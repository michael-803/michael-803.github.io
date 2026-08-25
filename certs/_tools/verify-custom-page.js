/* ============================================================
   verify-custom-page.js — custom/index.html のブート処理そのものを動かす統合検証

     node _tools/verify-custom-page.js

   HTMLからインラインスクリプトを抜き出し、実際のコードを Node 上で実行する。
   （検証用に書き写したコピーではなく、ページ本体を読む。ズレが起きないように）

   確認するもの
     ・?id= の検証とエラー画面への分岐
     ・Firestore（dev名前空間）から読んだメタ → エンジンのグローバルへの組み立て
     ・safe-store.js → engine.js → boot.js の注入順
     ・カード追加時に索引のカード枚数が追従すること（_save のラップ）

   Firestoreは名前空間 dev（app/notebook-*-dev）だけを読み書きする。
   SafeStoreはNode上ではクラウドに繋げないためオフライン動作になる
   （＝学習データの実書き込みは verify-custom.js --live 側で確認済み）。
   ============================================================ */

const fs   = require('fs');
const vm   = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CC   = require(path.join(ROOT, '_engine', 'custom-store.js'));

const PROJECT = 'aws-study-hub-9fa13';
const BASE = 'https://firestore.googleapis.com/v1/projects/' + PROJECT +
             '/databases/(default)/documents/app/';

let pass = 0, fail = 0;
function ok(label, cond, detail){
  if(cond){ pass++; console.log('  OK   ' + label); }
  else{ fail++; console.log('  NG   ' + label + (detail ? '  → ' + detail : '')); }
}
function eq(label, actual, expected){
  ok(label + '（' + JSON.stringify(actual) + '）',
     JSON.stringify(actual) === JSON.stringify(expected), '期待 ' + JSON.stringify(expected));
}
function section(t){ console.log('\n■ ' + t); }

/* ---------- Firestore REST アダプタ（verify-custom.js と同じもの） ---------- */
function toFs(v){
  if(v === null || v === undefined) return {nullValue:null};
  if(typeof v === 'string')  return {stringValue:v};
  if(typeof v === 'number')  return Number.isInteger(v) ? {integerValue:String(v)} : {doubleValue:v};
  if(typeof v === 'boolean') return {booleanValue:v};
  if(Array.isArray(v))       return {arrayValue:{values:v.map(toFs)}};
  const fields = {};
  Object.keys(v).forEach(function(k){ fields[k] = toFs(v[k]); });
  return {mapValue:{fields:fields}};
}
function fromFs(v){
  if(!v) return null;
  if('stringValue'  in v) return v.stringValue;
  if('integerValue' in v) return Number(v.integerValue);
  if('doubleValue'  in v) return v.doubleValue;
  if('booleanValue' in v) return v.booleanValue;
  if('nullValue'    in v) return null;
  if('arrayValue'   in v) return (v.arrayValue.values || []).map(fromFs);
  if('mapValue'     in v){
    const o = {};
    Object.keys(v.mapValue.fields || {}).forEach(function(k){ o[k] = fromFs(v.mapValue.fields[k]); });
    return o;
  }
  return null;
}
const rest = {
  async get(name){
    const res = await fetch(BASE + encodeURIComponent(name));
    if(res.status === 404) return null;
    if(!res.ok) throw new Error('GET ' + name + ' → ' + res.status);
    const j = await res.json();
    return fromFs({mapValue:{fields:j.fields || {}}});
  },
  async set(name, data, merge){
    let url = BASE + encodeURIComponent(name);
    if(merge !== false){
      url += '?' + Object.keys(data).map(function(k){
        return 'updateMask.fieldPaths=' + encodeURIComponent(k);
      }).join('&');
    }
    const fields = {};
    Object.keys(data).forEach(function(k){ fields[k] = toFs(data[k]); });
    const res = await fetch(url, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({fields: fields}),
    });
    if(!res.ok) throw new Error('PATCH ' + name + ' → ' + res.status);
  },
  async del(name){
    const res = await fetch(BASE + encodeURIComponent(name), {method:'DELETE'});
    if(!res.ok && res.status !== 404) throw new Error('DELETE ' + name + ' → ' + res.status);
  },
};

