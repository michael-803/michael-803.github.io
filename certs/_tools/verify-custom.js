/* ============================================================
   verify-custom.js — カスタム資格（ユーザー作成資格）の検証

     node _tools/verify-custom.js          … 純関数のみ（Firestoreに触らない）
     node _tools/verify-custom.js --live   … app/notebook-*-dev に対する実データ検証

   --live は名前空間 dev（app/notebook-index-dev / app/notebook-u-*-dev）
   だけを読み書きする。本番ドキュメント（app/notebook / notebook-itpass /
   notebook-fe / notebook-index）には一切書き込まない。
   ============================================================ */

const path = require('path');
const CC = require(path.join(__dirname, '..', '_engine', 'custom-store.js'));

const PROJECT = 'aws-study-hub-9fa13';
const BASE = 'https://firestore.googleapis.com/v1/projects/' + PROJECT +
             '/databases/(default)/documents/app/';

let pass = 0, fail = 0;
function ok(label, cond, detail){
  if(cond){ pass++; console.log('  OK   ' + label); }
  else{ fail++; console.log('  NG   ' + label + (detail ? '  → ' + detail : '')); }
}
function eq(label, actual, expected){
  ok(label + '（' + JSON.stringify(actual) + '）', JSON.stringify(actual) === JSON.stringify(expected),
     '期待 ' + JSON.stringify(expected));
}
function section(t){ console.log('\n■ ' + t); }

/* ============================================================
   1. 純関数
   ============================================================ */
