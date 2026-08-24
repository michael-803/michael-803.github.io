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
    focus(){}, blur(){}, addEventListener(){}, removeEventListener(){},
    appendChild(){}, closest(){ return null; },
    querySelector(){ return null; }, querySelectorAll(){ return []; },
  };
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
