/* ============================================================
   mock.js — 模擬試験の共通エンジン（全資格・CLAUDE.md 第20節）

   これまで模試だけが「資格ごとに丸ごとコピー」の状態だった
   （itpass/mock-exam.html と aws/clf/mock-exam.html がほぼ同じ構造）。
   資格が増えるたびに同じバグを何箇所も直すことになるため、
   タイマー・組み立て・採点・履歴・誤答プール・画面をここへ集約する。

   資格ごとの差分は cert.js の CERT.mock だけに書く。

   ── CERT.mock の形 ──────────────────────────────────────
   {
     title:   '基本情報技術者 模擬試験',
     icon:    'book',                     // icons.js のID
     keys:    {hist:'feMockHistoryV1', wrong:'feMockWrongV1'},
     sections:[{                          // 1件なら従来どおりの単一試験
       id:'a', name:'科目A', minutes:90,
       pools:['QQ','SCENARIO_Q'],         // data.js のグローバル名
       groups:[{id:'tc', name:'テクノロジ系', cats:[...], n:41}, ...],
       pseudo:false,                      // true なら擬似言語（code）を表示する
     }],
     pass:    {section:600},              // 科目ごとに600点（FE）
     // pass:{total:600, group:300}       // 総合600かつ分野別300（ITパスポート）
     scoreNote:'…',                       // スコアの但し書き（IRT非公開の説明など）
   }

   ★合否判定の3つの軸は独立して指定できる。
     total   … 全体の総合点の基準
     group   … 分野（groups）ごとの基準＝分野別足切り
     section … 科目（sections）ごとの基準。合算しない試験（FE）で使う

   ★選択肢の表示順は設問ごとにシャッフルし、正誤判定は必ず
     元データのindexで行う（CLAUDE.md 4-8b節）。

   依存：icons.js（ico）／store.js＋safe-store.js＋safe-store-compat.js（CloudStore）
         data.js（QQ / SCENARIO_Q / PSEUDO_Q などの問題バンク）
   ============================================================ */

