/* ============================================================
   SafeStore — AWS Study Deck 改変版（v2）専用の保存レイヤー

   目的：改変作業中に本番データを絶対に壊さないこと。

   ・app/notebook       … 本番。「読む」経路しか持たない（書き込み関数を用意していない）
   ・app/notebook_v2    … 改変版の保存先。読み書きはすべてここ
   ・app/notebook_v2_snap … 直近5世代のスナップショット
   ・localStorage       … 3つ目の砦（クラウドが落ちても残るミラー）

   本番へ書き込むコードはこのファイルに存在しません。
   ============================================================ */

window.SafeStore = (function(){

  const PROD_DOC  = 'notebook';
  const STAGE_DOC = 'notebook_v2';
  const SNAP_DOC  = 'notebook_v2_snap';
  const LS_KEY    = 'awsStudyDeckV2Mirror';
  const MAX_GENS  = 5;

  /* 起動時の同期方針
     'refresh' … 毎回、本番の最新コピーから開始する（改変作業中の既定）
     'keep'    … v2に保存した内容をそのまま引き継ぐ（保存機能をテストしたいとき）  */
  let SYNC_MODE = 'refresh';

  const GUARD = {
    dropRatio: 0.6,   // カードがこの割合を下回るまで減ったら保存を止める
    minCards:  4,     // 母数がこれ未満のときは割合判定をしない
    minStats:  10     // 学習履歴の全消失を検知する最小母数
  };

  let db = null, fns = null, ref = null, snapRef = null;
  let cloud = false, loaded = false;
  let prev = null;                 // 直前に保存が通ったデータ
  let applyingRemote = false;
  const remoteCbs = [];
  const blocked = [];              // ブロックした保存の記録（コンソール確認用）

  /* ---------- 小道具 ---------- */
  const clone = d => JSON.parse(JSON.stringify(d || {}));

  function countCards(d){
    if(!d || !d.customCards) return 0;
    return Object.values(d.customCards)
      .reduce((s,a) => s + (Array.isArray(a) ? a.length : 0), 0);
  }
  function countStats(d){
    return (d && d.fcStats) ? Object.keys(d.fcStats).length : 0;
  }
  function isEmpty(d){ return countCards(d) === 0 && countStats(d) === 0; }

  function lsRead(){
    try{ const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; }
    catch(e){ return null; }
  }
  function lsWrite(d){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(d)); }catch(e){}
  }

  /* ---------- 第1層：書き込みガード ----------
     消し飛ばす系の保存だけを止める。1枚ずつの削除は通す。 */
  function guardCheck(next){
    if(!loaded) return '読み込みが終わる前に保存しようとしました';

    const n = countCards(next), p = countCards(prev);
    if(p > 0 && n === 0)  return `カードが全部消えています（${p}枚 → 0枚）`;
    if(p >= GUARD.minCards && n < Math.ceil(p * GUARD.dropRatio))
      return `カードが一度に減りすぎています（${p}枚 → ${n}枚）`;

    const ns = countStats(next), ps = countStats(prev);
    if(ps >= GUARD.minStats && ns === 0)
      return `学習履歴が全部消えています（${ps}件 → 0件）`;

    return null;
  }

  /* ---------- 第2層：世代スナップショット ---------- */
  async function readSnapshots(){
    if(!cloud) return [];
    try{
      const s = await fns.getDoc(snapRef);
      return (s.exists() && Array.isArray(s.data().gens)) ? s.data().gens : [];
    }catch(e){ return []; }
  }
  async function pushSnapshot(data, label){
    if(!cloud || isEmpty(data)) return;
    try{
      const gens = await readSnapshots();
      const body = JSON.stringify(data);
      if(gens[0] && JSON.stringify(gens[0].data) === body) return;  // 変化なしなら積まない
      gens.unshift({ ts:new Date().toISOString(), label:label || '', data:clone(data) });
      await fns.setDoc(snapRef, { gens: gens.slice(0, MAX_GENS) });
    }catch(e){ console.warn('SafeStore: スナップショットの保存に失敗', e); }
  }

  /* ---------- 起動 ---------- */
  async function init(){
    const notes = [];
    const cfg = window.FIREBASE_CONFIG;

    /* --- クラウドに繋ぐ --- */
    try{
      const appMod = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
      const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      const app = appMod.initializeApp(cfg, 'safestore');
      db  = fsMod.getFirestore(app);
      fns = fsMod;
      ref     = fsMod.doc(db, 'app', STAGE_DOC);
      snapRef = fsMod.doc(db, 'app', SNAP_DOC);
      cloud = true;
    }catch(e){
      console.warn('SafeStore: クラウドに接続できません。この端末だけで動きます。', e);
      const mirror = lsRead();
      prev = mirror || {};
      loaded = true;
      notes.push(mirror ? 'オフラインです。この端末の控えを読み込みました。'
                        : 'オフラインです。データがまだありません。');
      return { data: clone(prev), cloud:false, notes };
    }

    /* --- 本番（読むだけ）と改変版を並行して読む --- */
    let prod = {}, stage = {};
    try{
      const [ps, ss] = await Promise.all([
        fns.getDoc(fns.doc(db, 'app', PROD_DOC)),
        fns.getDoc(ref)
      ]);
      if(ps.exists()) prod  = ps.data() || {};
      if(ss.exists()) stage = ss.data() || {};
    }catch(e){
      console.warn('SafeStore: 読み込みに失敗', e);
    }

    /* --- 使うデータを決める --- */
    let data, origin;
    if(SYNC_MODE === 'refresh' || isEmpty(stage)){
      data = clone(prod);  origin = '本番の最新コピー';
    }else{
      data = clone(stage); origin = '改変版の保存内容';
    }

    /* --- 第3層：それでも空なら控えから自動で戻す --- */
    if(isEmpty(data)){
      const gens = await readSnapshots();
      const mirror = lsRead();
      if(gens[0] && !isEmpty(gens[0].data)){
        data = clone(gens[0].data);
        notes.push(`データが空でした。${gens[0].ts.slice(0,16).replace('T',' ')} の控えから復元しました。`);
      }else if(mirror && !isEmpty(mirror)){
        data = clone(mirror);
        notes.push('データが空でした。この端末の控えから復元しました。');
      }
    }

    prev = clone(data);
    loaded = true;
    lsWrite(data);
    await pushSnapshot(data, '起動時（' + origin + '）');

    /* --- 他端末の更新を受け取る（改変版の箱のみ監視） --- */
    fns.onSnapshot(ref, s => {
      if(!s.exists() || applyingRemote) return;
      const d = s.data() || {};
      if(JSON.stringify(d) === JSON.stringify(prev)) return;
      prev = clone(d);
      lsWrite(d);
      remoteCbs.forEach(cb => { try{ cb(clone(d)); }catch(e){} });
    });

    return { data: clone(data), cloud:true, origin, notes };
  }

  /* ---------- 保存（改変版の箱にだけ書く） ---------- */
  async function save(data){
    const reason = guardCheck(data);
    if(reason){
      blocked.push({ ts:new Date().toISOString(), reason, attempted:clone(data) });
      console.warn('SafeStore: 保存をブロックしました —', reason);
      return { ok:false, reason };
    }

    lsWrite(data);            // ミラーは先に更新（クラウドが落ちても残る）
    prev = clone(data);
    if(!cloud) return { ok:true, cloud:false };

    try{
      applyingRemote = true;
      await fns.setDoc(ref, Object.assign({}, data, { updatedAt:new Date().toISOString() }));
      return { ok:true, cloud:true };
    }catch(e){
      console.warn('SafeStore: クラウドへの保存に失敗（端末の控えには保存済み）', e);
      return { ok:false, reason:e.message, cloud:false };
    }finally{
      applyingRemote = false;
    }
  }

  /* ---------- 手動の復旧・確認（コンソールから使う） ---------- */
  async function listSnapshots(){
    const gens = await readSnapshots();
    return gens.map((g,i) => ({
      index:i, ts:g.ts, label:g.label,
      cards:countCards(g.data), stats:countStats(g.data)
    }));
  }
  async function restore(index){
    const gens = await readSnapshots();
    const g = gens[index];
    if(!g) return { ok:false, reason:'その世代はありません' };
    prev = clone(g.data);            // ガードの基準を戻してから書く
    const r = await save(g.data);
    if(r.ok) location.reload();
    return r;
  }
  function blockedLog(){ return blocked.slice(); }
  function setSyncMode(m){ SYNC_MODE = m; }
  function status(){
    return { cloud, loaded, syncMode:SYNC_MODE, stageDoc:STAGE_DOC,
             cards:countCards(prev), stats:countStats(prev), blocked:blocked.length };
  }
  function onRemote(cb){ remoteCbs.push(cb); }

  return { init, save, onRemote, listSnapshots, restore,
           blockedLog, status, setSyncMode, countCards, countStats };
})();
