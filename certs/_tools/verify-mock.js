/* ============================================================
   verify-mock.js — 共通模試エンジン（_engine/mock.js）の検証

     node _tools/verify-mock.js

   実際の cert.js / data.js / mock.js を Node 上で評価し、
   問題の組み立て・採点・合否判定を確かめる。DOMは最小限のスタブ。

   ★FEの肝は「科目ごとに600点以上・合算では判定しない」ところ。
     片方が満点でももう片方が届かなければ不合格になることを実データで確認する。
   ============================================================ */

const fs   = require('fs');
const vm   = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');

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

/* ---------- DOMスタブ ---------- */
function makeStubElement(id){
  return {
    id:id, style:{}, dataset:{}, value:'', textContent:'', innerHTML:'', disabled:false,
    classList:{ _s:new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);},
                contains(c){return this._s.has(c);}, toggle(c, on){ on ? this._s.add(c) : this._s.delete(c); } },
    focus(){}, addEventListener(){}, appendChild(){},
    querySelector(){ return null; }, querySelectorAll(){ return []; },
  };
}

function makeContext(certRel, dataRel){
  const els = {};
  const store = {};
  const ctx = {
    document:{
      getElementById(id){ return (els[id] || (els[id] = makeStubElement(id))); },
      querySelectorAll(){ return []; }, querySelector(){ return null; },
      createElement(t){ return makeStubElement(t); },
      addEventListener(){}, body: makeStubElement('body'),
    },
    console: console,
    setTimeout: setTimeout, clearTimeout: clearTimeout,
    setInterval(){ return 0; }, clearInterval(){},
    JSON: JSON, Math: Object.create(Math), Date: Date, Promise: Promise, Set: Set,
    ico(){ return ''; }, confirm(){ return true; }, alert(){},
    addEventListener(){}, removeEventListener(){},
    /* CloudStore（safe-store-compat.js 相当）のスタブ。保存内容を検証で覗く */
    CloudStore:{
      init(){ return Promise.resolve({cloud:false}); },
      get(k){ return store[k]; },
      set(k, v){ store[k] = v; },
      onChange(){},
    },
    _store: store, _els: els,
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);

  const run = function(rel){
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, {filename:rel});
  };
  run(certRel);
  run(dataRel);
  run('_engine/mock.js');
  /* ページの <script>MockBoot({QQ, ...})</script> と同じことをする */
  /* 資格ごとに持っているバンクが違う（ITパスポートに PSEUDO_Q は無い）ので、
     存在するものだけを渡す。ページ側も自分の持ち物だけを列挙する。 */
  const banks = ['QQ','SCENARIO_Q','PSEUDO_Q','MULTI_Q'].map(function(n){
    return n + ':(typeof ' + n + "!=='undefined'?" + n + ':undefined)';
  }).join(',');
  vm.runInContext('Mock.setBanks({' + banks + '});', ctx);
  return ctx;
}

