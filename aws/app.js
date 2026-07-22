// ═══════════════════════════════════════════════════════════
//  AWS Study Hub — app.js v6
//  単語帳：移植仕様（flip / reverse / shuffle / 苦手のみ /
//  その場除去 / タブ状態のID保存復元）+ Firestore同期
// ═══════════════════════════════════════════════════════════

// ─── STATE ────────────────────────────────────────────────
let state = {
  customCards: {},                 // {カテゴリ: [{id,term,def}]}
  fcStats: {},                     // { cardId: {ok, ng} }
  fcTabState: {},                  // { datasetKey: {activeCat, weakOnly, reverseMode, orderIds, pos} }
  quiz: {selectedCatId:null, session:null},
  quizStats: {answered:{}, wrong:[]},
  resultCtx: null,
};

const FC_CATS = Object.keys(SAMPLE);

// ─── 単語カード：データセット ──────────────────────────────
// カード: {id, cat, term, meaning}
function buildCards(){
  const cards = [];
  FC_CATS.forEach(cat=>{
    (SAMPLE[cat]||[]).forEach((c,i)=>{
      cards.push({id:`b::${cat}::${i}`, cat, term:c.term, meaning:c.def, builtin:true});
    });
    (state.customCards[cat]||[]).forEach(c=>{
      cards.push({id:`c::${c.id}`, cat, term:c.term, meaning:c.def, builtin:false, rawId:c.id});
    });
  });
  return cards;
}
const DATASETS = { aws: { label:'AWS 用語', get cards(){ return buildCards(); } } };

// ─── 単語カード：セッション状態（仕様書準拠） ─────────────
let datasetKey = 'aws';
let activeCat = '全カテゴリ';
let weakOnly = false;
let reverseMode = false;
let deck = [];
let order = [];
let pos = 0;
let flipped = false;

const stats = new Proxy({}, {   // stats[card.id] → state.fcStats へ透過
  get(_, k){ return state.fcStats[k]; },
  set(_, k, v){ state.fcStats[k] = v; return true; },
  has(_, k){ return k in state.fcStats; },
});

function currentCards(){ return DATASETS[datasetKey].cards; }
function isWeak(card){
  const s = stats[card.id];
  return s && s.ng > s.ok;
}
function weakCount(){
  return currentCards().filter(isWeak).length;
}

// ─── デッキ計算（仕様書準拠） ─────────────────────────────
function computeDeck(){
  let base = currentCards();
  if(!weakOnly && activeCat !== '全カテゴリ'){
    base = base.filter(c => c.cat === activeCat);
  }
  if(weakOnly){
    base = base.filter(isWeak);
  }
  return base;
}
function applyFilter(){
  deck = computeDeck();
  order = deck.map((_, i) => i);
  pos = 0; flipped = false;
  persistTabState();
  renderFc();
}

// ─── タブごとの続き再開（IDベース保存・仕様書準拠） ───────
function persistTabState(){
  state.fcTabState[datasetKey] = {
    activeCat,
    weakOnly,
    reverseMode,
    orderIds: order.map(i => deck[i] ? deck[i].id : null).filter(Boolean),
    pos
  };
  save();
}
function enterTab(key){
  datasetKey = key;
  const saved = state.fcTabState[key];
  activeCat   = saved ? saved.activeCat : '全カテゴリ';
  weakOnly    = saved ? !!saved.weakOnly : false;
  reverseMode = saved ? !!saved.reverseMode : false;
  deck = computeDeck();

  if(saved && saved.orderIds && saved.orderIds.length){
    const idToIndex = {};
    deck.forEach((c, i) => { idToIndex[c.id] = i; });
    let restored = saved.orderIds.map(id => idToIndex[id]).filter(i => i !== undefined);
    const already = new Set(restored);
    deck.forEach((c, i) => { if(!already.has(i)) restored.push(i); });  // 新規カードは末尾へ
    order = restored;
    pos = Math.min(saved.pos || 0, Math.max(order.length - 1, 0));
  } else {
    order = deck.map((_, i) => i);
    pos = 0;
  }
  flipped = false;
  renderFc();
}