function pureTests(){
  console.log('============================================================');
  console.log('カスタム資格：純関数の検証');
  console.log('============================================================');

  section('ID生成（スラッグ化）');
  eq('英字の資格名', CC.slugify('AWS Certified Security'), 'aws-certified-security');
  eq('記号と全角空白を落とす', CC.slugify('簿記　3級 (商業簿記)'), '3');
  eq('日本語のみは空になる', CC.slugify('英検準1級'), '1');
  eq('完全に日本語のみ', CC.slugify('日商簿記'), '');
  eq('先頭と末尾のハイフンを落とす', CC.slugify('--foo--bar--'), 'foo-bar');

  section('ID候補の自動生成');
  const taken = ['u-eiken', 'u-eiken-2'];
  eq('未使用ならそのまま', CC.suggestId('Eiken', []), 'u-eiken');
  eq('衝突したら採番', CC.suggestId('Eiken', taken), 'u-eiken-3');
  eq('英字が拾えないと連番', CC.suggestId('日商簿記', []), 'u-cert-1');
  eq('連番も衝突を避ける', CC.suggestId('日商簿記', ['u-cert-1', 'u-cert-2']), 'u-cert-3');
  ok('先頭が数字になる名前でも妥当なIDになる',
     CC.checkId(CC.suggestId('英検準1級', []), []).ok,
     CC.suggestId('英検準1級', []));

  section('ID衝突チェック（既存・準備中の資格を守る）');
  ok('u- が無いIDは拒否', !CC.checkId('eiken', []).ok);
  ok('既存資格 clf との衝突を拒否', !CC.checkId('u-clf', []).ok);
  ok('既存資格 itpass との衝突を拒否', !CC.checkId('u-itpass', []).ok);
  ok('既存資格 fe との衝突を拒否', !CC.checkId('u-fe', []).ok);
  ['saa', 'soa', 'ap', 'sap', 'scs', 'sc', 'sa', 'dop'].forEach(function(r){
    ok('準備中の資格 ' + r + ' との衝突を拒否', !CC.checkId('u-' + r, []).ok);
  });
  ok('-dev で終わるIDを拒否（検証用名前空間との衝突）', !CC.checkId('u-foo-dev', []).ok);
  ok('_snap で終わるIDを拒否（SafeStoreの控えとの衝突）', !CC.checkId('u-foo_snap', []).ok);
  ok('大文字・日本語混じりを拒否', !CC.checkId('u-Eiken漢字', []).ok);
  ok('作成済みカスタム資格との重複を拒否', !CC.checkId('u-eiken', ['u-eiken']).ok);
  ok('正常なIDは通る', CC.checkId('u-eiken', ['u-boki']).ok);

  section('カテゴリの正規化');
  const cats = CC.normalizeCats([
    {id:'cat_a', name:'英単語'},
    {id:'cat_a', name:'熟語'},        // ID重複 → 振り直す
    {id:'', name:'文法'},             // ID無し → 採番
    {id:'cat_c', name:'  '},          // 空名 → 捨てる
  ]);
  eq('空名を捨てて3件になる', cats.length, 3);
  ok('IDが一意になる', new Set(cats.map(function(c){ return c.id; })).size === 3);
  eq('順序が保たれる', cats.map(function(c){ return c.name; }), ['英単語', '熟語', '文法']);

  section('カテゴリ削除 → カードは「未分類」へ退避（枚数不変）');
  const before = {cat_a:[{id:'1'}, {id:'2'}], cat_b:[{id:'3'}], cat_c:[{id:'4'}, {id:'5'}, {id:'6'}]};
  const r = CC.deleteCat(
    [{id:'cat_a', name:'英単語'}, {id:'cat_b', name:'熟語'}, {id:'cat_c', name:'文法'}],
    before, 'cat_c');
  eq('退避した枚数', r.moved, 3);
  eq('削除前のカード総数', CC.countCards(before), 6);
  eq('削除後のカード総数（1枚も減らない）', CC.countCards(r.customCards), 6);
  ok('未分類カテゴリが追加される', r.cats.some(function(c){ return c.id === CC.UNCAT_ID; }));
  eq('未分類に3枚入る', r.customCards[CC.UNCAT_ID].length, 3);
  ok('削除したカテゴリのキーは消える', !(('cat_c') in r.customCards));

  const empty = CC.deleteCat([{id:'cat_a', name:'英単語'}, {id:'cat_b', name:'熟語'}], {cat_a:[]}, 'cat_a');
  eq('空カテゴリの削除では未分類を作らない', empty.cats.map(function(c){ return c.id; }), ['cat_b']);

  const last = CC.deleteCat([{id:'cat_a', name:'英単語'}], {}, 'cat_a');
  eq('最後の1件を消しても必ず1カテゴリ残る', last.cats.length, 1);

  section('カテゴリの並べ替え');
  const three = [{id:'a', name:'1'}, {id:'b', name:'2'}, {id:'c', name:'3'}];
  eq('上へ', CC.moveCat(three, 'b', -1).map(function(c){ return c.id; }), ['b', 'a', 'c']);
  eq('下へ', CC.moveCat(three, 'b', 1).map(function(c){ return c.id; }), ['a', 'c', 'b']);
  eq('先頭より上には動かない', CC.moveCat(three, 'a', -1).map(function(c){ return c.id; }), ['a', 'b', 'c']);
  eq('末尾より下には動かない', CC.moveCat(three, 'c', 1).map(function(c){ return c.id; }), ['a', 'b', 'c']);

  section('索引の更新');
  const e1 = CC.indexEntry('u-eiken', {name:'英検準1級', desc:'説明', cats:[{id:'cat_a', name:'英単語'}]},
                           {cat_a:[{id:'1'}, {id:'2'}]});
  eq('索引に枚数が入る', e1.cards, 2);
  eq('索引にカテゴリ数が入る', e1.cats, 1);
  let idx = CC.upsertIndex(null, e1);
  eq('新規追加', idx.certs.length, 1);
  idx = CC.upsertIndex(idx, CC.indexEntry('u-eiken', {name:'英検1級', cats:[]}, {}));
  eq('同じIDは上書き（増えない）', idx.certs.length, 1);
  eq('名前が更新される', idx.certs[0].name, '英検1級');
  eq('作成日時は保たれる', idx.certs[0].createdAt, e1.createdAt);
  idx = CC.upsertIndex(idx, CC.indexEntry('u-boki', {name:'簿記', cats:[]}, {}));
  eq('別IDは追加される', idx.certs.length, 2);
  idx = CC.removeIndex(idx, 'u-eiken');
  eq('索引から外す（論理削除）', idx.certs.map(function(c){ return c.id; }), ['u-boki']);

  section('名前空間（本番と検証を混ぜない）');
  CC.setNamespace('');
  eq('本番の索引', CC.indexDocName(), 'notebook-index');
  eq('本番の資格ドキュメント', CC.certDocName('u-eiken'), 'notebook-u-eiken');
  CC.setNamespace('dev');
  eq('検証の索引', CC.indexDocName(), 'notebook-index-dev');
  eq('検証の資格ドキュメント', CC.certDocName('u-eiken'), 'notebook-u-eiken-dev');
  ok('既存資格のドキュメント名とは決して一致しない',
     ['notebook', 'notebook-itpass', 'notebook-fe', 'storage']
       .every(function(d){ return CC.certDocName('u-eiken') !== d && CC.indexDocName() !== d; }));
  CC.setNamespace('');
}