/* ============================================================ */
function feTests(){
  console.log('============================================================');
  console.log('基本情報技術者（FE）模試：2部構成・科目ごとの合否判定');
  console.log('============================================================');

  const ctx = makeContext('fe/cert.js', 'fe/data.js');
  const M = ctx.Mock._internals;
  const secA = M.sectionOf('a'), secB = M.sectionOf('b');

  section('設定が公式の値どおりか');
  eq('科目Aの問題数', M.sectionTotal(secA), 60);
  eq('科目Aの試験時間（分）', secA.minutes, 90);
  eq('科目Bの問題数', M.sectionTotal(secB), 20);
  eq('科目Bの試験時間（分）', secB.minutes, 100);
  eq('科目Aの分野配分', secA.groups.map(g => g.n), [41, 7, 12]);
  eq('科目Bの内訳（アルゴリズム／セキュリティ）', secB.groups.map(g => g.n), [16, 4]);
  eq('合格基準は科目ごと600点', M.PASS.section, 600);
  eq('総合点での判定はしない', M.PASS.total, null);
  eq('分野別足切りはない', M.PASS.group, null);

  section('母集団（収録数が本番を上回っているか）');
  const poolA = M.poolOf(secA), poolB = M.poolOf(secB);
  eq('科目Aの母集団（過去問72＋シナリオ35）', poolA.length, 107);
  eq('科目Bの母集団（擬似言語）', poolB.length, 24);
  secA.groups.forEach(function(g){
    const n = poolA.filter(function(q){ return g.cats.indexOf(q.c) >= 0; }).length;
    ok('科目A ' + g.name + ' の在庫 ' + n + '問 ≧ 必要 ' + g.n + '問', n >= g.n);
  });
  secB.groups.forEach(function(g){
    const n = poolB.filter(function(q){ return g.cats.indexOf(q.c) >= 0; }).length;
    ok('科目B ' + g.name + ' の在庫 ' + n + '問 ≧ 必要 ' + g.n + '問', n >= g.n);
  });

  section('組み立て（10回まわして毎回同じ条件を満たすか）');
  let okCount = 0, dupFound = 0, sameAsPrev = 0;
  let prevA = null;
  for(let t = 0; t < 10; t++){
    const qsA = M.buildSection(secA), qsB = M.buildSection(secB);
    const idsA = qsA.map(function(x){ return x.ref.id; });
    const idsB = qsB.map(function(x){ return x.ref.id; });
    const countBy = function(qs, sec){
      const m = {};
      qs.forEach(function(x){ const g = M.groupOf(sec, x.ref.c); m[g] = (m[g]||0)+1; });
      return m;
    };
    const cA = countBy(qsA, secA), cB = countBy(qsB, secB);
    const good = qsA.length === 60 && qsB.length === 20 &&
                 cA.tc === 41 && cA.mn === 7 && cA.st === 12 &&
                 cB.algo === 16 && cB.sec === 4;
    if(good) okCount++;
    if(new Set(idsA).size !== idsA.length || new Set(idsB).size !== idsB.length) dupFound++;
    if(prevA && JSON.stringify(idsA) === JSON.stringify(prevA)) sameAsPrev++;
    prevA = idsA;
  }
  eq('10回とも問題数と分野配分が正しい', okCount, 10);
  eq('同じ問題の重複なし', dupFound, 0);
  eq('毎回違う組み合わせになる（前回と一致した回数）', sameAsPrev, 0);

  section('選択肢のシャッフル（判定は元データのindex基準）');
  const qs = M.buildSection(secA);
  eq('表示順は元indexの並べ替えになっている',
     qs.every(function(x){
       return x.order.slice().sort(function(a,b){return a-b;})
              .join(',') === x.ref.o.map(function(_,i){return i;}).join(',');
     }), true);
  const shuffledSome = qs.some(function(x){ return x.order.join(',') !== x.ref.o.map(function(_,i){return i;}).join(','); });
  ok('少なくとも一部は並びが変わっている', shuffledSome);
  const qsB2 = M.buildSection(secB);
  const noShuffleKept = qsB2.filter(function(x){ return x.ref.noShuffle; })
    .every(function(x){ return x.order.join(',') === x.ref.o.map(function(_,i){return i;}).join(','); });
  ok('noShuffle の設問は並びを固定する（順序自体に意味がある解答群）', noShuffleKept);

  section('採点：全問正解');
  const allRight = function(qs){
    const a = {}; qs.forEach(function(x, i){ a[i] = x.ref.a; }); return a;
  };
  const rA = M.gradeSection(secA, qs, allRight(qs));
  const rB = M.gradeSection(secB, qsB2, allRight(qsB2));
  eq('科目Aのスコア', rA.score, 1000);
  eq('科目Bのスコア', rB.score, 1000);
  const all = M.gradeAll([rA, rB]);
  eq('総合', all.total, 1000);
  eq('合格', all.pass, true);

  section('採点：科目Aだけできて科目Bが振るわない（FEの肝）');
  const noneRight = function(qs){ return {}; };          // 全問未解答＝誤答扱い
  const rB0 = M.gradeSection(secB, qsB2, noneRight());
  eq('科目Bのスコア', rB0.score, 0);
  const mixed = M.gradeAll([rA, rB0]);
  eq('総合点は 750 点（60問正解 / 80問）', mixed.total, 750);
  ok('総合点だけ見れば600点を超えている', mixed.total >= 600);
  eq('それでも不合格（合算では判定しない）', mixed.pass, false);
  eq('科目Aは基準クリア', mixed.sections[0].passSection, true);
  eq('科目Bは基準未達', mixed.sections[1].passSection, false);

  section('採点：ちょうど600点の境目');
  const nCorrect = function(qs, n){
    const a = {};
    qs.forEach(function(x, i){ a[i] = (i < n) ? x.ref.a : (x.ref.a + 1) % x.ref.o.length; });
    return a;
  };
  eq('科目A 36/60問正解 → 600点（合格）', M.gradeSection(secA, qs, nCorrect(qs, 36)).score, 600);
  ok('600点は基準クリア', M.gradeSection(secA, qs, nCorrect(qs, 36)).passSection === true);
  eq('科目A 35/60問正解 → 583点（不合格）', M.gradeSection(secA, qs, nCorrect(qs, 35)).score, 583);
  ok('583点は基準未達', M.gradeSection(secA, qs, nCorrect(qs, 35)).passSection === false);
  eq('科目B 12/20問正解 → 600点', M.gradeSection(secB, qsB2, nCorrect(qsB2, 12)).score, 600);
  eq('科目B 11/20問正解 → 550点', M.gradeSection(secB, qsB2, nCorrect(qsB2, 11)).score, 550);

  section('未解答は誤答として扱う');
  const partial = {};
  qs.forEach(function(x, i){ if(i < 30) partial[i] = x.ref.a; });   // 30問だけ解答
  const rPart = M.gradeSection(secA, qs, partial);
  eq('正解数', rPart.correct, 30);
  eq('解答した数', rPart.answered, 30);
  eq('スコア（未解答30問は誤答）', rPart.score, 500);
  eq('基準未達', rPart.passSection, false);

  section('分野別の内訳が出る（弱点把握用）');
  const g = rPart.groups;
  eq('科目Aは3分野', g.map(function(x){ return x.id; }), ['tc','mn','st']);
  eq('分野ごとの出題数の合計', g.reduce(function(n,x){ return n + x.total; }, 0), 60);
  eq('科目Bは2分野', rB.groups.map(function(x){ return x.id; }), ['algo','sec']);
  eq('科目Bの内訳', rB.groups.map(function(x){ return x.total; }), [16, 4]);
}

