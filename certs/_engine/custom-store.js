/* ============================================================
   custom-store.js — ユーザー作成資格（カスタム資格）のデータ層

   既存資格（CLF-C02・ITパスポート・FE）は cert.js / data.js が
   リポジトリにコミットされた静的ファイルとして存在する。
   カスタム資格はGitHub Pages上では静的ファイルを作れないため、
   カテゴリ定義もカードもすべてFirestoreに置く「完全動的」な資格になる。

   ★このファイルが扱うのは「資格そのもの」（索引・メタ・カテゴリ）だけ。
     学習データ（customCards / fcStats / fcProgress）の読み書きは
     従来どおり SafeStore が担う。責務を混ぜないこと。

   Firestoreの配置（CLAUDE.md 10-5節の app/notebook-<id> 規則に準拠）

     app/notebook-index          … ハブが読む軽量索引
                                   { certs:[{id,name,desc,cats,cards,...}] }
     app/notebook-u-<slug>       … 資格1件の本体
                                   { meta:{...}, customCards:{}, fcStats:{}, ... }
     app/notebook-u-<slug>_snap  … SafeStoreが自動で作る世代控え

   検証用の名前空間（NS）を付けると、すべてのドキュメント名に接尾辞が付く。
     ?ns=dev → app/notebook-index-dev / app/notebook-u-<slug>-dev
   本番データと開発データが同じドキュメントに混ざらないようにするため、
   本番反映前の検証はかならず ns=dev で行う。

   ブラウザとNodeの両方で読み込める形にしてある（純関数を検証スクリプトから
   直接テストするため）。Firestoreへの実アクセスはアダプタ経由で差し替え可能。
   ============================================================ */

