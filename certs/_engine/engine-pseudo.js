// ═══════════════════════════════════════════════════════════
//  engine-pseudo.js — 擬似言語プログラム問題（基本情報技術者 科目B）
//
//  IPA公式の擬似言語記述形式に準拠する。仕様の一次情報は
//  certs/fe/擬似言語仕様_IPA公式.md に転記済み（作問時はそれを唯一の正とする）。
//
//  engine.js の直後に読み込むこと。state・save()・toast()・escHtml()・
//  pseudoCode()・qFigure() など engine.js のグローバルを使う。
//  engine.js 側の RESULT_CTX・TAB_FEATURE・switchTab からも参照される。
//
//  【出題形式】公式サンプル問題の3類型に対応する。いずれも最終的には
//  「プログラムを読んで解答群から1つ選ぶ」形なので、単一選択の1エンジンで扱える。
//    (1) 穴埋め1個   … コード中の [[a]] を1個置く
//    (2) 穴埋め複数   … [[a]]〜[[c]] を置き、解答群は組合せ（"a=3, b=5, c=3と5"）
//    (3) トレース     … 空欄なし。実行結果や戻り値を問う
//
//  【データ形式】data.js で PSEUDO_Q を定義する（無くても落ちない）
//    {id:'P001', c:カテゴリID,
//     q:'設問文',
//     note:'ここで、配列の要素番号は 1 から始まる。',  // 任意。前提条件の注記
//     code:'○整数型: f(整数型: n)\n  ...\n  [[a]]\n  ...',  // 擬似言語プログラム
//     fig:'<svg …>',        // 任意。図が要る問題はSVGを入れる（作問ルール第1項）
//     o:['選択肢…'], a:正解のindex, e:'解説'}
//
//  【選択肢シャッフル】CLAUDE.md 4-8b節の指針どおり、表示順は毎回シャッフルし、
//  正誤判定・DOM要素IDは常に元データのインデックス基準で行う。
//  ただし解答群が「ア 1,2／イ 1,3」のように順序自体に意味がある場合に備え、
//  問題オブジェクトに noShuffle:true を持たせるとシャッフルを止められる。
// ═══════════════════════════════════════════════════════════

// データを持たない資格でも落ちないようにする
function pseudoBank(){ return (typeof PSEUDO_Q !== 'undefined' && Array.isArray(PSEUDO_Q)) ? PSEUDO_Q : []; }

