/* ============================================================
   boot.js — 全資格共通のブート処理と保存項目の定義

   読み込み順： store.js → safe-store.js → cert.js → data.js
                → engine.js → engine-formats.js → boot.js

   保存先は各HTMLが読み込み前に設定する window.SAFESTORE_HOME_DOC
   （資格ごとに別ドキュメント。CLAUDE.md 10-5節）。

   ★保存する項目を増やすときは PERSIST_DEFAULTS に1行足すだけでよい。
     ここが唯一の定義箇所なので、資格ごとの追加漏れが起きない。

   ※CLF-C02版 index.html にあった旧形式（cardStats / notebooks / decks）
     からの救出コードは、新規資格には該当データが存在しないため入れていない。
     CLF-C02の移行処理は /aws/index.html 側にそのまま残っている。
   ============================================================ */

/* 保存する項目と、その既定値。 */
const PERSIST_DEFAULTS = {
  customCards:   {},
  fcStats:       {},
  fcTabState:    {},
  cardEdits:     {},
  hiddenCards:   [],
  fcProgress:    {},
  fcLastKey:     null,
  quizStats:     {answered:{}, wrong:[]},
  scenarioStats: {answered:{}, wrong:[]},
  multiStats:    {answered:{}, wrong:[]},
  orderingStats: {answered:{}, wrong:[]},
  matchingStats: {answered:{}, wrong:[]},
  pseudoStats:   {answered:{}, wrong:[]},   // FE科目B（擬似言語）
  multiQEdits:   {},
  hiddenMultiQ:  [],
  customMultiQ:  [],
};

/* 既定値は使い回すと参照が共有されてしまうため、都度コピーを作る */
function defaultFor(key){
  const v = PERSIST_DEFAULTS[key];
  return (v === null || typeof v !== 'object') ? v : JSON.parse(JSON.stringify(v));
}

/* クラウドの保存内容をアプリの state に流し込む */
function adoptData(d){
  d = d || {};
  Object.keys(PERSIST_DEFAULTS).forEach(key=>{
    const v = d[key];
    state[key] = (v === undefined || v === null) ? defaultFor(key) : v;
  });
}

/* state から保存対象だけを抜き出す */
function snapshotState(){
  const out = {};
  Object.keys(PERSIST_DEFAULTS).forEach(key=>{ out[key] = state[key]; });
  return out;
}

/* engine.js の save() から呼ばれる保存口。SafeStoreのガードを通ったものだけが書かれる */
window._save = async function(){
  setSyncState('syncing');
  const r = await SafeStore.save(snapshotState());
  if(r.ok){ setSyncState('ok'); }
  else{
    setSyncState('error');
    toast('保存を中止：' + r.reason, 'error');
  }
};

(async function boot(){
  setSyncState('syncing');

  let res;
  try{
    res = await SafeStore.init();
  }catch(e){
    res = {data:{}, cloud:false, notes:['接続できませんでした：' + e.message]};
  }

  adoptData(res.data);
  afterLoad();
  setSyncState(res.cloud ? 'ok' : 'error');

  (res.notes || []).forEach((n,i) => setTimeout(()=>toast(n, 'success'), 400 + i*2800));

  SafeStore.onRemote(d => {
    adoptData(d);
    afterLoad(true);
    setSyncState('ok');
  });

  console.log('%cSafeStore', 'color:#38BDF8;font-weight:700',
    CERT.name, '／ 保存先:', 'app/' + (window.SAFESTORE_HOME_DOC || 'notebook'),
    '\n  状態:', SafeStore.status(),
    '\n  控えの一覧: await SafeStore.listSnapshots()',
    '\n  控えから戻す: await SafeStore.restore(0)',
    '\n  止めた保存: SafeStore.blockedLog()');
})();
