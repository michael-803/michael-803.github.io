// ═══════════════════════════════════════════════════════════
//  engine-formats.js — 順序問題（Ordering）・マッチング問題（Matching）
//
//  CLAUDE.md 14-2節。AIF-C01以降の公式試験に出題される形式で、
//  CLF-C02版のエンジンには存在しなかった。どちらも「全部合っていないと
//  得点にならない」形式（公式試験ガイド準拠）。
//
//  engine.js の直後に読み込むこと。state・save()・toast() など engine.js の
//  グローバルを使う。engine.js 側の RESULT_CTX から呼ばれる関数もここにある。
//
//  【共通の設計方針】4-8b節の指針どおり、選択肢の表示順は設問を開くたびに
//  シャッフルし、正誤判定とDOM要素IDは常に「元データのインデックス」で行う。
//  表示位置には一切依存しない。
//
//  【データ形式】data.js で以下のグローバルを定義する（無くても動く）
//   ORDER_Q: {id:'O001', c:カテゴリID, q:'設問', o:['手順A','手順B','手順C'],
//             a:[2,0,1],   ← 正解の並びを o のインデックスで表す（o[2]→o[0]→o[1]）
//             e:'解説'}
//   MATCH_Q: {id:'MT001', c:カテゴリID, q:'設問',
//             l:['左1','左2'], r:['右1','右2'],
//             a:[1,0],     ← a[i] は l[i] に対応する r のインデックス
//             e:'解説'}
//
//  UIはドラッグ＆ドロップを使わない（スマホでの操作性が悪いため）。
//   順序問題   … タップした順に番号が振られる
//   マッチング … 左をタップ→右をタップ、で対応が繋がる
// ═══════════════════════════════════════════════════════════

// データを持たない資格でも落ちないようにする
function orderingBank(){ return (typeof ORDER_Q !== 'undefined' && Array.isArray(ORDER_Q)) ? ORDER_Q : []; }
function matchingBank(){ return (typeof MATCH_Q !== 'undefined' && Array.isArray(MATCH_Q)) ? MATCH_Q : []; }

// ─── 順序問題：成績 ────────────────────────────────────────
function orderingCatAccuracy(catId){
  let r=0, w=0;
  orderingBank().forEach(q=>{
    if(q.c!==catId) return;
    const a = state.orderingStats.answered[q.id];
    if(a){ r+=a.r; w+=a.w; }
  });
  const total = r+w;
  return total ? {pct:Math.round(r/total*100), total} : null;
}
function orderingOverallStats(){
  let r=0, w=0;
  Object.values(state.orderingStats.answered).forEach(a=>{ r+=a.r; w+=a.w; });
  return {answered:r+w, pct:(r+w)?Math.round(r/(r+w)*100):0, wrongCount:state.orderingStats.wrong.length};
}
function recordOrderingAnswer(q, isCorrect){
  const id = q.id;
  const st = state.orderingStats;
  if(!st.answered[id]) st.answered[id] = {r:0, w:0};
  if(isCorrect){
    st.answered[id].r++;
    st.wrong = st.wrong.filter(x=>x!==id);
  } else {
    st.answered[id].w++;
    if(!st.wrong.includes(id)) st.wrong.push(id);
  }
  save();
}

