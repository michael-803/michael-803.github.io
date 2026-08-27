/* ============================================================
   verify-custom-engine.js — 共通エンジンを動的モードで動かす検証

     node _tools/verify-custom-engine.js

   custom/index.html がやっているのと同じ手順で
   （CERT / SAMPLE / FC_CATS_DEF を先に組み立ててから engine.js を読む）
   実際の _engine/engine.js を Node 上で評価し、単語帳の動作を確かめる。

   ★同じハーネスで既存資格（FE）も読み込み、
     rebuildCatMaps() の追加で静的モードが壊れていないことを併せて確認する。

   DOMは最小限のスタブ。engine.js は読み込み時点ではDOMに触れないので、
   描画関数を呼んだときだけスタブが効けばよい。
   ============================================================ */

const fs   = require('fs');
const vm   = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CC   = require(path.join(ROOT, '_engine', 'custom-store.js'));

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

/* ---------- 最小DOMスタブ ---------- */
function makeStubElement(id){
  return {
    id: id,
    style: {}, dataset: {},
    value: '', textContent: '', innerHTML: '', disabled: false,
    classList: { add(){}, remove(){}, contains(){ return false; }, toggle(){} },
    focus(){}, blur(){}, scrollIntoView(){}, addEventListener(){}, removeEventListener(){},
    appendChild(){}, closest(){ return null; },
    querySelector(){ return null; }, querySelectorAll(){ return []; },
    getBoundingClientRect(){ return {top:0,left:0,width:0,height:0}; },
  };
}