/* ============================================================
   ITパスポート：同じエンジンで従来の規則（総合600かつ分野別300）を表現できるか
   ============================================================ */
function itpassRuleTests(){
  console.log('\n============================================================');
  console.log('同じエンジンで別の合格規則を表現できるか（ITパスポート型）');
  console.log('============================================================');

  const ctx = makeContext('fe/cert.js', 'fe/data.js');
  const M = ctx.Mock._internals;

  /* ITパスポートの規則（総合600かつ分野別300）を模した判定を、
     同じ gradeAll に通して確かめる。 */
  M.PASS.section = null; M.PASS.total = 600; M.PASS.group = 300;
  const secA = M.sectionOf('a');
  const qs = M.buildSection(secA);

  const mk = function(n){
    const a = {};
    qs.forEach(function(x, i){ a[i] = (i < n) ? x.ref.a : (x.ref.a + 1) % x.ref.o.length; });
    return a;
  };

  section('総合点の判定');
  const r36 = M.gradeSection(secA, qs, mk(36));
  eq('36/60問 → 総合600点', M.gradeAll([r36]).total, 600);
  ok('総合600点は基準クリア', M.gradeAll([r36]).passTotal === true);

  section('分野別足切り（総合が足りていても落ちる）');
  /* テクノロジ系だけを狙って落とす解答を作る */
  const a = {};
  qs.forEach(function(x, i){
    const gid = M.groupOf(secA, x.ref.c);
    a[i] = (gid === 'tc' && i % 4 !== 0) ? (x.ref.a + 1) % x.ref.o.length : x.ref.a;
  });
  const rSkew = M.gradeSection(secA, qs, a);
  const skew = M.gradeAll([rSkew]);
  const tc = rSkew.groups.find(function(g){ return g.id === 'tc'; });
  ok('テクノロジ系が300点未満（' + tc.score + '点）', tc.score < 300);
  ok('マネジメント・ストラテジは満点', rSkew.groups.filter(function(g){ return g.id !== 'tc'; })
     .every(function(g){ return g.score === 1000; }));
  eq('分野別の基準を満たさない', skew.passGroups, false);
  eq('総合点にかかわらず不合格', skew.pass, false);

  /* 元に戻す（他の検証に影響させない） */
  M.PASS.section = 600; M.PASS.total = null; M.PASS.group = null;
}