// ─── 順序問題：ホーム ──────────────────────────────────────
function renderOrderingHome(){
  state.ordering.session = null;
  const el = document.getElementById('ordering-layout');
  if(!el) return;
  const all = orderingBank();
  const selCat = state.ordering.selectedCatId;
  const os = orderingOverallStats();

  const catCardsHtml = QCAT.map(cat=>{
    const n = all.filter(q=>q.c===cat.id).length;
    if(n===0) return '';
    const acc = orderingCatAccuracy(cat.id);
    const accHtml = acc
      ? `<div class="cat-acc-bar"><div class="cat-acc-fill" style="width:${acc.pct}%;background:${accColor(acc.pct)}"></div></div>
         <div class="cat-acc-text">正答率 ${acc.pct}%（${acc.total}回）</div>`
      : `<div class="cat-acc-text">未挑戦</div>`;
    return `<div class="category-card${selCat===cat.id?' active-cat':''}" onclick="selectOrderingCat('${cat.id}')" role="button" tabindex="0">
      <div class="cat-head"><span class="cat-icon tone-${cat.tone||'orange'}">${ico(cat.icon)}</span><span class="cat-name">${cat.name}</span><span class="cat-count">${n}問</span></div>
      ${accHtml}
    </div>`;
  }).join('');

  const totalQ = all.length;
  const selName = selCat ? (QCAT.find(c=>c.id===selCat)||{}).name : '';
  const selCount = selCat ? all.filter(q=>q.c===selCat).length : totalQ;

  const statsHtml = os.answered > 0 ? `
    <div class="overall-stats">
      <div class="os-chip"><span class="os-num">${os.answered}</span><span class="os-lbl">累計解答数</span></div>
      <div class="os-chip"><span class="os-num" style="color:${accColor(os.pct)}">${os.pct}%</span><span class="os-lbl">全体正答率</span></div>
      <div class="os-chip"><span class="os-num" style="color:${os.wrongCount?'var(--ng)':'var(--ok)'}">${os.wrongCount}</span><span class="os-lbl">要復習の問題</span></div>
    </div>` : '';

  const reviewHtml = os.wrongCount > 0 ? `
    <div class="review-bar">
      <div class="review-label"><strong>${os.wrongCount} 問</strong>の間違えた順序問題があります。正解するとリストから消えます。</div>
      <button class="btn btn-secondary" onclick="startOrderingWrongReview()">${ico('flame')} 苦手を復習する</button>
    </div>` : '';

  el.innerHTML = `
    <div class="quiz-home">
      <div class="quiz-home-title">${ico('list-ol')} 順序問題チャレンジ</div>
      <div class="quiz-home-sub">本番試験にある「正しい順に並べてください」形式の問題です。選んだ順に番号が振られます。順序も含めて全部合っていないと正解になりません。全 ${totalQ} 問収録。</div>
      ${statsHtml}
      ${reviewHtml}
      <div class="quiz-start-bar">
        <div class="sel-cat-label">${selCat ? `<strong>${selName}</strong>（${selCount}問）を選択中` : `<strong>全カテゴリ</strong>（${totalQ}問）`}</div>
        <select class="qcount-select" id="o-count">
          <option value="10">10問</option>
          <option value="20">20問</option>
          <option value="all" selected>全問</option>
        </select>
        <button class="btn btn-secondary" onclick="startOrdering('${selCat||'all'}',false)">${ico('book')} 順番に</button>
        <button class="btn btn-primary" onclick="startOrdering('${selCat||'all'}',true)">${ico('shuffle')} ランダム</button>
      </div>
      <div class="category-grid">${catCardsHtml}</div>
    </div>`;
}
function selectOrderingCat(catId){
  state.ordering.selectedCatId = state.ordering.selectedCatId === catId ? null : catId;
  renderOrderingHome();
}
function startOrdering(catId, shuffle){
  let qs = orderingBank().slice();
  if(catId !== 'all') qs = qs.filter(q=>q.c===catId);
  if(shuffle) qs = qs.sort(()=>Math.random()-.5);
  const countSel = document.getElementById('o-count');
  const limit = countSel && countSel.value !== 'all' ? parseInt(countSel.value,10) : qs.length;
  qs = qs.slice(0, limit);
  if(!qs.length){ toast('問題がありません','error'); return; }
  launchOrderingSession(qs, {catId, shuffle, mode:'normal'});
}
function startOrderingWrongReview(){
  const wrongSet = new Set(state.orderingStats.wrong);
  let qs = orderingBank().filter(q=>wrongSet.has(q.id));
  if(!qs.length){ toast(ico('confetti')+' 復習する問題はありません'); return; }
  qs = qs.sort(()=>Math.random()-.5);
  launchOrderingSession(qs, {catId:'wrong', shuffle:true, mode:'review'});
}
function launchOrderingSession(qs, meta){
  state.ordering.session = {questions:qs, index:0, correct:0, wrong:0, wrongThisRun:[], ...meta};
  state.resultCtx = 'ordering';
  renderOrderingSession();
}
function quitOrdering(){
  const sess = state.ordering.session;
  if(sess && sess.index > 0 && !confirm('順序問題を終了しますか？（途中の成績も記録されています）')) return;
  renderOrderingHome();
}