(function(root, factory){
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  else root.CustomCerts = api;
})(typeof window !== 'undefined' ? window : globalThis, function(){

  /* ---------- 定数 ---------- */

  const ID_PREFIX  = 'u-';               // カスタム資格のIDは必ずこれで始まる
  const UNCAT_ID   = 'cat_uncat';        // カテゴリ削除時にカードを退避させる先
  const UNCAT_NAME = '未分類';
  const INDEX_BASE = 'notebook-index';
  const DOC_BASE   = 'notebook-';

  /* 既存資格・準備中として予約済みの資格ID。
     カスタム資格には u- を強制しているため構造的に衝突しないが、
     プレフィクスを外す将来変更に備えて照合だけは残しておく。 */
  const RESERVED_IDS = [
    'clf', 'itpass', 'fe', 'aif',                       // 既存（aifは削除済みだが再利用しない）
    'saa', 'soa', 'ap', 'sap', 'scs', 'sc', 'sa', 'dop', // ハブに準備中として並んでいるもの
    'index', 'custom', 'notebook', 'storage', 'roadmap',
  ];

  /* IDの末尾がこれらだと、名前空間やSafeStoreの控えドキュメントと衝突する */
  const FORBIDDEN_SUFFIXES = ['-dev', '_snap'];

  const ID_RE = /^u-[a-z0-9][a-z0-9-]{0,30}$/;

  /* ---------- 名前空間 ---------- */

  let NS = '';   // '' = 本番 / '-dev' = 検証用

  function setNamespace(ns){
    NS = ns ? ('-' + String(ns).replace(/^-/, '')) : '';
    return NS;
  }
  function namespace(){ return NS; }

  /* URLの ?ns=dev を名前空間として採用する（ブラウザのみ） */
  function adoptNamespaceFromUrl(){
    if(typeof location === 'undefined') return NS;
    const ns = new URLSearchParams(location.search).get('ns');
    return setNamespace(ns === 'dev' ? 'dev' : '');
  }

  function indexDocName(){ return INDEX_BASE + NS; }
  function certDocName(id){ return DOC_BASE + id + NS; }

  /* ---------- ID（スラッグ化・衝突チェック） ---------- */

  /* 資格名からIDの候補を作る。日本語だけの名前は英字が拾えないので空になる。 */
  function slugify(name){
    return String(name || '')
      .toLowerCase()
      .replace(/[　\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24)
      .replace(/-$/, '');
  }

  /* 使用済みIDと衝突しない候補を返す。
     英字が拾えなければ u-cert-1, u-cert-2 … と自動採番する。 */
  function suggestId(name, takenIds){
    const taken = new Set([...(takenIds || []), ...RESERVED_IDS.map(function(r){ return ID_PREFIX + r; })]);
    const base = slugify(name);
    if(base){
      const first = ID_PREFIX + base;
      if(!taken.has(first) && checkId(first, []).ok) return first;
      for(let i = 2; i < 100; i++){
        const cand = ID_PREFIX + base + '-' + i;
        if(!taken.has(cand) && checkId(cand, []).ok) return cand;
      }
    }
    for(let i = 1; i < 1000; i++){
      const cand = ID_PREFIX + 'cert-' + i;
      if(!taken.has(cand)) return cand;
    }
    return ID_PREFIX + 'cert-' + Date.now();
  }

  /* 入力されたIDが使えるかを判定する。理由つきで返す（UIにそのまま出す）。 */
  function checkId(id, takenIds){
    const v = String(id || '');
    if(!v) return {ok:false, reason:'IDを入力してください'};
    if(v.indexOf(ID_PREFIX) !== 0)
      return {ok:false, reason:'IDは「' + ID_PREFIX + '」で始めてください（既存の資格と区別するため）'};
    if(!ID_RE.test(v))
      return {ok:false, reason:'IDは u- のあと半角英数字とハイフンだけで、31文字以内にしてください'};
    for(const suf of FORBIDDEN_SUFFIXES){
      if(v.slice(-suf.length) === suf)
        return {ok:false, reason:'IDの末尾に「' + suf + '」は使えません'};
    }
    const bare = v.slice(ID_PREFIX.length);
    if(RESERVED_IDS.indexOf(bare) >= 0)
      return {ok:false, reason:'「' + bare + '」は既存または準備中の資格で予約されています。別のIDにしてください'};
    if((takenIds || []).indexOf(v) >= 0)
      return {ok:false, reason:'そのIDの資格はすでにあります。別のIDにしてください'};
    return {ok:true};
  }

  /* ---------- カテゴリ ---------- */

  /* カテゴリIDは改名しても変わらない安定IDにする（既存資格の cat_xxx と同じ考え方）。
     Firestoreはフィールド名に "__x__" 形式を許さないため、先頭は cat_ 固定。 */
  function newCatId(takenIds){
    const taken = new Set(takenIds || []);
    for(let i = 0; i < 500; i++){
      const cand = 'cat_' + Math.random().toString(36).slice(2, 8);
      if(!taken.has(cand) && cand !== UNCAT_ID) return cand;
    }
    return 'cat_' + Date.now().toString(36);
  }

  /* 表示・保存の前に整える。空名を捨て、IDの重複を解消し、順序は保つ。 */
  function normalizeCats(cats){
    const out = [], seen = new Set();
    (cats || []).forEach(function(c){
      const name = String((c && c.name) || '').trim();
      if(!name) return;
      let id = String((c && c.id) || '').trim();
      if(!id || seen.has(id)) id = newCatId(Array.from(seen));
      seen.add(id);
      out.push({id:id, name:name});
    });
    return out;
  }

  /* カテゴリを削除する。カードは消さず「未分類」へ退避させる（設計上の確定事項）。
     カード枚数が変わらないので、SafeStoreの急減ガードにも引っかからない。
     戻り値：{cats, customCards, moved} — moved は退避した枚数 */
  function deleteCat(cats, customCards, catId){
    const list  = normalizeCats(cats);
    const cards = Object.assign({}, customCards || {});
    const moved = (cards[catId] || []).length;

    const rest = list.filter(function(c){ return c.id !== catId; });
    if(moved > 0){
      if(!rest.some(function(c){ return c.id === UNCAT_ID; })) rest.push({id:UNCAT_ID, name:UNCAT_NAME});
      cards[UNCAT_ID] = (cards[UNCAT_ID] || []).concat(cards[catId] || []);
    }
    delete cards[catId];

    /* カテゴリが1つも無くなると単語帳の追加フォームが成立しないため、最低1つは残す */
    if(rest.length === 0) rest.push({id:UNCAT_ID, name:UNCAT_NAME});

    return {cats:rest, customCards:cards, moved:moved};
  }

  function moveCat(cats, catId, delta){
    const list = normalizeCats(cats);
    const i = list.findIndex(function(c){ return c.id === catId; });
    const j = i + delta;
    if(i < 0 || j < 0 || j >= list.length) return list;
    const c = list.splice(i, 1)[0];
    list.splice(j, 0, c);
    return list;
  }

  /* ---------- 集計 ---------- */

  function countCards(customCards){
    return Object.values(customCards || {})
      .reduce(function(s, a){ return s + (Array.isArray(a) ? a.length : 0); }, 0);
  }

  /* ---------- 索引 ---------- */

  function indexEntry(id, meta, customCards){
    const m = meta || {};
    return {
      id:    id,
      name:  m.name || id,
      desc:  m.desc || '',
      cats:  normalizeCats(m.cats).length,
      cards: countCards(customCards),
      createdAt: m.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function upsertIndex(index, entry){
    const certs = Array.isArray(index && index.certs) ? index.certs.slice() : [];
    const i = certs.findIndex(function(c){ return c && c.id === entry.id; });
    if(i >= 0){
      certs[i] = Object.assign({}, certs[i], entry, {createdAt: certs[i].createdAt || entry.createdAt});
    }else{
      certs.push(entry);
    }
    return {certs:certs};
  }

  function removeIndex(index, id){
    const certs = Array.isArray(index && index.certs) ? index.certs : [];
    return {certs: certs.filter(function(c){ return c && c.id !== id; })};
  }

  /* ---------- Firestoreアダプタ ---------- */
  /* 既定はブラウザ用（firebase SDK）。Nodeの検証スクリプトからは
     setAdapter() でREST版を差し込み、同じコードパスを通して確かめる。 */

  let adapter = null;

  function setAdapter(a){ adapter = a; }

  async function getAdapter(){
    if(adapter) return adapter;
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const app = appMod.initializeApp(window.FIREBASE_CONFIG, 'customcerts');
    const db  = fsMod.getFirestore(app);
    adapter = {
      async get(name){
        const s = await fsMod.getDoc(fsMod.doc(db, 'app', name));
        return s.exists() ? (s.data() || {}) : null;
      },
      async set(name, data, merge){
        await fsMod.setDoc(fsMod.doc(db, 'app', name), data, {merge: merge !== false});
      },
    };
    return adapter;
  }

  /* ---------- 公開API（非同期・Firestoreに触る） ---------- */

  async function listCerts(){
    const a = await getAdapter();
    const idx = await a.get(indexDocName());
    const certs = Array.isArray(idx && idx.certs) ? idx.certs : [];
    return certs.filter(function(c){ return c && c.id; });
  }

  async function loadMeta(id){
    const a = await getAdapter();
    const d = await a.get(certDocName(id));
    if(!d) return null;
    const meta = d.meta || {};
    meta.cats = normalizeCats(meta.cats);
    return {meta:meta, customCards: d.customCards || {}};
  }

  /* 資格を新規作成する。本体ドキュメントを作ってから索引に載せる。
     （逆順だと、索引にあるのに開けない資格が生まれ得る） */
  async function createCert(opt){
    const a = await getAdapter();
    const id = opt.id;
    const taken = (await listCerts()).map(function(c){ return c.id; });
    const chk = checkId(id, taken);
    if(!chk.ok) return {ok:false, reason:chk.reason};

    const existing = await a.get(certDocName(id));
    if(existing) return {ok:false, reason:'そのIDのデータがすでに存在します。別のIDにしてください'};

    const list = normalizeCats(opt.cats);
    if(list.length === 0) list.push({id:UNCAT_ID, name:UNCAT_NAME});

    const meta = {
      name: String(opt.name || '').trim() || id,
      desc: String(opt.desc || '').trim(),
      cats: list,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await a.set(certDocName(id), {meta:meta, customCards:{}}, true);

    const idx = await a.get(indexDocName());
    await a.set(indexDocName(), upsertIndex(idx, indexEntry(id, meta, {})), true);
    return {ok:true, id:id, meta:meta};
  }

  /* メタ（資格名・説明・カテゴリ）の更新。
     ★学習データ（customCards / fcStats / fcProgress）はここからは絶対に書かない。
       書くのは SafeStore だけ、という責務の線引きを守るため。
       cardsForCount は索引のカード枚数を出すためだけに使う（保存はしない）。
     カテゴリ削除でカードの所属が変わる場合は、呼び出し側で先に
     state.customCards を書き換えて SafeStore の save() を通してから、
     このメタ保存を呼ぶこと。 */
  async function saveMeta(id, meta, cardsForCount){
    const a = await getAdapter();
    const m = Object.assign({}, meta, {
      cats: normalizeCats(meta.cats),
      updatedAt: new Date().toISOString(),
    });
    await a.set(certDocName(id), {meta:m}, true);

    const idx = await a.get(indexDocName());
    const cards = cardsForCount || ((await loadMeta(id)) || {}).customCards || {};
    await a.set(indexDocName(), upsertIndex(idx, indexEntry(id, m, cards)), true);
    return {ok:true, meta:m};
  }

  /* 索引のカード枚数だけを更新する（カードを足した/消したあとに呼ぶ）。
     本体ドキュメントは SafeStore が書くので、ここでは索引しか触らない。 */
  async function touchIndex(id, meta, customCards){
    const a = await getAdapter();
    const idx = await a.get(indexDocName());
    await a.set(indexDocName(), upsertIndex(idx, indexEntry(id, meta, customCards)), true);
  }

  /* 資格の削除は索引から外すだけの論理削除。
     本体ドキュメント（カードと学習履歴）はFirestoreに残るので、
     同じIDで作り直せば中身が戻る。取り返しのつかない削除はしない。 */
  async function unlistCert(id){
    const a = await getAdapter();
    const idx = await a.get(indexDocName());
    await a.set(indexDocName(), removeIndex(idx, id), false);
    return {ok:true};
  }

  return {
    /* 定数 */
    ID_PREFIX: ID_PREFIX, UNCAT_ID: UNCAT_ID, UNCAT_NAME: UNCAT_NAME, RESERVED_IDS: RESERVED_IDS,
    /* 名前空間 */
    setNamespace: setNamespace, namespace: namespace, adoptNamespaceFromUrl: adoptNamespaceFromUrl,
    indexDocName: indexDocName, certDocName: certDocName,
    /* 純関数（検証スクリプトから直接テストする） */
    slugify: slugify, suggestId: suggestId, checkId: checkId, newCatId: newCatId,
    normalizeCats: normalizeCats, deleteCat: deleteCat, moveCat: moveCat,
    countCards: countCards, indexEntry: indexEntry, upsertIndex: upsertIndex, removeIndex: removeIndex,
    /* Firestore */
    setAdapter: setAdapter, listCerts: listCerts, loadMeta: loadMeta, createCert: createCert,
    saveMeta: saveMeta, touchIndex: touchIndex, unlistCert: unlistCert,
  };
});