/* ============================================================
   ITパスポート：共通エンジンへ載せ替えたあとも仕様が変わっていないか
   （載せ替え前の itpass/mock-exam.html の実装と同じ結果になること）
   ============================================================ */
function itpassPortTests(){
  console.log('\n============================================================');
  console.log('ITパスポート模試：共通エンジンへの載せ替え後の同一性');
  console.log('============================================================');

  const ctx = makeContext('itpass/cert.js', 'itpass/data.js');
  const M = ctx.Mock._internals;
  const sec = M.sectionOf('main');

  section('載せ替え前の定数と一致するか');
  eq('出題数（旧 TOTAL_Q=100）', M.sectionTotal(sec), 100);
  eq('試験時間（旧 LIMIT_MIN=120）', sec.minutes, 120);
  eq('総合の基準（旧 PASS_TOTAL=600）', M.PASS.total, 600);
  eq('分野別の基準（旧 PASS_FIELD=300）', M.PASS.group, 300);
  eq('科目ごとの基準は使わない', M.PASS.section, null);
  eq('分野の定義（旧 FIELDS と同じ順・同じ配分）',
     sec.groups.map(function(g){ return [g.id, g.n]; }), [['st',35],['mn',20],['tc',45]]);
  eq('分野に属するカテゴリ（旧 FIELDS.cats）',
     sec.groups.map(function(g){ return g.cats.join('+'); }),
     ['corp+strategy+syssta', 'dev+pm+sm', 'theory+comp+tech']);
  eq('保存キー（受験履歴）', M.CFG.keys.hist, 'ipMockHistoryV1');
  eq('保存キー（誤答プール）', M.CFG.keys.wrong, 'ipMockWrongV1');

  section('母集団と組み立て（旧 buildExam と同じ条件）');
  eq('母集団（過去問90＋シナリオ90）', M.poolOf(sec).length, 180);
  let good = 0, dup = 0;
  for(let t = 0; t < 10; t++){
    const qs = M.buildSection(sec);
    const m = {};
    qs.forEach(function(x){ const g = M.groupOf(sec, x.ref.c); m[g] = (m[g]||0)+1; });
    if(qs.length === 100 && m.st === 35 && m.mn === 20 && m.tc === 45) good++;
    const ids = qs.map(function(x){ return x.ref.id; });
    if(new Set(ids).size !== ids.length) dup++;
  }
  eq('10回とも100問・35/20/45', good, 10);
  eq('重複なし', dup, 0);

  section('合否判定（旧 grade と同じ規則）');
  const qs = M.buildSection(sec);
  const mk = function(fn){
    const a = {};
    qs.forEach(function(x, i){ a[i] = fn(x, i) ? x.ref.a : (x.ref.a + 1) % x.ref.o.length; });
    return a;
  };
  const rAll = M.gradeSection(sec, qs, mk(function(){ return true; }));
  eq('全問正解 → 1000点・合格', [rAll.score, M.gradeAll([rAll]).pass], [1000, true]);

  const r60 = M.gradeSection(sec, qs, mk(function(x, i){ return i < 60; }));
  eq('60問正解 → 総合600点', M.gradeAll([r60]).total, 600);

  /* テクノロジ系だけ落として、総合が足りていても不合格になることを見る
     （旧実装の検証表「テクノロジ系だけ落とす → 670点でも不合格」と同じ趣旨） */
  const rSkew = M.gradeSection(sec, qs, mk(function(x, i){
    return M.groupOf(sec, x.ref.c) !== 'tc' || i % 5 === 0;
  }));
  const skew = M.gradeAll([rSkew]);
  const tc = rSkew.groups.find(function(g){ return g.id === 'tc'; });
  ok('総合は600点以上（' + skew.total + '点）', skew.total >= 600);
  ok('テクノロジ系が300点未満（' + tc.score + '点）', tc.score < 300);
  eq('分野別足切りで不合格', skew.pass, false);
  eq('総合の基準自体は満たしている', skew.passTotal, true);

  const rZero = M.gradeSection(sec, qs, {});
  eq('全問未解答 → 0点・不合格', [rZero.score, M.gradeAll([rZero]).pass], [0, false]);

  section('分野別の内訳（結果画面と履歴に出るもの）');
  eq('3分野', rAll.groups.map(function(g){ return g.id; }), ['st','mn','tc']);
  eq('分野ごとの出題数', rAll.groups.map(function(g){ return g.total; }), [35, 20, 45]);
}