function makeContext(){
  const els = {};
  const document = {
    getElementById(id){ return (els[id] || (els[id] = makeStubElement(id))); },
    querySelector(){ return null; },
    querySelectorAll(){ return []; },
    createElement(t){ return makeStubElement(t); },
    addEventListener(){}, removeEventListener(){},
    body: makeStubElement('body'),
    documentElement: makeStubElement('html'),
  };
  const ctx = {
    document: document,
    console: console,
    setTimeout: setTimeout, clearTimeout: clearTimeout,
    setInterval: setInterval, clearInterval: clearInterval,
    /* Math はコピーを渡す。検証で Math.random を差し替えても
       Node本体やほかの検証に影響しないようにするため。 */
    JSON: JSON, Math: Object.create(Math), Date: Date, Promise: Promise,
    confirm(){ return true; }, alert(){}, prompt(){ return ''; },
    ico(){ return ''; },
    localStorage: { getItem(){ return null; }, setItem(){}, removeItem(){} },
    location: { search: '', href: '', reload(){} },
    navigator: { userAgent: 'node' },
    _els: els,
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  return ctx;
}

function runFile(ctx, rel){
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(code, ctx, {filename: rel});
}

/* ============================================================
   1. 動的モード（カスタム資格）
   ============================================================ */
function dynamicTests(){
  console.log('============================================================');
  console.log('動的モード：カスタム資格を共通エンジンで動かす');
  console.log('============================================================');

  const cats = [
    {id:'cat_w1', name:'英単語'},
    {id:'cat_w2', name:'熟語'},
    {id:'cat_w3', name:'文法'},
  ];

  /* custom/index.html と同じ順序でグローバルを用意する */
  const ctx = makeContext();
  ctx.CERT = {
    id:'u-verify', name:'検証用資格', doc:'notebook-u-verify-dev', custom:true,
    features:{flashcards:true, quiz:false, multi:false, scenario:false, ordering:false,
              matching:false, pseudo:false, weak:false, cheatsheet:false, mock:false, dojo:false},
    quizOnlyCats:[], labNames:{}, prescriptions:{},
  };
  ctx.SAMPLE = {};                       // 組み込みカードなし
  ctx.FC_CATS_DEF = cats.slice();
  ctx.QCAT = []; ctx.QQ = []; ctx.SCENARIO_Q = [];
  ctx.MULTI_Q = []; ctx.CHEATSHEETS = []; ctx.PSEUDO_Q = [];

  section('エンジンの読み込み（データ契約が満たせているか）');
  let loadErr = null;
  try{ runFile(ctx, '_engine/engine.js'); }catch(e){ loadErr = e; }
  ok('engine.js が動的グローバルだけで読み込める', !loadErr, loadErr && loadErr.message);
  if(loadErr) return;

  eq('カテゴリ表が組み上がる', vm.runInContext('Object.keys(CAT_ID_TO_NAME)', ctx), ['cat_w1','cat_w2','cat_w3']);
  eq('組み込みカードは0枚', vm.runInContext('Object.values(SAMPLE).length', ctx), 0);

  /* boot.js 相当：保存済みデータを state に流し込む */
  vm.runInContext(`
    state.customCards = {
      cat_w1:[{id:'1',term:'apple',def:'りんご'},{id:'2',term:'orange',def:'みかん'}],
      cat_w2:[{id:'3',term:'give up',def:'あきらめる'}],
      cat_w3:[{id:'4',term:'仮定法',def:'if節'},{id:'5',term:'関係代名詞',def:'which'},{id:'6',term:'分詞構文',def:'-ing'}]
    };
    window._save = function(){ window.__saved = (window.__saved||0)+1; };
  `, ctx);

  section('カードの組み立て（上書きレイヤーを通らないこと）');
  eq('全カード枚数', vm.runInContext('buildCards().length', ctx), 6);
  eq('すべてユーザーのカード（builtin:false）',
     vm.runInContext('buildCards().every(c=>c.builtin===false)', ctx), true);
  eq('カードIDの形（c::<id>）', vm.runInContext('buildCards()[0].id', ctx), 'c::1');
  eq('カテゴリ名が引けている', vm.runInContext('buildCards()[0].cat', ctx), '英単語');
  eq('cardEdits は空のまま', vm.runInContext('Object.keys(state.cardEdits||{}).length', ctx), 0);
  eq('hiddenCards は空のまま', vm.runInContext('(state.hiddenCards||[]).length', ctx), 0);

  section('デッキの計算（カテゴリ選択・全カテゴリ）');
  eq('全カテゴリ', vm.runInContext('computeDeck(CAT_ALL).length', ctx), 6);
  eq('1カテゴリ（英単語）', vm.runInContext('computeDeck("cat_w1").length', ctx), 2);
  eq('複数カテゴリ（英単語＋文法）', vm.runInContext('computeDeck("m:cat_w1+cat_w3").length', ctx), 5);

  section('描画（DOMスタブで例外が出ないこと）');
  let renderErr = null;
  try{ vm.runInContext('enterKey(CAT_ALL); renderFc();', ctx); }catch(e){ renderErr = e; }
  ok('単語帳の描画が通る', !renderErr, renderErr && renderErr.message);
  let afterErr = null;
  try{ vm.runInContext('applyFeatureToggles(); renderQuizHome();', ctx); }catch(e){ afterErr = e; }
  ok('afterLoad() が呼ぶ処理（機能トグル・過去問トップ）も通る', !afterErr, afterErr && afterErr.message);

  section('カードの追加・編集・削除（既存の独自カード経路をそのまま使う）');
  vm.runInContext(`
    document.getElementById('new-term').value = 'banana';
    document.getElementById('new-def').value  = 'バナナ\\n（果物）';
    document.getElementById('new-cat').value  = 'cat_w1';
    submitCard();
  `, ctx);
  eq('追加後の枚数', vm.runInContext('buildCards().length', ctx), 7);
  eq('英単語カテゴリが3枚に', vm.runInContext('state.customCards.cat_w1.length', ctx), 3);
  eq('改行がそのまま保存される',
     vm.runInContext('state.customCards.cat_w1[2].def.indexOf("\\n") > 0', ctx), true);

  vm.runInContext(`
    var target = buildCards().find(c=>c.term==='banana');
    editCard(target);
    document.getElementById('new-term').value = 'banana（編集）';
    document.getElementById('new-def').value  = 'バナナ';
    document.getElementById('new-cat').value  = 'cat_w2';
    submitCard();
  `, ctx);
  eq('編集で枚数は増えない', vm.runInContext('buildCards().length', ctx), 7);
  eq('カテゴリ移動が効く（英単語 2枚 / 熟語 2枚）',
     vm.runInContext('[state.customCards.cat_w1.length, state.customCards.cat_w2.length]', ctx), [2, 2]);
  eq('用語が更新される',
     vm.runInContext('state.customCards.cat_w2.some(c=>c.term==="banana（編集）")', ctx), true);

  vm.runInContext(`
    var t2 = buildCards().find(c=>c.term==='banana（編集）');
    deleteCard(t2);
  `, ctx);
  eq('削除で枚数が戻る', vm.runInContext('buildCards().length', ctx), 6);
  eq('非表示レイヤーは使われない（直接削除）', vm.runInContext('(state.hiddenCards||[]).length', ctx), 0);

  section('カテゴリ編集（学習ページと同じ手順）');
  /* ① deleteCat でカードを退避 → ② FC_CATS_DEF を差し替え → ③ rebuildCatMaps → ④ 進捗の剪定 */
  vm.runInContext('state.fcProgress["cat_w3"] = {orderIds:[],pos:0,shuffled:false,reverse:false,answeredIds:[]};', ctx);
  const before = vm.runInContext('JSON.parse(JSON.stringify(state.customCards))', ctx);
  const r = CC.deleteCat(cats, before, 'cat_w3');
  eq('退避した枚数', r.moved, 3);

  ctx.__newCats  = r.cats;
  ctx.__newCards = r.customCards;
  vm.runInContext(`
    state.customCards = __newCards;
    FC_CATS_DEF.length = 0; __newCats.forEach(function(c){ FC_CATS_DEF.push(c); });
    rebuildCatMaps();
    pruneUnknownProgress();
    enterKey(sanitizeKey(state.fcLastKey || CAT_ALL));
  `, ctx);

  eq('カード総数は変わらない', vm.runInContext('buildCards().length', ctx), 6);
  eq('未分類カテゴリが見える',
     vm.runInContext('FC_CATS_DEF.map(c=>c.name)', ctx), ['英単語', '熟語', '未分類']);
  eq('消えたカテゴリの進捗が捨てられる',
     vm.runInContext('("cat_w3" in state.fcProgress)', ctx), false);
  eq('カテゴリ表が作り直される',
     vm.runInContext('Object.keys(CAT_ID_TO_NAME)', ctx), ['cat_w1', 'cat_w2', CC.UNCAT_ID]);
  eq('未分類カテゴリのデッキ', vm.runInContext('computeDeck("' + CC.UNCAT_ID + '").length', ctx), 3);

  section('カードの表（用語）も改行できる（2026-08-25）');
  vm.runInContext(`
    document.getElementById('new-term').value = '第一正規形\\n（繰返し項目を排除した形）';
    document.getElementById('new-def').value  = '表の各行が同じ形になるよう、繰返しを別の行に分ける。';
    document.getElementById('new-cat').value  = 'cat_w1';
    submitCard();
  `, ctx);
  const added = vm.runInContext('state.customCards.cat_w1[state.customCards.cat_w1.length-1]', ctx);
  ok('用語に入力した改行がそのまま保存される', added.term.indexOf('\n') > 0, JSON.stringify(added.term));
  ok('入力欄が textarea になっている（1行のinputでは改行を入力できない）',
     fs.readFileSync(path.join(ROOT, '_engine/engine.js'), 'utf8')
       .includes('<textarea id="new-term"'));
  ok('表示側は改行を保持する指定（white-space:pre-wrap）',
     fs.readFileSync(path.join(ROOT, '_engine/app.css'), 'utf8')
       .includes('.study-term{') && /\.study-term\{[^}]*white-space:pre-wrap/.test(
       fs.readFileSync(path.join(ROOT, '_engine/app.css'), 'utf8')));

  section('長い本文のスクロールと、めくり操作の切り分け');
  const css = fs.readFileSync(path.join(ROOT, '_engine/app.css'), 'utf8');
  ok('grid が min-content 以下に縮む指定（minmax(0,1fr)）になっている',
     /\.study-face\{[^}]*grid-template-rows:auto minmax\(0,1fr\) auto/.test(css));
  ok('本文がはみ出したらスクロールする指定', /\.study-definition\{[^}]*overflow-y:auto/.test(css));
  ok('細いスクロールバーの指定がある', css.includes('scrollbar-width:thin') && css.includes('::-webkit-scrollbar-thumb'));

  /* スクロールバーをつまむクリックでカードがめくれてしまわないこと */
  vm.runInContext(`
    window.__ev = function(cls, scrollH, clientH, offsetX){
      return { target:{ classList:{ contains:function(c){ return c === cls; } },
               scrollHeight:scrollH, clientHeight:clientH, clientWidth:200 }, offsetX:offsetX };
    };
    flipped = false;
    fcFlip(__ev('study-definition', 420, 200, 206));
  `, ctx);
  eq('スクロールバーの上をクリックしてもめくれない', vm.runInContext('flipped', ctx), false);
  vm.runInContext("fcFlip(__ev('study-definition', 420, 200, 90));", ctx);
  eq('本文をクリックすればめくれる', vm.runInContext('flipped', ctx), true);
  vm.runInContext("flipped = false; fcFlip(__ev('study-definition', 180, 200, 206));", ctx);
  eq('スクロールが不要なときは右端をクリックしてもめくれる', vm.runInContext('flipped', ctx), true);
  vm.runInContext('flipped = false; fcFlip();', ctx);
  eq('キーボード（Space）からの呼び出しは従来どおり', vm.runInContext('flipped', ctx), true);

  section('学習記録（fcStats）がカードIDで保たれること');
  vm.runInContext(`
    state.fcStats['c::1'] = {ok:3, ng:1};
    state.fcStats['c::4'] = {ok:0, ng:2};
  `, ctx);
  eq('カテゴリを移動しても記録はカードIDに残る',
     vm.runInContext('state.fcStats["c::4"].ng', ctx), 2);
  eq('苦手カードの判定が効く', vm.runInContext('weakCount()', ctx), 1);
}

/* ============================================================
   1b. シャッフル（2026-08-24 仕様変更・CLAUDE.md 29節）
       「通過済みは据え置き、これから出る残りだけを混ぜる、位置は動かさない」
   ============================================================ */
function shuffleTests(){
  console.log('\n============================================================');
  console.log('シャッフル：進捗を維持したまま残りだけを混ぜる');
  console.log('============================================================');

  const ctx = makeContext();
  ctx.CERT = {
    id:'u-sh', name:'シャッフル検証', doc:'notebook-u-sh-dev', custom:true,
    features:{flashcards:true, quiz:false, multi:false, scenario:false, ordering:false,
              matching:false, pseudo:false, weak:false, cheatsheet:false, mock:false, dojo:false},
    quizOnlyCats:[], labNames:{}, prescriptions:{},
  };
  ctx.SAMPLE = {};
  ctx.FC_CATS_DEF = [{id:'cat_s', name:'章'}];
  ctx.QCAT = []; ctx.QQ = []; ctx.SCENARIO_Q = [];
  ctx.MULTI_Q = []; ctx.CHEATSHEETS = []; ctx.PSEUDO_Q = [];
  runFile(ctx, '_engine/engine.js');

  /* 10枚のカードを用意して、5枚目まで進んだ状態を作る */
  vm.runInContext(`
    state.customCards = {cat_s: Array.from({length:10}, function(_,i){
      return {id:String(i+1), term:'語'+(i+1), def:'意味'+(i+1)};
    })};
    window._save = function(){};
    enterKey(CAT_ALL);
    pos = 4;                                   // 5枚目を表示中（1〜4枚目は通過済み）
    /* 通過した4枚は「わかる/わからない」も押した扱いにする */
    getProgress(CAT_ALL).answeredIds = ['c::1','c::2','c::3','c::4'];
  `, ctx);

  const idsAt = 'order.map(function(i){ return deck[i].id; })';
  const beforeOrder = vm.runInContext(idsAt, ctx);
  eq('シャッフル前の並び', beforeOrder.slice(0, 5), ['c::1','c::2','c::3','c::4','c::5']);

  section('OFF → ON（シャッフルする）');
  /* 並びが必ず変わるよう、決まった乱数で回す */
  vm.runInContext('Math.random = (function(){ var s=1; return function(){ s=(s*16807)%2147483647; return s/2147483647; }; })();', ctx);
  vm.runInContext('toggleShuffle();', ctx);

  const afterOrder = vm.runInContext(idsAt, ctx);
  eq('位置（pos）が動かない', vm.runInContext('pos', ctx), 4);
  eq('カウンタの表示が続きから（pos+1）', vm.runInContext('pos + 1', ctx), 5);
  eq('通過済みの4枚は順番も位置もそのまま', afterOrder.slice(0, 4), ['c::1','c::2','c::3','c::4']);
  eq('デッキの枚数は変わらない', afterOrder.length, 10);
  eq('カードの重複・欠落なし', new Set(afterOrder).size, 10);
  ok('これから出る6枚の並びが変わった',
     JSON.stringify(afterOrder.slice(4)) !== JSON.stringify(beforeOrder.slice(4)),
     JSON.stringify(afterOrder.slice(4)));
  eq('残り6枚の顔ぶれは同じ（未回答のみが対象）',
     afterOrder.slice(4).slice().sort(), beforeOrder.slice(4).slice().sort());
  eq('シャッフル状態が記録される', vm.runInContext('getProgress(CAT_ALL).shuffled', ctx), true);
  eq('回答済みの記録は消えない',
     vm.runInContext('getProgress(CAT_ALL).answeredIds.length', ctx), 4);

  section('ON → OFF（本来の順に戻す）');
  vm.runInContext('toggleShuffle();', ctx);
  const back = vm.runInContext(idsAt, ctx);
  eq('位置は動かないまま', vm.runInContext('pos', ctx), 4);
  eq('通過済みはそのまま', back.slice(0, 4), ['c::1','c::2','c::3','c::4']);
  eq('残りが本来の順に戻る', back.slice(4), ['c::5','c::6','c::7','c::8','c::9','c::10']);
  eq('シャッフル状態が戻る', vm.runInContext('getProgress(CAT_ALL).shuffled', ctx), false);

  section('これから出るぶんに回答済みが混ざっている場合');
  vm.runInContext(`
    getProgress(CAT_ALL).answeredIds = ['c::1','c::2','c::3','c::4','c::6','c::8'];
    toggleShuffle();
  `, ctx);
  const mixed = vm.runInContext(idsAt, ctx);
  eq('通過済みはそのまま', mixed.slice(0, 4), ['c::1','c::2','c::3','c::4']);
  eq('未回答（5,7,9,10）が先に出る', mixed.slice(4, 8).slice().sort(), ['c::10','c::5','c::7','c::9']);
  eq('回答済み（6,8）は後ろへ回る', mixed.slice(8).slice().sort(), ['c::6','c::8']);

  section('最後の1枚まで来てから押した場合（一周の扱い）');
  vm.runInContext('pos = 9; toggleShuffle();', ctx);
  eq('先頭から出題し直す', vm.runInContext('pos', ctx), 0);
  eq('全10枚が対象に戻る', vm.runInContext('order.length', ctx), 10);
  eq('回答済みの記録がリセットされる',
     vm.runInContext('getProgress(CAT_ALL).answeredIds.length', ctx), 0);

  section('保存される進捗（別の端末・次回起動で復元されるもの）');
  vm.runInContext('persistProgress();', ctx);
  eq('並び順が保存される', vm.runInContext('getProgress(CAT_ALL).orderIds.length', ctx), 10);
  eq('位置が保存される', vm.runInContext('getProgress(CAT_ALL).pos', ctx), 0);
  vm.runInContext('pos = 6; persistProgress(); enterKey(CAT_ALL);', ctx);
  eq('起動し直しても位置が戻る', vm.runInContext('pos', ctx), 6);
}

/* ============================================================
   1c. 弱点診断が全ての出題形式を集計するか（2026-08-25）
       以前は過去問（QQ）と単語帳しか見ておらず、シナリオ・複数選択・
       擬似言語（FE科目B）の記録が反映されなかった。
   ============================================================ */
function weakTests(){
  console.log('\n============================================================');
  console.log('弱点診断：全形式の記録を集計するか');
  console.log('============================================================');

  const ctx = makeContext();
  runFile(ctx, 'fe/cert.js');
  ctx.CERT = ctx.window.CERT;
  runFile(ctx, 'fe/data.js');
  runFile(ctx, '_engine/engine.js');
  runFile(ctx, '_engine/engine-pseudo.js');     // FEは科目Bエンジンを読み込む
  vm.runInContext('window._save = function(){};', ctx);

  section('科目B（擬似言語）だけを解いた状態');
  vm.runInContext(`
    /* アルゴリズムの問題を3問正解・1問不正解にする */
    var algo = PSEUDO_Q.filter(function(q){ return q.c === 'algo'; }).slice(0, 4);
    algo.forEach(function(q, i){ recordPseudoAnswer(q, i < 3); });
  `, ctx);

  const rows = vm.runInContext('weakDiagnosis()', ctx);
  const algoRow = rows.find(function(r){ return r.id === 'algo'; });
  ok('アルゴリズム（科目B専用カテゴリ）の行がある', !!algoRow);
  eq('解答回数が集計される（以前は0のままだった）', algoRow.total, 4);
  eq('正答率が出る', algoRow.pct, 75);
  eq('内訳に擬似言語が入る', algoRow.sources.map(function(s){ return s.label; }), ['擬似言語']);

  section('科目Bのセキュリティは単語帳のセキュリティと合算される');
  vm.runInContext(`
    var sec = PSEUDO_Q.filter(function(q){ return q.c === 'security'; }).slice(0, 2);
    sec.forEach(function(q){ recordPseudoAnswer(q, false); });          // 2問とも不正解
    var cards = buildCards().filter(function(c){ return c.catId === 'cat_security'; }).slice(0, 2);
    cards.forEach(function(c){ state.fcStats[c.id] = {ok:3, ng:1}; });  // 単語帳は8回中6回正解
  `, ctx);
  const rows2 = vm.runInContext('weakDiagnosis()', ctx);
  const secRow = rows2.find(function(r){ return r.id === 'cat_security'; });
  eq('単語帳8回＋擬似言語2回＝10回', secRow.total, 10);
  eq('内訳が2種類出る', secRow.sources.map(function(s){ return s.label; }), ['単語帳', '擬似言語']);
  eq('重み付き平均になる（単語帳75%×8 ＋ 擬似言語0%×2 → 60%）', secRow.pct, 60);

  section('シナリオ問題と過去問も合算される');
  vm.runInContext(`
    var q1 = QQ.filter(function(q){ return q.c === 'db'; }).slice(0, 2);
    q1.forEach(function(q){ recordAnswer(q, true); });
    var s1 = SCENARIO_Q.filter(function(q){ return q.c === 'db'; }).slice(0, 2);
    s1.forEach(function(q){ recordScenarioAnswer(q, false); });
  `, ctx);
  const dbRow = vm.runInContext('weakDiagnosis()', ctx).find(function(r){ return r.id === 'cat_db'; });
  eq('過去問2回＋シナリオ2回', dbRow.total, 4);
  eq('内訳', dbRow.sources.map(function(s){ return s.label; }), ['過去問', 'シナリオ']);
  eq('正答率（2勝2敗）', dbRow.pct, 50);

  section('記録が無いカテゴリは従来どおり「未挑戦」');
  const uiRow = vm.runInContext('weakDiagnosis()', ctx).find(function(r){ return r.id === 'cat_ui'; });
  eq('回数0', uiRow.total, 0);
  eq('正答率はnull', uiRow.pct, null);
  eq('内訳は空', uiRow.sources.length, 0);

  section('描画');
  let err = null;
  try{ vm.runInContext('renderWeak();', ctx); }catch(e){ err = e; }
  ok('弱点診断の画面が描ける', !err, err && err.message);
  const html = ctx._els['weak-container'] ? ctx._els['weak-container'].innerHTML : '';
  ok('内訳が画面に出る', html.indexOf('cat-src') >= 0);
  ok('擬似言語の内訳が出る', html.indexOf('擬似言語') >= 0);

  /* ★資格ごとに持っている問題バンクが違う（FEに MULTI_Q は無い）。
     機能トグルを見ずに集計関数を呼ぶと未定義のグローバルで落ちるため、
     3資格すべてで弱点診断が例外なく描けることを確かめる。 */
  section('全資格で弱点診断が落ちないこと');
  [['aws/clf', 'CLF-C02', ['_engine/engine-formats.js']],
   ['itpass',  'ITパスポート', ['_engine/engine-formats.js']],
   ['fe',      '基本情報',    ['_engine/engine-formats.js', '_engine/engine-pseudo.js']],
   ['aws/saa', 'SAA-C03',     []],
   ['aws/soa', 'SOA-C03',     []],
   ['ap',      '応用情報',    []],
   ['aws/sap', 'SAP-C02',     []],
   ['aws/scs', 'SCS-C03',     ['_engine/engine-formats.js']],
  ].forEach(function(t){
    const dir = t[0], label = t[1], extra = t[2];
    const c = makeContext();
    let e2 = null;
    try{
      runFile(c, dir + '/cert.js');
      c.CERT = c.window.CERT;
      runFile(c, dir + '/data.js');
      runFile(c, '_engine/engine.js');
      extra.forEach(function(f){ runFile(c, f); });
      vm.runInContext('window._save = function(){}; weakDiagnosis(); renderWeak();', c);
    }catch(err2){ e2 = err2; }
    ok(label + '：弱点診断が例外なく動く', !e2, e2 && e2.message);
    if(!e2){
      const rows = vm.runInContext('weakDiagnosis()', c);
      ok(label + '：カテゴリ行が ' + rows.length + ' 件そろう', rows.length > 0);
    }
  });
}

/* ============================================================
   1d. チートシート：資格固有の図解が混ざらないこと（2026-08-25）
       以前は AWS の VPC構成図が共通エンジンに直書きされており、
       FE・ITパスポートのチートシートにも無条件で描かれていた。
   ============================================================ */
function cheatsheetTests(){
  console.log('\n============================================================');
  console.log('チートシート：資格固有の図解の切り分け');
  console.log('============================================================');

  const load = function(dir, extra){
    const c = makeContext();
    runFile(c, dir + '/cert.js');
    c.CERT = c.window.CERT;
    runFile(c, dir + '/data.js');
    runFile(c, '_engine/engine.js');
    (extra || []).forEach(function(f){ runFile(c, f); });
    vm.runInContext('window._save = function(){}; renderCheatsheet();', c);
    return c._els['cheatsheet-container'].innerHTML;
  };

  section('CLF-C02（AWS）');
  const clf = load('aws/clf', ['_engine/engine-formats.js']);
  ok('VPC構成図が出る', clf.indexOf('vpc-diagram') >= 0);
  ok('図の見出しが出る', clf.indexOf('VPC構成図（基本パターン）') >= 0);

  section('基本情報（FE）');
  const fe = load('fe', ['_engine/engine-formats.js', '_engine/engine-pseudo.js']);
  ok('AWSのVPC構成図が出ない', fe.indexOf('vpc-diagram') < 0);
  ok('FEのチートシートが出る', fe.indexOf('擬似言語') >= 0);
  ok('見出しがAWS用語でない（サービス比較ではない）', fe.indexOf('サービス比較チートシート') < 0);

  section('ITパスポート');
  const ip = load('itpass', ['_engine/engine-formats.js']);
  ok('AWSのVPC構成図が出ない', ip.indexOf('vpc-diagram') < 0);
  ok('ITパスポートのチートシートが出る', ip.indexOf('cs-card') >= 0);

  section('収録数');
  const feCs = (function(){
    const c = makeContext();
    runFile(c, 'fe/cert.js'); c.CERT = c.window.CERT;
    runFile(c, 'fe/data.js');
    return vm.runInContext('CHEATSHEETS', c);
  })();
  eq('FEのチートシート本数', feCs.length, 13);
  eq('表の列数と各行の項目数が一致',
     feCs.every(function(cs){ return cs.rows.every(function(r){ return r.length === cs.headers.length; }); }), true);
  eq('idの重複なし', feCs.length - new Set(feCs.map(function(cs){ return cs.id; })).size, 0);
}

/* ============================================================
   1e. 全資格 × 全タブの描画（2026-08-25 追加）

   共通エンジンが「その資格に無い問題バンク」を参照して落ちる事故を
   短期間に2回起こしたため（弱点診断の MULTI_Q 参照・複数選択タブ）、
   資格ごとに全ての描画関数を呼ぶ点検を常設にする。
   ============================================================ */
function allTabsTests(){
  console.log('\n============================================================');
  console.log('全資格 × 全タブの描画');
  console.log('============================================================');

  const RENDERS = ['renderFc', 'renderQuizHome', 'renderScenarioHome', 'renderMultiHome',
                   'renderWeak', 'renderCheatsheet', 'renderOrderingHome', 'renderMatchingHome',
                   'renderPseudoHome', 'openHiddenCards', 'openHiddenMultiQ'];

  [['aws/clf', 'CLF-C02',      ['_engine/engine-formats.js']],
   ['itpass',  'ITパスポート',  ['_engine/engine-formats.js']],
   ['fe',      '基本情報',      ['_engine/engine-formats.js', '_engine/engine-pseudo.js']],
   ['aws/saa', 'SAA-C03',       []],
   ['aws/soa', 'SOA-C03',       []],
   ['ap',      '応用情報',      []],
   ['aws/sap', 'SAP-C02',       []],
   ['aws/scs', 'SCS-C03',       ['_engine/engine-formats.js']],
  ].forEach(function(t){
    const dir = t[0], label = t[1], extra = t[2];
    section(label);
    const c = makeContext();
    runFile(c, dir + '/cert.js');
    c.CERT = c.window.CERT;
    runFile(c, dir + '/data.js');
    runFile(c, '_engine/engine.js');
    extra.forEach(function(f){ runFile(c, f); });
    vm.runInContext('window._save = function(){};', c);

    RENDERS.forEach(function(fn){
      if(vm.runInContext('typeof ' + fn, c) !== 'function') return;
      let err = null;
      try{ vm.runInContext('enterKey(CAT_ALL); ' + fn + '();', c); }catch(e){ err = e; }
      ok(fn + ' が例外なく描ける', !err, err && err.message);
    });
  });

  section('カード追加フォームの文言が資格に依存しないこと');
  const src = fs.readFileSync(path.join(ROOT, '_engine/engine.js'), 'utf8');
  ok('プレースホルダにAWSのサービス名が入っていない', src.indexOf('例: Amazon S3') < 0);
}

/* ============================================================
   2. 静的モード（既存資格）の回帰確認
   ============================================================ */
function staticTests(){
  console.log('\n============================================================');
  console.log('静的モード：既存資格（FE）が壊れていないこと');
  console.log('============================================================');

  const ctx = makeContext();
  let err = null;
  try{
    runFile(ctx, 'fe/cert.js');
    ctx.CERT = ctx.window.CERT;
    runFile(ctx, 'fe/data.js');
    runFile(ctx, '_engine/engine.js');
  }catch(e){ err = e; }
  ok('cert.js → data.js → engine.js が従来どおり読み込める', !err, err && err.message);
  if(err) return;

  eq('単語帳カテゴリ数', vm.runInContext('FC_CATS_DEF.length', ctx), 12);
  eq('カテゴリ表の件数', vm.runInContext('Object.keys(CAT_ID_TO_NAME).length', ctx), 12);
  eq('FC_CATS（表示名の配列）が SAMPLE と一致',
     vm.runInContext('FC_CATS.length === Object.keys(SAMPLE).length', ctx), true);
  eq('組み込みカード200枚', vm.runInContext('buildCards().length', ctx), 200);
  eq('すべて組み込みカード', vm.runInContext('buildCards().every(c=>c.builtin===true)', ctx), true);
  eq('科目A 72問', vm.runInContext('QQ.length', ctx), 72);
  eq('シナリオ 57問', vm.runInContext('SCENARIO_Q.length', ctx), 57);
  eq('科目B 42問', vm.runInContext('PSEUDO_Q.length', ctx), 42);

  let renderErr = null;
  try{ vm.runInContext('enterKey(CAT_ALL); renderFc(); renderQuizHome(); renderWeak();', ctx); }catch(e){ renderErr = e; }
  ok('単語帳・過去問・弱点診断の描画が通る', !renderErr, renderErr && renderErr.message);
}

dynamicTests();
shuffleTests();
weakTests();
cheatsheetTests();
allTabsTests();
staticTests();

console.log('\n' + '─'.repeat(60));
console.log(fail === 0 ? '✓ すべての検証を通過しました（' + pass + '項目）'
                       : '✗ ' + fail + ' 件失敗（' + pass + ' 件成功）');
process.exit(fail === 0 ? 0 : 1);
