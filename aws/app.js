// ═══════════════════════════════════════════════════════════
//  AWS Study Hub — app.js v6
//  単語帳：移植仕様（flip / reverse / shuffle / 苦手のみ /
//  その場除去 / タブ状態のID保存復元）+ Firestore同期
// ═══════════════════════════════════════════════════════════

// ─── STATE ────────────────────────────────────────────────
let state = {
  customCards: {},                 // {カテゴリID: [{id,term,def}]}
  cardEdits: {},                   // { 'B0001': {term, def} } — 組み込みカードの上書き
  hiddenCards: [],                 // ['B0001', ...] — 論理削除された組み込みカード（復活可能）
  fcStats: {},                     // { cardId: {ok, ng} }
  fcTabState: {},                  // 旧形式（移行専用。以後はfcProgressを使う）
  fcProgress: {},                  // { '<catId|_all_|_weak_>': {orderIds,pos,shuffled,reverse,answeredIds} }
  fcLastKey: null,                 // 最後に見ていたビュー（起動時にそこへ復帰）
  quiz: {selectedCatId:null, session:null},
  quizStats: {answered:{}, wrong:[]},
  resultCtx: null,
};

const FC_CATS = Object.keys(SAMPLE);

// カテゴリ安定ID ⇔ 表示名（現在の名称）の対応。
// customCards・activeCatの永続化はIDで行い、日本語名が変わっても崩れないようにする。
const CAT_NAME_TO_ID = {}; const CAT_ID_TO_NAME = {};
FC_CATS_DEF.forEach(c=>{ CAT_NAME_TO_ID[c.name]=c.id; CAT_ID_TO_NAME[c.id]=c.name; });
// Firestoreは "__xxx__" 形式のフィールド名を予約済みとして拒否するため、
// 単一アンダースコアの _all_ / _weak_ を使う（fcProgressのキーとして保存されるため）。
const CAT_ALL  = '_all_';
const CAT_WEAK = '_weak_';

// ─── 単語カード：データセット ──────────────────────────────
// カード: {id, cat(表示名), catId(安定ID), term, meaning}
// 組み込みカードには cardEdits（上書き）・hiddenCards（論理削除）を適用する
function buildCards(){
  const cards = [];
  FC_CATS_DEF.forEach(({id:catId, name})=>{
    (SAMPLE[name]||[]).forEach((c)=>{
      if((state.hiddenCards||[]).includes(c.id)) return;
      const ov = (state.cardEdits||{})[c.id];
      cards.push({id:c.id, cat:name, catId, term:(ov&&ov.term)||c.term, meaning:(ov&&ov.def)||c.def, builtin:true});
    });
    (state.customCards[catId]||[]).forEach(c=>{
      cards.push({id:`c::${c.id}`, cat:name, catId, term:c.term, meaning:c.def, builtin:false, rawId:c.id});
    });
  });
  return cards;
}
function cardById(id){ return deck.find(c=>c.id===id) || buildCards().find(c=>c.id===id); }

// ─── 単語カード：セッション状態 ────────────────────────────
// currentKey: カテゴリID or CAT_ALL('全カテゴリ') or CAT_WEAK('苦手のみ')
let currentKey = CAT_ALL;
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

function currentCards(){ return buildCards(); }
function isWeak(card){
  const s = stats[card.id];
  return s && s.ng > s.ok;
}
function weakCount(){
  return currentCards().filter(isWeak).length;
}

// ─── デッキ計算（キー単位：カテゴリ or 全カテゴリ or 苦手のみ） ─
function computeDeck(key){
  const all = currentCards();
  if(key === CAT_WEAK) return all.filter(isWeak);
  if(key !== CAT_ALL)  return all.filter(c => c.catId === key);
  return all;
}

// ─── キーごとの進捗（カテゴリ別・確定仕様） ────────────────
function getProgress(key){
  if(!state.fcProgress) state.fcProgress = {};
  if(!state.fcProgress[key]){
    state.fcProgress[key] = { orderIds:[], pos:0, shuffled:false, reverse:false, answeredIds:[] };
  }
  return state.fcProgress[key];
}
function persistProgress(){
  const prog = getProgress(currentKey);
  prog.orderIds = order.map(i => deck[i] ? deck[i].id : null).filter(Boolean);
  prog.pos = pos;
  prog.reverse = reverseMode;
  state.fcLastKey = currentKey;
  save();
}
// 一枚「わかる/わからない」を押すたびに記録。デッキ全問に答えたら自動リセット（確定仕様）
function markAnswered(cardId){
  const prog = getProgress(currentKey);
  if(!prog.answeredIds.includes(cardId)) prog.answeredIds.push(cardId);
  if(deck.length > 0 && prog.answeredIds.length >= deck.length){
    prog.answeredIds = [];
  }
}