/* 旧形式の受験履歴（載せ替え前に保存されたもの）が表示できるか */
function itpassLegacyHistTests(){
  console.log('\n============================================================');
  console.log('ITパスポート：載せ替え前に保存された履歴も読めるか');
  console.log('============================================================');

  const ctx = makeContext('itpass/cert.js', 'itpass/data.js');
  /* 旧実装が書いていた形（fields を持ち、sections が無い） */
  ctx._store.ipMockHistoryV1 = [{
    at:'2026-08-20T10:00:00.000Z', total:720, correct:72, count:100, pass:false,
    fields:[{id:'st',name:'ストラテジ系',correct:28,total:35,score:800},
            {id:'mn',name:'マネジメント系',correct:15,total:20,score:750},
            {id:'tc',name:'テクノロジ系',correct:29,total:45,score:644}],
  }];
  return ctx.MockBoot().then(function(){
    const html = ctx._els.app.innerHTML;
    section('旧形式の履歴');
    ok('受験日が表示される', html.indexOf('08/20') >= 0 || html.indexOf('8/20') >= 0);
    ok('分野別のスコアが表示される（旧fieldsから読む）',
       html.indexOf('800') >= 0 && html.indexOf('750') >= 0 && html.indexOf('644') >= 0);
    ok('判定が表示される', html.indexOf('不合格') >= 0);
    ok('分野名が列見出しになる', html.indexOf('ストラテジ系') >= 0);
  });
}

/* ============================================================
   保存（履歴・誤答プール）
   ============================================================ */
function storageTests(){
  console.log('\n============================================================');
  console.log('保存：受験履歴と誤答プール');
  console.log('============================================================');

  const ctx = makeContext('fe/cert.js', 'fe/data.js');
  const M = ctx.Mock._internals;
  const S = M.S;
  const Mock = ctx.Mock;

  section('通し受験を最後まで走らせる');
  Mock.start('full');
  eq('科目Aから始まる', S.plan, ['a','b']);
  eq('科目Aの問題数', S.qs.length, 60);
  /* 科目Aを全問正解で終える */
  S.qs.forEach(function(x, i){ S.ans[i] = x.ref.a; });
  Mock.confirmFinish();
  eq('科目Aの採点後は「科目のあいだ」画面へ', S.view, 'between');
  eq('まだ履歴は書かれていない', ctx._store.feMockHistoryV1, undefined);

  Mock.nextSection();
  eq('科目Bへ進む', S.qs.length, 20);
  /* 科目Bは半分だけ正解 */
  S.qs.forEach(function(x, i){ if(i < 10) S.ans[i] = x.ref.a; });
  Mock.confirmFinish();
  eq('採点が終わると結果画面', S.view, 'result');

  section('履歴');
  const hist = ctx._store.feMockHistoryV1;
  eq('履歴が1件できる', hist.length, 1);
  eq('科目ごとのスコアが残る', hist[0].sections.map(function(s){ return s.sec; }), ['a','b']);
  eq('科目Aは1000点', hist[0].sections[0].score, 1000);
  eq('科目Bは500点', hist[0].sections[1].score, 500);
  eq('判定は不合格（科目Bが600点未満）', hist[0].pass, false);
  eq('総合点も残る（表示用）', hist[0].total, 875);

  section('誤答プール');
  const wrong = ctx._store.feMockWrongV1;
  eq('間違えた10問が入る', Object.keys(wrong).length, 10);
  ok('正解した問題は入っていない',
     Object.keys(wrong).every(function(id){ return id.indexOf('P') === 0; }), Object.keys(wrong).join(','));

  section('間違えた問題だけ解き直す');
  Mock.startWrong();
  eq('誤答プールの10問が出題される', S.qs.length, 10);
  eq('モードは復習', S.mode, 'wrong');
  S.qs.forEach(function(x, i){ S.ans[i] = x.ref.a; });   // 全問正解する
  Mock.confirmFinish();
  eq('誤答プールが空になる', Object.keys(ctx._store.feMockWrongV1).length, 0);
  eq('復習は履歴に残さない', ctx._store.feMockHistoryV1.length, 1);

  section('科目Bだけ受験する');
  Mock.start('b');
  eq('科目Bだけの構成', S.plan, ['b']);
  eq('問題数', S.qs.length, 20);
  S.qs.forEach(function(x, i){ S.ans[i] = x.ref.a; });
  Mock.confirmFinish();
  eq('結果画面へ', S.view, 'result');
  eq('一部受験として記録される', ctx._store.feMockHistoryV1[0].partial, true);
  eq('履歴が2件になる', ctx._store.feMockHistoryV1.length, 2);
}