// ─── シャッフル（Fisher-Yates・仕様書準拠） ───────────────
function shuffleOrder(){
  for(let i = order.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  pos = 0; flipped = false;
  persistTabState();
  renderFc();
  toast('シャッフルしました 🔀');
}

// ─── ナビゲーション ───────────────────────────────────────
function fcNext(){ if(deck.length === 0) return; pos = (pos + 1) % deck.length; flipped = false; persistTabState(); renderFc(); }
function fcPrev(){ if(deck.length === 0) return; pos = (pos - 1 + deck.length) % deck.length; flipped = false; persistTabState(); renderFc(); }
function fcFlip(){
  if(deck.length === 0) return;
  flipped = !flipped;
  const cardEl = document.getElementById('fc-card');
  if(cardEl) cardEl.classList.toggle('flipped', flipped);
  syncKnowButtons();
}
function syncKnowButtons(){
  const ok = document.getElementById('btn-know-ok');
  const ng = document.getElementById('btn-know-ng');
  if(ok) ok.disabled = !flipped;
  if(ng) ng.disabled = !flipped;
}

// ─── 苦手克服時：1枚だけその場で取り除く（仕様書準拠） ───
function removeCurrentCardFromDeck(){
  if(deck.length === 0) return;
  const oldDeck = deck;
  const removedId = oldDeck[order[pos]].id;

  const newDeck = oldDeck.filter(c => c.id !== removedId);
  const idToNewIndex = {};
  newDeck.forEach((c, i) => { idToNewIndex[c.id] = i; });

  const newOrder = order
    .filter((_, i) => i !== pos)
    .map(deckIdx => idToNewIndex[oldDeck[deckIdx].id]);

  deck = newDeck;
  order = newOrder;
  if(order.length === 0){ pos = 0; }
  else if(pos >= order.length){ pos = 0; }
  // それ以外は pos を変えない → 次のカードが繰り上がって同じ位置に来る
}

// ─── わかる / わからない（仕様書準拠） ────────────────────
function markKnow(didKnow){
  if(deck.length === 0 || !flipped) return;
  const card = deck[order[pos]];
  if(!stats[card.id]) stats[card.id] = { ok:0, ng:0 };
  if(didKnow) stats[card.id].ok++; else stats[card.id].ng++;

  const stillWeak = stats[card.id].ng > stats[card.id].ok;
  if(weakOnly && didKnow && !stillWeak){
    removeCurrentCardFromDeck();
    flipped = false;
    persistTabState();
    renderFc();
    toast('🎉 苦手を克服！リストから外れました');
  } else {
    fcNext();
  }
}

// ─── 出題方向トグル ───────────────────────────────────────
function toggleReverse(){
  reverseMode = !reverseMode;
  flipped = false;
  persistTabState();
  renderFc();
  toast(reverseMode ? '意味 → 用語 モード' : '用語 → 意味 モード');
}
function toggleWeakOnly(){
  weakOnly = !weakOnly;
  applyFilter();
}
function setCat(cat){
  activeCat = cat;
  weakOnly = false;
  applyFilter();
}

// ─── 単語帳レンダリング ───────────────────────────────────
function renderFc(){
  const el = document.getElementById('fc-container');
  if(!el) return;
  const wc = weakCount();
  const total = deck.length;
  const card = total ? deck[order[pos]] : null;
  const s = card ? (stats[card.id] || {ok:0, ng:0}) : null;

  const chips = ['全カテゴリ', ...FC_CATS].map(cat=>{
    const active = !weakOnly && activeCat === cat;
    return `<button class="tag-btn${active?' selected':''}" onclick="setCat('${escAttr(cat)}')">${escHtml(cat)}</button>`;
  }).join('');

  const front = card ? (reverseMode ? card.meaning : card.term) : '';
  const back  = card ? (reverseMode ? card.term : card.meaning) : '';
  const frontIsLong = reverseMode;

  el.innerHTML = `
  <div class="fc-player">
    <div class="fc-chips quick-tags">${chips}</div>

    <div class="fc-toolbar">
      <button class="btn-icon" onclick="shuffleOrder()" title="シャッフル">🔀 シャッフル</button>
      <button class="btn-icon${reverseMode?' rev-on':''}" onclick="toggleReverse()" title="出題方向を反転">🔃 ${reverseMode?'意味→用語':'用語→意味'}</button>
      <button class="btn-icon${weakOnly?' weak-on':''}" onclick="toggleWeakOnly()" title="苦手カードのみ表示">🔥 苦手のみ（${wc}）</button>
      <button class="btn-icon" onclick="openAddForm()" title="カードを追加">＋ 追加</button>
    </div>

    ${total === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">${weakOnly ? '🎉' : '📭'}</div>
        <div class="empty-title">${weakOnly ? '苦手カードはありません！' : 'カードがありません'}</div>
        <div class="empty-sub">${weakOnly ? '全ての苦手を克服しました。' : 'カテゴリを変えるかカードを追加してください。'}</div>
        ${weakOnly ? '<button class="btn btn-secondary" style="width:auto" onclick="toggleWeakOnly()">全カードに戻る</button>' : ''}
      </div>
    ` : `
      <div class="fc-meta">
        <span class="fc-counter">${pos+1} / ${total}</span>
        <span class="fc-cat-label">${escHtml(card.cat)}${card.builtin?'':' ・独自カード'}</span>
        <span class="fc-stats">
          <span style="color:var(--ok)">✓ ${s.ok}</span>
          <span style="color:var(--ng)">✗ ${s.ng}</span>
          ${isWeak(card)?'<span style="color:var(--ng);font-weight:700">🔥 苦手</span>':''}
        </span>
      </div>

      <div class="study-card-wrap">
        <div class="study-card${flipped?' flipped':''}" id="fc-card" onclick="fcFlip()" tabindex="0" role="button" aria-label="カードをめくる">
          <div class="study-face study-front">
            <div class="study-label">${reverseMode?'意味':'用語'}</div>
            <div class="study-term" style="${frontIsLong?'font-size:15px;line-height:1.7;':''}">${escHtml(front)}</div>
            <div class="study-tap-hint">タップ / Space でめくる</div>
          </div>
          <div class="study-face study-back">
            <div class="study-label">${reverseMode?'用語':'意味'}</div>
            <div class="study-definition" style="${frontIsLong?'font-size:24px;font-weight:700;font-family:var(--disp);':''}">${escHtml(back)}</div>
          </div>
        </div>
      </div>

      <div class="fc-controls">
        <button class="btn-prev" onclick="fcPrev()" aria-label="前のカード">←</button>
        <button class="btn-study btn-again" id="btn-know-ng" onclick="markKnow(false)" ${flipped?'':'disabled'}>わからない ✗</button>
        <button class="btn-study btn-know" id="btn-know-ok" onclick="markKnow(true)" ${flipped?'':'disabled'}>わかる ✓</button>
        <button class="btn-prev" onclick="fcNext()" aria-label="次のカード">→</button>
      </div>
      ${card.builtin ? '' : `
      <div style="text-align:center;margin-top:10px;">
        <button class="card-action-btn" onclick="editCustomCard('${escAttr(card.rawId)}','${escAttr(card.cat)}')">✏️ 編集</button>
        <button class="card-action-btn del" onclick="deleteCustomCard('${escAttr(card.rawId)}','${escAttr(card.cat)}')">🗑 削除</button>
      </div>`}
      <div class="kbd-hint"><kbd>Space</kbd> めくる ・ <kbd>1</kbd> わからない ・ <kbd>2</kbd> わかる ・ <kbd>←</kbd><kbd>→</kbd> 移動 ・ <kbd>R</kbd> 反転 ・ <kbd>S</kbd> シャッフル</div>
    `}

    <div class="add-card-form" id="add-card-form">
      <div class="form-row">
        <div class="form-group"><label>用語</label><input type="text" id="new-term" placeholder="例: Amazon S3"></div>
        <div class="form-group"><label>意味・説明</label><textarea id="new-def" placeholder="例: スケーラブルなオブジェクトストレージ..."></textarea></div>
      </div>
      <div class="form-group"><label>カテゴリ</label>
        <select id="new-cat">${FC_CATS.map(c=>`<option value="${escHtml(c)}"${(!weakOnly&&activeCat===c)?' selected':''}>${escHtml(c)}</option>`).join('')}</select>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="closeAddForm()">キャンセル</button>
        <button class="btn btn-primary" onclick="submitCard()" style="width:auto" id="add-card-btn">追加</button>
      </div>
    </div>
  </div>`;
}

// ─── カスタムカード ───────────────────────────────────────
let editingCard = null;   // {rawId, cat}
function openAddForm(){
  editingCard = null;
  const f = document.getElementById('add-card-form');
  f.classList.add('open');
  document.getElementById('add-card-btn').textContent = '追加';
  document.getElementById('new-term').focus();
}
function closeAddForm(){
  editingCard = null;
  const f = document.getElementById('add-card-form');
  if(f) f.classList.remove('open');
}
function submitCard(){
  const term = document.getElementById('new-term').value.trim();
  const def  = document.getElementById('new-def').value.trim();
  const cat  = document.getElementById('new-cat').value;
  if(!term||!def){ toast('用語と意味を入力してください','error'); return; }
  if(editingCard){
    const list = state.customCards[editingCard.cat]||[];
    const c = list.find(x=>String(x.id)===String(editingCard.rawId));
    if(c){
      if(cat !== editingCard.cat){
        // カテゴリ変更：移動
        state.customCards[editingCard.cat] = list.filter(x=>String(x.id)!==String(editingCard.rawId));
        if(!state.customCards[cat]) state.customCards[cat]=[];
        state.customCards[cat].push({id:c.id, term, def});
      }else{
        c.term = term; c.def = def;
      }
      toast('カードを更新しました ✓');
    }
    editingCard = null;
  }else{
    if(!state.customCards[cat]) state.customCards[cat]=[];
    state.customCards[cat].push({id:String(Date.now()), term, def});
    toast('カードを追加しました ✓');
  }
  save();
  deck = computeDeck();
  // 新規カードを末尾に追加した状態でorderを再構成（既存順は維持）
  enterTab(datasetKey);
}
function editCustomCard(rawId, cat){
  const c = (state.customCards[cat]||[]).find(x=>String(x.id)===String(rawId));
  if(!c) return;
  editingCard = {rawId, cat};
  const f = document.getElementById('add-card-form');
  f.classList.add('open');
  document.getElementById('new-term').value = c.term;
  document.getElementById('new-def').value = c.def;
  document.getElementById('new-cat').value = cat;
  document.getElementById('add-card-btn').textContent = '更新';
  document.getElementById('new-term').focus();
}
function deleteCustomCard(rawId, cat){
  if(!confirm('このカードを削除しますか？')) return;
  state.customCards[cat] = (state.customCards[cat]||[]).filter(x=>String(x.id)!==String(rawId));
  delete state.fcStats['c::'+rawId];
  save();
  enterTab(datasetKey);
  toast('削除しました');
}

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
let _saveTimer;
function save(){
  // 連打時の書き込みを軽くまとめる
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(()=>{ if(window._save) window._save(); }, 400);
}
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s){ return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;'); }

// ─── BOOT ─────────────────────────────────────────────────
function afterLoad(silent){
  document.getElementById('btn-home').style.display = 'block';
  document.getElementById('sync-indicator').style.display = 'flex';
  if(!silent){
    showScreen('notebook-screen');
    enterTab('aws');   // 保存された続きから再開
  } else {
    if(document.getElementById('notebook-screen').classList.contains('active')
       && document.getElementById('tabcontent-fc').classList.contains('active')){
      // バックグラウンド同期：進行中の並びを壊さないため件数系のみ更新
      renderFc();
    }
  }
  if(!state.quiz.session) renderQuizHome();
}
function goHome(){
  if(state.quiz.session && !confirm('クイズを中断してトップに戻りますか？')) return;
  state.quiz.session = null;
  showScreen('notebook-screen');
  switchTab('fc');
}

// ─── TABS ─────────────────────────────────────────────────
function switchTab(t){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.getElementById('tab-'+t).classList.add('active');
  document.getElementById('tabcontent-'+t).classList.add('active');
  if(t==='quiz' && !state.quiz.session) renderQuizHome();
  if(t==='fc') renderFc();
}

// ─── QUIZ STATS ───────────────────────────────────────────
function qid(q){ return QQ.indexOf(q); }
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
    const pos2 = window._multiSelected.indexOf(idx);
    if(pos2===-1){ window._multiSelected.push(idx); btn.classList.add('selected-multi'); }
    else{ window._multiSelected.splice(pos2,1); btn.classList.remove('selected-multi'); }
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
    showResultScreen(sess.correct, sess.correct+sess.wrong);
    state.quiz.session = null;
  } else renderQuizSession();
}

// ─── RESULT（クイズ用） ───────────────────────────────────
function showResultScreen(correct, total){
  const pct = total>0 ? Math.round(correct/total*100) : 0;
  document.getElementById('result-emoji').textContent = pct>=80?'🎉':pct>=60?'👍':'💪';
  document.getElementById('result-title').textContent = pct>=80?'素晴らしい！':pct>=60?'よく頑張りました！':'もう少し！';
  document.getElementById('result-sub').textContent = `${correct} / ${total} 問正解（${pct}%）`;
  document.getElementById('rb-correct').textContent = correct;
  document.getElementById('rb-wrong').textContent = total - correct;
  document.getElementById('result-pct').textContent = pct+'%';
  const hasWrong = state.lastQuizRun && state.lastQuizRun.wrongThisRun.length > 0;
  const btn = document.getElementById('review-wrong-btn');
  btn.style.display = hasWrong ? 'block' : 'none';
  btn.textContent = '間違えた問題だけ復習';
  const c = document.getElementById('result-circle');
  c.style.strokeDashoffset = 289;
  showScreen('result-screen');
  setTimeout(()=>{ c.style.strokeDashoffset = 289 - (289*pct/100); }, 120);
}
function restartResult(){
  const run = state.lastQuizRun;
  showScreen('notebook-screen'); switchTab('quiz');
  if(run){
    if(run.mode==='review') startWrongReview();
    else { renderQuizHome(); startQuiz(run.catId||'all', run.shuffle); }
  } else renderQuizHome();
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
  showScreen('notebook-screen'); switchTab('quiz'); renderQuizHome();
}

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────
document.addEventListener('keydown', e=>{
  const tag = (e.target.tagName||'').toLowerCase();
  if(tag==='input' || tag==='textarea' || tag==='select') return;
  if(!document.getElementById('notebook-screen').classList.contains('active')) return;

  const fcActive = document.getElementById('tabcontent-fc').classList.contains('active');
  const quizActive = document.getElementById('tabcontent-quiz').classList.contains('active');

  if(fcActive){
    if(e.code==='Space'){ e.preventDefault(); fcFlip(); }
    else if(e.key==='1' && flipped) markKnow(false);
    else if(e.key==='2' && flipped) markKnow(true);
    else if(e.key==='ArrowLeft') fcPrev();
    else if(e.key==='ArrowRight') fcNext();
    else if(e.key.toLowerCase()==='r') toggleReverse();
    else if(e.key.toLowerCase()==='s') shuffleOrder();
    return;
  }

  if(quizActive && state.quiz.session){
    if(e.key==='Enter' && window._quizAnswered){ e.preventDefault(); nextQuestion(); return; }
    const map = {'a':0,'b':1,'c':2,'d':3,'e':4,'1':0,'2':1,'3':2,'4':3,'5':4};
    const idx = map[e.key.toLowerCase()];
    if(idx!==undefined && !window._quizAnswered){
      const q = state.quiz.session.questions[state.quiz.session.index];
      if(idx < q.o.length) selectAnswer(idx);
    }
  }
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeAddForm(); });
