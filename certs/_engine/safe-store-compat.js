/* ============================================================
   SafeStore を CloudStore と同じ get/set/init インターフェースで
   使うための互換シム。dojo-v2.html・mock-exam-v2.html 専用。

   本番 app/notebook・app/storage は読むだけ。書き込みは
   app/notebook_v2 にのみ、SafeStore.save()経由でフィールド単位の
   merge保存を行う（他ページのフィールドは消さない）。

   store.js が定義する window.CloudStore をこのシムで上書きする。
   store.js・safe-store.js の後に読み込むこと。
   ============================================================ */

window.CloudStore = (function(){
  let cache = {};
  let ready = false, cloud = false;
  const changeCbs = [];

  async function init(keys){
    keys = keys || [];
    if(ready) return {cloud};

    let res;
    try{
      res = await SafeStore.init();
    }catch(e){
      res = { data:{}, cloud:false };
    }
    const data = res.data || {};
    keys.forEach(k=>{ if(data[k] !== undefined) cache[k] = data[k]; });
    ready = true;
    cloud = !!res.cloud;

    SafeStore.onRemote(d=>{
      let changed = false;
      keys.forEach(k=>{
        if(JSON.stringify(d[k]) !== JSON.stringify(cache[k])){ cache[k] = d[k]; changed = true; }
      });
      if(changed) changeCbs.forEach(cb=>{ try{ cb(); }catch(e){} });
    });

    return {cloud};
  }

  function get(key){ return cache[key]; }
  function set(key, val){
    cache[key] = val;
    SafeStore.save({ [key]: val });
  }
  function onChange(cb){ changeCbs.push(cb); }
  function isCloud(){ return cloud; }
  function isConfigured(){ return true; }

  return {init, get, set, onChange, isCloud, isConfigured};
})();