/* ============================================================
   2. 実データ検証（--live）: Firestore REST・名前空間 dev のみ
   ============================================================ */

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

const restAdapter = {
  async get(name){
    const res = await fetch(BASE + encodeURIComponent(name));
    if(res.status === 404) return null;
    if(!res.ok) throw new Error('GET ' + name + ' → ' + res.status);
    const j = await res.json();
    return fromFs({mapValue:{fields:j.fields || {}}});
  },
  async set(name, data, merge){
    /* merge=true はフィールド単位の更新（updateMask）で表現する */
    let url = BASE + encodeURIComponent(name);
    if(merge !== false){
      url += '?' + Object.keys(data).map(function(k){ return 'updateMask.fieldPaths=' + encodeURIComponent(k); }).join('&');
    }
    const fields = {};
    Object.keys(data).forEach(function(k){ fields[k] = toFs(data[k]); });
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({fields: fields}),
    });
    if(!res.ok) throw new Error('PATCH ' + name + ' → ' + res.status + ' ' + (await res.text()).slice(0, 200));
  },
  async del(name){
    const res = await fetch(BASE + encodeURIComponent(name), {method:'DELETE'});
    if(!res.ok && res.status !== 404) throw new Error('DELETE ' + name + ' → ' + res.status);
  },
};