/* ---------- DOMスタブ（スクリプト要素は「読み込んだら実行」まで再現する） ---------- */
function makeStubElement(id){
  return {
    id:id, style:{}, dataset:{}, value:'', textContent:'', innerHTML:'', disabled:false, href:'',
    classList:{ _s:new Set(),
      add(c){ this._s.add(c); }, remove(c){ this._s.delete(c); },
      contains(c){ return this._s.has(c); }, toggle(c){ this._s.has(c) ? this._s.delete(c) : this._s.add(c); } },
    focus(){}, blur(){},
    /* イベントは記録しておき、検証側から fire() で発火させる */
    _on:{},
    addEventListener(type, fn){ (this._on[type] = this._on[type] || []).push(fn); },
    removeEventListener(){},
    appendChild(){}, closest(){ return null; },
    querySelector(){ return null; }, querySelectorAll(){ return []; },
  };
}

/* 要素のイベントを発火する（onclick属性・addEventListener の両方に対応） */
function fire(el, type){
  const handlers = (el._on && el._on[type]) || [];
  handlers.forEach(function(fn){ fn.call(el, {type:type, target:el, preventDefault(){}}); });
  const inline = el['on' + type];
  if(typeof inline === 'function') inline.call(el, {type:type, target:el, preventDefault(){}});
  return handlers.length + (typeof inline === 'function' ? 1 : 0);
}

function makeContext(pageDir, opts){
  const els = {};
  const loadedScripts = [];

  const document = {
    title: '',
    getElementById(id){ return (els[id] || (els[id] = makeStubElement(id))); },
    querySelector(sel){ return makeStubElement(sel); },
    querySelectorAll(sel){
      /* [data-cert-name] と .screen だけ実体を返す（ページが触るのはこの2つ） */
      if(sel === '[data-cert-name]') return [els['__certname'] || (els['__certname'] = makeStubElement('certname'))];
      if(sel === '.screen') return ['loading-screen', 'error-screen', 'notebook-screen']
        .map(function(id){ return document.getElementById(id); });
      return [];
    },
    createElement(tag){
      const el = makeStubElement(tag);
      if(tag === 'script'){
        /* src が設定されたら、その場でファイルを評価して onload を呼ぶ（ブラウザの再現） */
        let _src = '';
        Object.defineProperty(el, 'src', {
          get(){ return _src; },
          set(v){
            _src = v;
            const rel = v.split('?')[0];
            const file = path.resolve(pageDir, rel);
            loadedScripts.push(path.relative(ROOT, file).replace(/\\/g, '/'));
            try{
              vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, {filename: rel});
              setTimeout(function(){ if(el.onload) el.onload(); }, 0);
            }catch(e){
              setTimeout(function(){ if(el.onerror) el.onerror(e); }, 0);
              console.error('   スクリプト評価に失敗: ' + rel + ' → ' + e.message);
            }
          },
        });
      }
      return el;
    },
    addEventListener(){}, removeEventListener(){},
    body: makeStubElement('body'),
  };

  const ctx = {
    document: document,
    console: console,
    setTimeout: setTimeout, clearTimeout: clearTimeout,
    JSON: JSON, Math: Math, Date: Date, Promise: Promise, Error: Error,
    URLSearchParams: URLSearchParams,
    encodeURIComponent: encodeURIComponent, decodeURIComponent: decodeURIComponent,
    fetch: fetch,
    confirm(){ return true; }, alert(){},
    ico(){ return ''; },
    localStorage: { _d:{}, getItem(k){ return this._d[k] || null; },
                    setItem(k, v){ this._d[k] = v; }, removeItem(k){ delete this._d[k]; } },
    location: { search: opts.search || '', href: '', reload(){} },
    CustomCerts: CC,
    _loadedScripts: loadedScripts,
    _els: els,
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  return ctx;
}

