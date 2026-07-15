// ─── STATE ────────────────────────────────────────────────
let state = {
  customCards: {},          // {カテゴリ名: [{id,term,def}]}
  cardStats: {},            // {cardKey: 'k'(覚えた) | 'a'(もう一度)}
  currentCat: null,         // 表示中のカテゴリ
  editingCardId: null,
  study: {queue:[], index:0, history:[], isFlipped:false, reversed:false, cat:null, mode:'all'},
  quiz: {selectedCatId:null, session:null},
  quizStats: {answered:{}, wrong:[]},
  resultCtx: null,
};

const FC_CATS = Object.keys(SAMPLE);   // 単語帳カテゴリ一覧（data.jsのキー）

// カードキー：組み込みは「カテゴリ::b::連番」、カスタムは「カテゴリ::c::id」
function cardKey(cat, card){
  return card._builtin !== undefined
    ? `${cat}::b::${card._builtin}`
    : `${cat}::c::${card.id}`;
}
function catCards(cat){
  const builtin = (SAMPLE[cat]||[]).map((c,i)=>({term:c.term, def:c.def, _builtin:i}));
  const custom  = (state.customCards[cat]||[]).map(c=>({id:c.id, term:c.term, def:c.def}));
  return builtin.concat(custom);
}
function qid(q){ return QQ.indexOf(q); }