function selectView(key){
  if(key === currentKey) return;
  persistProgress();
  enterKey(key);
}
function toggleWeakView(){
  selectView(currentKey === CAT_WEAK ? CAT_ALL : CAT_WEAK);
}
function enterKey(key){
  currentKey = key;
  const prog = getProgress(key);
  deck = computeDeck(key);
  reverseMode = !!prog.reverse;

  const idToIndex = {};
  deck.forEach((c, i) => { idToIndex[c.id] = i; });
  let restored = (prog.orderIds||[]).map(id => idToIndex[id]).filter(i => i !== undefined);
  const already = new Set(restored);
  deck.forEach((c, i) => { if(!already.has(i)) restored.push(i); });  // 新規カードは末尾へ
  order = restored;
  pos = Math.min(prog.pos || 0, Math.max(order.length - 1, 0));
  flipped = false;
  renderFc();
}

// ─── シャッフルのトグル化（確定仕様） ──────────────────────
// OFF→ON: 未回答カードをシャッフルして先頭へ／ON→OFF: 未回答カードだけを本来の順で
function toggleShuffle(){
  if(deck.length === 0) return;
  const prog = getProgress(currentKey);
  const answeredSet = new Set(prog.answeredIds || []);

  if(!prog.shuffled){
    let unanswered = order.filter(i => !answeredSet.has(deck[i].id));
    let answered   = order.filter(i =>  answeredSet.has(deck[i].id));
    for(let i = unanswered.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [unanswered[i], unanswered[j]] = [unanswered[j], unanswered[i]];
    }
    order = unanswered.concat(answered);
    prog.shuffled = true;
    toast('シャッフルしました 🔀');
  } else {
    const naturalOrder = deck.map((_, i) => i);
    order = naturalOrder.filter(i => !answeredSet.has(deck[i].id));
    prog.shuffled = false;
    if(order.length === 0){
      order = naturalOrder;
      toast('一周しました！最初から出題します 🔁');
    } else {
      toast('順番どおり（未回答のみ）に切り替えました');
    }
  }
  pos = 0; flipped = false;
  persistProgress();
  renderFc();
}

// ─── ナビゲーション ───────────────────────────────────────
function fcNext(){ if(deck.length === 0) return; pos = (pos + 1) % deck.length; flipped = false; persistProgress(); renderFc(); }
function fcPrev(){ if(deck.length === 0) return; pos = (pos - 1 + deck.length) % deck.length; flipped = false; persistProgress(); renderFc(); }
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