// ─── 順序問題：出題画面 ────────────────────────────────────
function renderOrderingSession(){
  const sess = state.ordering.session;
  const el = document.getElementById('ordering-layout');
  if(!el || !sess) return;
  const q = sess.questions[sess.index];
  const total = sess.questions.length;
  const pct = Math.round(sess.index/total*100);
  const catInfo = QCAT.find(c=>c.id===q.c) || {name:q.c, icon:'list-ol'};
  const modeTag = sess.mode==='review' ? ico('flame')+' 苦手復習 ／ ' : '';
  // 表示順シャッフル。displayOrder[表示位置] = 元のインデックス。
  const displayOrder = shuffleIndices(q.o.length);

  el.innerHTML = `
    <div class="quiz-session">
      <div class="qsess-header">
        <div style="font-family:var(--disp);font-weight:700;font-size:15px;">${modeTag}${ico('list-ol')} ${catInfo.name}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="q-prog-bar"><div class="q-prog-fill" style="width:${pct}%"></div></div>
          <span style="font-size:12px;color:var(--dim);font-family:var(--disp);">${sess.index+1} / ${total}</span>
        </div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:12px;align-items:center;">
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ok)">${sess.correct}</span><div style="font-size:10.5px;color:var(--dim)">正解</div></div>
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ng)">${sess.wrong}</span><div style="font-size:10.5px;color:var(--dim)">不正解</div></div>
        <button class="btn btn-secondary" style="width:auto;margin-left:auto;font-size:12px;padding:7px 13px" onclick="quitOrdering()">← 終了</button>
      </div>
      <div class="quiz-card">
        <div class="quiz-cat-tag">${ico('list-ol')} ${catInfo.name} ／ 順序問題（正しい順に選んでください）</div>
        ${qStem(q)}
        <div class="mt-hint">選んだ順に番号が振られます。押し間違えたら「やり直す」で全部解除できます。</div>
        <div class="ord-list" id="ord-list">
          ${displayOrder.map(origIdx=>`
            <button class="ord-opt" id="oo-${origIdx}" onclick="pickOrderingOption(${origIdx})">
              <span class="ord-num" id="on-${origIdx}">–</span>
              <span>${escHtml(q.o[origIdx])}</span>
            </button>`).join('')}
        </div>
        <div style="margin-top:13px;display:flex;justify-content:flex-end;gap:8px">
          <button class="btn btn-secondary" id="ord-reset" style="width:auto;" onclick="resetOrderingPicks()">やり直す</button>
          <button class="btn btn-primary" id="ord-submit" style="width:auto;" onclick="submitOrderingAnswer()">回答する</button>
        </div>
        <div class="quiz-explain" id="ord-explain" style="white-space:pre-wrap;"></div>
      </div>
      <div class="quiz-nav" id="ord-nav" style="display:none;">
        <button class="btn btn-primary" style="width:auto" onclick="nextOrderingQuestion()" id="next-o-btn">次の問題 →</button>
      </div>
    </div>`;
  window._ordPicks = [];       // 選んだ順に並んだ「元データのインデックス」
  window._ordAnswered = false;
}
function pickOrderingOption(origIdx){
  if(window._ordAnswered) return;
  const picks = window._ordPicks;
  if(picks.includes(origIdx)) return;   // 同じ選択肢は一度しか選べない
  picks.push(origIdx);
  const btn = document.getElementById('oo-'+origIdx);
  const num = document.getElementById('on-'+origIdx);
  if(btn) btn.classList.add('picked');
  if(num) num.textContent = picks.length;
}
function resetOrderingPicks(){
  if(window._ordAnswered) return;
  (window._ordPicks||[]).forEach(i=>{
    const btn = document.getElementById('oo-'+i);
    const num = document.getElementById('on-'+i);
    if(btn) btn.classList.remove('picked');
    if(num) num.textContent = '–';
  });
  window._ordPicks = [];
}
function submitOrderingAnswer(){
  const sess = state.ordering.session;
  if(!sess || window._ordAnswered) return;
  const q = sess.questions[sess.index];
  const picks = window._ordPicks;
  if(picks.length !== q.o.length){
    toast(`すべての選択肢を順に選んでください（${picks.length}/${q.o.length}）`,'error');
    return;
  }
  window._ordAnswered = true;
  // 判定は「元データのインデックス列」どうしの比較。表示位置には依存しない。
  const isCorrect = picks.every((v,i)=>v===q.a[i]);
  document.querySelectorAll('#ord-list .ord-opt').forEach(b=>b.disabled=true);
  // 自分が置いた位置が正解の位置と一致しているかで1つずつ色を付ける
  picks.forEach((origIdx, userPos)=>{
    const btn = document.getElementById('oo-'+origIdx);
    if(btn) btn.classList.add(q.a[userPos]===origIdx ? 'ok' : 'ng');
  });
  if(isCorrect) sess.correct++; else { sess.wrong++; sess.wrongThisRun.push(q.id); }
  recordOrderingAnswer(q, isCorrect);
  document.getElementById('ord-submit').style.display = 'none';
  document.getElementById('ord-reset').style.display = 'none';
  const correctText = q.a.map((origIdx,i)=>`${i+1}. ${q.o[origIdx]}`).join('\n');
  const ex = document.getElementById('ord-explain');
  ex.textContent = (isCorrect ? '正解！\n\n' : '不正解\n\n【正しい順序】\n' + correctText + '\n\n') + (q.e||'');
  ex.classList.add('show');
  document.getElementById('ord-nav').style.display = 'flex';
  const btn = document.getElementById('next-o-btn');
  if(btn) btn.focus({preventScroll:true});
}
function nextOrderingQuestion(){
  const sess = state.ordering.session;
  sess.index++;
  if(sess.index >= sess.questions.length){
    state.lastOrderingRun = {catId:sess.catId, shuffle:sess.shuffle, mode:sess.mode, wrongThisRun:sess.wrongThisRun.slice()};
    showResultScreen(sess.correct, sess.correct+sess.wrong);
    state.ordering.session = null;
  } else renderOrderingSession();
}

