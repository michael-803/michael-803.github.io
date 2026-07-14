// ─── STATE ────────────────────────────────────────────────
let state = {
  notebooks: [],            // [{id, name, exam, decks:[...]}]
  currentNbId: null,
  notebook: {name:'', exam:''},   // 現在開いているノートの表示用エイリアス
  decks: [],                      // 現在開いているノートの decks への参照
  currentDeckId: null,
  editingCardId: null,
  study: {queue:[], index:0, history:[], isFlipped:false},
  selectedIcon: '⚙️',
  quiz: {selectedCatId:null, session:null},
  quizStats: {answered:{}, wrong:[]},   // answered: {qid:{r,w}}, wrong: [qid,...]
  resultCtx: null,
};

// Each question gets a stable id = its index in QQ (data.js is static).
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
function escAttr(s){ return String(s).replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

// ─── SETUP ────────────────────────────────────────────────
function toggleTag(btn){ btn.classList.toggle('selected'); }

function currentNb(){
  return state.notebooks.find(n => String(n.id) === String(state.currentNbId));
}

function afterLoad(silent){
  document.getElementById('btn-home').style.display = 'block';
  document.getElementById('sync-indicator').style.display = 'flex';
  if(!state.notebooks.length){
    if(!silent){ showScreen('setup-screen'); renderNotebookList(); }
    return;
  }
  if(!currentNb()) state.currentNbId = state.notebooks[0].id;
  const nb = currentNb();
  state.notebook = {name: nb.name, exam: nb.exam};
  state.decks = nb.decks;
  document.getElementById('sidebar-notebook-name').textContent = nb.name;
  document.getElementById('sidebar-exam-target').textContent = nb.exam;
  renderSidebar();
  // Don't yank the user out of quiz/study mid-session on background sync
  if(!silent){
    showScreen('notebook-screen');
    if(state.decks.length > 0) selectDeck(state.decks[0].id);
  } else {
    if(document.getElementById('notebook-screen').classList.contains('active')){
      if(state.currentDeckId && getDeck()) renderCards();
    }
  }
  if(!state.quiz.session) renderQuizHome();
}

function renderNotebookList(){
  const slot = document.getElementById('existing-notes');
  if(!slot) return;
  if(!state.notebooks.length){ slot.innerHTML = ''; return; }
  slot.innerHTML = `
    <div class="note-list">
      <div class="note-list-title">保存済みのノート</div>
      ${state.notebooks.map(nb => `
        <div class="note-item">
          <button class="note-open" onclick="openNotebook('${escAttr(nb.id)}')">
            <div class="nm">📓 ${escHtml(nb.name)}</div>
            <div class="sub">${escHtml(nb.exam || '')}　デッキ ${nb.decks.length} 個・カード ${nb.decks.reduce((s,d)=>s+d.cards.length,0)} 枚</div>
          </button>
          <button class="note-del" onclick="deleteNotebook('${escAttr(nb.id)}')">削除</button>
        </div>`).join('')}
    </div>
    <div class="setup-divider">または新しく作成</div>`;
}

function openNotebook(id){
  state.currentNbId = String(id);
  save();
  afterLoad();
  toast(`「${currentNb().name}」を開きました`);
}

function deleteNotebook(id){
  const nb = state.notebooks.find(n => String(n.id) === String(id));
  if(!nb) return;
  const cards = nb.decks.reduce((s,d)=>s+d.cards.length,0);
  if(!confirm(`ノート「${nb.name}」を削除しますか？\n（デッキ ${nb.decks.length} 個・カード ${cards} 枚が完全に消えます）`)) return;
  state.notebooks = state.notebooks.filter(n => String(n.id) !== String(id));
  if(String(state.currentNbId) === String(id)){
    state.currentNbId = state.notebooks.length ? state.notebooks[0].id : null;
    state.decks = [];
    state.currentDeckId = null;
  }
  save();
  renderNotebookList();
  toast('ノートを削除しました');
}

function startWithoutNotebook(){
  if(state.notebooks.length){
    openNotebook(state.notebooks[0].id);
    switchTab('quiz');
    return;
  }
  let idc = Date.now();
  const nb = {id:String(idc++), name:'クイック学習', exam:'', decks:[{id:String(idc++), name:'未分類', icon:'📚', cards:[]}]};
  state.notebooks.push(nb);
  state.currentNbId = nb.id;
  save();
  afterLoad();
  switchTab('quiz');
  toast('過去問モードで開始しました');
}

function createNotebook(){
  const name = document.getElementById('notebook-name').value.trim();
  if(!name){ toast('ノート名を入力してください','error'); return; }
  const examEl = document.getElementById('exam-target');
  let idCounter = Date.now();
  const decks = [];
  const tags = [...document.querySelectorAll('#setup-screen .quick-tags .tag-btn.selected')].map(b=>b.textContent);
  tags.forEach(tag=>{
    decks.push({
      id: String(idCounter++),
      name: tag,
      icon: iconFor(tag),
      cards: (SAMPLE[tag]||[]).map(c=>({id:String(idCounter++), term:c.term, def:c.def}))
    });
  });
  if(!decks.length) decks.push({id:String(idCounter++), name:'未分類', icon:'📚', cards:[]});
  const nb = {id:String(idCounter++), name, exam: examEl.options[examEl.selectedIndex].text, decks};
  state.notebooks.push(nb);           // 既存ノートは消さずに追加
  state.currentNbId = nb.id;
  state.currentDeckId = null;
  afterLoad();
  save();
  toast('ノートを作成しました ☁️');
}

function iconFor(tag){
  const map = {'コンピューティング':'⚙️','ストレージ':'💾','ネットワーク':'🌐','データベース':'🗄️','セキュリティ':'🔐','サーバーレス':'⚡','AI / ML':'🤖','監視・管理':'📊','料金・サポート':'💰'};
  return map[tag] || '📚';
}

function goHome(){
  if(state.quiz.session && !confirm('クイズを中断してホームに戻りますか？')) return;
  state.quiz.session = null;
  showScreen('setup-screen');
  renderNotebookList();
}

// ─── TABS ─────────────────────────────────────────────────
function switchTab(t){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.getElementById('tab-'+t).classList.add('active');
  document.getElementById('tabcontent-'+t).classList.add('active');
  if(t==='quiz' && !state.quiz.session) renderQuizHome();
}

// ─── SIDEBAR / DECKS ──────────────────────────────────────
function renderSidebar(){
  document.getElementById('deck-list').innerHTML = state.decks.map(d=>`
    <button class="deck-item${d.id===state.currentDeckId?' active':''}" onclick="selectDeck('${escAttr(d.id)}')">
      <span>${d.icon}</span>
      <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(d.name)}</span>
      <span class="deck-count">${d.cards.length}</span>
    </button>`).join('');
}
function getDeck(id){ return state.decks.find(d=>String(d.id)===String(id||state.currentDeckId)); }
function selectDeck(id){
  state.currentDeckId = String(id);
  const deck = getDeck();
  if(!deck) return;
  document.getElementById('deck-title').textContent = `${deck.icon} ${deck.name}`;
  document.getElementById('deck-actions').style.display = 'flex';
  document.getElementById('study-btn').disabled = deck.cards.length===0;
  document.getElementById('search-box').style.display = deck.cards.length>5 ? 'block' : 'none';
  document.getElementById('card-search').value = '';
  cancelEdit();
  renderSidebar();
  renderCards();
}
function openNewDeckModal(){
  document.getElementById('new-deck-modal').classList.add('open');
  const inp = document.getElementById('new-deck-name');
  inp.value = '';
  setTimeout(()=>inp.focus(), 50);
}
function closeNewDeckModal(){ document.getElementById('new-deck-modal').classList.remove('open'); }
function selectIcon(btn, icon){
  document.querySelectorAll('#icon-picker .tag-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  state.selectedIcon = icon;
}
function createDeck(){
  const name = document.getElementById('new-deck-name').value.trim();
  if(!name){ toast('デッキ名を入力してください','error'); return; }
  const deck = {id:String(Date.now()), name, icon:state.selectedIcon, cards:[]};
  state.decks.push(deck);
  closeNewDeckModal();
  renderSidebar();
  selectDeck(deck.id);
  save();
  toast(`「${name}」を作成しました`);
}

// ─── FLASHCARDS (add / edit / delete / search) ────────────
function toggleAddForm(){
  const f = document.getElementById('add-card-form');
  const opening = !f.classList.contains('open');
  if(opening) cancelEdit();
  f.classList.toggle('open');
  if(f.classList.contains('open')) document.getElementById('new-term').focus();
}
function cancelEdit(){
  state.editingCardId = null;
  document.getElementById('add-card-btn').textContent = '追加';
  document.getElementById('new-term').value = '';
  document.getElementById('new-def').value = '';
  document.getElementById('add-card-form').classList.remove('open');
}
function addCard(){
  const term = document.getElementById('new-term').value.trim();
  const def = document.getElementById('new-def').value.trim();
  if(!term||!def){ toast('用語と説明を入力してください','error'); return; }
  const deck = getDeck();
  if(state.editingCardId){
    const card = deck.cards.find(c=>String(c.id)===String(state.editingCardId));
    if(card){ card.term = term; card.def = def; toast('カードを更新しました ✓'); }
    cancelEdit();
  } else {
    deck.cards.push({id:String(Date.now()), term, def});
    document.getElementById('new-term').value='';
    document.getElementById('new-def').value='';
    document.getElementById('new-term').focus();
    toast('カードを追加しました ✓');
  }
  renderCards();
  renderSidebar();
  document.getElementById('study-btn').disabled = deck.cards.length===0;
  save();
}
function editCard(cardId){
  const deck = getDeck();
  const card = deck.cards.find(c=>String(c.id)===String(cardId));
  if(!card) return;
  state.editingCardId = String(cardId);
  document.getElementById('new-term').value = card.term;
  document.getElementById('new-def').value = card.def;
  document.getElementById('add-card-btn').textContent = '更新';
  document.getElementById('add-card-form').classList.add('open');
  document.getElementById('new-term').focus();
  window.scrollTo({top:0, behavior:'smooth'});
}
function deleteCard(cardId){
  if(!confirm('このカードを削除しますか？')) return;
  const deck = getDeck();
  deck.cards = deck.cards.filter(c=>String(c.id)!==String(cardId));
  renderCards();
  renderSidebar();
  document.getElementById('study-btn').disabled = deck.cards.length===0;
  save();
  toast('削除しました');
}
function renderCards(){
  const deck = getDeck();
  const el = document.getElementById('cards-container');
  if(!deck || !deck.cards.length){
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">カードがありません</div><div class="empty-sub">「＋ カード追加」から作成してください</div></div>`;
    return;
  }
  const kw = (document.getElementById('card-search').value||'').trim().toLowerCase();
  const cards = kw ? deck.cards.filter(c=>c.term.toLowerCase().includes(kw)||c.def.toLowerCase().includes(kw)) : deck.cards;
  if(!cards.length){
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">一致するカードがありません</div><div class="empty-sub">別のキーワードで検索してください</div></div>`;
    return;
  }
  el.innerHTML = `<div class="cards-grid">${cards.map(c=>`
    <div class="flashcard" id="fc-${c.id}" onclick="flipCard('${escAttr(c.id)}')">
      <div class="flashcard-inner">
        <div class="card-front">
          <div class="card-label">用語</div>
          <div class="card-term">${escHtml(c.term)}</div>
          <div class="card-actions-row" onclick="event.stopPropagation()">
            <button class="card-action-btn" onclick="editCard('${escAttr(c.id)}')">編集</button>
            <button class="card-action-btn del" onclick="deleteCard('${escAttr(c.id)}')">削除</button>
          </div>
        </div>
        <div class="card-back">
          <div class="card-label">説明</div>
          <div class="card-definition">${escHtml(c.def)}</div>
          <div class="card-hint">タップで戻る</div>
        </div>
      </div>
    </div>`).join('')}</div>`;
}
function flipCard(id){ const el = document.getElementById('fc-'+id); if(el) el.classList.toggle('flipped'); }

// ─── STUDY (flashcard practice) ───────────────────────────
function startStudy(){
  const deck = getDeck();
  if(!deck || !deck.cards.length) return;
  state.study = {queue:[...deck.cards].sort(()=>Math.random()-.5), index:0, history:[], isFlipped:false};
  document.getElementById('study-deck-title').textContent = `${deck.icon} ${deck.name}`;
  document.getElementById('study-subtitle').textContent = `${deck.cards.length} 枚`;
  state.resultCtx = 'study';
  showScreen('study-screen');
  renderStudyCard();
}
function studyCounts(){
  const h = state.study.history;
  return { known: h.filter(x=>x).length, again: h.filter(x=>!x).length };
}
function renderStudyCard(){
  const s = state.study, c = s.queue[s.index], n = s.queue.length;
  const {known, again} = studyCounts();
  document.getElementById('study-term-text').textContent = c.term;
  document.getElementById('study-def-text').textContent = c.def;
  document.getElementById('study-card').classList.remove('flipped');
  document.getElementById('study-controls').style.display = 'none';
  s.isFlipped = false;
  document.getElementById('progress-fill').style.width = Math.round(s.index/n*100)+'%';
  document.getElementById('progress-text').textContent = `${s.index+1}/${n}`;
  document.getElementById('stat-know').textContent = known;
  document.getElementById('stat-again').textContent = again;
  document.getElementById('stat-remain').textContent = n - s.index;
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
    s.history.length = s.index; // roll back the judgement too
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

  const catCards = QCAT.map(cat=>{
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
      <div class="category-grid">${catCards}</div>
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

// ─── QUIZ SESSION ─────────────────────────────────────────
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
  document.getElementById('result-sub').textContent = ctx==='quiz' ? `${correct} / ${total} 問正解（${pct}%）` : `${correct} / ${total} 枚を正解（${pct}%）`;
  document.getElementById('rb-correct').textContent = correct;
  document.getElementById('rb-wrong').textContent = total - correct;
  document.getElementById('result-pct').textContent = pct+'%';
  const hasWrong = ctx==='quiz' && state.lastQuizRun && state.lastQuizRun.wrongThisRun.length > 0;
  document.getElementById('review-wrong-btn').style.display = hasWrong ? 'block' : 'none';
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
      else {
        renderQuizHome();
        startQuiz(run.catId||'all', run.shuffle);
      }
    } else renderQuizHome();
  } else startStudy();
}
function reviewWrongFromResult(){
  const run = state.lastQuizRun;
  if(!run || !run.wrongThisRun.length) return;
  showScreen('notebook-screen'); switchTab('quiz');
  const set = new Set(run.wrongThisRun.map(String));
  const qs = QQ.filter((q,i)=>set.has(String(i))).sort(()=>Math.random()-.5);
  launchQuizSession(qs, {catId:'wrong', shuffle:true, mode:'review'});
}
function backFromResult(){
  if(state.resultCtx==='quiz'){
    showScreen('notebook-screen'); switchTab('quiz'); renderQuizHome();
  } else {
    showScreen('notebook-screen'); switchTab('fc');
  }
}

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────
document.addEventListener('keydown', e=>{
  // ignore while typing in inputs
  const tag = (e.target.tagName||'').toLowerCase();
  if(tag==='input' || tag==='textarea' || tag==='select') return;

  // Study mode
  if(document.getElementById('study-screen').classList.contains('active')){
    if(e.code==='Space'){ e.preventDefault(); flipStudyCard(); }
    else if(e.key==='1' && state.study.isFlipped) markCard(false);
    else if(e.key==='2' && state.study.isFlipped) markCard(true);
    else if(e.key==='ArrowLeft') prevCard();
    return;
  }

  // Quiz mode
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

// Close modal on Escape / overlay click
document.addEventListener('keydown', e=>{
  if(e.key==='Escape') closeNewDeckModal();
});
document.getElementById('new-deck-modal').addEventListener('click', e=>{
  if(e.target.id==='new-deck-modal') closeNewDeckModal();
});