// ─── 成績 ──────────────────────────────────────────────────
function pseudoCatAccuracy(catId){
  let r=0, w=0;
  pseudoBank().forEach(q=>{
    if(q.c!==catId) return;
    const a = state.pseudoStats.answered[q.id];
    if(a){ r+=a.r; w+=a.w; }
  });
  const total = r+w;
  return total ? {pct:Math.round(r/total*100), total} : null;
}
function pseudoOverallStats(){
  let r=0, w=0;
  Object.values(state.pseudoStats.answered).forEach(a=>{ r+=a.r; w+=a.w; });
  return {answered:r+w, pct:(r+w)?Math.round(r/(r+w)*100):0, wrongCount:state.pseudoStats.wrong.length};
}
function recordPseudoAnswer(q, isCorrect){
  const id = q.id;
  const st = state.pseudoStats;
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

// ─── ホーム ────────────────────────────────────────────────
function renderPseudoHome(){
  state.pseudo.session = null;
  const el = document.getElementById('pseudo-layout');
  if(!el) return;
  const all = pseudoBank();
  const selCat = state.pseudo.selectedCatId;
  const os = pseudoOverallStats();

  const catCardsHtml = QCAT.map(cat=>{
    const n = all.filter(q=>q.c===cat.id).length;
    if(n===0) return '';
    const acc = pseudoCatAccuracy(cat.id);
    const accHtml = acc
      ? `<div class="cat-acc-bar"><div class="cat-acc-fill" style="width:${acc.pct}%;background:${accColor(acc.pct)}"></div></div>
         <div class="cat-acc-text">正答率 ${acc.pct}%（${acc.total}回）</div>`
      : `<div class="cat-acc-text">未挑戦</div>`;
    return `<div class="category-card${selCat===cat.id?' active-cat':''}" onclick="selectPseudoCat('${cat.id}')" role="button" tabindex="0">
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
      <div class="review-label"><strong>${os.wrongCount} 問</strong>の間違えた擬似言語問題があります。正解するとリストから消えます。</div>
      <button class="btn btn-secondary" onclick="startPseudoWrongReview()">${ico('flame')} 苦手を復習する</button>
    </div>` : '';

  el.innerHTML = `
    <div class="quiz-home">
      <div class="quiz-home-title">${ico('code')} 擬似言語（科目B）</div>
      <div class="quiz-home-sub">プログラムを読んで、空欄に入るものや実行結果を答える形式です。表記はIPA公式の擬似言語記述形式に準拠しています。全 ${totalQ} 問収録。</div>
      ${statsHtml}
      ${reviewHtml}
      <div class="quiz-start-bar">
        <div class="sel-cat-label">${selCat ? `<strong>${selName}</strong>（${selCount}問）を選択中` : `<strong>全カテゴリ</strong>（${totalQ}問）`}</div>
        <select class="qcount-select" id="p-count">
          <option value="5">5問</option>
          <option value="10">10問</option>
          <option value="all" selected>全問</option>
        </select>
        <button class="btn btn-secondary" onclick="startPseudo('${selCat||'all'}',false)">${ico('book')} 順番に</button>
        <button class="btn btn-primary" onclick="startPseudo('${selCat||'all'}',true)">${ico('shuffle')} ランダム</button>
      </div>
      <div class="category-grid">${catCardsHtml}</div>
    </div>`;
}
function selectPseudoCat(catId){
  state.pseudo.selectedCatId = state.pseudo.selectedCatId === catId ? null : catId;
  renderPseudoHome();
}
function startPseudo(catId, shuffle){
  let qs = pseudoBank().slice();
  if(catId !== 'all') qs = qs.filter(q=>q.c===catId);
  if(shuffle) qs = qs.sort(()=>Math.random()-.5);
  const countSel = document.getElementById('p-count');
  const limit = countSel && countSel.value !== 'all' ? parseInt(countSel.value,10) : qs.length;
  qs = qs.slice(0, limit);
  if(!qs.length){ toast('問題がありません','error'); return; }
  launchPseudoSession(qs, {catId, shuffle, mode:'normal'});
}
function startPseudoWrongReview(){
  const wrongSet = new Set(state.pseudoStats.wrong);
  let qs = pseudoBank().filter(q=>wrongSet.has(q.id));
  if(!qs.length){ toast(ico('confetti')+' 復習する問題はありません'); return; }
  qs = qs.sort(()=>Math.random()-.5);
  launchPseudoSession(qs, {catId:'wrong', shuffle:true, mode:'review'});
}
function launchPseudoSession(qs, meta){
  state.pseudo.session = {questions:qs, index:0, correct:0, wrong:0, wrongThisRun:[], ...meta};
  state.resultCtx = 'pseudo';
  renderPseudoSession();
}
function quitPseudo(){
  const sess = state.pseudo.session;
  if(sess && sess.index > 0 && !confirm('擬似言語問題を終了しますか？（途中の成績も記録されています）')) return;
  renderPseudoHome();
}

// ─── 出題画面 ──────────────────────────────────────────────
function renderPseudoSession(){
  const sess = state.pseudo.session;
  const el = document.getElementById('pseudo-layout');
  if(!el || !sess) return;
  const q = sess.questions[sess.index];
  const total = sess.questions.length;
  const pct = Math.round(sess.index/total*100);
  const catInfo = QCAT.find(c=>c.id===q.c) || {name:q.c, icon:'code'};
  const modeTag = sess.mode==='review' ? ico('flame')+' 苦手復習 ／ ' : '';
  // 解答群の記号は本番同様アイウエオカキ
  const letters = ['ア','イ','ウ','エ','オ','カ','キ','ク'];
  // 表示順シャッフル。noShuffle の問題（順序自体に意味がある解答群）は元の順を保つ。
  const displayOrder = q.noShuffle
    ? Array.from({length:q.o.length}, (_,i)=>i)
    : shuffleIndices(q.o.length);

  el.innerHTML = `
    <div class="quiz-session">
      <div class="qsess-header">
        <div style="font-family:var(--disp);font-weight:700;font-size:15px;">${modeTag}${ico('code')} ${catInfo.name}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="q-prog-bar"><div class="q-prog-fill" style="width:${pct}%"></div></div>
          <span style="font-size:12px;color:var(--dim);font-family:var(--disp);">${sess.index+1} / ${total}</span>
        </div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:12px;align-items:center;">
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ok)">${sess.correct}</span><div style="font-size:10.5px;color:var(--dim)">正解</div></div>
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ng)">${sess.wrong}</span><div style="font-size:10.5px;color:var(--dim)">不正解</div></div>
        <button class="btn btn-secondary" style="width:auto;margin-left:auto;font-size:12px;padding:7px 13px" onclick="quitPseudo()">← 終了</button>
      </div>
      <div class="quiz-card">
        <div class="quiz-cat-tag">${ico('code')} ${catInfo.name} ／ 科目B</div>
        <div class="quiz-question">${escHtml(q.q)}</div>
        ${q.note ? `<div class="pseudo-note">${escHtml(q.note)}</div>` : ''}
        ${qFigure(q)}
        <div class="pseudo-label">〔プログラム〕</div>
        ${pseudoCode(q.code)}
        <div class="pseudo-label">解答群</div>
        <div class="quiz-choices" id="pseudo-choices">
          ${displayOrder.map((origIdx,pos)=>`
            <button class="quiz-choice" id="pc-${origIdx}" onclick="selectPseudoAnswer(${origIdx})">
              <div class="choice-letter">${letters[pos]}</div>
              <div>${escHtml(q.o[origIdx])}</div>
            </button>`).join('')}
        </div>
        <div class="quiz-explain" id="pseudo-explain"></div>
      </div>
      <div class="quiz-nav" id="pseudo-nav" style="display:none;">
        <button class="btn btn-primary" style="width:auto" onclick="nextPseudoQuestion()" id="next-p-btn">次の問題 →</button>
      </div>
    </div>`;
  window._pseudoAnswered = false;
}
function selectPseudoAnswer(idx){
  const sess = state.pseudo.session;
  if(!sess || window._pseudoAnswered) return;
  const q = sess.questions[sess.index];
  window._pseudoAnswered = true;
  // 判定は常に元データのインデックス基準。表示位置には依存しない。
  const isCorrect = idx === q.a;
  document.querySelectorAll('#pseudo-choices .quiz-choice').forEach(b=>b.disabled=true);
  const picked = document.getElementById('pc-'+idx);
  if(picked) picked.classList.add(isCorrect?'correct':'wrong');
  const answer = document.getElementById('pc-'+q.a);
  if(answer) answer.classList.add('correct');

  if(isCorrect) sess.correct++; else { sess.wrong++; sess.wrongThisRun.push(q.id); }
  recordPseudoAnswer(q, isCorrect);

  const ex = document.getElementById('pseudo-explain');
  ex.textContent = q.e;
  ex.classList.add('show');
  document.getElementById('pseudo-nav').style.display = 'flex';
  const btn = document.getElementById('next-p-btn');
  if(btn) btn.focus({preventScroll:true});
}
function nextPseudoQuestion(){
  const sess = state.pseudo.session;
  sess.index++;
  if(sess.index >= sess.questions.length){
    state.lastPseudoRun = {catId:sess.catId, shuffle:sess.shuffle, mode:sess.mode, wrongThisRun:sess.wrongThisRun.slice()};
    showResultScreen(sess.correct, sess.correct+sess.wrong);
    state.pseudo.session = null;
  } else renderPseudoSession();
}