// ─── マッチング問題：成績 ──────────────────────────────────
function matchingCatAccuracy(catId){
  let r=0, w=0;
  matchingBank().forEach(q=>{
    if(q.c!==catId) return;
    const a = state.matchingStats.answered[q.id];
    if(a){ r+=a.r; w+=a.w; }
  });
  const total = r+w;
  return total ? {pct:Math.round(r/total*100), total} : null;
}
function matchingOverallStats(){
  let r=0, w=0;
  Object.values(state.matchingStats.answered).forEach(a=>{ r+=a.r; w+=a.w; });
  return {answered:r+w, pct:(r+w)?Math.round(r/(r+w)*100):0, wrongCount:state.matchingStats.wrong.length};
}
function recordMatchingAnswer(q, isCorrect){
  const id = q.id;
  const st = state.matchingStats;
  if(!st.answered[id]) st.answered[id] = {r:0, w:0};
  if(isCorrect){
    st.answered[id].r++;
    st.wrong = st.wrong.filter(x=>x!==id);
  } else {
    st.answered[id].w++;
    if(!st.wrong.includes(id)) st.wrong.push(id);
  }
  save();
}

// ─── マッチング問題：ホーム ────────────────────────────────
function renderMatchingHome(){
  state.matching.session = null;
  const el = document.getElementById('matching-layout');
  if(!el) return;
  const all = matchingBank();
  const selCat = state.matching.selectedCatId;
  const os = matchingOverallStats();

  const catCardsHtml = QCAT.map(cat=>{
    const n = all.filter(q=>q.c===cat.id).length;
    if(n===0) return '';
    const acc = matchingCatAccuracy(cat.id);
    const accHtml = acc
      ? `<div class="cat-acc-bar"><div class="cat-acc-fill" style="width:${acc.pct}%;background:${accColor(acc.pct)}"></div></div>
         <div class="cat-acc-text">正答率 ${acc.pct}%（${acc.total}回）</div>`
      : `<div class="cat-acc-text">未挑戦</div>`;
    return `<div class="category-card${selCat===cat.id?' active-cat':''}" onclick="selectMatchingCat('${cat.id}')" role="button" tabindex="0">
      <div class="cat-head"><span class="cat-icon tone-${cat.tone||'orange'}">${ico(cat.icon)}</span><span class="cat-name">${cat.name}</span><span class="cat-count">${n}問</span></div>
      ${accHtml}
    </div>`;
  }).join('');

  const totalQ = all.length;
  const selName = selCat ? (QCAT.find(c=>c.id===selCat)||{}).name : '';
  const selCount = selCat ? all.filter(q=>q.c===selCat).length : totalQ;

  const statsHtml = os.answered > 0 ? `
    <div class="overall-stats">
      <div class="os-chip"><span class="os-num">${os.answered}</span><span class="os-lbl">累計解答数</span></div>
      <div class="os-chip"><span class="os-num" style="color:${accColor(os.pct)}">${os.pct}%</span><span class="os-lbl">全体正答率</span></div>
      <div class="os-chip"><span class="os-num" style="color:${os.wrongCount?'var(--ng)':'var(--ok)'}">${os.wrongCount}</span><span class="os-lbl">要復習の問題</span></div>
    </div>` : '';

  const reviewHtml = os.wrongCount > 0 ? `
    <div class="review-bar">
      <div class="review-label"><strong>${os.wrongCount} 問</strong>の間違えたマッチング問題があります。正解するとリストから消えます。</div>
      <button class="btn btn-secondary" onclick="startMatchingWrongReview()">${ico('flame')} 苦手を復習する</button>
    </div>` : '';

  el.innerHTML = `
    <div class="quiz-home">
      <div class="quiz-home-title">${ico('link')} マッチング問題チャレンジ</div>
      <div class="quiz-home-sub">本番試験にある「対応するものを組み合わせてください」形式の問題です。左の項目をタップしてから、対応する右の選択肢をタップします。全ペア正解で初めて得点になります。全 ${totalQ} 問収録。</div>
      ${statsHtml}
      ${reviewHtml}
      <div class="quiz-start-bar">
        <div class="sel-cat-label">${selCat ? `<strong>${selName}</strong>（${selCount}問）を選択中` : `<strong>全カテゴリ</strong>（${totalQ}問）`}</div>
        <select class="qcount-select" id="mt-count">
          <option value="10">10問</option>
          <option value="20">20問</option>
          <option value="all" selected>全問</option>
        </select>
        <button class="btn btn-secondary" onclick="startMatching('${selCat||'all'}',false)">${ico('book')} 順番に</button>
        <button class="btn btn-primary" onclick="startMatching('${selCat||'all'}',true)">${ico('shuffle')} ランダム</button>
      </div>
      <div class="category-grid">${catCardsHtml}</div>
    </div>`;
}
function selectMatchingCat(catId){
  state.matching.selectedCatId = state.matching.selectedCatId === catId ? null : catId;
  renderMatchingHome();
}
function startMatching(catId, shuffle){
  let qs = matchingBank().slice();
  if(catId !== 'all') qs = qs.filter(q=>q.c===catId);
  if(shuffle) qs = qs.sort(()=>Math.random()-.5);
  const countSel = document.getElementById('mt-count');
  const limit = countSel && countSel.value !== 'all' ? parseInt(countSel.value,10) : qs.length;
  qs = qs.slice(0, limit);
  if(!qs.length){ toast('問題がありません','error'); return; }
  launchMatchingSession(qs, {catId, shuffle, mode:'normal'});
}
function startMatchingWrongReview(){
  const wrongSet = new Set(state.matchingStats.wrong);
  let qs = matchingBank().filter(q=>wrongSet.has(q.id));
  if(!qs.length){ toast(ico('confetti')+' 復習する問題はありません'); return; }
  qs = qs.sort(()=>Math.random()-.5);
  launchMatchingSession(qs, {catId:'wrong', shuffle:true, mode:'review'});
}
function launchMatchingSession(qs, meta){
  state.matching.session = {questions:qs, index:0, correct:0, wrong:0, wrongThisRun:[], ...meta};
  state.resultCtx = 'matching';
  renderMatchingSession();
}
function quitMatching(){
  const sess = state.matching.session;
  if(sess && sess.index > 0 && !confirm('マッチング問題を終了しますか？（途中の成績も記録されています）')) return;
  renderMatchingHome();
}