/* ---------- ページからインラインスクリプトを抜き出す ---------- */
function inlineScripts(htmlPath){
  /* コメント内に <script> の語が出てくるので、先にコメントを落としておく */
  const html = fs.readFileSync(htmlPath, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const out = [];
  const re = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

const sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };

/* ============================================================
   custom/new.html：作成フローをイベントごと動かす
   ============================================================ */
async function newPageTests(){
  console.log('\n============================================================');
  console.log('custom/new.html の作成フロー（実コード・イベント込み）');
  console.log('============================================================');

  const pageDir  = path.join(ROOT, 'custom');
  const pagePath = path.join(pageDir, 'new.html');
  const ID_TAKEN = 'u-taken';

  /* 衝突チェックを実データで試すため、先に1件作っておく */
  await rest.del(CC.certDocName(ID_TAKEN));
  await rest.del(CC.indexDocName());
  await CC.createCert({id:ID_TAKEN, name:'先客', desc:'', cats:[{id:'cat_x', name:'章'}]});

  const ctx = makeContext(pageDir, {search:'?ns=dev'});
  /* ページが <script src> で読む依存のうち、DOMに触れるものを先に評価しておく
     （CustomCerts は検証用アダプタを差した実体をそのまま使う） */
  vm.runInContext(fs.readFileSync(path.join(ROOT, '_engine', 'cat-editor.js'), 'utf8'), ctx,
                  {filename:'_engine/cat-editor.js'});
  vm.runInContext(inlineScripts(pagePath)[0], ctx, {filename:'custom/new.html'});
  await sleep(700);   // listCerts() の完了待ち

  const $ = function(id){ return ctx.document.getElementById(id); };

  section('ステップ1：資格名からIDが自動で決まる');
  ok('リンクが検証用の名前空間を引き継ぐ', $('back-link').href === '../index.html?ns=dev',
     $('back-link').href);
  eq('最初は次へ進めない', $('to-step2').disabled, true);

  $('f-name').value = 'Eiken';
  fire($('f-name'), 'input');
  eq('英字の資格名からIDが埋まる', $('f-id').value, 'eiken');
  eq('次へ進めるようになる', $('to-step2').disabled, false);
  ok('保存先が案内される', $('id-msg').textContent.indexOf('app/notebook-u-eiken-dev') >= 0,
     $('id-msg').textContent);

  $('f-name').value = '日商簿記';
  fire($('f-name'), 'input');
  eq('日本語だけの資格名は連番になる', $('f-id').value, 'cert-1');

  section('ステップ1：IDの手入力と衝突チェック');
  $('f-id').value = 'Boki_2級';
  fire($('f-id'), 'input');
  ok('大文字・日本語混じりは弾かれる', $('to-step2').disabled === true &&
     $('id-msg').textContent.length > 0, $('id-msg').textContent);

  $('f-id').value = 'clf';
  fire($('f-id'), 'input');
  ok('既存資格と同名は理由つきで弾かれる',
     $('id-msg').textContent.indexOf('予約') >= 0, $('id-msg').textContent);

  $('f-id').value = 'taken';
  fire($('f-id'), 'input');
  ok('作成済みの資格と重複しても弾かれる',
     $('id-msg').textContent.indexOf('すでにあります') >= 0, $('id-msg').textContent);

  section('ステップ2：カテゴリ編集へ進む');
  $('f-id').value = 'boki';
  fire($('f-id'), 'input');
  eq('正常なIDに直すと進める', $('to-step2').disabled, false);
  fire($('to-step2'), 'click');
  ok('ステップ2が開く', $('step2').classList.contains('active'));
  ok('ステップ1が閉じる', !$('step1').classList.contains('active'));
  ok('進行バーが2つ目まで進む', $('dot2').classList.contains('on'));
  ok('カテゴリ編集が描画される', $('cat-host').innerHTML.indexOf('カテゴリを追加') >= 0);
  ok('初期カテゴリが1件入っている', $('cat-host').innerHTML.indexOf('カテゴリ1') >= 0);

  fire($('to-step1'), 'click');
  ok('「戻る」でステップ1へ戻れる', $('step1').classList.contains('active'));
  fire($('to-step2'), 'click');

  section('作成の実行（Firestoreのdev名前空間）');
  fire($('do-create'), 'click');
  await sleep(1200);

  eq('学習ページへ遷移する', ctx.location.href, 'index.html?id=u-boki&ns=dev');
  const made = await CC.loadMeta('u-boki');
  ok('本体ドキュメントができている', made !== null);
  eq('資格名が保存される', made.meta.name, '日商簿記');
  eq('カテゴリが保存される', made.meta.cats.map(function(c){ return c.name; }), ['カテゴリ1']);
  eq('カードは空で始まる', CC.countCards(made.customCards), 0);
  const listed = await CC.listCerts();
  ok('索引に載る', listed.some(function(c){ return c.id === 'u-boki'; }));
  eq('先に作った資格も残っている', listed.length, 2);

  section('ページを開いたあとに、横から同じIDを取られた場合（実データ）');
  /* 入力時点の衝突チェックは素通りし、作成の瞬間に初めてぶつかる状況を作る。
     ページを開いた時点では u-boki が存在しない状態から始める。 */
  await rest.del(CC.certDocName('u-boki'));
  await rest.del(CC.certDocName('u-boki') + '_snap');
  await rest.del(CC.indexDocName());

  const ctx2 = makeContext(pageDir, {search:'?ns=dev'});
  vm.runInContext(fs.readFileSync(path.join(ROOT, '_engine', 'cat-editor.js'), 'utf8'), ctx2,
                  {filename:'_engine/cat-editor.js'});
  vm.runInContext(inlineScripts(pagePath)[0], ctx2, {filename:'custom/new.html'});
  await sleep(700);
  const $$ = function(id){ return ctx2.document.getElementById(id); };

  $$('f-name').value = '簿記（重複）';
  fire($$('f-name'), 'input');
  $$('f-id').value = 'boki';
  fire($$('f-id'), 'input');
  eq('この時点では入力チェックを通る', $$('to-step2').disabled, false);
  fire($$('to-step2'), 'click');
  ok('ステップ2まで進める', $$('step2').classList.contains('active'));

  /* ここで別のタブ（別端末）が同じIDで作ってしまう */
  const sniped = await CC.createCert({id:'u-boki', name:'先に作られた簿記', desc:'',
                                      cats:[{id:'cat_y', name:'章'}]});
  ok('横取り側の作成は成功する', sniped.ok, sniped.reason);

  fire($$('do-create'), 'click');
  await sleep(1500);
  eq('遷移しない', ctx2.location.href, '');
  ok('ステップ1へ戻して入力し直させる', $$('step1').classList.contains('active'));
  ok('理由が表示される', $$('toast').textContent.indexOf('すでに') >= 0, $$('toast').textContent);
  eq('ボタンが押せる状態に戻る', $$('do-create').disabled, false);
  const survivor = await CC.loadMeta('u-boki');
  eq('先に作られた側のデータは上書きされない', survivor.meta.name, '先に作られた簿記');

  /* 後片づけ */
  await rest.del(CC.certDocName('u-boki'));
  await rest.del(CC.certDocName('u-boki') + '_snap');
  await rest.del(CC.certDocName(ID_TAKEN));
  await rest.del(CC.indexDocName());
}

/* ============================================================
   HTMLから呼ばれる関数が実在するか（DOM操作の取りこぼし防止）
   ============================================================ */
function handlerTests(){
  console.log('\n============================================================');
  console.log('onclick から呼ばれる関数が実在するか');
  console.log('============================================================');

  const sources = ['_engine/engine.js', '_engine/cat-editor.js', '_engine/custom-store.js']
    .map(function(f){ return fs.readFileSync(path.join(ROOT, f), 'utf8'); }).join('\n');

  [['custom/index.html', 'カスタム資格の学習ページ'],
   ['custom/new.html',   'カスタム資格の作成フロー']].forEach(function(pair){
    const rel = pair[0], label = pair[1];
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const inline = inlineScripts(path.join(ROOT, rel)).join('\n');
    const all = sources + '\n' + inline;

    const names = new Set();
    const re = /on(?:click|change|input|submit)\s*=\s*"([A-Za-z_$][\w$]*)\s*\(/g;
    let m;
    while((m = re.exec(html)) !== null) names.add(m[1]);

    section(label + '（' + rel + '）');
    if(names.size === 0){ ok('onclick属性なし（すべてaddEventListener）', true); return; }
    names.forEach(function(n){
      const defined = new RegExp('(function\\s+' + n + '\\s*\\(|window\\.' + n + '\\s*=|'
                                + n + '\\s*[:=]\\s*function)').test(all);
      ok(n + '() が定義されている', defined, '見つかりません');
    });
  });

  /* 逆方向：ページが参照するエンジンの関数・変数が存在するか */
  section('学習ページがエンジンに期待している名前');
  const engine = fs.readFileSync(path.join(ROOT, '_engine', 'engine.js'), 'utf8');
  [['state', 'let state'], ['FC_CATS_DEF', 'FC_CATS_DEF'], ['rebuildCatMaps', 'function rebuildCatMaps'],
   ['pruneUnknownProgress', 'function pruneUnknownProgress'], ['enterKey', 'function enterKey'],
   ['sanitizeKey', 'function sanitizeKey'], ['CAT_ALL', 'const CAT_ALL'], ['toast', 'function toast'],
   ['closeHiddenCards', 'function closeHiddenCards'], ['switchTab', 'function switchTab'],
   ['goHome', 'function goHome']].forEach(function(p){
    ok(p[0] + ' がengine.jsにある', engine.indexOf(p[1]) >= 0);
  });
}

/* ============================================================ */
async function main(){
  console.log('============================================================');
  console.log('custom/index.html のブート処理（実コード）を動かす');
  console.log('============================================================');

  CC.setNamespace('dev');
  CC.setAdapter(rest);

  const ID = 'u-page';
  const pageDir  = path.join(ROOT, 'custom');
  const pagePath = path.join(pageDir, 'index.html');

  /* 検証用の資格をFirestore（dev）に作る */
  await rest.del(CC.certDocName(ID));
  await rest.del(CC.certDocName(ID) + '_snap');
  await rest.del(CC.indexDocName());
  const created = await CC.createCert({
    id: ID, name: 'ページ検証用', desc: '',
    cats: [{id:'cat_p1', name:'章1'}, {id:'cat_p2', name:'章2'}],
  });
  ok('検証用の資格を用意した', created.ok, created.reason);
  await rest.set(CC.certDocName(ID), {customCards:{
    cat_p1:[{id:'a1', term:'用語A', def:'意味A'}, {id:'a2', term:'用語B', def:'意味B'}],
    cat_p2:[{id:'b1', term:'用語C', def:'意味C'}],
  }}, true);
  await CC.touchIndex(ID, created.meta, (await CC.loadMeta(ID)).customCards);

  /* ---- 正常系 ---- */
  section('正常系：?id=' + ID + '&ns=dev');
  const ctx = makeContext(pageDir, {search: '?id=' + ID + '&ns=dev'});
  const scripts = inlineScripts(pagePath);
  eq('ページのインラインスクリプトを抽出できた', scripts.length, 1);
  vm.runInContext(scripts[0], ctx, {filename: 'custom/index.html'});
  await sleep(900);   // スクリプト注入（onload連鎖）と boot.js の完了を待つ

  eq('注入されたスクリプトと順序', ctx._loadedScripts,
     ['_engine/safe-store.js', '_engine/engine.js', '_engine/boot.js']);
  eq('CERT.name がメタから入る', vm.runInContext('CERT.name', ctx), 'ページ検証用');
  eq('保存先ドキュメント', vm.runInContext('window.SAFESTORE_HOME_DOC', ctx), 'notebook-u-page-dev');
  eq('単独運用フラグ', vm.runInContext('window.SAFESTORE_STANDALONE', ctx), true);
  eq('有効な機能は単語帳だけ',
     vm.runInContext('Object.keys(CERT.features).filter(k=>CERT.features[k])', ctx), ['flashcards']);
  eq('カテゴリがエンジンに渡る', vm.runInContext('FC_CATS_DEF.map(c=>c.name)', ctx), ['章1', '章2']);
  eq('組み込みカードは0枚', vm.runInContext('Object.keys(SAMPLE).length', ctx), 0);
  eq('過去問系のグローバルは空配列', vm.runInContext('[QQ.length,QCAT.length,SCENARIO_Q.length,MULTI_Q.length,CHEATSHEETS.length,PSEUDO_Q.length]', ctx),
     [0, 0, 0, 0, 0, 0]);
  eq('ページのタイトル', ctx.document.title, 'ページ検証用 Study Deck');
  ok('エラー画面は出ていない', !ctx.document.getElementById('error-screen').classList.contains('active'));
  ok('設定ボタンが表示される', ctx.document.getElementById('btn-settings').style.display === '');

  section('索引の追従（_save のラップが効いているか）');
  /* SafeStoreはNodeではオフライン。engine側の state を直接組み立ててから保存口を叩く */
  vm.runInContext(`
    state.customCards = {
      cat_p1:[{id:'a1',term:'用語A',def:'意味A'},{id:'a2',term:'用語B',def:'意味B'}],
      cat_p2:[{id:'b1',term:'用語C',def:'意味C'}]
    };
    document.getElementById('new-term').value = '用語D';
    document.getElementById('new-def').value  = '意味D';
    document.getElementById('new-cat').value  = 'cat_p2';
    submitCard();
  `, ctx);
  eq('エンジン上のカード枚数', vm.runInContext('buildCards().length', ctx), 4);
  await vm.runInContext('window._save()', ctx);
  await sleep(400);

  const idxEntry = (await CC.listCerts()).find(function(c){ return c.id === ID; });
  eq('索引のカード枚数が4枚に追従', idxEntry.cards, 4);
  eq('索引のカテゴリ数', idxEntry.cats, 2);

  /* ---- 異常系 ---- */
  section('異常系：IDが無い／存在しない資格');
  const ctx2 = makeContext(pageDir, {search: '?ns=dev'});
  vm.runInContext(inlineScripts(pagePath)[0], ctx2, {filename: 'custom/index.html'});
  await sleep(300);
  ok('IDなしはエラー画面へ', ctx2.document.getElementById('error-screen').classList.contains('active'));
  eq('エンジンを読み込まない', ctx2._loadedScripts, []);
  eq('エラー文言', ctx2.document.getElementById('err-title').textContent, '資格IDが指定されていません');

  const ctx3 = makeContext(pageDir, {search: '?id=u-nothing-here&ns=dev'});
  vm.runInContext(inlineScripts(pagePath)[0], ctx3, {filename: 'custom/index.html'});
  await sleep(900);
  ok('存在しない資格はエラー画面へ', ctx3.document.getElementById('error-screen').classList.contains('active'));
  eq('エンジンを読み込まない', ctx3._loadedScripts, []);

  const ctx4 = makeContext(pageDir, {search: '?id=clf&ns=dev'});
  vm.runInContext(inlineScripts(pagePath)[0], ctx4, {filename: 'custom/index.html'});
  await sleep(300);
  ok('既存資格のID（u-なし）は弾く', ctx4.document.getElementById('error-screen').classList.contains('active'));

  /* ---- ハブ（certs/index.html）への統合 ---- */
  section('ハブの一覧にカスタム資格が並ぶか');
  const hubPath = path.join(ROOT, 'index.html');
  const hubScripts = inlineScripts(hubPath);
  const hubCustom = hubScripts[hubScripts.length - 1];   // 最後がカスタム資格の描画

  const hubCtx = makeContext(ROOT, {search: '?ns=dev'});
  vm.runInContext(hubScripts[0], hubCtx, {filename: 'index.html#静的一覧'});
  const staticHtml = hubCtx.document.getElementById('cert-list').innerHTML;
  ok('静的な資格一覧は従来どおり描かれる', staticHtml.indexOf('CLF-C02') >= 0 && staticHtml.indexOf('基本情報技術者') >= 0);
  ok('準備中の資格も残っている', staticHtml.indexOf('SAA-C03') >= 0);

  vm.runInContext(hubCustom, hubCtx, {filename: 'index.html#カスタム資格'});
  await sleep(700);
  const customHtml = hubCtx.document.getElementById('custom-list').innerHTML;
  ok('作成済みのカスタム資格が出る', customHtml.indexOf('ページ検証用') >= 0);
  ok('カード枚数が出る', customHtml.indexOf('カード4枚') >= 0);
  ok('リンクが資格IDと名前空間を持つ',
     customHtml.indexOf('custom/index.html?id=' + ID + '&ns=dev') >= 0);
  ok('「新しい資格を作る」が出る', customHtml.indexOf('新しい資格を作る') >= 0);
  ok('静的な一覧は上書きされていない', hubCtx.document.getElementById('cert-list').innerHTML === staticHtml);

  section('ハブ：索引が読めないときの退避動作');
  const brokenCtx = makeContext(ROOT, {search: ''});
  CC.setAdapter({ get(){ throw new Error('offline'); }, set(){ throw new Error('offline'); } });
  vm.runInContext(hubScripts[0], brokenCtx, {filename: 'index.html#静的一覧'});
  vm.runInContext(hubCustom, brokenCtx, {filename: 'index.html#カスタム資格'});
  await sleep(300);
  const brokenHtml = brokenCtx.document.getElementById('custom-list').innerHTML;
  ok('接続できなくても静的な一覧は無傷',
     brokenCtx.document.getElementById('cert-list').innerHTML.indexOf('CLF-C02') >= 0);
  ok('接続できない旨を出す', brokenHtml.indexOf('接続できませんでした') >= 0);
  ok('それでも新規作成の導線は残る', brokenHtml.indexOf('新しい資格を作る') >= 0);
  CC.setAdapter(rest);
  CC.setNamespace('dev');

  await newPageTests();
  handlerTests();

  /* ---- 後片づけ ---- */
  await rest.del(CC.certDocName(ID));
  await rest.del(CC.certDocName(ID) + '_snap');
  await rest.del(CC.indexDocName());
  console.log('\n  （検証用ドキュメントは削除済み）');

  console.log('\n' + '─'.repeat(60));
  console.log(fail === 0 ? '✓ すべての検証を通過しました（' + pass + '項目）'
                         : '✗ ' + fail + ' 件失敗（' + pass + ' 件成功）');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(function(e){ console.error(e); process.exit(1); });