async function liveTests(){
  console.log('\n============================================================');
  console.log('実データ検証（名前空間 dev のみ・本番ドキュメントには触れない）');
  console.log('============================================================');

  CC.setNamespace('dev');
  CC.setAdapter(restAdapter);

  const ID = 'u-verify';

  /* 前回の残骸を片づけてから始める */
  await restAdapter.del(CC.certDocName(ID));
  await restAdapter.del(CC.certDocName(ID) + '_snap');
  await restAdapter.del(CC.indexDocName());

  section('新規作成');
  const cats = [
    {id:'cat_w1', name:'英単語'},
    {id:'cat_w2', name:'熟語'},
    {id:'cat_w3', name:'文法'},
  ];
  const created = await CC.createCert({id:ID, name:'検証用資格', desc:'verify-custom.js が作った検証用', cats:cats});
  ok('作成に成功', created.ok, created.reason);

  const listed = await CC.listCerts();
  ok('索引に載る', listed.some(function(c){ return c.id === ID; }));
  const entry = listed.find(function(c){ return c.id === ID; });
  eq('索引のカテゴリ数', entry.cats, 3);
  eq('索引のカード枚数（作成直後）', entry.cards, 0);

  section('ID衝突（実データ）');
  const dup = await CC.createCert({id:ID, name:'重複', desc:'', cats:cats});
  ok('同じIDでは作成できない', !dup.ok, dup.reason);
  console.log('       → ' + dup.reason);

  section('カード追加（SafeStoreと同じ経路＝customCards への直接CRUD）');
  const cards = {
    cat_w1: [{id:'1', term:'apple', def:'りんご'}, {id:'2', term:'orange', def:'みかん'}],
    cat_w2: [{id:'3', term:'give up', def:'あきらめる'}],
    cat_w3: [{id:'4', term:'仮定法', def:'if節'}, {id:'5', term:'関係代名詞', def:'which'}, {id:'6', term:'分詞構文', def:'-ing'}],
  };
  await restAdapter.set(CC.certDocName(ID), {customCards:cards}, true);
  const loaded = await CC.loadMeta(ID);
  eq('保存したカード枚数', CC.countCards(loaded.customCards), 6);

  await CC.touchIndex(ID, loaded.meta, loaded.customCards);
  const after = (await CC.listCerts()).find(function(c){ return c.id === ID; });
  eq('索引のカード枚数が追従する', after.cards, 6);

  section('カテゴリ削除（実データ・件数照合）');
  const del = CC.deleteCat(loaded.meta.cats, loaded.customCards, 'cat_w3');
  eq('退避した枚数', del.moved, 3);
  /* アプリと同じ順序：先に学習データ（customCards）を SafeStore 相当の経路で保存し、
     そのあとメタを保存する。saveMeta は customCards を書かない。 */
  await restAdapter.set(CC.certDocName(ID), {customCards:del.customCards}, true);
  await CC.saveMeta(ID, Object.assign({}, loaded.meta, {cats:del.cats}), del.customCards);
  const reloaded = await CC.loadMeta(ID);
  eq('カテゴリ数 3 → 3（未分類が増える）', reloaded.meta.cats.length, 3);
  eq('カテゴリ構成', reloaded.meta.cats.map(function(c){ return c.name; }), ['英単語', '熟語', CC.UNCAT_NAME]);
  eq('カード総数は変わらない', CC.countCards(reloaded.customCards), 6);
  eq('未分類の枚数', reloaded.customCards[CC.UNCAT_ID].length, 3);
  const idxAfterDel = (await CC.listCerts()).find(function(c){ return c.id === ID; });
  eq('索引のカード枚数も変わらない', idxAfterDel.cards, 6);

  section('資格の削除（索引から外す論理削除）');
  await CC.unlistCert(ID);
  ok('索引から消える', !(await CC.listCerts()).some(function(c){ return c.id === ID; }));
  const survived = await CC.loadMeta(ID);
  ok('本体ドキュメントは残っている（同じIDで作り直せば戻る）', survived !== null);
  eq('残っているカード枚数', CC.countCards(survived.customCards), 6);

  section('既存資格への影響がないこと');
  for(const doc of ['notebook', 'notebook-itpass', 'notebook-fe', 'storage', 'notebook-index']){
    const before = liveBaseline[doc];
    const res = await fetch(BASE + encodeURIComponent(doc));
    const now = res.status === 404 ? null : (await res.text()).length;
    ok('app/' + doc + ' は検証前後で不変（' + (now === null ? '存在しない' : now + ' bytes') + '）',
       String(before) === String(now), '検証前 ' + before);
  }

  /* 後片づけ */
  await restAdapter.del(CC.certDocName(ID));
  await restAdapter.del(CC.certDocName(ID) + '_snap');
  await restAdapter.del(CC.indexDocName());
  console.log('\n  （検証用ドキュメントは削除済み）');
}

let liveBaseline = {};
async function takeBaseline(){
  for(const doc of ['notebook', 'notebook-itpass', 'notebook-fe', 'storage', 'notebook-index']){
    const res = await fetch(BASE + encodeURIComponent(doc));
    liveBaseline[doc] = res.status === 404 ? null : (await res.text()).length;
  }
}

(async function main(){
  pureTests();
  if(process.argv.includes('--live')){
    await takeBaseline();
    await liveTests();
  }
  console.log('\n' + '─'.repeat(60));
  console.log(fail === 0 ? '✓ すべての検証を通過しました（' + pass + '項目）'
                         : '✗ ' + fail + ' 件失敗（' + pass + ' 件成功）');
  process.exit(fail === 0 ? 0 : 1);
})();
