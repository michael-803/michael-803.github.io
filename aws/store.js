/* ============================================================
   CloudStore — 全アプリ共有のクラウド保存レイヤー
   Firebase の設定はこのファイルの1箇所だけ書き換えればOK。
   ・未設定でも localStorage で動作（フォールバック）
   ・初回接続時、既存の localStorage データを自動でクラウドへ移行
   ・別端末の更新は onChange コールバックで受け取れる
   ============================================================ */

// ★ Firebase 設定（aws-study-hub プロジェクト）
window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBYdrdGHoLqeMfsKQBK1sGdriXjk__iJ2o",
  authDomain:        "aws-study-hub-9fa13.firebaseapp.com",
  projectId:         "aws-study-hub-9fa13",
  storageBucket:     "aws-study-hub-9fa13.firebasestorage.app",
  messagingSenderId: "667642812393",
  appId:             "1:667642812393:web:164a65c4819cdc8e431d78"
};

window.CloudStore = (function(){
  const cfg = window.FIREBASE_CONFIG;
  const configured = Object.values(cfg).every(v => v !== "REPLACE_ME");
  const DOC_PATH = ['app', 'storage'];   // Firestore: app/storage に全キーを保存

  let cache = {};          // メモリ上のキー値ストア
  let db = null, fns = null;
  let ready = false;
  let cloud = false;
  const changeCbs = [];
  let applyingRemote = false;

  function lsGet(key){
    try{ const r = window.localStorage.getItem(key); return r ? JSON.parse(r) : undefined; }
    catch(e){ return undefined; }
  }
  function lsSet(key, val){
    try{ window.localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
  }

  async function init(keys){
    keys = keys || [];
    if(ready) return {cloud};

    if(!configured){
      // Firebase未設定 → localStorageのみで動作
      keys.forEach(k => { const v = lsGet(k); if(v !== undefined) cache[k] = v; });
      ready = true; cloud = false;
      return {cloud:false};
    }

    try{
      const appMod = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
      const fsMod  = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
      const app = appMod.initializeApp(cfg, 'cloudstore');
      db = fsMod.getFirestore(app);
      fns = fsMod;

      const ref = fsMod.doc(db, DOC_PATH[0], DOC_PATH[1]);
      const snap = await fsMod.getDoc(ref);
      const remote = snap.exists() ? (snap.data() || {}) : {};

      // クラウドの値を採用しつつ、クラウドに無いキーは localStorage から移行
      cache = Object.assign({}, remote);
      let migrated = false;
      keys.forEach(k => {
        if(cache[k] === undefined){
          const v = lsGet(k);
          if(v !== undefined){ cache[k] = v; migrated = true; }
        }
      });
      if(migrated){
        await fsMod.setDoc(ref, cache, {merge:true});
      }

      // 別端末からの更新をリアルタイム反映
      fsMod.onSnapshot(ref, s => {
        if(!s.exists()) return;
        const d = s.data() || {};
        if(JSON.stringify(d) === JSON.stringify(cache)) return;
        applyingRemote = true;
        cache = Object.assign({}, d);
        applyingRemote = false;
        changeCbs.forEach(cb => { try{ cb(); }catch(e){} });
      });

      ready = true; cloud = true;
      return {cloud:true};
    }catch(e){
      console.warn('CloudStore: Firebase接続失敗。localStorageで動作します。', e);
      keys.forEach(k => { const v = lsGet(k); if(v !== undefined) cache[k] = v; });
      ready = true; cloud = false;
      return {cloud:false, error:e};
    }
  }

  function get(key){
    return cache[key];
  }

  function set(key, val){
    cache[key] = val;
    lsSet(key, val);              // オフラインフォールバック用ミラー
    if(cloud && db && fns && !applyingRemote){
      const ref = fns.doc(db, DOC_PATH[0], DOC_PATH[1]);
      fns.setDoc(ref, {[key]: val}, {merge:true}).catch(e => {
        console.warn('CloudStore: 保存失敗（localStorageには保存済み）', e);
      });
    }
  }

  function onChange(cb){ changeCbs.push(cb); }
  function isCloud(){ return cloud; }
  function isConfigured(){ return configured; }

  return {init, get, set, onChange, isCloud, isConfigured};
})();