(function(){

const MK = ['ア','イ','ウ','エ','オ','カ','キ','ク'];

/* CERT.mock の既定値。書かれていない項目はここで埋める */
const CFG = Object.assign({
  title:'模擬試験', icon:'cap', keys:{hist:'mockHistoryV1', wrong:'mockWrongV1'},
  sections:[], pass:{}, scoreNote:'',
}, (window.CERT || {}).mock || {});

const PASS = Object.assign({total:null, group:null, section:null}, CFG.pass || {});

/* 状態。sec は「いま何科目目か」。res には科目ごとの採点結果を積む */
const S = {
  view:'home', plan:[], sec:0, qs:[], i:0, ans:{}, flags:{},
  endAt:0, timerInt:null, results:[], reviewIdx:0, reviewSec:0, mode:'full',
  matchLeft:null,   /* マッチング問題で選択中の左側 */
};

/* ---------- 小道具 ---------- */
const el  = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pad = n => String(n).padStart(2,'0');
const fmt = ms => { const s = Math.max(0, Math.floor(ms/1000)); return pad(Math.floor(s/60)) + ':' + pad(s%60); };
function shuffle(a){
  const r = a.slice();
  for(let i=r.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [r[i],r[j]]=[r[j],r[i]]; }
  return r;
}
function sectionOf(id){ return CFG.sections.find(s => s.id === id) || CFG.sections[0]; }
function groupOf(sec, catId){
  const g = (sec.groups || []).find(g => g.cats.indexOf(catId) >= 0);
  return g ? g.id : null;
}
function groupName(sec, gid){
  const g = (sec.groups || []).find(g => g.id === gid);
  return g ? g.name : gid;
}
/* 問題バンク（QQ / SCENARIO_Q / PSEUDO_Q …）の実体は各ページから受け取る。

   ★data.js は `const QQ = [...]` の形なので、これは「グローバル字句環境」に入り
     window.QQ にはならない。`window[name]` では取れないため、
     ページ側の <script> で MockBoot({QQ, SCENARIO_Q, ...}) と明示的に渡す。
     （識別子が見えるのは、data.js と同じスクリプト階層にいるページ側だけ） */
const BANKS = {};
function setBanks(b){ Object.assign(BANKS, b || {}); }

function poolOf(sec){
  const out = [];
  (sec.pools || []).forEach(name => {
    const arr = BANKS[name] || window[name];
    if(Array.isArray(arr)) out.push.apply(out, arr);
  });
  return out;
}
function sectionTotal(sec){
  return (sec.groups || []).reduce((n, g) => n + g.n, 0);
}

/* ---------- 問題の組み立て ----------
   分野（groups）ごとに必要数を抽出する。母数が足りない分野があっても
   落ちないよう、不足分は同じ科目の残りから補う。 */
function buildSection(sec){
  const pool = poolOf(sec);
  const picked = [], used = new Set();
  (sec.groups || []).forEach(g => {
    shuffle(pool.filter(q => g.cats.indexOf(q.c) >= 0 && !used.has(q.id)))
      .slice(0, g.n)
      .forEach(q => { picked.push(q); used.add(q.id); });
  });
  const need = sectionTotal(sec);
  if(picked.length < need){
    shuffle(pool.filter(q => !used.has(q.id))).slice(0, need - picked.length)
      .forEach(q => { picked.push(q); used.add(q.id); });
  }
  return shuffle(picked).slice(0, need).map(q => wrap(q, sec));
}

/* 設問1件ぶんの表示用データ。order[表示位置] = 元データのindex */
function wrap(q, sec){
  /* 表示順のシャッフル。マッチング問題は選択肢の配列（o）を持たず、
     右側（r）を並べ替える。判定は常に元のインデックス基準（4-8b節）。 */
  const src = isMatch(q) ? q.r : q.o;
  const idx = (src || []).map((_, i) => i);
  return {
    ref: q,
    sec: sec.id,
    order: q.noShuffle ? idx : shuffle(idx),
  };
}

/* ---------- タイマー ---------- */
function remain(){ return S.endAt - Date.now(); }
function startTimer(){
  stopTimer();
  const t = el('timer');
  if(t) t.style.display = 'inline-block';
  tick();
  S.timerInt = setInterval(tick, 500);
}
function stopTimer(){ if(S.timerInt){ clearInterval(S.timerInt); S.timerInt = null; } }
function tick(){
  const t = el('timer');
  if(!t) return;
  t.textContent = '残り ' + fmt(remain());
  t.classList.toggle('low', remain() <= 10*60*1000);
  if(remain() <= 0){ stopTimer(); finishSection(true); }
}

/* ---------- 保存（CloudStore経由＝SafeStoreに繋がっている） ---------- */
const loadHist  = () => CloudStore.get(CFG.keys.hist) || [];
const saveHist  = h => CloudStore.set(CFG.keys.hist, h);
const loadWrong = () => CloudStore.get(CFG.keys.wrong) || {};
const saveWrong = w => CloudStore.set(CFG.keys.wrong, w);

/* ---------- 採点 ----------
   本番のIRT（項目応答理論）は計算式が非公開で再現できないため、
   正答率をそのまま1000点満点に換算した目安を出す。 */
const scale = (correct, total) => total ? Math.round(correct / total * 1000) : 0;

/* マッチング問題（3〜7組を対応づける） */
const isMatch = q => !!(q && Array.isArray(q.l) && Array.isArray(q.r));
/* 順序問題（3〜5個を正しい順に並べる）。複数選択と形が同じなので明示の印で見分ける */
const isOrder = q => !!(q && q.kind === 'order');
/* 複数選択（本番形式：5つ以上から2つ以上）。順序問題は含めない */
const isMulti = q => !!(q && Array.isArray(q.a) && !isOrder(q) && !isMatch(q));

/* 解答が正解かどうか。複数選択は全部合っていないと得点にならない
   （公式規則）。選んだ順には依存しない。 */
function answerIsCorrect(given, q){
  if(isMatch(q)){
    /* 全ペアが合っていること。1組でも違えば得点にならない */
    if(!given || typeof given !== 'object') return false;
    const keys = Object.keys(q.a);
    if(Object.keys(given).length !== keys.length) return false;
    return keys.every(k => String(given[k]) === String(q.a[k]));
  }
  if(isOrder(q)){
    /* 並び順まで含めて一致すること */
    if(!Array.isArray(given)) return false;
    if(given.length !== q.a.length) return false;
    return q.a.every((v, i) => given[i] === v);
  }
  if(isMulti(q)){
    /* 選んだ順には依存しない。全部合っていないと得点にならない */
    if(!Array.isArray(given)) return false;
    if(given.length !== q.a.length) return false;
    const a = given.slice().sort((x, y) => x - y);
    const b = q.a.slice().sort((x, y) => x - y);
    return a.every((v, i) => v === b[i]);
  }
  return given === q.a;
}

/* 解答済みかどうか。複数選択で1つも選んでいない状態は未解答とみなす */
function isAnswered(given){
  if(given === undefined) return false;
  if(Array.isArray(given)) return given.length > 0;
  if(given && typeof given === 'object') return Object.keys(given).length > 0;
  return true;
}

function gradeSection(sec, qs, ans){
  const per = {};
  (sec.groups || []).forEach(g => { per[g.id] = {correct:0, total:0}; });
  let correct = 0;
  const wrongIds = [];
  qs.forEach((item, idx) => {
    const gid = groupOf(sec, item.ref.c);
    if(per[gid]) per[gid].total++;
    if(answerIsCorrect(ans[idx], item.ref)){
      correct++;
      if(per[gid]) per[gid].correct++;
    }else{
      wrongIds.push(item.ref.id);
    }
  });
  const groups = (sec.groups || []).map(g => ({
    id:g.id, name:g.name, correct:per[g.id].correct, total:per[g.id].total,
    score: scale(per[g.id].correct, per[g.id].total),
  }));
  const score = scale(correct, qs.length);
  return {
    sec: sec.id, name: sec.name, correct: correct, count: qs.length,
    answered: Object.keys(ans).length, score: score, groups: groups,
    passSection: PASS.section === null ? true : score >= PASS.section,
    passGroups:  PASS.group   === null ? true : groups.every(g => g.score >= PASS.group),
    wrongIds: wrongIds,
  };
}

/* 全科目そろった時点の総合判定 */
function gradeAll(results){
  const correct = results.reduce((n,r) => n + r.correct, 0);
  const count   = results.reduce((n,r) => n + r.count, 0);
  const total   = scale(correct, count);
  const passTotal    = PASS.total   === null ? true : total >= PASS.total;
  const passSections = results.every(r => r.passSection);
  const passGroups   = results.every(r => r.passGroups);
  return {
    at:new Date().toISOString(), correct:correct, count:count, total:total,
    sections:results, passTotal:passTotal, passSections:passSections, passGroups:passGroups,
    pass: passTotal && passSections && passGroups,
  };
}

/* ---------- 画面 ---------- */
function render(){
  if(S.view === 'home')    return renderHome();
  if(S.view === 'exam')    return renderExam();
  if(S.view === 'between') return renderBetween();
  if(S.view === 'result')  return renderResult();
  if(S.view === 'review')  return renderReview();
}

function specRows(){
  return CFG.sections.map(sec => {
    const detail = (sec.groups || []).map(g => g.name + ' ' + g.n + '問').join(' ／ ');
    return '<tr><th>' + esc(sec.name) + '</th><td>' +
      sectionTotal(sec) + '問／' + sec.minutes + '分<br>' +
      '<span class="sub">' + esc(detail) + '</span></td></tr>';
  }).join('');
}

function passText(){
  const parts = [];
  if(PASS.section !== null){
    parts.push('<strong>各科目それぞれ' + PASS.section + '点</strong>以上（1000点満点）' +
               '<br><span class="sub">合算では判定しない。片方が高くても、もう片方が届かなければ不合格</span>');
  }
  if(PASS.total !== null) parts.push('総合 <strong>' + PASS.total + '点</strong>以上（1000点満点）');
  if(PASS.group !== null) parts.push('<strong>かつ</strong> 分野ごとに <strong>' + PASS.group + '点</strong>以上');
  return parts.join('<br>') || '—';
}

/* 受験履歴の列。
   科目が複数ある試験（FE）は科目ごと、単一の試験（ITパスポート）は分野ごとに出す。
   分野が1つしか無ければ総合点だけ。 */
function histCols(){
  if(CFG.sections.length > 1){
    return CFG.sections.map(s => ({kind:'sec', id:s.id, label:s.name}));
  }
  const groups = (CFG.sections[0] || {}).groups || [];
  if(groups.length > 1) return groups.map(g => ({kind:'group', id:g.id, label:g.name}));
  return [{kind:'total', label:'総合'}];
}

function histCells(h){
  return histCols().map(function(c){
    if(c.kind === 'total') return '<td><strong>' + h.total + '</strong></td>';

    if(c.kind === 'sec'){
      const r = (h.sections || []).find(x => x.sec === c.id);
      if(!r) return '<td class="sub">—</td>';
      const okc = r.passSection && r.passGroups;
      return '<td style="color:' + (okc ? 'var(--ok)' : 'var(--ng)') + '">' + r.score + '</td>';
    }

    /* 分野列。新形式は sections[0].groups、旧ITパスポート版の記録は fields に入っている。
       載せ替え前の履歴もそのまま読めるようにしておく。 */
    const groups = ((h.sections || [])[0] || {}).groups || h.fields || [];
    const g = groups.find(x => x.id === c.id);
    if(!g) return '<td class="sub">—</td>';
    const okc = PASS.group === null ? true : g.score >= PASS.group;
    return '<td style="color:' + (okc ? 'var(--ok)' : 'var(--ng)') + '">' + g.score + '</td>';
  }).join('');
}

function renderHome(){
  stopTimer();
  const t = el('timer');
  if(t) t.style.display = 'none';
  const hist = loadHist();
  const wrongCount = Object.keys(loadWrong()).length;
  const multi = CFG.sections.length > 1;

  const poolInfo = CFG.sections.map(sec =>
    esc(sec.name) + ' ' + poolOf(sec).length + '問').join(' ／ ');

  const histHtml = hist.length
    ? '<table class="hist"><tr><th>受験日</th>' + histCols().map(c => '<th>' + esc(c.label) + '</th>').join('') +
      '<th>判定</th></tr>' +
      hist.slice(0,10).map(h =>
        '<tr><td>' +
        new Date(h.at).toLocaleString('ja-JP',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) +
        '</td>' + histCells(h) +
        '<td style="color:' + (h.pass ? 'var(--ok)' : 'var(--ng)') + ';font-weight:700">' +
        (h.partial ? '（一部）' : (h.pass ? '合格' : '不合格')) + '</td></tr>'
      ).join('') + '</table>'
    : '<p class="note">まだ受験履歴がありません。</p>';

  const startBtns = multi
    ? '<button class="btn btn-main" onclick="Mock.start(\'full\')">▶ 通しで受験する（' +
        CFG.sections.map(s => s.minutes).reduce((a,b)=>a+b,0) + '分）</button>' +
      CFG.sections.map(s =>
        '<button class="btn btn-sub" onclick="Mock.start(\'' + s.id + '\')">' +
        esc(s.name) + 'だけ（' + s.minutes + '分）</button>').join('')
    : '<button class="btn btn-main" onclick="Mock.start(\'full\')">▶ 試験を開始する</button>';

  el('app').innerHTML =
    '<div class="card">' +
      '<h1>' + ico(CFG.icon) + ' ' + esc(CFG.title) + '</h1>' +
      '<p class="sub">本番と同じ形式で通しの演習ができます。</p>' +
      '<table class="spec">' + specRows() +
        '<tr><th>合格基準</th><td>' + passText() + '</td></tr>' +
      '</table>' +
      '<p class="note">問題は収録済みの問題バンク（' + poolInfo + '）から、' +
        '分野の配分に沿って毎回ランダムに選び出します。受験のたびに組み合わせが変わります。' +
        (CFG.scoreNote ? '<br>' + CFG.scoreNote : '') + '</p>' +
      '<div class="nav">' + startBtns +
        (wrongCount ? '<button class="btn btn-sub" onclick="Mock.startWrong()">' + ico('flame') +
                      ' 間違えた' + wrongCount + '問だけ解く</button>' : '') +
      '</div>' +
    '</div>' +
    '<div class="card"><h2>受験履歴</h2>' + histHtml +
      (hist.length ? '<div class="nav"><button class="btn btn-sub" onclick="Mock.clearHist()">履歴を消去</button></div>' : '') +
    '</div>';
}

/* 擬似言語のコード。空欄マーカー [[a]] はバッジに置き換える */
function pseudoBlock(code){
  if(!code) return '';
  return '<div class="pseudo-label">プログラム</div><div class="pseudo-code">' +
    esc(code).replace(/\[\[([^\]]+)\]\]/g, function(_, k){
      return '<span class="pc-blank">' + esc(k) + '</span>';
    }) + '</div>';
}
function figureBlock(fig){
  return fig ? '<div class="q-figure">' + fig + '</div>' : '';
}

/* 出題画面の選択部分。形式ごとに描き分ける。
   判定・保存はすべて元データのインデックス基準（CLAUDE.md 4-8b節）。 */
function choiceBlock(q, item, given){
  if(isMatch(q)){
    const sel = (given && typeof given === 'object') ? given : {};
    const active = S.matchLeft;
    return '<p class="note">左を選んでから、対応する右を選んでください（全部合っていないと得点になりません）</p>' +
      '<div class="mt-wrap">' +
        '<div class="mt-col">' + q.l.map(function(t, i){
          const n = sel[i] !== undefined ? (q.r.indexOf(q.r[sel[i]]) + 1) : null;
          return '<button class="opt' + (active === i ? ' sel' : '') + '" onclick="Mock.pickLeft(' + i + ')">' +
            '<span class="mk">' + (i + 1) + '</span><span>' + esc(t) +
            (sel[i] !== undefined ? ' <strong>→ ' + MK[sel[i]] + '</strong>' : '') + '</span></button>';
        }).join('') + '</div>' +
        '<div class="mt-col">' + item.order.map(function(orig, pos){
          const usedBy = Object.keys(sel).filter(function(k){ return sel[k] === orig; })[0];
          return '<button class="opt' + (usedBy !== undefined ? ' sel' : '') + '" onclick="Mock.pickRight(' + orig + ')">' +
            '<span class="mk">' + MK[pos] + '</span><span>' + esc(q.r[orig]) +
            (usedBy !== undefined ? ' <strong>← ' + (Number(usedBy) + 1) + '</strong>' : '') + '</span></button>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="nav"><button class="btn btn-sub" onclick="Mock.clearAnswer()">やり直す</button></div>';
  }
  if(isOrder(q)){
    const seq = Array.isArray(given) ? given : [];
    return '<p class="note">正しい順にタップしてください（順番も含めて合っていないと得点になりません）</p>' +
      item.order.map(function(orig, pos){
        const at = seq.indexOf(orig);
        return '<button class="opt' + (at >= 0 ? ' sel' : '') + '" onclick="Mock.pick(' + orig + ')">' +
          '<span class="mk">' + (at >= 0 ? (at + 1) : MK[pos]) + '</span><span>' + esc(q.o[orig]) + '</span></button>';
      }).join('') +
      '<div class="nav"><button class="btn btn-sub" onclick="Mock.clearAnswer()">やり直す</button></div>';
  }
  return (isMulti(q) ? '<p class="note">' + (q.n || q.a.length) + 'つ選択してください（全部合っていないと得点になりません）</p>' : '') +
    item.order.map(function(orig, pos){
      const picked = isMulti(q)
        ? (Array.isArray(given) && given.indexOf(orig) >= 0)
        : (given === orig);
      return '<button class="opt' + (picked ? ' sel' : '') + '" onclick="Mock.pick(' + orig + ')">' +
        '<span class="mk">' + MK[pos] + '</span><span>' + esc(q.o[orig]) + '</span></button>';
    }).join('');
}

function renderExam(){
  const sec = sectionOf(S.plan[S.sec]);
  const item = S.qs[S.i];
  const q = item.ref;
  const answered = Object.keys(S.ans).filter(function(k){ return isAnswered(S.ans[k]); }).length;
  const multi = CFG.sections.length > 1;

  el('app').innerHTML =
    '<div class="card">' +
      '<div class="qhead">' +
        '<span class="qno">問 ' + (S.i+1) + ' / ' + S.qs.length + '</span>' +
        (multi ? '<span class="sec-pill">' + esc(sec.name) + '</span>' : '') +
        '<span class="qfield">' + esc(groupName(sec, groupOf(sec, q.c)) || '') + '</span>' +
        '<span class="sub" style="margin-left:auto">解答済み ' + answered + ' / ' + S.qs.length + '</span>' +
      '</div>' +
      '<div class="qtext' + (String(q.q||'').length >= 130 ? ' long' : '') + '">' + esc(q.q) + '</div>' +
      figureBlock(q.fig) +
      (sec.pseudo ? pseudoBlock(q.code) : '') +
      choiceBlock(q, item, S.ans[S.i]) +
      '<div class="nav">' +
        '<button class="btn btn-sub" onclick="Mock.go(-1)"' + (S.i === 0 ? ' disabled' : '') + '>← 前の問題</button>' +
        '<button class="flagbtn' + (S.flags[S.i] ? ' on' : '') + '" onclick="Mock.toggleFlag()">' +
          ico('flag') + ' ' + (S.flags[S.i] ? '見直す' : '後で見直す') + '</button>' +
        '<span class="spacer"></span>' +
        (S.i === S.qs.length-1
          ? '<button class="btn btn-main" onclick="Mock.confirmFinish()">' + endLabel() + '</button>'
          : '<button class="btn btn-main" onclick="Mock.go(1)">次の問題 →</button>') +
      '</div>' +
    '</div>' +
    '<div class="card"><h2>解答状況</h2>' +
      '<div class="grid">' + S.qs.map(function(_, n){
        return '<button class="gcell' + (isAnswered(S.ans[n]) ? ' done' : '') +
          (S.flags[n] ? ' flag' : '') + (n === S.i ? ' cur' : '') +
          '" onclick="Mock.jump(' + n + ')">' + (n+1) + '</button>';
      }).join('') + '</div>' +
      '<div class="legend">' +
        '<span><i style="background:#E8F0FB;border-color:#9BB8DC"></i>解答済み</span>' +
        '<span><i style="background:#FFF6D9;border-color:#B8860B"></i>見直し</span>' +
        '<span><i style="background:#fff"></i>未解答</span>' +
      '</div>' +
      '<div class="nav"><button class="btn btn-sub" onclick="Mock.confirmFinish()">' + endLabel() + '</button></div>' +
    '</div>';
}

function endLabel(){
  return (S.sec < S.plan.length - 1) ? 'この科目を終える' : '採点する';
}

/* 科目と科目のあいだ（FEは同日に科目A→科目Bを続けて受ける） */
function renderBetween(){
  stopTimer();
  const t = el('timer');
  if(t) t.style.display = 'none';
  const done = S.results[S.results.length - 1];
  const next = sectionOf(S.plan[S.sec + 1]);

  el('app').innerHTML =
    '<div class="card">' +
      '<div class="sec-head"><div class="t">' + esc(done.name) + ' が終了しました</div>' +
        '<div class="s">' + done.correct + ' / ' + done.count + ' 問正解</div></div>' +
      '<p class="note">科目ごとの得点はすべての科目を終えてから表示します。' +
        '本番も科目Aの結果を見てから科目Bを受けることはできません。</p>' +
      '<div class="nav">' +
        '<button class="btn btn-main" onclick="Mock.nextSection()">' +
          esc(next.name) + 'へ進む（' + next.minutes + '分）</button>' +
        '<button class="btn btn-sub" onclick="Mock.finishHere()">ここで終える（採点する）</button>' +
      '</div>' +
    '</div>';
}

function verdictReason(r){
  if(r.pass) return '';
  const ng = r.sections.filter(s => !s.passSection);
  if(PASS.section !== null && ng.length){
    return ng.map(s => esc(s.name)).join('・') + ' が ' + PASS.section + ' 点に届いていません。' +
      '<strong>この試験は科目ごとに基準を満たす必要があり、合算では判定しません。</strong>';
  }
  if(PASS.total !== null && !r.passTotal && !r.passGroups) return '総合点と分野別基準の両方に届いていません。';
  if(PASS.total !== null && !r.passTotal) return '分野別の基準は満たしていますが、総合点が届いていません。';
  if(PASS.group !== null && !r.passGroups) return '総合点は基準を超えていますが、基準を下回った分野があります。';
  return '';
}

function renderResult(){
  const t = el('timer');
  if(t) t.style.display = 'none';
  const r = S.result;
  const multi = CFG.sections.length > 1;

  const secBoxes = multi ? '<div class="sec-grid">' + r.sections.map(function(s){
    const okc = s.passSection && s.passGroups;
    return '<div class="sec-box" style="border-color:' + (okc ? 'var(--ok)' : 'var(--ng)') + '">' +
      '<div class="n">' + esc(s.name) + '</div>' +
      '<div class="v" style="color:' + (okc ? 'var(--ok)' : 'var(--ng)') + '">' + s.score + '</div>' +
      '<div class="sub">' + s.correct + ' / ' + s.count + ' 問正解</div>' +
      (PASS.section !== null
        ? '<div class="j" style="color:' + (okc ? 'var(--ok)' : 'var(--ng)') + '">' +
          (okc ? '基準クリア' : PASS.section + '点に届かず') + '</div>'
        : '') +
      '</div>';
  }).join('') + '</div>' : '';

  const groupCards = r.sections.filter(s => s.groups.length > 1).map(function(s){
    return '<div class="card"><h2>' + esc(s.name) + '：分野別の結果</h2>' +
      (PASS.group !== null
        ? '<p class="note" style="margin-bottom:12px">すべての分野で ' + PASS.group + ' 点以上が必要です。</p>'
        : '<p class="note" style="margin-bottom:12px">分野別の基準はありません。弱点の把握に使ってください。</p>') +
      s.groups.map(function(g){
        const okc = PASS.group === null ? g.score >= 600 : g.score >= PASS.group;
        return '<div class="frow"><div class="t"><span>' + esc(g.name) +
          '<span class="sub">（' + g.correct + '/' + g.total + '問）</span></span>' +
          '<strong style="color:' + (okc ? 'var(--ok)' : 'var(--ng)') + '">' + g.score + ' 点</strong></div>' +
          '<div class="fbar"><i style="width:' + Math.min(100, g.score/10) + '%;background:' +
          (okc ? 'var(--ok)' : 'var(--ng)') + '"></i></div></div>';
      }).join('') + '</div>';
  }).join('');

  const reason = verdictReason(r);

  el('app').innerHTML =
    '<div class="card" style="text-align:center">' +
      (r.byTimeout ? '<p class="sub" style="color:var(--ng)">' + ico('clock') +
                     ' 制限時間に達したため自動採点しました</p>' : '') +
      (r.partial ? '<p class="sub">一部の科目だけを受験した結果です</p>' : '') +
      '<div class="big">' + r.total + '<small> / 1000</small></div>' +
      '<div class="verdict ' + (r.pass ? 'pass' : 'fail') + '">' +
        (r.partial ? (r.pass ? '受験した科目は基準到達' : '基準に届かず')
                   : (r.pass ? '合格ライン到達' : '不合格')) + '</div>' +
      '<p class="sub">' + r.correct + ' / ' + r.count + ' 問正解</p>' +
      (reason ? '<p class="note" style="margin-top:8px">' + reason + '</p>' : '') +
      secBoxes +
    '</div>' +
    groupCards +
    '<div class="card"><div class="nav">' +
      '<button class="btn btn-main" onclick="Mock.openReview()">解答を確認する</button>' +
      '<button class="btn btn-sub" onclick="Mock.start(S_mode())">もう一度受験する</button>' +
      '<button class="btn btn-sub" onclick="Mock.home()">トップへ戻る</button>' +
    '</div></div>';
}

/* 解答確認。科目をまたいで、間違えた問題を順に見ていく */
function reviewList(){
  const out = [];
  S.taken.forEach(function(t){
    t.qs.forEach(function(item, i){
      if(t.ans[i] !== item.ref.a) out.push({item:item, ans:t.ans[i], no:i+1, secId:t.sec});
    });
  });
  if(out.length) return {list:out, allCorrect:false};
  const all = [];
  S.taken.forEach(function(t){
    t.qs.forEach(function(item, i){ all.push({item:item, ans:t.ans[i], no:i+1, secId:t.sec}); });
  });
  return {list:all, allCorrect:true};
}

/* 解答確認：順序問題とマッチング問題は、正しい並び／組合せと自分の解答を並べる */
function reviewFormats(q, mine){
  if(isOrder(q)){
    const seq = Array.isArray(mine) ? mine : [];
    return '<div class="opt correct" style="cursor:default"><span class="mk">正</span><span>' +
        esc(q.a.map(function(i){ return q.o[i]; }).join(' → ')) + '</span></div>' +
      '<div class="opt' + (seq.length ? ' wrong' : '') + '" style="cursor:default"><span class="mk">答</span><span>' +
        (seq.length ? esc(seq.map(function(i){ return q.o[i]; }).join(' → ')) : '（未解答）') + '</span></div>';
  }
  const sel = (mine && typeof mine === 'object') ? mine : {};
  return q.l.map(function(t, i){
    const right = q.a[i];
    const chose = sel[i];
    const okPair = String(chose) === String(right);
    return '<div class="opt' + (okPair ? ' correct' : ' wrong') + '" style="cursor:default">' +
      '<span class="mk">' + (i + 1) + '</span><span>' + esc(t) + ' ／ 正解：' + esc(q.r[right]) +
      (chose === undefined ? '（未解答）' : (okPair ? '' : ' ／ あなたの解答：' + esc(q.r[chose]))) +
      '</span></div>';
  }).join('');
}

function renderReview(){
  const rv = reviewList();
  const cur = rv.list[Math.min(S.reviewIdx, rv.list.length - 1)];
  const q = cur.item.ref;
  const sec = sectionOf(cur.secId);
  const mine = cur.ans;

  el('app').innerHTML =
    '<div class="card">' +
      '<div class="qhead">' +
        '<span class="qno">問 ' + cur.no + '</span>' +
        (CFG.sections.length > 1 ? '<span class="sec-pill">' + esc(sec.name) + '</span>' : '') +
        '<span class="qfield">' + esc(groupName(sec, groupOf(sec, q.c)) || '') + '</span>' +
        '<span class="sub" style="margin-left:auto">' +
          (rv.allCorrect ? '全問正解のため全 ' + rv.list.length + ' 問を表示'
                         : '間違えた問題 ' + (S.reviewIdx+1) + ' / ' + rv.list.length) + '</span>' +
      '</div>' +
      '<div class="qtext' + (String(q.q||'').length >= 130 ? ' long' : '') + '">' + esc(q.q) + '</div>' +
      figureBlock(q.fig) +
      (sec.pseudo ? pseudoBlock(q.code) : '') +
      (isMatch(q) || isOrder(q) ? reviewFormats(q, mine) : cur.item.order.map(function(orig, pos){
        const right = isMulti(q) ? q.a.indexOf(orig) >= 0 : orig === q.a;
        const chose = isMulti(q)
          ? (Array.isArray(mine) && mine.indexOf(orig) >= 0)
          : orig === mine;
        let cls = '';
        if(right) cls = ' correct';
        else if(chose) cls = ' wrong';
        return '<div class="opt' + cls + '" style="cursor:default">' +
          '<span class="mk">' + MK[pos] + '</span><span>' + esc(q.o[orig]) +
          (right ? ' <strong style="color:var(--ok)">← 正解</strong>' : '') +
          (chose && !right ? ' <strong style="color:var(--ng)">← あなたの解答</strong>' : '') +
          '</span></div>';
      }).join('')) +
      (!isAnswered(mine) ? '<p class="note" style="color:var(--ng)">この問題は未解答でした。</p>' : '') +
      '<div class="expl">' + esc(q.e) + '</div>' +
      '<div class="nav">' +
        '<button class="btn btn-sub" onclick="Mock.reviewGo(-1)"' + (S.reviewIdx === 0 ? ' disabled' : '') + '>← 前</button>' +
        '<span class="spacer"></span>' +
        (S.reviewIdx < rv.list.length - 1
          ? '<button class="btn btn-main" onclick="Mock.reviewGo(1)">次 →</button>'
          : '<button class="btn btn-main" onclick="Mock.backToResult()">結果に戻る</button>') +
      '</div>' +
    '</div>';
}

/* ---------- 進行 ---------- */
function beginSection(){
  const sec = sectionOf(S.plan[S.sec]);
  S.qs = buildSection(sec);
  S.i = 0; S.ans = {}; S.flags = {};
  S.endAt = Date.now() + sec.minutes*60*1000;
  S.view = 'exam';
  startTimer();
  render();
}

function finishSection(byTimeout){
  stopTimer();
  const sec = sectionOf(S.plan[S.sec]);
  const r = gradeSection(sec, S.qs, S.ans);
  r.byTimeout = !!byTimeout;
  S.results.push(r);
  S.taken.push({sec:sec.id, qs:S.qs, ans:S.ans});

  if(S.sec < S.plan.length - 1){
    S.view = 'between';
    render();
    return;
  }
  finalize();
}

function finalize(){
  const r = gradeAll(S.results);
  r.byTimeout = S.results.some(x => x.byTimeout);
  r.partial = S.plan.length < CFG.sections.length || S.mode === 'wrong';
  S.result = r;

  /* 誤答プールの更新（正解した問題は取り除く） */
  const wrong = loadWrong();
  S.taken.forEach(function(t){
    t.qs.forEach(function(item, idx){
      if(t.ans[idx] === item.ref.a) delete wrong[item.ref.id];
      else wrong[item.ref.id] = (wrong[item.ref.id] || 0) + 1;
    });
  });
  saveWrong(wrong);

  /* 誤答復習は履歴に残さない（本番形式の受験記録だけを残す） */
  if(S.mode !== 'wrong'){
    const hist = loadHist();
    hist.unshift({
      at:r.at, total:r.total, correct:r.correct, count:r.count, pass:r.pass,
      partial:r.partial,
      sections:r.sections.map(function(s){
        return {sec:s.sec, name:s.name, score:s.score, correct:s.correct, count:s.count,
                passSection:s.passSection, passGroups:s.passGroups,
                groups:s.groups.map(function(g){ return {id:g.id, name:g.name, score:g.score}; })};
      }),
    });
    saveHist(hist.slice(0, 50));
  }

  S.view = 'result';
  render();
}

/* ---------- 公開API（HTMLのonclickから呼ぶ） ---------- */
const Mock = {
  start(mode){
    S.mode = mode || 'full';
    S.plan = (S.mode === 'full') ? CFG.sections.map(s => s.id) : [S.mode];
    S.sec = 0; S.results = []; S.taken = [];
    beginSection();
  },
  startWrong(){
    const ids = loadWrong();
    const items = [];
    CFG.sections.forEach(function(sec){
      poolOf(sec).forEach(function(q){ if(ids[q.id] !== undefined) items.push(wrap(q, sec)); });
    });
    if(!items.length){ alert('復習する問題はありません。'); return; }
    S.mode = 'wrong';
    S.plan = [CFG.sections[0].id];
    S.sec = 0; S.results = []; S.taken = [];
    S.qs = shuffle(items);
    S.i = 0; S.ans = {}; S.flags = {};
    S.endAt = Date.now() + Math.max(10, Math.round(S.qs.length*1.2))*60*1000;
    S.view = 'exam';
    startTimer();
    render();
  },
  nextSection(){ S.sec++; beginSection(); },
  finishHere(){ finalize(); },
  pick(orig){
    const q = S.qs[S.i] && S.qs[S.i].ref;
    if(isOrder(q)){
      const cur = Array.isArray(S.ans[S.i]) ? S.ans[S.i].slice() : [];
      const at = cur.indexOf(orig);
      if(at >= 0) cur.splice(at, 1); else cur.push(orig);
      if(cur.length) S.ans[S.i] = cur; else delete S.ans[S.i];
      render();
      return;
    }
    if(isMulti(q)){
      const cur = Array.isArray(S.ans[S.i]) ? S.ans[S.i].slice() : [];
      const at = cur.indexOf(orig);
      if(at >= 0) cur.splice(at, 1); else cur.push(orig);
      if(cur.length) S.ans[S.i] = cur; else delete S.ans[S.i];
    }else{
      S.ans[S.i] = orig;
    }
    render();
  },
  /* マッチング：左を選んでから右を選ぶ。一対一を保つ */
  pickLeft(i){ S.matchLeft = (S.matchLeft === i ? null : i); render(); },
  pickRight(r){
    const i = S.matchLeft;
    if(i === null || i === undefined) return;
    const cur = Object.assign({}, S.ans[S.i] || {});
    Object.keys(cur).forEach(function(k){ if(cur[k] === r) delete cur[k]; });
    cur[i] = r;
    S.ans[S.i] = cur;
    S.matchLeft = null;
    render();
  },
  clearAnswer(){ delete S.ans[S.i]; S.matchLeft = null; render(); },
  go(d){ S.matchLeft = null; S.i = Math.min(S.qs.length-1, Math.max(0, S.i + d)); render(); },
  jump(n){ S.matchLeft = null; S.i = n; render(); },
  toggleFlag(){ S.flags[S.i] = !S.flags[S.i]; render(); },
  confirmFinish(){
    const un = S.qs.length - Object.keys(S.ans).length;
    const last = S.sec >= S.plan.length - 1;
    const what = last ? '採点します' : 'この科目を終えます';
    const msg = un > 0
      ? '未解答が ' + un + ' 問あります。未解答は誤答として採点されます。' + what + 'か？'
      : what + 'か？';
    if(confirm(msg)) finishSection(false);
  },
  openReview(){ S.reviewIdx = 0; S.view = 'review'; render(); },
  reviewGo(d){ S.reviewIdx = Math.max(0, S.reviewIdx + d); render(); },
  backToResult(){ S.view = 'result'; render(); },
  home(){ S.view = 'home'; render(); },
  setBanks: setBanks,
  clearHist(){
    if(!confirm('受験履歴を消去しますか？（間違えた問題の記録は残ります）')) return;
    saveHist([]);
    render();
  },
  /* 検証用（画面を通さずに組み立て・採点だけ確かめる） */
  _internals: {
    CFG:CFG, PASS:PASS, S:S, buildSection:buildSection, gradeSection:gradeSection,
    gradeAll:gradeAll, sectionOf:sectionOf, sectionTotal:sectionTotal,
    groupOf:groupOf, poolOf:poolOf, wrap:wrap,
    answerIsCorrect:answerIsCorrect, isAnswered:isAnswered,
    isMulti:isMulti, isOrder:isOrder, isMatch:isMatch,
  },
};
window.Mock = Mock;
window.S_mode = function(){ return S.mode === 'wrong' ? 'full' : S.mode; };

/* ---------- 起動 ---------- */
window.MockBoot = function(banks){
  setBanks(banks);
  S.taken = [];
  return CloudStore.init([CFG.keys.hist, CFG.keys.wrong]).then(function(){
    render();
    CloudStore.onChange(function(){ if(S.view === 'home') render(); });
  }).catch(function(e){
    el('app').innerHTML = '<div class="card"><h1>接続できませんでした</h1>' +
      '<p class="note">' + esc(e.message) + '<br>ページを再読み込みしてください。</p></div>';
  });
};

if(typeof window !== 'undefined'){
  window.addEventListener('beforeunload', function(e){
    if(S.view === 'exam'){ e.preventDefault(); e.returnValue = ''; }
  });
}

})();