// ─── わかる / わからない ───────────────────────────────────
function markKnow(didKnow){
  if(deck.length === 0 || !flipped) return;
  const card = deck[order[pos]];
  if(!stats[card.id]) stats[card.id] = { ok:0, ng:0 };
  if(didKnow) stats[card.id].ok++; else stats[card.id].ng++;

  markAnswered(card.id);

  const stillWeak = stats[card.id].ng > stats[card.id].ok;
  if(currentKey === CAT_WEAK && didKnow && !stillWeak){
    removeCurrentCardFromDeck();
    flipped = false;
    persistProgress();
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
  persistProgress();
  renderFc();
  toast(reverseMode ? '意味 → 用語 モード' : '用語 → 意味 モード');
}

// ─── 単語帳レンダリング ───────────────────────────────────
function renderFc(){
  const el = document.getElementById('fc-container');
  if(!el) return;
  const wc = weakCount();
  const hiddenCount = (state.hiddenCards||[]).length;
  const prog = getProgress(currentKey);
  const total = deck.length;
  const card = total ? deck[order[pos]] : null;
  const s = card ? (stats[card.id] || {ok:0, ng:0}) : null;

  const chips = [{id:CAT_ALL, name:'全カテゴリ'}, ...FC_CATS_DEF].map(c=>{
    const active = currentKey === c.id;
    return `<button class="tag-btn${active?' selected':''}" onclick="selectView('${escAttr(c.id)}')">${escHtml(c.name)}</button>`;
  }).join('');

  const front = card ? (reverseMode ? card.meaning : card.term) : '';
  const back  = card ? (reverseMode ? card.term : card.meaning) : '';
  const frontIsLong = reverseMode;
  const isWeakView = currentKey === CAT_WEAK;
  const formCatDefault = (currentKey !== CAT_ALL && currentKey !== CAT_WEAK) ? currentKey : FC_CATS_DEF[0].id;

  el.innerHTML = `
  <div class="fc-player">
    <div class="fc-chips quick-tags">${chips}</div>

    <div class="fc-toolbar">
      <button class="btn-icon${isWeakView?' weak-on':''}" onclick="toggleWeakView()" title="苦手カードのみ表示">🔥 苦手のみ（${wc}）</button>
    </div>
    <hr class="fc-divider">

    ${total === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">${isWeakView ? '🎉' : '📭'}</div>
        <div class="empty-title">${isWeakView ? '苦手カードはありません！' : 'カードがありません'}</div>
        <div class="empty-sub">${isWeakView ? '全ての苦手を克服しました。' : 'カテゴリを変えるかカードを追加してください。'}</div>
        ${isWeakView ? '<button class="btn btn-secondary" style="width:auto" onclick="toggleWeakView()">全カードに戻る</button>' : ''}
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
      <div style="text-align:center;margin-top:10px;">
        <button class="card-action-btn" onclick="editCard(cardById('${escAttr(card.id)}'))">✏️ 編集</button>
        <button class="card-action-btn del" onclick="deleteCard(cardById('${escAttr(card.id)}'))">🗑 削除</button>
      </div>
    `}

    <hr class="fc-divider">
    <div class="fc-segment-bar">
      <button class="seg-btn${prog.shuffled?' seg-on':''}" onclick="toggleShuffle()" title="シャッフル">
        <span class="seg-icon">🔀</span><span class="seg-label">シャッフル${prog.shuffled?'（ON）':''}</span>
      </button>
      <button class="seg-btn${reverseMode?' seg-on':''}" onclick="toggleReverse()" title="出題方向を反転">
        <span class="seg-icon">🔃</span><span class="seg-label">${reverseMode?'意味→用語':'用語→意味'}</span>
      </button>
      <button class="seg-btn" onclick="openAddForm()" title="カードを追加">
        <span class="seg-icon">＋</span><span class="seg-label">追加</span>
      </button>
    </div>
    <button class="hidden-cards-link" onclick="openHiddenCards()">🗂 非表示にしたカード（${hiddenCount}）</button>
    ${total > 0 ? `<div class="kbd-hint"><kbd>Space</kbd> めくる ・ <kbd>1</kbd> わからない ・ <kbd>2</kbd> わかる ・ <kbd>←</kbd><kbd>→</kbd> 移動 ・ <kbd>R</kbd> 反転 ・ <kbd>S</kbd> シャッフル</div>` : ''}

    <div class="add-card-form" id="add-card-form">
      <div class="form-row">
        <div class="form-group"><label>用語</label><input type="text" id="new-term" placeholder="例: Amazon S3"></div>
        <div class="form-group"><label>意味・説明</label><textarea id="new-def" placeholder="例: スケーラブルなオブジェクトストレージ..."></textarea></div>
      </div>
      <div class="form-group"><label>カテゴリ</label>
        <select id="new-cat">${FC_CATS_DEF.map(c=>`<option value="${escHtml(c.id)}"${formCatDefault===c.id?' selected':''}>${escHtml(c.name)}</option>`).join('')}</select>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="closeAddForm()">キャンセル</button>
        <button class="btn btn-primary" onclick="submitCard()" style="width:auto" id="add-card-btn">追加</button>
      </div>
    </div>
  </div>`;
}

// ─── カード編集・削除・追加 ─────────────────────────────────
// editingCard: null（新規） | {kind:'custom', rawId, cat} | {kind:'builtin', id}
let editingCard = null;
function openAddForm(){
  editingCard = null;
  const catSel = document.getElementById('new-cat');
  if(catSel) catSel.disabled = false;
  const f = document.getElementById('add-card-form');
  f.classList.add('open');
  document.getElementById('add-card-btn').textContent = '追加';
  document.getElementById('new-term').focus();
}
function closeAddForm(){
  editingCard = null;
  const catSel = document.getElementById('new-cat');
  if(catSel) catSel.disabled = false;
  const f = document.getElementById('add-card-form');
  if(f) f.classList.remove('open');
}
function submitCard(){
  const term = document.getElementById('new-term').value.trim();
  const def  = document.getElementById('new-def').value.trim();
  const cat  = document.getElementById('new-cat').value;
  if(!term||!def){ toast('用語と意味を入力してください','error'); return; }

  if(editingCard && editingCard.kind === 'builtin'){
    if(!state.cardEdits) state.cardEdits = {};
    state.cardEdits[editingCard.id] = {term, def};
    toast('カードを更新しました ✓');
    editingCard = null;
  } else if(editingCard && editingCard.kind === 'custom'){
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
  closeAddForm();
  // 新規カードを末尾に追加した状態でorderを再構成（既存順は維持）
  enterKey(currentKey);
}
function editCard(card){
  if(!card) return;
  const catSel = document.getElementById('new-cat');
  if(card.builtin){
    editingCard = {kind:'builtin', id:card.id};
    if(catSel){ catSel.value = card.catId; catSel.disabled = true; }
  }else{
    editingCard = {kind:'custom', rawId:card.rawId, cat:card.catId};
    if(catSel){ catSel.value = card.catId; catSel.disabled = false; }
  }
  const f = document.getElementById('add-card-form');
  f.classList.add('open');
  document.getElementById('new-term').value = card.term;
  document.getElementById('new-def').value = card.meaning;
  document.getElementById('add-card-btn').textContent = '更新';
  document.getElementById('new-term').focus();
}
function deleteCard(card){
  if(!card) return;
  if(!confirm('このカードを削除しますか？')) return;
  if(card.builtin){
    if(!state.hiddenCards) state.hiddenCards = [];
    if(!state.hiddenCards.includes(card.id)) state.hiddenCards.push(card.id);
    toast('カードを非表示にしました（🗂 非表示から復活できます）');
  }else{
    state.customCards[card.catId] = (state.customCards[card.catId]||[]).filter(x=>String(x.id)!==String(card.rawId));
    delete state.fcStats['c::'+card.rawId];
    toast('削除しました');
  }
  save();
  enterKey(currentKey);
}

// ─── 非表示にしたカード（組み込みカードの論理削除・復活） ───
function openHiddenCards(){
  const hidden = state.hiddenCards || [];
  const allBuiltin = FC_CATS_DEF.flatMap(({name})=>SAMPLE[name]||[]);
  const items = hidden.map(id=>allBuiltin.find(c=>c.id===id)).filter(Boolean);
  const listEl = document.getElementById('hidden-cards-list');
  listEl.innerHTML = items.length ? items.map(c=>{
    const ov = (state.cardEdits||{})[c.id];
    const term = (ov&&ov.term) || c.term;
    return `<div style="display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:var(--rs);padding:10px 12px;margin-bottom:8px;">
      <div style="flex:1;font-size:13px;font-weight:700;">${escHtml(term)}</div>
      <button class="btn btn-secondary" style="width:auto;padding:6px 12px;font-size:12px;" onclick="restoreHiddenCard('${escAttr(c.id)}')">復活</button>
    </div>`;
  }).join('') : '<div style="color:var(--dim);font-size:13px;text-align:center;padding:20px 0;">非表示のカードはありません</div>';
  document.getElementById('hidden-cards-modal').classList.add('open');
}
function closeHiddenCards(){
  const m = document.getElementById('hidden-cards-modal');
  if(m) m.classList.remove('open');
}
function restoreHiddenCard(id){
  state.hiddenCards = (state.hiddenCards||[]).filter(x=>x!==id);
  save();
  openHiddenCards();
  enterKey(currentKey);
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

// ─── 件数照合（移行前後で件数が変わっていないことを確認するための集計） ──
function countSnapshot(){
  return {
    builtinCards:  Object.values(SAMPLE).reduce((s,a)=>s+a.length,0),
    quizQuestions: QQ.length,
    customCards:   Object.values(state.customCards||{}).reduce((s,a)=>s+(Array.isArray(a)?a.length:0),0),
    fcStatsEntries: Object.keys(state.fcStats||{}).length,
    quizAnswered:  Object.keys((state.quizStats||{}).answered||{}).length,
    quizWrong:     ((state.quizStats||{}).wrong||[]).length,
  };
}

// ─── KEY MIGRATION (b::cat::index → B####, "0"-"66" → Q001-Q067,
//                    日本語カテゴリ名 → 安定カテゴリID) ──────
function migrateOldKeys(){
  const before = countSnapshot();

  // Build old flashcard key → new stable ID map
  const fcKeyMap = {};
  FC_CATS.forEach(cat=>{
    (SAMPLE[cat]||[]).forEach((c,i)=>{
      fcKeyMap[`b::${cat}::${i}`] = c.id;
    });
  });

  // Build old quiz key → new stable ID map
  const qqKeyMap = {};
  QQ.forEach((q,i)=>{ qqKeyMap[String(i)] = q.id; });

  let changed = false;

  // Migrate fcStats
  const newFcStats = {};
  Object.entries(state.fcStats).forEach(([k,v])=>{
    const mapped = fcKeyMap[k];
    if(mapped){ newFcStats[mapped]=v; changed=true; }
    else newFcStats[k]=v;
  });
  state.fcStats = newFcStats;

  // Migrate quizStats.answered
  const newAnswered = {};
  Object.entries(state.quizStats.answered||{}).forEach(([k,v])=>{
    const mapped = qqKeyMap[k];
    if(mapped){ newAnswered[mapped]=v; changed=true; }
    else newAnswered[k]=v;
  });
  state.quizStats.answered = newAnswered;

  // Migrate quizStats.wrong
  state.quizStats.wrong = (state.quizStats.wrong||[]).map(x=>{
    const mapped = qqKeyMap[String(x)];
    if(mapped){ changed=true; return mapped; }
    return x;
  });

  // Migrate fcTabState orderIds + activeCat（日本語名/「全カテゴリ」→ 安定ID）
  Object.keys(state.fcTabState||{}).forEach(key=>{
    const ts = state.fcTabState[key];
    if(ts && ts.orderIds){
      ts.orderIds = ts.orderIds.map(oldId=>{
        const mapped = fcKeyMap[oldId];
        if(mapped){ changed=true; return mapped; }
        return oldId;
      });
    }
    if(ts && ts.activeCat){
      if(ts.activeCat === '全カテゴリ'){ ts.activeCat = CAT_ALL; changed = true; }
      else if(CAT_NAME_TO_ID[ts.activeCat]){ ts.activeCat = CAT_NAME_TO_ID[ts.activeCat]; changed = true; }
    }
  });

  // Migrate customCards: 日本語カテゴリ名キー → 安定カテゴリID キー
  const newCustomCards = {};
  Object.entries(state.customCards||{}).forEach(([k,v])=>{
    const mapped = CAT_NAME_TO_ID[k];
    const key = mapped || k;
    if(mapped) changed = true;
    newCustomCards[key] = (newCustomCards[key]||[]).concat(v||[]);
  });
  state.customCards = newCustomCards;

  // Migrate fcTabState（旧・タブ単位の進捗）→ fcProgress（新・カテゴリ/苦手のみ単位の進捗）
  if(!state.fcProgress) state.fcProgress = {};
  const oldTab = (state.fcTabState||{}).aws;
  if(oldTab && Object.keys(state.fcProgress).length === 0){
    const key = oldTab.weakOnly ? CAT_WEAK : (oldTab.activeCat || CAT_ALL);
    state.fcProgress[key] = {
      orderIds: oldTab.orderIds || [],
      pos: oldTab.pos || 0,
      shuffled: false,
      reverse: !!oldTab.reverseMode,
      answeredIds: []
    };
    state.fcLastKey = key;
    changed = true;
  }

  if(changed){
    const after = countSnapshot();
    console.log('%cSafeStore 移行 件数照合', 'color:#38BDF8;font-weight:700', { before, after });
    Object.keys(after).forEach(k=>{
      if(before[k] !== after[k]){
        console.warn(`件数不一致: ${k} ${before[k]} → ${after[k]}`);
      }
    });
  }

  return changed;
}

// ─── BOOT ─────────────────────────────────────────────────
function afterLoad(silent){
  const migrated = migrateOldKeys();
  if(migrated) save();
  document.getElementById('btn-home').style.display = 'block';
  document.getElementById('sync-indicator').style.display = 'flex';
  if(!silent){
    showScreen('notebook-screen');
    enterKey(state.fcLastKey || CAT_ALL);   // 保存された続き（最後に見ていたビュー）から再開
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
function qid(q){ return q.id; }
function recordAnswer(q, isCorrect){
  const id = q.id;
  const st = state.quizStats;
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
function catAccuracy(catId){
  let r=0, w=0;
  QQ.forEach((q)=>{
    if(q.c!==catId) return;
    const a = state.quizStats.answered[q.id];
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
  const wrongSet = new Set(state.quizStats.wrong);
  let qs = QQ.filter(q=>wrongSet.has(q.id));
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
  const set = new Set(run.wrongThisRun);
  const qs = QQ.filter(q=>set.has(q.id)).sort(()=>Math.random()-.5);
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
    else if(e.key.toLowerCase()==='s') toggleShuffle();
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
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeAddForm(); closeHiddenCards(); } });