// ─── HELPERS ──────────────────────────────────────────────
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function setSyncState(st){
  const d=document.getElementById('sync-dot'), t=document.getElementById('sync-text');
  if(!d)return;
  d.className='sync-dot'+(st==='syncing'?' syncing':st==='error'?' error':'');
  t.textContent=st==='syncing'?'同期中...':st==='error'?'エラー':'同期済み';
}
let _tt;
function toast(msg, type='success'){
  const e=document.getElementById('toast');
  e.textContent=msg; e.className='toast show '+type;
  clearTimeout(_tt); _tt=setTimeout(()=>{e.className='toast';},2600);
}
function save(){ if(window._save) window._save(); }
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s){ return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;'); }
function fcIcon(cat){
  return {'コンピューティング':'⚙️','ストレージ':'💾','ネットワーク':'🌐','データベース':'🗄️','セキュリティ':'🔐','サーバーレス':'⚡','AI / ML':'🤖','監視・管理':'📊','料金・サポート':'💰'}[cat]||'📚';
}

// ─── BOOT ─────────────────────────────────────────────────
function afterLoad(silent){
  document.getElementById('btn-home').style.display = 'block';
  document.getElementById('sync-indicator').style.display = 'flex';
  if(!silent){
    showScreen('notebook-screen');
    renderFcHome();
  } else {
    // バックグラウンド同期：表示中の画面だけ静かに更新
    if(document.getElementById('notebook-screen').classList.contains('active')){
      if(state.currentCat) renderCatView(); else renderFcHome();
    }
  }
  if(!state.quiz.session) renderQuizHome();
}
function goHome(){
  if(state.quiz.session && !confirm('クイズを中断してトップに戻りますか？')) return;
  state.quiz.session = null;
  state.currentCat = null;
  showScreen('notebook-screen');
  switchTab('fc');
  renderFcHome();
}

// ─── TABS ─────────────────────────────────────────────────
function switchTab(t){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.getElementById('tab-'+t).classList.add('active');
  document.getElementById('tabcontent-'+t).classList.add('active');
  if(t==='quiz' && !state.quiz.session) renderQuizHome();
  if(t==='fc'){ if(state.currentCat) renderCatView(); else renderFcHome(); }
}

// ─── 単語帳：カテゴリホーム ───────────────────────────────
function catMastery(cat){
  const cards = catCards(cat);
  let k=0, a=0;
  cards.forEach(c=>{
    const st = state.cardStats[cardKey(cat,c)];
    if(st==='k') k++; else if(st==='a') a++;
  });
  return {total:cards.length, known:k, again:a, unseen:cards.length-k-a};
}
function fcOverall(){
  let total=0, known=0, again=0;
  FC_CATS.forEach(cat=>{
    const m = catMastery(cat);
    total+=m.total; known+=m.known; again+=m.again;
  });
  return {total, known, again, review: total-known};
}
function renderFcHome(){
  state.currentCat = null;
  const el = document.getElementById('fc-container');
  const ov = fcOverall();
  const reviewCount = ov.again;   // 「もう一度」マークが付いたカード

  const cats = FC_CATS.map(cat=>{
    const m = catMastery(cat);
    const pct = m.total ? Math.round(m.known/m.total*100) : 0;
    const color = pct>=80?'var(--ok)':pct>=40?'var(--orange)':'var(--dim)';
    return `<div class="category-card" onclick="openCat('${escAttr(cat)}')" role="button" tabindex="0">
      <div class="cat-head"><span class="cat-icon">${fcIcon(cat)}</span><span class="cat-name">${escHtml(cat)}</span><span class="cat-count">${m.total}枚</span></div>
      <div class="cat-acc-bar"><div class="cat-acc-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="cat-acc-text">習得 ${m.known} / ${m.total}${m.again?`　<span style="color:var(--ng)">要復習 ${m.again}</span>`:''}</div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="quiz-home">
      <div class="quiz-home-title">📇 単語帳</div>
      <div class="quiz-home-sub">カテゴリを選んで学習を開始。「覚えた」の記録は端末をまたいで保存されます。全 ${ov.total} 枚収録。</div>
      <div class="overall-stats">
        <div class="os-chip"><span class="os-num" style="color:var(--ok)">${ov.known}</span><span class="os-lbl">覚えた</span></div>
        <div class="os-chip"><span class="os-num" style="color:var(--ng)">${ov.again}</span><span class="os-lbl">要復習</span></div>
        <div class="os-chip"><span class="os-num" style="color:var(--dim)">${ov.total-ov.known-ov.again}</span><span class="os-lbl">未学習</span></div>
      </div>
      ${reviewCount>0?`
      <div class="review-bar">
        <div class="review-label"><strong>${reviewCount} 枚</strong>の「もう一度」カードがあります。覚えたらリストから消えます。</div>
        <button class="btn btn-secondary" onclick="startReviewStudy()">🔥 覚えてないカードだけ復習</button>
      </div>`:''}
      <div class="category-grid">${cats}</div>
    </div>`;
}

// ─── 単語帳：カテゴリ内ビュー ─────────────────────────────
function openCat(cat){
  state.currentCat = cat;
  cancelEdit();
  renderCatView();
}
function renderCatView(){
  const cat = state.currentCat;
  const el = document.getElementById('fc-container');
  const m = catMastery(cat);
  const kw = (state._fcSearch||'').toLowerCase();
  let cards = catCards(cat);
  if(kw) cards = cards.filter(c=>c.term.toLowerCase().includes(kw)||c.def.toLowerCase().includes(kw));

  el.innerHTML = `
    <div class="quiz-home">
      <div class="content-header">
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="btn-icon" onclick="renderFcHome()" aria-label="カテゴリ一覧へ">←</button>
          <div class="content-title">${fcIcon(cat)} ${escHtml(cat)}</div>
        </div>
        <div class="content-actions">
          <button class="btn btn-secondary" onclick="toggleAddForm()">＋ カード追加</button>
          ${m.again>0?`<button class="btn btn-secondary" onclick="startStudy('again')">🔥 要復習のみ（${m.again}）</button>`:''}
          <button class="btn btn-primary" style="width:auto" onclick="startStudy('all')">📖 学習開始（${m.total}枚）</button>
        </div>
      </div>
      <div class="search-box">
        <input type="text" id="card-search" placeholder="カードを検索..." value="${escHtml(state._fcSearch||'')}" oninput="state._fcSearch=this.value;renderCatView();">
      </div>
      <div class="add-card-form" id="add-card-form">
        <div class="form-row">
          <div class="form-group"><label>用語</label><input type="text" id="new-term" placeholder="例: Amazon S3"></div>
          <div class="form-group"><label>説明</label><textarea id="new-def" placeholder="例: スケーラブルなオブジェクトストレージ..."></textarea></div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="cancelEdit()">キャンセル</button>
          <button class="btn btn-primary" onclick="addCard()" style="width:auto" id="add-card-btn">追加</button>
        </div>
      </div>
      ${cards.length ? `<div class="cards-grid">${cards.map(c=>{
        const key = cardKey(cat, c);
        const st = state.cardStats[key];
        const badge = st==='k'?'<span style="color:var(--ok);font-size:10px;">✓ 覚えた</span>':st==='a'?'<span style="color:var(--ng);font-size:10px;">🔥 要復習</span>':'';
        const isCustom = c._builtin===undefined;
        return `
        <div class="flashcard" id="fc-${escHtml(key).replace(/[^a-zA-Z0-9_-]/g,'_')}" onclick="flipCardByKey(this)">
          <div class="flashcard-inner">
            <div class="card-front">
              <div class="card-label">用語 ${badge}</div>
              <div class="card-term">${escHtml(c.term)}</div>
              <div class="card-actions-row" onclick="event.stopPropagation()">
                ${isCustom?`<button class="card-action-btn" onclick="editCard('${escAttr(c.id)}')">編集</button>
                <button class="card-action-btn del" onclick="deleteCard('${escAttr(c.id)}')">削除</button>`:'<span style="font-size:10px;color:var(--dim)">標準カード</span>'}
              </div>
            </div>
            <div class="card-back">
              <div class="card-label">説明</div>
              <div class="card-definition">${escHtml(c.def)}</div>
              <div class="card-hint">タップで戻る</div>
            </div>
          </div>
        </div>`;}).join('')}</div>`
      : `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">一致するカードがありません</div></div>`}
    </div>`;
}
function flipCardByKey(el){ el.classList.toggle('flipped'); }

// ─── カスタムカード（追加/編集/削除） ─────────────────────
function toggleAddForm(){
  const f = document.getElementById('add-card-form');
  f.classList.toggle('open');
  if(f.classList.contains('open')) document.getElementById('new-term').focus();
}
function cancelEdit(){
  state.editingCardId = null;
  const f = document.getElementById('add-card-form');
  if(f){
    f.classList.remove('open');
    const btn = document.getElementById('add-card-btn');
    if(btn) btn.textContent = '追加';
  }
}
function addCard(){
  const term = document.getElementById('new-term').value.trim();
  const def = document.getElementById('new-def').value.trim();
  if(!term||!def){ toast('用語と説明を入力してください','error'); return; }
  const cat = state.currentCat;
  if(!state.customCards[cat]) state.customCards[cat] = [];
  if(state.editingCardId){
    const card = state.customCards[cat].find(c=>String(c.id)===String(state.editingCardId));
    if(card){ card.term=term; card.def=def; toast('カードを更新しました ✓'); }
    state.editingCardId = null;
  } else {
    state.customCards[cat].push({id:String(Date.now()), term, def});
    toast('カードを追加しました ✓');
  }
  save();
  renderCatView();
}
function editCard(id){
  const cat = state.currentCat;
  const card = (state.customCards[cat]||[]).find(c=>String(c.id)===String(id));
  if(!card) return;
  state.editingCardId = String(id);
  renderCatView();
  const f = document.getElementById('add-card-form');
  f.classList.add('open');
  document.getElementById('new-term').value = card.term;
  document.getElementById('new-def').value = card.def;
  document.getElementById('add-card-btn').textContent = '更新';
  document.getElementById('new-term').focus();
}
function deleteCard(id){
  if(!confirm('このカードを削除しますか？')) return;
  const cat = state.currentCat;
  state.customCards[cat] = (state.customCards[cat]||[]).filter(c=>String(c.id)!==String(id));
  delete state.cardStats[`${cat}::c::${id}`];
  save();
  renderCatView();
  toast('削除しました');
}

// ─── STUDY（学習モード） ──────────────────────────────────
function startStudy(mode){
  const cat = state.currentCat;
  let cards = catCards(cat);
  if(mode==='again'){
    cards = cards.filter(c=>state.cardStats[cardKey(cat,c)]==='a');
  }
  if(!cards.length){ toast('対象のカードがありません','error'); return; }
  launchStudy(cards.map(c=>({...c, _cat:cat})), `${fcIcon(cat)} ${cat}`, mode);
}
function startReviewStudy(){
  // 全カテゴリ横断の「もう一度」カード
  let pool = [];
  FC_CATS.forEach(cat=>{
    catCards(cat).forEach(c=>{
      if(state.cardStats[cardKey(cat,c)]==='a') pool.push({...c, _cat:cat});
    });
  });
  if(!pool.length){ toast('復習するカードはありません 🎉'); return; }
  launchStudy(pool, '🔥 苦手カード復習', 'review');
}
function launchStudy(cards, title, mode){
  state.study = {
    queue: cards.sort(()=>Math.random()-.5),
    index: 0, history: [], isFlipped: false,
    reversed: state.study.reversed || false,   // 反転設定は維持
    cat: state.currentCat, mode
  };
  document.getElementById('study-deck-title').textContent = title;
  document.getElementById('study-subtitle').textContent = `${cards.length} 枚`;
  state.resultCtx = 'study';
  showScreen('study-screen');
  updateReverseBtn();
  renderStudyCard();
}
function studyCounts(){
  const h = state.study.history;
  return { known: h.filter(x=>x).length, again: h.filter(x=>x===false).length };
}
function renderStudyCard(){
  const s = state.study, c = s.queue[s.index], n = s.queue.length;
  const {known, again} = studyCounts();
  const front = s.reversed ? c.def : c.term;
  const back  = s.reversed ? c.term : c.def;
  document.getElementById('study-front-label').textContent = s.reversed ? '説明' : '用語';
  document.getElementById('study-back-label').textContent  = s.reversed ? '用語' : '説明';
  document.getElementById('study-term-text').textContent = front;
  document.getElementById('study-def-text').textContent = back;
  // 説明が表なら文字を小さく
  document.getElementById('study-term-text').style.fontSize = s.reversed ? '15px' : '';
  document.getElementById('study-term-text').style.lineHeight = s.reversed ? '1.7' : '';
  document.getElementById('study-def-text').style.fontSize = s.reversed ? '24px' : '';
  document.getElementById('study-card').classList.remove('flipped');
  document.getElementById('study-controls').style.display = 'none';
  s.isFlipped = false;
  document.getElementById('progress-fill').style.width = Math.round(s.index/n*100)+'%';
  document.getElementById('progress-text').textContent = `${s.index+1}/${n}`;
  document.getElementById('stat-know').textContent = known;
  document.getElementById('stat-again').textContent = again;
  document.getElementById('stat-remain').textContent = n - s.index;
}
function toggleReverse(){
  state.study.reversed = !state.study.reversed;
  updateReverseBtn();
  renderStudyCard();
  toast(state.study.reversed ? '説明 → 用語 モード' : '用語 → 説明 モード');
}
function updateReverseBtn(){
  const b = document.getElementById('reverse-btn');
  if(b) b.classList.toggle('rev-on', state.study.reversed);
}
function quitStudy(){
  const s = state.study;
  if(s.index > 0 && !confirm('学習を終了しますか？（ここまでの「覚えた/もう一度」は保存済みです）')) return;
  backToFc();
}
function backToFc(){
  showScreen('notebook-screen');
  switchTab('fc');
  if(state.currentCat) renderCatView(); else renderFcHome();
}
function flipStudyCard(){
  const s = state.study;
  document.getElementById('study-card').classList.toggle('flipped');
  s.isFlipped = !s.isFlipped;
  if(s.isFlipped) document.getElementById('study-controls').style.display = 'flex';
}
function markCard(known){
  const s = state.study;
  s.history[s.index] = known;
  const c = s.queue[s.index];
  const key = cardKey(c._cat, c);
  state.cardStats[key] = known ? 'k' : 'a';
  save();
  s.index++;
  if(s.index >= s.queue.length){
    const {known:k} = studyCounts();
    showResultScreen(k, s.queue.length, 'study');
  } else renderStudyCard();
}
function prevCard(){
  const s = state.study;
  if(s.index > 0){
    s.index--;
    s.history.length = s.index;
    renderStudyCard();
  }
}

// ─── QUIZ STATS ───────────────────────────────────────────
function recordAnswer(q, isCorrect){
  const id = String(qid(q));
  const st = state.quizStats;
  if(!st.answered[id]) st.answered[id] = {r:0, w:0};
  if(isCorrect){
    st.answered[id].r++;
    st.wrong = st.wrong.filter(x=>String(x)!==id);
  } else {
    st.answered[id].w++;
    if(!st.wrong.some(x=>String(x)===id)) st.wrong.push(id);
  }
  save();
}
function catAccuracy(catId){
  let r=0, w=0;
  QQ.forEach((q,i)=>{
    if(q.c!==catId) return;
    const a = state.quizStats.answered[String(i)];
    if(a){ r+=a.r; w+=a.w; }
  });
  const total = r+w;
  return total ? {pct:Math.round(r/total*100), total} : null;
}
function overallStats(){
  let r=0, w=0;
  Object.values(state.quizStats.answered).forEach(a=>{ r+=a.r; w+=a.w; });
  return {answered:r+w, pct:(r+w)?Math.round(r/(r+w)*100):0, wrongCount:state.quizStats.wrong.length};
}
function accColor(p){ return p>=80?'var(--ok)':p>=60?'var(--orange)':'var(--ng)'; }

// ─── QUIZ HOME ────────────────────────────────────────────
function renderQuizHome(){
  state.quiz.session = null;
  const el = document.getElementById('quiz-layout');
  const selCat = state.quiz.selectedCatId;
  const os = overallStats();

  const catCardsHtml = QCAT.map(cat=>{
    const n = QQ.filter(q=>q.c===cat.id).length;
    const acc = catAccuracy(cat.id);
    const accHtml = acc
      ? `<div class="cat-acc-bar"><div class="cat-acc-fill" style="width:${acc.pct}%;background:${accColor(acc.pct)}"></div></div>
         <div class="cat-acc-text">正答率 ${acc.pct}%（${acc.total}回）</div>`
      : `<div class="cat-acc-text">未挑戦</div>`;
    return `<div class="category-card${selCat===cat.id?' active-cat':''}" onclick="selectQuizCat('${cat.id}')" role="button" tabindex="0">
      <div class="cat-head"><span class="cat-icon">${cat.icon}</span><span class="cat-name">${cat.name}</span><span class="cat-count">${n}問</span></div>
      ${accHtml}
    </div>`;
  }).join('');

  const totalQ = QQ.length;
  const selName = selCat ? (QCAT.find(c=>c.id===selCat)||{}).name : '';
  const selCount = selCat ? QQ.filter(q=>q.c===selCat).length : totalQ;

  const statsHtml = os.answered > 0 ? `
    <div class="overall-stats">
      <div class="os-chip"><span class="os-num">${os.answered}</span><span class="os-lbl">累計解答数</span></div>
      <div class="os-chip"><span class="os-num" style="color:${accColor(os.pct)}">${os.pct}%</span><span class="os-lbl">全体正答率</span></div>
      <div class="os-chip"><span class="os-num" style="color:${os.wrongCount?'var(--ng)':'var(--ok)'}">${os.wrongCount}</span><span class="os-lbl">要復習の問題</span></div>
    </div>` : '';

  const reviewHtml = os.wrongCount > 0 ? `
    <div class="review-bar">
      <div class="review-label"><strong>${os.wrongCount} 問</strong>の間違えた問題があります。正解するとリストから消えます。</div>
      <button class="btn btn-secondary" onclick="startWrongReview()">🔥 苦手を復習する</button>
    </div>` : '';

  el.innerHTML = `
    <div class="quiz-home">
      <div class="quiz-home-title">📝 CLF-C02 過去問チャレンジ</div>
      <div class="quiz-home-sub">カテゴリを選んで学習するか、全問ランダムで挑戦できます。全 ${totalQ} 問収録。</div>
      ${statsHtml}
      ${reviewHtml}
      <div class="quiz-start-bar">
        <div class="sel-cat-label">${selCat ? `<strong>${selName}</strong>（${selCount}問）を選択中` : `<strong>全カテゴリ</strong>（${totalQ}問）`}</div>
        <select class="qcount-select" id="q-count">
          <option value="10">10問</option>
          <option value="20">20問</option>
          <option value="all" selected>全問</option>
        </select>
        <button class="btn btn-secondary" onclick="startQuiz('${selCat||'all'}',false)">📖 順番に</button>
        <button class="btn btn-primary" onclick="startQuiz('${selCat||'all'}',true)">🔀 ランダム</button>
      </div>
      <div class="category-grid">${catCardsHtml}</div>
    </div>`;
}
function selectQuizCat(catId){
  state.quiz.selectedCatId = state.quiz.selectedCatId === catId ? null : catId;
  renderQuizHome();
}
function startQuiz(catId, shuffle){
  let qs = catId==='all' ? [...QQ] : QQ.filter(q=>q.c===catId);
  if(shuffle) qs = qs.sort(()=>Math.random()-.5);
  const countSel = document.getElementById('q-count');
  const limit = countSel && countSel.value !== 'all' ? parseInt(countSel.value,10) : qs.length;
  qs = qs.slice(0, limit);
  launchQuizSession(qs, {catId, shuffle, mode:'normal'});
}
function startWrongReview(){
  const wrongSet = new Set(state.quizStats.wrong.map(String));
  let qs = QQ.filter((q,i)=>wrongSet.has(String(i)));
  if(!qs.length){ toast('復習する問題はありません 🎉'); return; }
  qs = qs.sort(()=>Math.random()-.5);
  launchQuizSession(qs, {catId:'wrong', shuffle:true, mode:'review'});
}
function launchQuizSession(qs, meta){
  state.quiz.session = {questions:qs, index:0, correct:0, wrong:0, wrongThisRun:[], ...meta};
  state.resultCtx = 'quiz';
  renderQuizSession();
}
function quitQuiz(){
  const sess = state.quiz.session;
  if(sess && sess.index > 0 && !confirm('クイズを終了しますか？（途中の成績も記録されています）')) return;
  renderQuizHome();
}
function renderQuizSession(){
  const sess = state.quiz.session;
  const el = document.getElementById('quiz-layout');
  const q = sess.questions[sess.index];
  const total = sess.questions.length;
  const pct = Math.round(sess.index/total*100);
  const catInfo = QCAT.find(c=>c.id===q.c) || {name:q.c, icon:'📝'};
  const letters = ['A','B','C','D','E'];
  const isMulti = Array.isArray(q.a);
  const modeTag = sess.mode==='review' ? '🔥 苦手復習 ／ ' : '';

  el.innerHTML = `
    <div class="quiz-session">
      <div class="qsess-header">
        <div style="font-family:var(--disp);font-weight:700;font-size:15px;">${modeTag}${catInfo.icon} ${catInfo.name}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="q-prog-bar"><div class="q-prog-fill" style="width:${pct}%"></div></div>
          <span style="font-size:12px;color:var(--dim);font-family:var(--disp);">${sess.index+1} / ${total}</span>
        </div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:12px;align-items:center;">
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ok)">${sess.correct}</span><div style="font-size:10.5px;color:var(--dim)">正解</div></div>
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ng)">${sess.wrong}</span><div style="font-size:10.5px;color:var(--dim)">不正解</div></div>
        <button class="btn btn-secondary" style="width:auto;margin-left:auto;font-size:12px;padding:7px 13px" onclick="quitQuiz()">← 終了</button>
      </div>
      <div class="quiz-card">
        <div class="quiz-cat-tag">${catInfo.icon} ${catInfo.name}${isMulti?' ／ 複数選択':''}</div>
        <div class="quiz-question">${escHtml(q.q)}</div>
        <div class="quiz-choices" id="quiz-choices">
          ${q.o.map((c,i)=>`
            <button class="quiz-choice" id="qc-${i}" onclick="selectAnswer(${i})">
              <div class="choice-letter">${letters[i]}</div>
              <div>${escHtml(c)}</div>
            </button>`).join('')}
        </div>
        ${isMulti ? `<div style="margin-top:13px;display:flex;justify-content:flex-end"><button class="btn btn-primary" id="multi-submit" style="width:auto;display:none" onclick="submitMulti()">回答する</button></div>` : ''}
        <div class="quiz-explain" id="quiz-explain"></div>
      </div>
      <div class="quiz-nav" id="quiz-nav" style="display:none;">
        <button class="btn btn-primary" style="width:auto" onclick="nextQuestion()" id="next-q-btn">次の問題 →</button>
      </div>
      <div class="kbd-hint"><kbd>A</kbd>〜<kbd>D</kbd> または <kbd>1</kbd>〜<kbd>4</kbd> で回答 ・ <kbd>Enter</kbd> で次へ</div>
    </div>`;

  if(isMulti) window._multiSelected = [];
  window._quizAnswered = false;
}
function selectAnswer(idx){
  const sess = state.quiz.session;
  if(!sess || window._quizAnswered) return;
  const q = sess.questions[sess.index];
  const isMulti = Array.isArray(q.a);
  const btn = document.getElementById('qc-'+idx);
  if(!btn || btn.disabled) return;

  if(isMulti){
    const pos = window._multiSelected.indexOf(idx);
    if(pos===-1){ window._multiSelected.push(idx); btn.classList.add('selected-multi'); }
    else{ window._multiSelected.splice(pos,1); btn.classList.remove('selected-multi'); }
    const submitBtn = document.getElementById('multi-submit');
    if(submitBtn) submitBtn.style.display = window._multiSelected.length>0 ? 'block' : 'none';
    return;
  }

  window._quizAnswered = true;
  document.querySelectorAll('.quiz-choice').forEach(b=>b.disabled=true);
  const correct = idx === q.a;
  btn.classList.add(correct?'correct':'wrong');
  if(!correct) document.getElementById('qc-'+q.a).classList.add('correct');
  if(correct) sess.correct++; else { sess.wrong++; sess.wrongThisRun.push(qid(q)); }
  recordAnswer(q, correct);
  showExplain(q.e);
}
function submitMulti(){
  const sess = state.quiz.session;
  if(!sess || window._quizAnswered) return;
  const q = sess.questions[sess.index];
  window._quizAnswered = true;
  const selected = window._multiSelected.slice().sort((a,b)=>a-b);
  const correct = q.a.slice().sort((a,b)=>a-b);
  const isCorrect = JSON.stringify(selected) === JSON.stringify(correct);
  document.querySelectorAll('.quiz-choice').forEach(b=>b.disabled=true);
  selected.forEach(i=>document.getElementById('qc-'+i).classList.add(isCorrect?'correct':'wrong'));
  correct.forEach(i=>document.getElementById('qc-'+i).classList.add('correct'));
  if(isCorrect) sess.correct++; else { sess.wrong++; sess.wrongThisRun.push(qid(q)); }
  recordAnswer(q, isCorrect);
  document.getElementById('multi-submit').style.display = 'none';
  showExplain(q.e);
}
function showExplain(text){
  const ex = document.getElementById('quiz-explain');
  ex.textContent = text;
  ex.classList.add('show');
  const nav = document.getElementById('quiz-nav');
  nav.style.display = 'flex';
  const btn = document.getElementById('next-q-btn');
  if(btn) btn.focus({preventScroll:true});
}
function nextQuestion(){
  const sess = state.quiz.session;
  sess.index++;
  if(sess.index >= sess.questions.length){
    state.lastQuizRun = {catId:sess.catId, shuffle:sess.shuffle, mode:sess.mode, wrongThisRun:sess.wrongThisRun.slice()};
    showResultScreen(sess.correct, sess.correct+sess.wrong, 'quiz');
    state.quiz.session = null;
  } else renderQuizSession();
}

// ─── RESULT ───────────────────────────────────────────────
function showResultScreen(correct, total, ctx){
  state.resultCtx = ctx;
  const pct = total>0 ? Math.round(correct/total*100) : 0;
  document.getElementById('result-emoji').textContent = pct>=80?'🎉':pct>=60?'👍':'💪';
  document.getElementById('result-title').textContent = pct>=80?'素晴らしい！':pct>=60?'よく頑張りました！':'もう少し！';
  document.getElementById('result-sub').textContent = ctx==='quiz' ? `${correct} / ${total} 問正解（${pct}%）` : `${correct} / ${total} 枚を「覚えた」（${pct}%）`;
  document.getElementById('rb-correct').textContent = correct;
  document.getElementById('rb-wrong').textContent = total - correct;
  document.getElementById('result-pct').textContent = pct+'%';
  const hasWrongQuiz = ctx==='quiz' && state.lastQuizRun && state.lastQuizRun.wrongThisRun.length > 0;
  const hasWrongStudy = ctx==='study' && (total-correct) > 0;
  const btn = document.getElementById('review-wrong-btn');
  btn.style.display = (hasWrongQuiz||hasWrongStudy) ? 'block' : 'none';
  btn.textContent = ctx==='quiz' ? '間違えた問題だけ復習' : '覚えてないカードだけ復習';
  const c = document.getElementById('result-circle');
  c.style.strokeDashoffset = 289;
  showScreen('result-screen');
  setTimeout(()=>{ c.style.strokeDashoffset = 289 - (289*pct/100); }, 120);
}
function restartResult(){
  if(state.resultCtx==='quiz'){
    const run = state.lastQuizRun;
    showScreen('notebook-screen'); switchTab('quiz');
    if(run){
      if(run.mode==='review') startWrongReview();
      else { renderQuizHome(); startQuiz(run.catId||'all', run.shuffle); }
    } else renderQuizHome();
  } else {
    // 直前と同じ範囲で再スタート
    const s = state.study;
    showScreen('notebook-screen'); switchTab('fc');
    if(s.mode==='review') startReviewStudy();
    else if(s.cat){ state.currentCat = s.cat; startStudy(s.mode||'all'); }
    else renderFcHome();
  }
}
function reviewWrongFromResult(){
  if(state.resultCtx==='quiz'){
    const run = state.lastQuizRun;
    if(!run || !run.wrongThisRun.length) return;
    showScreen('notebook-screen'); switchTab('quiz');
    const set = new Set(run.wrongThisRun.map(String));
    const qs = QQ.filter((q,i)=>set.has(String(i))).sort(()=>Math.random()-.5);
    launchQuizSession(qs, {catId:'wrong', shuffle:true, mode:'review'});
  } else {
    showScreen('notebook-screen'); switchTab('fc');
    startReviewStudy();
  }
}
function backFromResult(){
  if(state.resultCtx==='quiz'){
    showScreen('notebook-screen'); switchTab('quiz'); renderQuizHome();
  } else {
    backToFc();
  }
}

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────
document.addEventListener('keydown', e=>{
  const tag = (e.target.tagName||'').toLowerCase();
  if(tag==='input' || tag==='textarea' || tag==='select') return;

  if(document.getElementById('study-screen').classList.contains('active')){
    if(e.code==='Space'){ e.preventDefault(); flipStudyCard(); }
    else if(e.key==='1' && state.study.isFlipped) markCard(false);
    else if(e.key==='2' && state.study.isFlipped) markCard(true);
    else if(e.key==='ArrowLeft') prevCard();
    else if(e.key.toLowerCase()==='r') toggleReverse();
    return;
  }

  if(state.quiz.session && document.getElementById('tabcontent-quiz').classList.contains('active')){
    if(e.key==='Enter' && window._quizAnswered){ e.preventDefault(); nextQuestion(); return; }
    const map = {'a':0,'b':1,'c':2,'d':3,'e':4,'1':0,'2':1,'3':2,'4':3,'5':4};
    const idx = map[e.key.toLowerCase()];
    if(idx!==undefined && !window._quizAnswered){
      const q = state.quiz.session.questions[state.quiz.session.index];
      if(idx < q.o.length) selectAnswer(idx);
    }
  }
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape') cancelEdit(); });