// ─── マッチング問題：出題画面 ──────────────────────────────
function renderMatchingSession(){
  const sess = state.matching.session;
  const el = document.getElementById('matching-layout');
  if(!el || !sess) return;
  const q = sess.questions[sess.index];
  const total = sess.questions.length;
  const pct = Math.round(sess.index/total*100);
  const catInfo = QCAT.find(c=>c.id===q.c) || {name:q.c, icon:'link'};
  const modeTag = sess.mode==='review' ? ico('flame')+' 苦手復習 ／ ' : '';
  // 左右それぞれ表示順をシャッフルする。要素IDは元のインデックス基準のまま。
  const leftOrder  = shuffleIndices(q.l.length);
  const rightOrder = shuffleIndices(q.r.length);

  el.innerHTML = `
    <div class="quiz-session">
      <div class="qsess-header">
        <div style="font-family:var(--disp);font-weight:700;font-size:15px;">${modeTag}${ico('link')} ${catInfo.name}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="q-prog-bar"><div class="q-prog-fill" style="width:${pct}%"></div></div>
          <span style="font-size:12px;color:var(--dim);font-family:var(--disp);">${sess.index+1} / ${total}</span>
        </div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:12px;align-items:center;">
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ok)">${sess.correct}</span><div style="font-size:10.5px;color:var(--dim)">正解</div></div>
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ng)">${sess.wrong}</span><div style="font-size:10.5px;color:var(--dim)">不正解</div></div>
        <button class="btn btn-secondary" style="width:auto;margin-left:auto;font-size:12px;padding:7px 13px" onclick="quitMatching()">← 終了</button>
      </div>
      <div class="quiz-card">
        <div class="quiz-cat-tag">${ico('link')} ${catInfo.name} ／ マッチング問題（すべて対応付けてください）</div>
        ${qStem(q)}
        <div class="mt-hint">左をタップ → 対応する右をタップ。同じ番号どうしが1組です。組んだ左をもう一度タップすると解除できます。</div>
        <div class="mt-grid">
          <div>
            <div class="mt-col-label">項目</div>
            ${leftOrder.map(i=>`
              <button class="mt-item" id="ml-${i}" onclick="pickMatchLeft(${i})">
                <span class="mt-badge" id="mlb-${i}">–</span><span>${escHtml(q.l[i])}</span>
              </button>`).join('')}
          </div>
          <div>
            <div class="mt-col-label">対応するもの</div>
            ${rightOrder.map(j=>`
              <button class="mt-item" id="mr-${j}" onclick="pickMatchRight(${j})">
                <span class="mt-badge" id="mrb-${j}">–</span><span>${escHtml(q.r[j])}</span>
              </button>`).join('')}
          </div>
        </div>
        <div style="margin-top:13px;display:flex;justify-content:flex-end;gap:8px">
          <button class="btn btn-secondary" id="mt-reset" style="width:auto;" onclick="resetMatchPairs()">やり直す</button>
          <button class="btn btn-primary" id="mt-submit" style="width:auto;" onclick="submitMatchingAnswer()">回答する</button>
        </div>
        <div class="quiz-explain" id="mt-explain" style="white-space:pre-wrap;"></div>
      </div>
      <div class="quiz-nav" id="mt-nav" style="display:none;">
        <button class="btn btn-primary" style="width:auto" onclick="nextMatchingQuestion()" id="next-mt-btn">次の問題 →</button>
      </div>
    </div>`;
  window._mtPairs = {};         // {左の元index: 右の元index}
  window._mtOrder = [];         // 組んだ順（バッジ番号の採番に使う）
  window._mtActiveLeft = null;  // 選択中の左項目
  window._mtAnswered = false;
}
// 現在の組み合わせ状態からバッジと色を描き直す
function refreshMatchBadges(){
  const sess = state.matching.session;
  if(!sess) return;
  const q = sess.questions[sess.index];
  q.l.forEach((_,i)=>{
    const btn = document.getElementById('ml-'+i), bad = document.getElementById('mlb-'+i);
    if(!btn || !bad) return;
    const paired = window._mtPairs[i] !== undefined;
    btn.classList.toggle('paired', paired);
    btn.classList.toggle('active', window._mtActiveLeft === i);
    bad.textContent = paired ? (window._mtOrder.indexOf(i) + 1) : '–';
  });
  q.r.forEach((_,j)=>{
    const btn = document.getElementById('mr-'+j), bad = document.getElementById('mrb-'+j);
    if(!btn || !bad) return;
    const leftKey = Object.keys(window._mtPairs).find(k=>window._mtPairs[k] === j);
    const paired = leftKey !== undefined;
    btn.classList.toggle('paired', paired);
    bad.textContent = paired ? (window._mtOrder.indexOf(Number(leftKey)) + 1) : '–';
  });
}
function pickMatchLeft(i){
  if(window._mtAnswered) return;
  // 既に組んである左項目をタップしたら、その組を解除する
  if(window._mtPairs[i] !== undefined){
    delete window._mtPairs[i];
    window._mtOrder = window._mtOrder.filter(x=>x!==i);
    window._mtActiveLeft = null;
  } else {
    window._mtActiveLeft = (window._mtActiveLeft === i) ? null : i;
  }
  refreshMatchBadges();
}
function pickMatchRight(j){
  if(window._mtAnswered) return;
  const left = window._mtActiveLeft;
  if(left === null || left === undefined){ toast('先に左の項目を選んでください','error'); return; }
  // その右項目が既に他の左と組んでいたら、先にその組を解除する
  const prevLeftKey = Object.keys(window._mtPairs).find(k=>window._mtPairs[k] === j);
  if(prevLeftKey !== undefined){
    const prevLeft = Number(prevLeftKey);
    delete window._mtPairs[prevLeft];
    window._mtOrder = window._mtOrder.filter(x=>x!==prevLeft);
  }
  window._mtPairs[left] = j;
  if(!window._mtOrder.includes(left)) window._mtOrder.push(left);
  window._mtActiveLeft = null;
  refreshMatchBadges();
}
function resetMatchPairs(){
  if(window._mtAnswered) return;
  window._mtPairs = {};
  window._mtOrder = [];
  window._mtActiveLeft = null;
  refreshMatchBadges();
}
function submitMatchingAnswer(){
  const sess = state.matching.session;
  if(!sess || window._mtAnswered) return;
  const q = sess.questions[sess.index];
  const pairedCount = Object.keys(window._mtPairs).length;
  if(pairedCount !== q.l.length){
    toast(`すべての項目を対応付けてください（${pairedCount}/${q.l.length}）`,'error');
    return;
  }
  window._mtAnswered = true;
  // 判定は元データのインデックス基準。表示位置には依存しない。
  const isCorrect = q.l.every((_,i)=>window._mtPairs[i] === q.a[i]);
  document.querySelectorAll('.mt-item').forEach(b=>b.disabled=true);
  q.l.forEach((_,i)=>{
    const btn = document.getElementById('ml-'+i);
    if(!btn) return;
    btn.classList.remove('active');
    btn.classList.add(window._mtPairs[i] === q.a[i] ? 'ok' : 'ng');
  });
  if(isCorrect) sess.correct++; else { sess.wrong++; sess.wrongThisRun.push(q.id); }
  recordMatchingAnswer(q, isCorrect);
  document.getElementById('mt-submit').style.display = 'none';
  document.getElementById('mt-reset').style.display = 'none';
  const correctText = q.l.map((lv,i)=>`・${lv} → ${q.r[q.a[i]]}`).join('\n');
  const ex = document.getElementById('mt-explain');
  ex.textContent = (isCorrect ? '正解！\n\n' : '不正解\n\n') + '【正しい組み合わせ】\n' + correctText + '\n\n' + (q.e||'');
  ex.classList.add('show');
  document.getElementById('mt-nav').style.display = 'flex';
  const btn = document.getElementById('next-mt-btn');
  if(btn) btn.focus({preventScroll:true});
}
function nextMatchingQuestion(){
  const sess = state.matching.session;
  sess.index++;
  if(sess.index >= sess.questions.length){
    state.lastMatchingRun = {catId:sess.catId, shuffle:sess.shuffle, mode:sess.mode, wrongThisRun:sess.wrongThisRun.slice()};
    showResultScreen(sess.correct, sess.correct+sess.wrong);
    state.matching.session = null;
  } else renderMatchingSession();
}