/* ============================================================
   画面（DOMスタブで例外が出ないこと）
   ============================================================ */
async function renderTests(){
  console.log('\n============================================================');
  console.log('画面の描画（DOMスタブで例外が出ないこと）');
  console.log('============================================================');

  const ctx = makeContext('fe/cert.js', 'fe/data.js');
  const Mock = ctx.Mock;
  const S = Mock._internals.S;
  const html = function(){ return ctx._els.app ? ctx._els.app.innerHTML : ''; };

  let err = null;
  /* MockBoot は CloudStore.init を待つ非同期処理。描画完了まで待ってから見る */
  try{ await ctx.MockBoot(); }catch(e){ err = e; }
  ok('トップ画面が描ける', !err, err && err.message);

  try{
    ok('科目の構成が出ている', html().indexOf('科目A') >= 0 && html().indexOf('科目B') >= 0);
    ok('合格基準の説明が出ている', html().indexOf('600点') >= 0);
    ok('合算しない旨が明記されている', html().indexOf('合算') >= 0);

    Mock.start('full');
    ok('科目Aの出題画面が描ける', html().indexOf('問 1 / 60') >= 0, html().slice(0, 200));
    Mock.pick(0); Mock.go(1); Mock.toggleFlag(); Mock.jump(0);

    /* 科目Bへ進み、擬似言語のコードが表示されるか */
    S.qs.forEach(function(x, i){ S.ans[i] = x.ref.a; });
    Mock.confirmFinish();
    ok('科目のあいだの画面が描ける', html().indexOf('科目Bへ進む') >= 0);
    Mock.nextSection();
    ok('科目Bの出題画面が描ける', html().indexOf('問 1 / 20') >= 0);
    ok('擬似言語のコードが表示される', html().indexOf('pseudo-code') >= 0);

    S.qs.forEach(function(x, i){ if(i < 5) S.ans[i] = x.ref.a; });
    Mock.confirmFinish();
    ok('結果画面が描ける', html().indexOf('/ 1000') >= 0);
    ok('科目ごとの得点が並ぶ', html().indexOf('sec-box') >= 0);
    ok('不合格の理由が説明される', html().indexOf('合算では判定しません') >= 0);

    Mock.openReview();
    ok('解答確認が描ける', html().indexOf('あなたの解答') >= 0 || html().indexOf('← 正解') >= 0);
    Mock.reviewGo(1);
    Mock.backToResult();
    Mock.home();
    ok('トップへ戻れる', html().indexOf('受験履歴') >= 0);
  }catch(e){
    ok('画面遷移で例外が出ない', false, e.message);
  }
}

(async function main(){
feTests();
itpassRuleTests();
itpassPortTests();
await itpassLegacyHistTests();
storageTests();
await renderTests();

console.log('\n' + '─'.repeat(60));
console.log(fail === 0 ? '✓ すべての検証を通過しました（' + pass + '項目）'
                       : '✗ ' + fail + ' 件失敗（' + pass + ' 件成功）');
process.exit(fail === 0 ? 0 : 1);
})();
