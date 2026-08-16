// ═══════════════════════════════════════════════════════════
//  AWS Study Deck — engine.js（資格非依存の共通エンジン）
//
//  このファイルは資格固有の情報を一切持たない。資格ごとの差分は
//  以下の2つから供給される。読み込み順は cert.js → data.js → engine.js。
//
//   ・window.CERT … cert.js。資格ID・表示名・保存先・機能トグル・
//                   弱点診断の処方箋・道場ラボ名
//   ・データ契約 … data.js。以下のグローバルを同名で定義すること
//                   SAMPLE / FC_CATS_DEF / QCAT / QQ / SCENARIO_Q /
//                   MULTI_Q / ORDER_Q / MATCH_Q / CHEATSHEETS
//
//  由来：CLF-C02版 app.js v6。詳細は ../CLAUDE.md 第II部を参照。
// ═══════════════════════════════════════════════════════════

// ─── 資格定義の正規化 ──────────────────────────────────────
// cert.js が無くても落ちないよう既定値で埋める。
const CERT = Object.assign({
  id:'unknown', name:'AWS Study Deck', doc:'notebook',
  prescriptions:{}, labNames:{}
}, window.CERT || {});

// 機能トグル。CLAUDE.md 第11節の機能マトリクスに対応する。
// 既定は「CLF-C02が持っていた機能を全部ON、新形式はOFF」。
CERT.features = Object.assign({
  flashcards:true, quiz:true, multi:true, scenario:true,
  weak:true, cheatsheet:true, mock:true, dojo:true,
  ordering:false, matching:false
}, (window.CERT || {}).features || {});

function hasFeature(k){ return CERT.features[k] === true; }

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
  scenario: {selectedCatId:null, session:null},
  scenarioStats: {answered:{}, wrong:[]},
  multi: {selectedCatId:null, session:null},
  multiStats: {answered:{}, wrong:[]},
  multiQEdits: {},                 // { 'MS001': {q,o,a,n} } — 組み込み複数選択問題の上書き
  hiddenMultiQ: [],                // ['MS001', ...] — 論理削除された組み込み複数選択問題
  customMultiQ: [],                // ユーザーが追加した複数選択問題
  ordering: {selectedCatId:null, session:null},   // 順序問題（CLAUDE.md 14-2節）
  orderingStats: {answered:{}, wrong:[]},
  matching: {selectedCatId:null, session:null},   // マッチング問題（CLAUDE.md 14-2節）
  matchingStats: {answered:{}, wrong:[]},
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

// ─── カテゴリ複数選択（CLAUDE.md 14-3節） ───────────────────
// fcProgress のキー設計。1件だけ選んだときは現行キーとまったく同じに
// なるため、既存の学習進捗がそのまま引き継がれる。
//   0件 → '_all_' ／ 1件 → そのカテゴリID ／ 2件以上 → 'm:' + ソート済みIDを'+'連結
// IDをソートしてから連結するので、選ぶ順番が違っても同じキーになる（進捗が分裂しない）。
// Firestoreの予約語（'__x__'形式）を避けるため、接頭辞は単一アンダースコアのまま。
const MULTI_PREFIX = 'm:';
const MAX_MULTI_PROGRESS = 10;   // 'm:'キーの保持上限。9カテゴリなら組み合わせは最大511通りある

function isMultiKey(key){ return typeof key === 'string' && key.startsWith(MULTI_PREFIX); }

// キー → カテゴリID配列。全カテゴリ・苦手のみは空配列を返す。
function catsFromKey(key){
  if(isMultiKey(key)) return key.slice(MULTI_PREFIX.length).split('+').filter(Boolean);
  if(key === CAT_ALL || key === CAT_WEAK) return [];
  return [key];
}
// カテゴリID配列 → キー。存在しないIDは捨てる（カテゴリ定義が変わっても壊れない）
function keyFromCats(cats){
  const uniq = [...new Set(cats)].filter(id => CAT_ID_TO_NAME[id]).sort();
  if(uniq.length === 0) return CAT_ALL;
  if(uniq.length === 1) return uniq[0];
  return MULTI_PREFIX + uniq.join('+');
}

// 保存されているキーが、現在の資格のカテゴリ定義と食い違っていないか確かめる。
// 資格をまたいで紛れ込んだキーや、カテゴリ定義を変えた後の古いキーを弾く。
// これが無いと、存在しないカテゴリを復元して「0枚」の画面になってしまう。
function sanitizeKey(key){
  if(key === CAT_ALL || key === CAT_WEAK) return key;
  const cats = catsFromKey(key).filter(id => CAT_ID_TO_NAME[id]);
  return cats.length ? keyFromCats(cats) : CAT_ALL;
}

// 現在の資格に存在しないカテゴリを含む進捗を捨てる（起動時に一度だけ）
function pruneUnknownProgress(){
  const prog = state.fcProgress || {};
  let changed = false;
  Object.keys(prog).forEach(k=>{
    if(k === CAT_ALL || k === CAT_WEAK) return;
    const cats = catsFromKey(k);
    if(!cats.length || !cats.every(id => CAT_ID_TO_NAME[id])){ delete prog[k]; changed = true; }
  });
  if(state.fcLastKey){
    const fixed = sanitizeKey(state.fcLastKey);
    if(fixed !== state.fcLastKey){ state.fcLastKey = fixed; changed = true; }
  }
  return changed;
}

// 'm:'キーが際限なく増えないよう、最終利用が古いものから削除する。
// 単一カテゴリ・_all_・_weak_ は削除対象にしない。
function pruneMultiProgress(){
  const prog = state.fcProgress || {};
  const keys = Object.keys(prog).filter(isMultiKey);
  if(keys.length <= MAX_MULTI_PROGRESS) return false;
  keys.sort((a,b) => (prog[b].usedAt||0) - (prog[a].usedAt||0));   // 新しい順に並べ
  keys.slice(MAX_MULTI_PROGRESS).forEach(k => { delete prog[k]; }); // 溢れた分を捨てる
  return true;
}

// ─── デッキ計算（キー単位：カテゴリ / 複数カテゴリ / 全カテゴリ / 苦手のみ） ─
function computeDeck(key){
  const all = currentCards();
  if(key === CAT_WEAK) return all.filter(isWeak);
  if(key === CAT_ALL)  return all;
  const cats = new Set(catsFromKey(key));
  return all.filter(c => cats.has(c.catId));
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

// ─── カテゴリ選択の操作（CLAUDE.md 14-3節） ──────────────────
// スマホではカテゴリチップが6段・233pxを占め、カードと「わかる／わからない」が
// 画面外へ押し出されてしまう。そこで狭い画面では折りたたみ、見出しをタップして
// 開く形にする（PCでは常に開いたまま。CSS側で出し分ける）。
let catPickerOpen = false;
function toggleCatPicker(){ catPickerOpen = !catPickerOpen; renderFc(); }

// チップを押したとき：そのカテゴリの選択を入れる／外す
function toggleCatSelection(catId){
  const cats = new Set(catsFromKey(currentKey));
  if(cats.has(catId)) cats.delete(catId); else cats.add(catId);
  selectView(keyFromCats([...cats]));
}
// 選択をすべて解除（＝全カテゴリに戻す）
function clearCatSelection(){ selectView(CAT_ALL); }

function enterKey(key){
  currentKey = key;
  const prog = getProgress(key);
  prog.usedAt = Date.now();            // LRU剪定の判定に使う
  if(isMultiKey(key)) pruneMultiProgress();
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
    toast(ico('shuffle')+' シャッフルしました');
  } else {
    const naturalOrder = deck.map((_, i) => i);
    order = naturalOrder.filter(i => !answeredSet.has(deck[i].id));
    prog.shuffled = false;
    if(order.length === 0){
      order = naturalOrder;
      toast(ico('repeat')+' 一周しました！最初から出題します');
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
    toast(ico('confetti')+' 苦手を克服！リストから外れました');
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

  // ─── カテゴリチップ（CLAUDE.md 14-3節：複数選択） ───────────
  // チップは常にチェックボックスとして振る舞う。タップするたびに、その
  // カテゴリを出題対象に入れる／外す。組み合わせは自由で個数の制限もない
  // （例：AIサービス群＋責任あるAI の2つだけを出題する）。
  //
  // モード切り替え式にしていた時期があるが、「複数選択」ボタンを先に押す
  // 必要があることに気づけず、機能していないように見えるため廃止した。
  const selectedCats = new Set(catsFromKey(currentKey));

  const chips = [{id:CAT_ALL, name:'全カテゴリ'}, ...FC_CATS_DEF].map(c=>{
    // 「全カテゴリ」は選択をすべて解除するボタンとして働く
    if(c.id === CAT_ALL){
      return `<button class="tag-btn${currentKey===CAT_ALL?' selected':''}" onclick="selectView('${escAttr(CAT_ALL)}')">${escHtml(c.name)}</button>`;
    }
    const active = selectedCats.has(c.id);
    return `<button class="tag-btn${active?' selected':''}" onclick="toggleCatSelection('${escAttr(c.id)}')">${active?'☑':'☐'} ${escHtml(c.name)}</button>`;
  }).join('');

  const multiBar = `
    <div class="fc-multi-bar${catPickerOpen?' open':''}">
      ${selectedCats.size === 0
        ? `<span class="fc-multi-count">カテゴリはいくつでも組み合わせられます</span>`
        : `<span class="fc-multi-count"><strong>${selectedCats.size}</strong> カテゴリ・<strong>${deck.length}</strong> 枚を出題中</span>
           <button class="btn-icon" onclick="clearCatSelection()">選択を解除</button>`}
    </div>`;

  // スマホ用の折りたたみ見出し。今なにを選んでいるかを畳んだ状態でも示す。
  const catSummaryText = selectedCats.size === 0
    ? `全カテゴリ（${deck.length}枚）`
    : `${[...selectedCats].map(id=>CAT_ID_TO_NAME[id]).join('・')}（${deck.length}枚）`;
  const catSummary = `
    <button class="fc-cat-summary" onclick="toggleCatPicker()" aria-expanded="${catPickerOpen}">
      <span>${ico('folder')} カテゴリ</span>
      <span class="fc-cat-current">${escHtml(catSummaryText)}</span>
      <span class="fc-cat-caret">${catPickerOpen?'▲':'▼'}</span>
    </button>`;

  const front = card ? (reverseMode ? card.meaning : card.term) : '';
  const back  = card ? (reverseMode ? card.term : card.meaning) : '';
  const frontIsLong = reverseMode;
  const isWeakView = currentKey === CAT_WEAK;
  // 追加フォームの既定カテゴリ。複数選択中は先頭のカテゴリを既定にする。
  const formCatDefault = selectedCats.size ? [...selectedCats].sort()[0] : FC_CATS_DEF[0].id;

  el.innerHTML = `
  <div class="fc-player">
    ${catSummary}
    <div class="fc-chips quick-tags${catPickerOpen?' open':''}">${chips}</div>
    ${multiBar}

    <div class="fc-toolbar">
      <button class="btn-icon${isWeakView?' weak-on':''}" onclick="toggleWeakView()" title="苦手カードのみ表示">${ico('flame')} 苦手のみ（${wc}）</button>
    </div>
    <hr class="fc-divider">

    ${total === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">${isWeakView ? ico('confetti') : ico('empty-box')}</div>
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
          ${isWeak(card)?'<span style="color:var(--ng);font-weight:700">'+ico('flame')+' 苦手</span>':''}
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
        <button class="card-action-btn" onclick="editCard(cardById('${escAttr(card.id)}'))">${ico('pencil')} 編集</button>
        <button class="card-action-btn del" onclick="deleteCard(cardById('${escAttr(card.id)}'))">${ico('trash')} 削除</button>
      </div>
    `}

    <hr class="fc-divider">
    <div class="fc-segment-bar">
      <button class="seg-btn${prog.shuffled?' seg-on':''}" onclick="toggleShuffle()" title="シャッフル">
        <span class="seg-icon">${ico('shuffle')}</span><span class="seg-label">シャッフル${prog.shuffled?'（ON）':''}</span>
      </button>
      <button class="seg-btn${reverseMode?' seg-on':''}" onclick="toggleReverse()" title="出題方向を反転">
        <span class="seg-icon">${ico('repeat')}</span><span class="seg-label">${reverseMode?'意味→用語':'用語→意味'}</span>
      </button>
      <button class="seg-btn" onclick="openAddForm()" title="カードを追加">
        <span class="seg-icon">＋</span><span class="seg-label">追加</span>
      </button>
    </div>
    <button class="hidden-cards-link" onclick="openHiddenCards()">${ico('archive')} 非表示にしたカード（${hiddenCount}）</button>
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
    toast(ico('archive')+' カードを非表示にしました（非表示から復活できます）');
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
  e.innerHTML=msg; e.className='toast show '+type;
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
  const cleaned  = pruneUnknownProgress(); // 他資格・旧定義のカテゴリキーを除去
  const pruned   = pruneMultiProgress();   // 複数選択キーのLRU剪定（CLAUDE.md 14-3節）
  if(migrated || cleaned || pruned) save();
  applyFeatureToggles();
  document.getElementById('btn-home').style.display = 'block';
  document.getElementById('sync-indicator').style.display = 'flex';
  if(!silent){
    showScreen('notebook-screen');
    // 保存された続き（最後に見ていたビュー）から再開。存在しないカテゴリなら全カテゴリへ。
    enterKey(sanitizeKey(state.fcLastKey || CAT_ALL));
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
// タブIDと機能トグルの対応。index.html は全資格共通のテンプレートで、
// 無効な機能のタブはここで間引く。
const TAB_FEATURE = {
  fc:'flashcards', quiz:'quiz', multi:'multi', scenario:'scenario',
  ordering:'ordering', matching:'matching', weak:'weak', cheatsheet:'cheatsheet'
};

// 起動時に一度だけ呼ぶ。無効な機能のタブ・導線を隠し、資格名を流し込む。
function applyFeatureToggles(){
  Object.entries(TAB_FEATURE).forEach(([tab, feat])=>{
    if(hasFeature(feat)) return;
    const btn  = document.getElementById('tab-'+tab);
    const pane = document.getElementById('tabcontent-'+tab);
    if(btn)  btn.style.display  = 'none';
    if(pane) pane.style.display = 'none';
  });
  // タブ以外の導線（模試リンク・道場リンクなど）は data-feature 属性で制御する
  document.querySelectorAll('[data-feature]').forEach(el=>{
    if(!hasFeature(el.dataset.feature)) el.style.display = 'none';
  });
  document.querySelectorAll('[data-cert-name]').forEach(el=>{ el.textContent = CERT.name; });
  if(CERT.name) document.title = CERT.name + ' Study Deck';
}

function switchTab(t){
  const feat = TAB_FEATURE[t];
  if(feat && !hasFeature(feat)) return;   // 無効な機能へは遷移させない
  const btn  = document.getElementById('tab-'+t);
  const pane = document.getElementById('tabcontent-'+t);
  if(!btn || !pane) return;               // その資格に存在しないタブなら何もしない
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  pane.classList.add('active');
  if(t==='quiz'     && !state.quiz.session)     renderQuizHome();
  if(t==='fc')                                  renderFc();
  if(t==='weak')                                renderWeak();
  if(t==='scenario' && !state.scenario.session) renderScenarioHome();
  if(t==='multi'    && !state.multi.session)    renderMultiHome();
  if(t==='ordering' && !state.ordering.session) renderOrderingHome();
  if(t==='matching' && !state.matching.session) renderMatchingHome();
  if(t==='cheatsheet')                          renderCheatsheet();
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

// ─── 弱点診断（段階3-6：ローカル集計のみ・AI不要） ──────────
function fcCatAccuracy(catId){
  let ok=0, ng=0;
  buildCards().filter(c=>c.catId===catId).forEach(c=>{
    const s = state.fcStats[c.id];
    if(s){ ok+=s.ok||0; ng+=s.ng||0; }
  });
  const total = ok+ng;
  return total ? {pct:Math.round(ok/total*100), total} : null;
}

// 弱点診断で使う資格固有のテキストは cert.js から供給する（CLAUDE.md 10-3節）。
// labNames は道場を持たない資格（AIF-C01など）では空オブジェクトでよい。
const DOJO_LAB_NAME = CERT.labNames || {};
const WEAK_PRESCRIPTIONS = CERT.prescriptions || {};

// 弱点診断の集計対象は2種類ある。
//  ① 単語帳のカテゴリ（FC_CATS_DEF）
//     過去問カテゴリIDは「'cat_' を除いたもの」という命名規約で対応付ける。
//     data.js の QCAT 側もこの規約に合わせること（例 cat_bedrock ⇔ bedrock）。
//  ② 過去問にしか存在しないカテゴリ
//     資格ごとに異なるため cert.js の quizOnlyCats に列挙する。
function weakDiagnosis(){
  const rows = [];
  FC_CATS_DEF.forEach(({id, name})=>{
    const quizId = id.replace('cat_','');
    const quizAcc = catAccuracy(quizId);
    const fcAcc = fcCatAccuracy(id);
    let pct = null, total = 0;
    if(quizAcc && fcAcc){
      total = quizAcc.total + fcAcc.total;
      pct = Math.round((quizAcc.pct*quizAcc.total + fcAcc.pct*fcAcc.total) / total);
    } else if(quizAcc){ pct = quizAcc.pct; total = quizAcc.total; }
    else if(fcAcc){ pct = fcAcc.pct; total = fcAcc.total; }
    rows.push({ id, name, pct, total });
  });
  (CERT.quizOnlyCats || []).forEach(qid=>{
    const info = QCAT.find(c=>c.id===qid);
    if(!info) return;                    // 定義されていないカテゴリは黙って飛ばす
    const acc = catAccuracy(qid);
    rows.push({ id:qid, name:info.name, pct:acc?acc.pct:null, total:acc?acc.total:0 });
  });
  return rows;
}

function renderWeak(){
  const el = document.getElementById('weak-container');
  if(!el) return;
  const rows = weakDiagnosis();
  const answered = rows.filter(r=>r.total > 0).sort((a,b)=>a.pct-b.pct);
  const unanswered = rows.filter(r=>r.total === 0);
  const weakest = answered.slice(0, 3);

  const rowHtml = (r)=>`
    <div class="category-card" style="cursor:default;">
      <div class="cat-head"><span class="cat-name">${escHtml(r.name)}</span>
        <span class="cat-count">${r.total>0 ? r.total+'回' : '未挑戦'}</span></div>
      ${r.total>0 ? `
        <div class="cat-acc-bar"><div class="cat-acc-fill" style="width:${r.pct}%;background:${accColor(r.pct)}"></div></div>
        <div class="cat-acc-text">正答率 ${r.pct}%</div>
      ` : `<div class="cat-acc-text">まだ記録がありません</div>`}
    </div>`;

  const prescriptionHtml = weakest.length ? weakest.map(r=>{
    const rx = WEAK_PRESCRIPTIONS[r.id];
    if(!rx) return '';
    // 道場を持たない資格（features.dojo=false）ではラボ導線を出さない
    const labHtml = (rx.lab && hasFeature('dojo'))
      ? `<br>${ico('belt')} おすすめ道場：<strong>${escHtml(DOJO_LAB_NAME[rx.lab]||rx.lab)}</strong>` : '';
    return `<div class="quiz-card" style="margin-bottom:12px;">
      <div class="quiz-cat-tag">${ico('target')} ${escHtml(r.name)}（正答率 ${r.pct}%）</div>
      <div style="font-size:13.5px;line-height:1.8;">${escHtml(rx.text)}${labHtml}</div>
    </div>`;
  }).join('') : `<div class="empty-sub">まだ十分な学習記録がありません。単語帳や過去問に取り組むとここに弱点が表示されます。</div>`;

  const os = overallStats();
  const timeHint = weakest.length
    ? `苦手カテゴリ（${weakest.map(r=>r.name).join('・')}）に学習時間の6割程度を配分し、残りは全体の復習に回すのがおすすめです。`
    : `まずは単語帳・過去問を一通り触って記録を作りましょう。記録が増えるほど診断が正確になります。`;

  el.innerHTML = `
    <div class="quiz-home">
      <div class="quiz-home-title">${ico('target')} 弱点診断</div>
      <div class="quiz-home-sub">単語帳と過去問の正答率をカテゴリ別に集計し、重点強化ポイントを提案します（模試の受験履歴があればそちらも加味されます）。</div>
      <div class="overall-stats">
        <div class="os-chip"><span class="os-num">${os.answered}</span><span class="os-lbl">過去問 累計解答数</span></div>
        <div class="os-chip"><span class="os-num" style="color:${accColor(os.pct)}">${os.pct}%</span><span class="os-lbl">過去問 全体正答率</span></div>
      </div>

      <div class="review-bar" style="background:linear-gradient(135deg,rgba(56,189,248,.08),rgba(255,153,0,.06));border-color:rgba(56,189,248,.35);">
        <div class="review-label">${ico('clock')} ${escHtml(timeHint)}</div>
      </div>

      <div style="font-family:var(--disp);font-size:14px;font-weight:700;margin:18px 0 10px;">重点強化カテゴリ</div>
      ${prescriptionHtml}

      <div style="font-family:var(--disp);font-size:14px;font-weight:700;margin:18px 0 10px;">カテゴリ別 正答率一覧</div>
      <div class="category-grid">${answered.map(rowHtml).join('')}${unanswered.map(rowHtml).join('')}</div>
    </div>`;
}

// ─── シナリオ問題（段階3-7）────────────────────────────────
// 過去問クイズエンジンとは独立させ、既存の過去問フロー（実データが乗っている）に
// 影響を与えないようにしている。カテゴリ体系はQCATを共用。
function scenarioCatAccuracy(catId){
  let r=0, w=0;
  SCENARIO_Q.forEach((q)=>{
    if(q.c!==catId) return;
    const a = state.scenarioStats.answered[q.id];
    if(a){ r+=a.r; w+=a.w; }
  });
  const total = r+w;
  return total ? {pct:Math.round(r/total*100), total} : null;
}
function scenarioOverallStats(){
  let r=0, w=0;
  Object.values(state.scenarioStats.answered).forEach(a=>{ r+=a.r; w+=a.w; });
  return {answered:r+w, pct:(r+w)?Math.round(r/(r+w)*100):0, wrongCount:state.scenarioStats.wrong.length};
}
function recordScenarioAnswer(q, isCorrect){
  const id = q.id;
  const st = state.scenarioStats;
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

function renderScenarioHome(){
  state.scenario.session = null;
  const el = document.getElementById('scenario-layout');
  if(!el) return;
  const selCat = state.scenario.selectedCatId;
  const os = scenarioOverallStats();

  const catCardsHtml = QCAT.map(cat=>{
    const n = SCENARIO_Q.filter(q=>q.c===cat.id).length;
    if(n===0) return '';
    const acc = scenarioCatAccuracy(cat.id);
    const accHtml = acc
      ? `<div class="cat-acc-bar"><div class="cat-acc-fill" style="width:${acc.pct}%;background:${accColor(acc.pct)}"></div></div>
         <div class="cat-acc-text">正答率 ${acc.pct}%（${acc.total}回）</div>`
      : `<div class="cat-acc-text">未挑戦</div>`;
    return `<div class="category-card${selCat===cat.id?' active-cat':''}" onclick="selectScenarioCat('${cat.id}')" role="button" tabindex="0">
      <div class="cat-head"><span class="cat-icon tone-${cat.tone||'orange'}">${ico(cat.icon)}</span><span class="cat-name">${cat.name}</span><span class="cat-count">${n}問</span></div>
      ${accHtml}
    </div>`;
  }).join('');

  const totalQ = SCENARIO_Q.length;
  const selName = selCat ? (QCAT.find(c=>c.id===selCat)||{}).name : '';
  const selCount = selCat ? SCENARIO_Q.filter(q=>q.c===selCat).length : totalQ;

  const statsHtml = os.answered > 0 ? `
    <div class="overall-stats">
      <div class="os-chip"><span class="os-num">${os.answered}</span><span class="os-lbl">累計解答数</span></div>
      <div class="os-chip"><span class="os-num" style="color:${accColor(os.pct)}">${os.pct}%</span><span class="os-lbl">全体正答率</span></div>
      <div class="os-chip"><span class="os-num" style="color:${os.wrongCount?'var(--ng)':'var(--ok)'}">${os.wrongCount}</span><span class="os-lbl">要復習の問題</span></div>
    </div>` : '';

  const reviewHtml = os.wrongCount > 0 ? `
    <div class="review-bar">
      <div class="review-label"><strong>${os.wrongCount} 問</strong>の間違えたシナリオ問題があります。正解するとリストから消えます。</div>
      <button class="btn btn-secondary" onclick="startScenarioWrongReview()">${ico('flame')} 苦手を復習する</button>
    </div>` : '';

  el.innerHTML = `
    <div class="quiz-home">
      <div class="quiz-home-title">${ico('puzzle')} シナリオ問題チャレンジ</div>
      <div class="quiz-home-sub">「〇〇したい場合、どのサービスを使うか」形式の実践的な問題です。カテゴリを選んで学習するか、全問ランダムで挑戦できます。全 ${totalQ} 問収録。</div>
      ${statsHtml}
      ${reviewHtml}
      <div class="quiz-start-bar">
        <div class="sel-cat-label">${selCat ? `<strong>${selName}</strong>（${selCount}問）を選択中` : `<strong>全カテゴリ</strong>（${totalQ}問）`}</div>
        <select class="qcount-select" id="s-count">
          <option value="10">10問</option>
          <option value="20">20問</option>
          <option value="all" selected>全問</option>
        </select>
        <button class="btn btn-secondary" onclick="startScenario('${selCat||'all'}',false)">${ico('book')} 順番に</button>
        <button class="btn btn-primary" onclick="startScenario('${selCat||'all'}',true)">${ico('shuffle')} ランダム</button>
      </div>
      <div class="category-grid">${catCardsHtml}</div>
    </div>`;
}
function selectScenarioCat(catId){
  state.scenario.selectedCatId = state.scenario.selectedCatId === catId ? null : catId;
  renderScenarioHome();
}
function startScenario(catId, shuffle){
  let qs = catId==='all' ? [...SCENARIO_Q] : SCENARIO_Q.filter(q=>q.c===catId);
  if(shuffle) qs = qs.sort(()=>Math.random()-.5);
  const countSel = document.getElementById('s-count');
  const limit = countSel && countSel.value !== 'all' ? parseInt(countSel.value,10) : qs.length;
  qs = qs.slice(0, limit);
  launchScenarioSession(qs, {catId, shuffle, mode:'normal'});
}
function startScenarioWrongReview(){
  const wrongSet = new Set(state.scenarioStats.wrong);
  let qs = SCENARIO_Q.filter(q=>wrongSet.has(q.id));
  if(!qs.length){ toast(ico('confetti')+' 復習する問題はありません'); return; }
  qs = qs.sort(()=>Math.random()-.5);
  launchScenarioSession(qs, {catId:'wrong', shuffle:true, mode:'review'});
}
function launchScenarioSession(qs, meta){
  state.scenario.session = {questions:qs, index:0, correct:0, wrong:0, wrongThisRun:[], ...meta};
  state.resultCtx = 'scenario';
  renderScenarioSession();
}
function quitScenario(){
  const sess = state.scenario.session;
  if(sess && sess.index > 0 && !confirm('シナリオ問題を終了しますか？（途中の成績も記録されています）')) return;
  renderScenarioHome();
}
function renderScenarioSession(){
  const sess = state.scenario.session;
  const el = document.getElementById('scenario-layout');
  const q = sess.questions[sess.index];
  const total = sess.questions.length;
  const pct = Math.round(sess.index/total*100);
  const catInfo = QCAT.find(c=>c.id===q.c) || {name:q.c, icon:'puzzle'};
  const letters = ['A','B','C','D','E'];
  const isMulti = Array.isArray(q.a);
  const modeTag = sess.mode==='review' ? ico('flame')+' 苦手復習 ／ ' : '';
  // 選択肢の表示順を毎回シャッフル（解答するまでは固定）。判定は常に元のインデックス基準。
  const displayOrder = shuffleIndices(q.o.length);

  el.innerHTML = `
    <div class="quiz-session">
      <div class="qsess-header">
        <div style="font-family:var(--disp);font-weight:700;font-size:15px;">${modeTag}${ico('puzzle')} ${catInfo.name}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="q-prog-bar"><div class="q-prog-fill" style="width:${pct}%"></div></div>
          <span style="font-size:12px;color:var(--dim);font-family:var(--disp);">${sess.index+1} / ${total}</span>
        </div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:12px;align-items:center;">
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ok)">${sess.correct}</span><div style="font-size:10.5px;color:var(--dim)">正解</div></div>
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ng)">${sess.wrong}</span><div style="font-size:10.5px;color:var(--dim)">不正解</div></div>
        <button class="btn btn-secondary" style="width:auto;margin-left:auto;font-size:12px;padding:7px 13px" onclick="quitScenario()">← 終了</button>
      </div>
      <div class="quiz-card">
        <div class="quiz-cat-tag">${ico('puzzle')} ${catInfo.name}${isMulti?' ／ 複数選択':''}</div>
        <div class="quiz-question">${escHtml(q.q)}</div>
        <div class="quiz-choices" id="scenario-choices">
          ${displayOrder.map((origIdx,pos)=>`
            <button class="quiz-choice" id="sc-${origIdx}" onclick="selectScenarioAnswer(${origIdx})">
              <div class="choice-letter">${letters[pos]}</div>
              <div>${escHtml(q.o[origIdx])}</div>
            </button>`).join('')}
        </div>
        ${isMulti ? `<div style="margin-top:13px;display:flex;justify-content:flex-end"><button class="btn btn-primary" id="scenario-multi-submit" style="width:auto;display:none" onclick="submitScenarioMulti()">回答する</button></div>` : ''}
        <div class="quiz-explain" id="scenario-explain"></div>
      </div>
      <div class="quiz-nav" id="scenario-nav" style="display:none;">
        <button class="btn btn-primary" style="width:auto" onclick="nextScenarioQuestion()" id="next-s-btn">次の問題 →</button>
      </div>
      <div class="kbd-hint"><kbd>A</kbd>〜<kbd>D</kbd> または <kbd>1</kbd>〜<kbd>4</kbd> で回答 ・ <kbd>Enter</kbd> で次へ</div>
    </div>`;
  if(isMulti) window._scenarioMultiSelected = [];
  window._scenarioAnswered = false;
}
function selectScenarioAnswer(idx){
  const sess = state.scenario.session;
  if(!sess || window._scenarioAnswered) return;
  const q = sess.questions[sess.index];
  const isMulti = Array.isArray(q.a);
  const btn = document.getElementById('sc-'+idx);
  if(!btn || btn.disabled) return;

  if(isMulti){
    const pos2 = window._scenarioMultiSelected.indexOf(idx);
    if(pos2===-1){ window._scenarioMultiSelected.push(idx); btn.classList.add('selected-multi'); }
    else{ window._scenarioMultiSelected.splice(pos2,1); btn.classList.remove('selected-multi'); }
    const submitBtn = document.getElementById('scenario-multi-submit');
    if(submitBtn) submitBtn.style.display = window._scenarioMultiSelected.length>0 ? 'block' : 'none';
    return;
  }

  window._scenarioAnswered = true;
  document.querySelectorAll('#scenario-choices .quiz-choice').forEach(b=>b.disabled=true);
  const correct = idx === q.a;
  btn.classList.add(correct?'correct':'wrong');
  if(!correct) document.getElementById('sc-'+q.a).classList.add('correct');
  if(correct) sess.correct++; else { sess.wrong++; sess.wrongThisRun.push(q.id); }
  recordScenarioAnswer(q, correct);
  showScenarioExplain(q.e);
}
function submitScenarioMulti(){
  const sess = state.scenario.session;
  if(!sess || window._scenarioAnswered) return;
  const q = sess.questions[sess.index];
  window._scenarioAnswered = true;
  const selected = window._scenarioMultiSelected.slice().sort((a,b)=>a-b);
  const correct = q.a.slice().sort((a,b)=>a-b);
  const isCorrect = JSON.stringify(selected) === JSON.stringify(correct);
  document.querySelectorAll('#scenario-choices .quiz-choice').forEach(b=>b.disabled=true);
  selected.forEach(i=>document.getElementById('sc-'+i).classList.add(isCorrect?'correct':'wrong'));
  correct.forEach(i=>document.getElementById('sc-'+i).classList.add('correct'));
  if(isCorrect) sess.correct++; else { sess.wrong++; sess.wrongThisRun.push(q.id); }
  recordScenarioAnswer(q, isCorrect);
  document.getElementById('scenario-multi-submit').style.display = 'none';
  showScenarioExplain(q.e);
}
function showScenarioExplain(text){
  const ex = document.getElementById('scenario-explain');
  ex.textContent = text;
  ex.classList.add('show');
  const nav = document.getElementById('scenario-nav');
  nav.style.display = 'flex';
  const btn = document.getElementById('next-s-btn');
  if(btn) btn.focus({preventScroll:true});
}
function nextScenarioQuestion(){
  const sess = state.scenario.session;
  sess.index++;
  if(sess.index >= sess.questions.length){
    state.lastScenarioRun = {catId:sess.catId, shuffle:sess.shuffle, mode:sess.mode, wrongThisRun:sess.wrongThisRun.slice()};
    showResultScreen(sess.correct, sess.correct+sess.wrong);
    state.scenario.session = null;
  } else renderScenarioSession();
}

// ─── 複数選択問題（段階3-7追加分） ──────────────────────────
// 択一式のQQ/SCENARIO_Qとは別の、チェックボックス複数選択専用エンジン。
// 組み込み問題(MULTI_Q)はcardEdits/hiddenCardsと同じ要領でmultiQEdits/hiddenMultiQを
// 重ねて編集・非表示にできる。customMultiQでユーザー独自の複数選択問題も追加できる。
// Fisher-Yates。[0..n-1]をシャッフルした配列を返す（選択肢の表示順シャッフル用）。
function shuffleIndices(n){
  const arr = Array.from({length:n}, (_,i)=>i);
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function buildMultiQuestions(){
  const out = [];
  MULTI_Q.forEach(q=>{
    if((state.hiddenMultiQ||[]).includes(q.id)) return;
    const ov = (state.multiQEdits||{})[q.id];
    out.push(ov ? Object.assign({}, q, ov, {builtin:true}) : Object.assign({}, q, {builtin:true}));
  });
  (state.customMultiQ||[]).forEach(q=>out.push(Object.assign({}, q, {builtin:false})));
  return out;
}
function multiCatAccuracy(catId){
  let r=0, w=0;
  buildMultiQuestions().forEach((q)=>{
    if(q.c!==catId) return;
    const a = state.multiStats.answered[q.id];
    if(a){ r+=a.r; w+=a.w; }
  });
  const total = r+w;
  return total ? {pct:Math.round(r/total*100), total} : null;
}
function multiOverallStats(){
  let r=0, w=0;
  Object.values(state.multiStats.answered).forEach(a=>{ r+=a.r; w+=a.w; });
  return {answered:r+w, pct:(r+w)?Math.round(r/(r+w)*100):0, wrongCount:state.multiStats.wrong.length};
}
function recordMultiAnswer(q, isCorrect){
  const id = q.id;
  const st = state.multiStats;
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

function renderMultiHome(){
  state.multi.session = null;
  const el = document.getElementById('multi-layout');
  if(!el) return;
  const all = buildMultiQuestions();
  const selCat = state.multi.selectedCatId;
  const os = multiOverallStats();
  const hiddenCount = (state.hiddenMultiQ||[]).length;

  const catCardsHtml = QCAT.map(cat=>{
    const n = all.filter(q=>q.c===cat.id).length;
    if(n===0) return '';
    const acc = multiCatAccuracy(cat.id);
    const accHtml = acc
      ? `<div class="cat-acc-bar"><div class="cat-acc-fill" style="width:${acc.pct}%;background:${accColor(acc.pct)}"></div></div>
         <div class="cat-acc-text">正答率 ${acc.pct}%（${acc.total}回）</div>`
      : `<div class="cat-acc-text">未挑戦</div>`;
    return `<div class="category-card${selCat===cat.id?' active-cat':''}" onclick="selectMultiCat('${cat.id}')" role="button" tabindex="0">
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
      <div class="review-label"><strong>${os.wrongCount} 問</strong>の間違えた複数選択問題があります。正解するとリストから消えます。</div>
      <button class="btn btn-secondary" onclick="startMultiWrongReview()">${ico('flame')} 苦手を復習する</button>
    </div>` : '';

  el.innerHTML = `
    <div class="quiz-home">
      <div class="quiz-home-title">${ico('ballot')} 複数選択問題チャレンジ</div>
      <div class="quiz-home-sub">本番試験にある「〇つ選択してください」形式の問題です。チェックボックスで複数選択して回答します。全 ${totalQ} 問収録。</div>
      ${statsHtml}
      ${reviewHtml}
      <div class="quiz-start-bar">
        <div class="sel-cat-label">${selCat ? `<strong>${selName}</strong>（${selCount}問）を選択中` : `<strong>全カテゴリ</strong>（${totalQ}問）`}</div>
        <select class="qcount-select" id="m-count">
          <option value="10">10問</option>
          <option value="20">20問</option>
          <option value="all" selected>全問</option>
        </select>
        <button class="btn btn-secondary" onclick="startMulti('${selCat||'all'}',false)">${ico('book')} 順番に</button>
        <button class="btn btn-primary" onclick="startMulti('${selCat||'all'}',true)">${ico('shuffle')} ランダム</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <button class="btn btn-secondary" style="width:auto" onclick="openMultiForm()">＋ 問題を追加</button>
        <button class="btn btn-secondary" style="width:auto" onclick="openHiddenMultiQ()">${ico('archive')} 非表示（${hiddenCount}）</button>
      </div>
      <div class="category-grid">${catCardsHtml}</div>
    </div>

    <div class="add-card-form" id="multi-form">
      <div class="form-group"><label>問題文</label><textarea id="mf-q" placeholder="例: 〜な場合、正しいものを選択してください。（2つ選択してください。）" style="min-height:60px;"></textarea></div>
      <div class="form-group"><label>カテゴリ</label>
        <select id="mf-cat">${QCAT.map(c=>`<option value="${c.id}">${escHtml(c.name)}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label>正解の数</label>
        <select id="mf-mode" onchange="document.getElementById('mf-n-row').style.display=this.value==='fixed'?'block':'none'">
          <option value="fixed">〇つ選択してください（数を指定）</option>
          <option value="all">すべて選択してください（数を明示しない）</option>
        </select>
      </div>
      <div class="form-group" id="mf-n-row"><label>正解の数</label><input type="text" id="mf-n" placeholder="例: 2"></div>
      <div class="form-group"><label>選択肢（正解にはチェック。空欄の行は無視されます。最大6つ）</label>
        ${[0,1,2,3,4,5].map(i=>`
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
            <input type="checkbox" id="mf-correct-${i}" style="width:auto;flex-shrink:0;">
            <input type="text" id="mf-opt-${i}" placeholder="選択肢${String.fromCharCode(65+i)}" style="flex:1;">
          </div>`).join('')}
      </div>
      <div class="form-group"><label>解説</label><textarea id="mf-e" placeholder="正解の理由の解説"></textarea></div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="closeMultiForm()">キャンセル</button>
        <button class="btn btn-primary" onclick="submitMultiForm()" style="width:auto" id="mf-submit-btn">追加</button>
      </div>
    </div>

    <div class="cs-card" id="hidden-multi-list" style="display:none;"></div>`;
}
function selectMultiCat(catId){
  state.multi.selectedCatId = state.multi.selectedCatId === catId ? null : catId;
  renderMultiHome();
}
function startMulti(catId, shuffle){
  let qs = buildMultiQuestions();
  qs = catId==='all' ? qs : qs.filter(q=>q.c===catId);
  if(shuffle) qs = qs.sort(()=>Math.random()-.5);
  const countSel = document.getElementById('m-count');
  const limit = countSel && countSel.value !== 'all' ? parseInt(countSel.value,10) : qs.length;
  qs = qs.slice(0, limit);
  if(!qs.length){ toast('問題がありません','error'); return; }
  launchMultiSession(qs, {catId, shuffle, mode:'normal'});
}
function startMultiWrongReview(){
  const wrongSet = new Set(state.multiStats.wrong);
  let qs = buildMultiQuestions().filter(q=>wrongSet.has(q.id));
  if(!qs.length){ toast(ico('confetti')+' 復習する問題はありません'); return; }
  qs = qs.sort(()=>Math.random()-.5);
  launchMultiSession(qs, {catId:'wrong', shuffle:true, mode:'review'});
}
function launchMultiSession(qs, meta){
  state.multi.session = {questions:qs, index:0, correct:0, wrong:0, wrongThisRun:[], ...meta};
  state.resultCtx = 'multi';
  renderMultiSession();
}
function quitMulti(){
  const sess = state.multi.session;
  if(sess && sess.index > 0 && !confirm('複数選択問題を終了しますか？（途中の成績も記録されています）')) return;
  renderMultiHome();
}
function renderMultiSession(){
  const sess = state.multi.session;
  const el = document.getElementById('multi-layout');
  const q = sess.questions[sess.index];
  const total = sess.questions.length;
  const pct = Math.round(sess.index/total*100);
  const catInfo = QCAT.find(c=>c.id===q.c) || {name:q.c, icon:'ballot'};
  const letters = ['A','B','C','D','E','F'];
  const modeTag = sess.mode==='review' ? ico('flame')+' 苦手復習 ／ ' : '';
  const countHint = q.n ? `（${q.n}つ選択してください）` : '（正しいものをすべて選択してください）';
  // 選択肢の表示順を毎回シャッフル（解答するまでは固定・renderMultiSessionは新しい設問に
  // 移るときだけ呼ばれるため、回答中に並びが変わることはない）。
  // 正誤判定・DOM要素IDは常に元のインデックス基準（q.o/q.aのインデックス）で行い、
  // 表示位置には依存しない。displayOrder[表示位置] = 元のインデックス。
  const displayOrder = shuffleIndices(q.o.length);

  el.innerHTML = `
    <div class="quiz-session">
      <div class="qsess-header">
        <div style="font-family:var(--disp);font-weight:700;font-size:15px;">${modeTag}${ico('ballot')} ${catInfo.name}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="q-prog-bar"><div class="q-prog-fill" style="width:${pct}%"></div></div>
          <span style="font-size:12px;color:var(--dim);font-family:var(--disp);">${sess.index+1} / ${total}</span>
        </div>
      </div>
      <div style="display:flex;gap:16px;margin-bottom:12px;align-items:center;">
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ok)">${sess.correct}</span><div style="font-size:10.5px;color:var(--dim)">正解</div></div>
        <div style="text-align:center"><span style="font-family:var(--disp);font-size:16px;font-weight:700;color:var(--ng)">${sess.wrong}</span><div style="font-size:10.5px;color:var(--dim)">不正解</div></div>
        <button class="btn btn-secondary" style="width:auto;margin-left:auto;font-size:12px;padding:7px 13px" onclick="quitMulti()">← 終了</button>
      </div>
      <div class="quiz-card">
        <div class="quiz-cat-tag">${ico('ballot')} ${catInfo.name} ／ 複数選択${countHint}${q.verify?' ／ <span style="color:var(--orange)">'+ico('warning')+' 要確認</span>':''}</div>
        <div class="quiz-question">${escHtml(q.q)}</div>
        <div class="quiz-choices" id="multi-choices">
          ${displayOrder.map((origIdx,pos)=>`
            <button class="quiz-choice" id="mc-${origIdx}" onclick="toggleMultiChoice(${origIdx})">
              <div class="choice-letter">${letters[pos]}</div>
              <div>${escHtml(q.o[origIdx])}</div>
            </button>`).join('')}
        </div>
        <div style="margin-top:13px;display:flex;justify-content:flex-end">
          <button class="btn btn-primary" id="multi-answer-submit" style="width:auto;" onclick="submitMultiAnswer()">回答する</button>
        </div>
        <div class="quiz-explain" id="multi-explain"></div>
        <div style="text-align:center;margin-top:10px;">
          <button class="card-action-btn" onclick="editMultiQuestion('${escAttr(q.id)}')">${ico('pencil')} 編集</button>
          <button class="card-action-btn del" onclick="deleteMultiQuestion('${escAttr(q.id)}')">${ico('trash')} 削除</button>
        </div>
      </div>
      <div class="quiz-nav" id="multi-nav" style="display:none;">
        <button class="btn btn-primary" style="width:auto" onclick="nextMultiQuestion()" id="next-m-btn">次の問題 →</button>
      </div>
    </div>`;
  window._multiSelected = [];
  window._multiAnswered = false;
}
function toggleMultiChoice(idx){
  if(window._multiAnswered) return;
  const btn = document.getElementById('mc-'+idx);
  if(!btn) return;
  const pos = window._multiSelected.indexOf(idx);
  if(pos===-1){ window._multiSelected.push(idx); btn.classList.add('selected-multi'); }
  else{ window._multiSelected.splice(pos,1); btn.classList.remove('selected-multi'); }
}
function submitMultiAnswer(){
  const sess = state.multi.session;
  if(!sess || window._multiAnswered) return;
  if(window._multiSelected.length === 0){ toast('少なくとも1つ選択してください','error'); return; }
  const q = sess.questions[sess.index];
  window._multiAnswered = true;
  const selected = window._multiSelected.slice().sort((a,b)=>a-b);
  const correct = q.a.slice().sort((a,b)=>a-b);
  const isCorrect = JSON.stringify(selected) === JSON.stringify(correct);
  document.querySelectorAll('#multi-choices .quiz-choice').forEach(b=>b.disabled=true);
  selected.forEach(i=>document.getElementById('mc-'+i).classList.add(isCorrect?'correct':(correct.includes(i)?'correct':'wrong')));
  correct.forEach(i=>document.getElementById('mc-'+i).classList.add('correct'));
  if(isCorrect) sess.correct++; else { sess.wrong++; sess.wrongThisRun.push(q.id); }
  recordMultiAnswer(q, isCorrect);
  document.getElementById('multi-answer-submit').style.display = 'none';
  const ex = document.getElementById('multi-explain');
  ex.textContent = q.e;
  ex.classList.add('show');
  const nav = document.getElementById('multi-nav');
  nav.style.display = 'flex';
  const btn = document.getElementById('next-m-btn');
  if(btn) btn.focus({preventScroll:true});
}
function nextMultiQuestion(){
  const sess = state.multi.session;
  sess.index++;
  if(sess.index >= sess.questions.length){
    state.lastMultiRun = {catId:sess.catId, shuffle:sess.shuffle, mode:sess.mode, wrongThisRun:sess.wrongThisRun.slice()};
    showResultScreen(sess.correct, sess.correct+sess.wrong);
    state.multi.session = null;
  } else renderMultiSession();
}

// ─── 複数選択問題：編集・追加・非表示 ───────────────────────
let editingMultiQ = null;   // null | {kind:'builtin', id} | {kind:'custom', id}
function openMultiForm(){
  editingMultiQ = null;
  const f = document.getElementById('multi-form');
  if(!f) return;
  f.classList.add('open');
  document.getElementById('mf-submit-btn').textContent = '追加';
  document.getElementById('mf-q').focus();
}
function closeMultiForm(){
  editingMultiQ = null;
  const f = document.getElementById('multi-form');
  if(f) f.classList.remove('open');
}
function submitMultiForm(){
  const qText = document.getElementById('mf-q').value.trim();
  const cat = document.getElementById('mf-cat').value;
  const mode = document.getElementById('mf-mode').value;
  const nVal = parseInt(document.getElementById('mf-n').value, 10);
  const eText = document.getElementById('mf-e').value.trim();
  const opts = [], correct = [];
  for(let i=0;i<6;i++){
    const t = document.getElementById('mf-opt-'+i).value.trim();
    if(!t) continue;
    const isCorrect = document.getElementById('mf-correct-'+i).checked;
    if(isCorrect) correct.push(opts.length);
    opts.push(t);
  }
  if(!qText || opts.length < 2){ toast('問題文と2つ以上の選択肢を入力してください','error'); return; }
  if(correct.length === 0){ toast('正解を少なくとも1つチェックしてください','error'); return; }
  const n = mode==='fixed' && nVal ? nVal : null;
  if(n && correct.length !== n){ toast(`正解の数（${n}）とチェックした数（${correct.length}）が一致しません`,'error'); return; }

  if(editingMultiQ && editingMultiQ.kind==='builtin'){
    if(!state.multiQEdits) state.multiQEdits = {};
    state.multiQEdits[editingMultiQ.id] = {q:qText, c:cat, n, o:opts, a:correct, e:eText};
    toast('問題を更新しました ✓');
  } else if(editingMultiQ && editingMultiQ.kind==='custom'){
    const item = (state.customMultiQ||[]).find(x=>x.id===editingMultiQ.id);
    if(item) Object.assign(item, {q:qText, c:cat, n, o:opts, a:correct, e:eText});
    toast('問題を更新しました ✓');
  } else {
    if(!state.customMultiQ) state.customMultiQ = [];
    state.customMultiQ.push({id:'cm::'+Date.now(), q:qText, c:cat, n, o:opts, a:correct, e:eText});
    toast('問題を追加しました ✓');
  }
  save();
  closeMultiForm();
  renderMultiHome();
}
function editMultiQuestion(id){
  const q = buildMultiQuestions().find(x=>x.id===id);
  if(!q) return;
  if(state.multi.session) renderMultiHome();   // セッション画面には編集フォームがないため、先にホーム画面へ戻す
  const f = document.getElementById('multi-form');
  if(f) f.classList.add('open');
  editingMultiQ = {kind:q.builtin?'builtin':'custom', id:q.id};
  document.getElementById('mf-q').value = q.q;
  document.getElementById('mf-cat').value = q.c;
  document.getElementById('mf-mode').value = q.n ? 'fixed' : 'all';
  document.getElementById('mf-n-row').style.display = q.n ? 'block' : 'none';
  document.getElementById('mf-n').value = q.n || '';
  q.o.forEach((t,i)=>{
    document.getElementById('mf-opt-'+i).value = t;
    document.getElementById('mf-correct-'+i).checked = q.a.includes(i);
  });
  for(let i=q.o.length;i<6;i++){
    document.getElementById('mf-opt-'+i).value = '';
    document.getElementById('mf-correct-'+i).checked = false;
  }
  document.getElementById('mf-submit-btn').textContent = '更新';
}
function deleteMultiQuestion(id){
  if(!confirm('この問題を削除しますか？')) return;
  const q = buildMultiQuestions().find(x=>x.id===id);
  if(!q) return;
  if(q.builtin){
    if(!state.hiddenMultiQ) state.hiddenMultiQ = [];
    if(!state.hiddenMultiQ.includes(id)) state.hiddenMultiQ.push(id);
    toast(ico('archive')+' 問題を非表示にしました（非表示から復活できます）');
  } else {
    state.customMultiQ = (state.customMultiQ||[]).filter(x=>x.id!==id);
    delete state.multiStats.answered[id];
    state.multiStats.wrong = state.multiStats.wrong.filter(x=>x!==id);
    toast('削除しました');
  }
  save();
  renderMultiHome();
}
function renderHiddenMultiQList(){
  const hidden = state.hiddenMultiQ || [];
  const items = hidden.map(id=>MULTI_Q.find(q=>q.id===id)).filter(Boolean);
  const box = document.getElementById('hidden-multi-list');
  if(!box) return;
  box.innerHTML = `<h3>${ico('archive')} 非表示にした複数選択問題</h3>` + (items.length ? items.map(q=>`
    <div style="display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:var(--rs);padding:10px 12px;margin-bottom:8px;">
      <div style="flex:1;font-size:13px;">${escHtml(q.q.slice(0,60))}${q.q.length>60?'…':''}</div>
      <button class="btn btn-secondary" style="width:auto;padding:6px 12px;font-size:12px;" onclick="restoreHiddenMultiQ('${escAttr(q.id)}')">復活</button>
    </div>`).join('') : '<div style="color:var(--dim);font-size:13px;">非表示の問題はありません</div>')
    + `<div class="form-actions" style="margin-top:10px;"><button class="btn btn-secondary" onclick="closeHiddenMultiQ()">閉じる</button></div>`;
}
function openHiddenMultiQ(){
  const box = document.getElementById('hidden-multi-list');
  if(!box) return;
  renderHiddenMultiQList();
  box.style.display = 'block';
}
function closeHiddenMultiQ(){
  const box = document.getElementById('hidden-multi-list');
  if(box) box.style.display = 'none';
}
function restoreHiddenMultiQ(id){
  state.hiddenMultiQ = (state.hiddenMultiQ||[]).filter(x=>x!==id);
  save();
  renderHiddenMultiQList();
}

// ─── チートシート（段階3-8） ───────────────────────────────
const VPC_DIAGRAM_HTML = `
  <div class="vpc-diagram">
    <div class="vpc-box vpc-vpc">
      <div class="vpc-label">${ico('globe')} VPC（例: 10.0.0.0/16）</div>
      <div class="vpc-box vpc-pub">
        <div class="vpc-label">パブリックサブネット（IGWへのルートあり）</div>
        <span class="vpc-item">${ico('globe')} IGW</span>
        <span class="vpc-item">${ico('arrow-right')} NAT Gateway</span>
        <span class="vpc-item">${ico('server')} 踏み台/ALB</span>
      </div>
      <div class="vpc-box vpc-priv">
        <div class="vpc-label">プライベートサブネット（IGWへのルートなし）</div>
        <span class="vpc-item">${ico('server')} EC2（アプリ）</span>
        <span class="vpc-item">${ico('database')} RDS</span>
        <span class="vpc-item">${ico('gear')} SG（ステートフル）</span>
      </div>
    </div>
    <div style="margin-top:8px;color:var(--dim);">
      外部→IGW→ALB（パブリック）／ プライベートのEC2はNAT Gateway経由でのみ外向き通信 ／ サブネット境界にはNACL（ステートレス）も併用
    </div>
  </div>`;

function renderCheatsheet(){
  const el = document.getElementById('cheatsheet-container');
  if(!el) return;
  const sheetsHtml = CHEATSHEETS.map(cs => `
    <div class="cs-card">
      <h3>${ico(cs.icon||'clipboard')} ${escHtml(cs.title)}</h3>
      <div class="cmp-table-wrap">
        <table class="cmp-table">
          <thead><tr>${cs.headers.map(h=>`<th>${escHtml(h)}</th>`).join('')}</tr></thead>
          <tbody>${cs.rows.map(r=>`<tr>${r.map(c=>`<td>${escHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`).join('');

  el.innerHTML = `
    <div class="quiz-home">
      <div class="quiz-home-title">${ico('clipboard')} サービス比較チートシート</div>
      <div class="quiz-home-sub">試験で混同しやすいサービス群を並べて比較できます。内容は固定（静的コンテンツ）です。</div>
      <div class="cs-card">
        <h3>${ico('blueprint')} VPC構成図（基本パターン）</h3>
        ${VPC_DIAGRAM_HTML}
      </div>
      ${sheetsHtml}
    </div>`;
}

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
      <div class="cat-head"><span class="cat-icon tone-${cat.tone||'orange'}">${ico(cat.icon)}</span><span class="cat-name">${cat.name}</span><span class="cat-count">${n}問</span></div>
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
      <button class="btn btn-secondary" onclick="startWrongReview()">${ico('flame')} 苦手を復習する</button>
    </div>` : '';

  el.innerHTML = `
    <div class="quiz-home">
      <div class="quiz-home-title">${ico('doc-check')} CLF-C02 過去問チャレンジ</div>
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
        <button class="btn btn-secondary" onclick="startQuiz('${selCat||'all'}',false)">${ico('book')} 順番に</button>
        <button class="btn btn-primary" onclick="startQuiz('${selCat||'all'}',true)">${ico('shuffle')} ランダム</button>
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
  if(!qs.length){ toast(ico('confetti')+' 復習する問題はありません'); return; }
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
  const catInfo = QCAT.find(c=>c.id===q.c) || {name:q.c, icon:'doc-check'};
  const letters = ['A','B','C','D','E'];
  const isMulti = Array.isArray(q.a);
  const modeTag = sess.mode==='review' ? ico('flame')+' 苦手復習 ／ ' : '';
  // 選択肢の表示順を毎回シャッフル（解答するまでは固定）。判定は常に元のインデックス基準。
  const displayOrder = shuffleIndices(q.o.length);

  el.innerHTML = `
    <div class="quiz-session">
      <div class="qsess-header">
        <div style="font-family:var(--disp);font-weight:700;font-size:15px;">${modeTag}${ico(catInfo.icon)} ${catInfo.name}</div>
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
        <div class="quiz-cat-tag">${ico(catInfo.icon)} ${catInfo.name}${isMulti?' ／ 複数選択':''}</div>
        <div class="quiz-question">${escHtml(q.q)}</div>
        <div class="quiz-choices" id="quiz-choices">
          ${displayOrder.map((origIdx,pos)=>`
            <button class="quiz-choice" id="qc-${origIdx}" onclick="selectAnswer(${origIdx})">
              <div class="choice-letter">${letters[pos]}</div>
              <div>${escHtml(q.o[origIdx])}</div>
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
// 結果画面は5つの出題形式（過去問・シナリオ・複数選択・順序・マッチング）から
// 共通で使われる。形式ごとの差分をこの表に集約し、分岐の重複をなくしている。
//
// ※CLF-C02版 app.js には、結果画面の「間違えた問題だけ復習」ボタンの表示判定が
//   常に state.lastQuizRun を見ており、シナリオ・複数選択の結果では別形式の履歴で
//   出し分けてしまうバグがあった。この表を使うことで解消している。
const RESULT_CTX = {
  quiz:     { tab:'quiz',     run:()=>state.lastQuizRun,     home:()=>renderQuizHome(),
              start:(c,s)=>startQuiz(c,s),     review:()=>startWrongReview(),
              pool:()=>QQ,                     launch:(qs,m)=>launchQuizSession(qs,m) },
  scenario: { tab:'scenario', run:()=>state.lastScenarioRun, home:()=>renderScenarioHome(),
              start:(c,s)=>startScenario(c,s), review:()=>startScenarioWrongReview(),
              pool:()=>SCENARIO_Q,             launch:(qs,m)=>launchScenarioSession(qs,m) },
  multi:    { tab:'multi',    run:()=>state.lastMultiRun,    home:()=>renderMultiHome(),
              start:(c,s)=>startMulti(c,s),    review:()=>startMultiWrongReview(),
              pool:()=>buildMultiQuestions(),  launch:(qs,m)=>launchMultiSession(qs,m) },
  ordering: { tab:'ordering', run:()=>state.lastOrderingRun, home:()=>renderOrderingHome(),
              start:(c,s)=>startOrdering(c,s), review:()=>startOrderingWrongReview(),
              pool:()=>orderingBank(),         launch:(qs,m)=>launchOrderingSession(qs,m) },
  matching: { tab:'matching', run:()=>state.lastMatchingRun, home:()=>renderMatchingHome(),
              start:(c,s)=>startMatching(c,s), review:()=>startMatchingWrongReview(),
              pool:()=>matchingBank(),         launch:(qs,m)=>launchMatchingSession(qs,m) },
};
function currentResultCtx(){ return RESULT_CTX[state.resultCtx] || RESULT_CTX.quiz; }

function showResultScreen(correct, total){
  const pct = total>0 ? Math.round(correct/total*100) : 0;
  { const re=document.getElementById('result-emoji'); re.className='result-emoji '+(pct>=80?'tone-ok':pct>=60?'tone-orange':'tone-ng'); re.innerHTML = pct>=80?ico('confetti'):pct>=60?ico('thumbs-up'):ico('dumbbell'); }
  document.getElementById('result-title').textContent = pct>=80?'素晴らしい！':pct>=60?'よく頑張りました！':'もう少し！';
  document.getElementById('result-sub').textContent = `${correct} / ${total} 問正解（${pct}%）`;
  document.getElementById('rb-correct').textContent = correct;
  document.getElementById('rb-wrong').textContent = total - correct;
  document.getElementById('result-pct').textContent = pct+'%';
  const run = currentResultCtx().run();
  const hasWrong = !!(run && run.wrongThisRun && run.wrongThisRun.length > 0);
  const btn = document.getElementById('review-wrong-btn');
  btn.style.display = hasWrong ? 'block' : 'none';
  btn.textContent = '間違えた問題だけ復習';
  const c = document.getElementById('result-circle');
  c.style.strokeDashoffset = 289;
  showScreen('result-screen');
  setTimeout(()=>{ c.style.strokeDashoffset = 289 - (289*pct/100); }, 120);
}
function restartResult(){
  const ctx = currentResultCtx();
  const run = ctx.run();
  showScreen('notebook-screen'); switchTab(ctx.tab);
  if(run){
    if(run.mode==='review') ctx.review();
    else { ctx.home(); ctx.start(run.catId||'all', run.shuffle); }
  } else ctx.home();
}
function reviewWrongFromResult(){
  const ctx = currentResultCtx();
  const run = ctx.run();
  if(!run || !run.wrongThisRun.length) return;
  showScreen('notebook-screen'); switchTab(ctx.tab);
  const set = new Set(run.wrongThisRun);
  const qs = ctx.pool().filter(q=>set.has(q.id)).sort(()=>Math.random()-.5);
  ctx.launch(qs, {catId:'wrong', shuffle:true, mode:'review'});
}
function backFromResult(){
  const ctx = currentResultCtx();
  showScreen('notebook-screen'); switchTab(ctx.tab); ctx.home();
}

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────
document.addEventListener('keydown', e=>{
  const tag = (e.target.tagName||'').toLowerCase();
  if(tag==='input' || tag==='textarea' || tag==='select') return;
  if(!document.getElementById('notebook-screen').classList.contains('active')) return;

  const fcActive = document.getElementById('tabcontent-fc').classList.contains('active');
  const quizActive = document.getElementById('tabcontent-quiz').classList.contains('active');
  const scenarioActive = document.getElementById('tabcontent-scenario').classList.contains('active');

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
    return;
  }

  if(scenarioActive && state.scenario.session){
    if(e.key==='Enter' && window._scenarioAnswered){ e.preventDefault(); nextScenarioQuestion(); return; }
    const map = {'a':0,'b':1,'c':2,'d':3,'e':4,'1':0,'2':1,'3':2,'4':3,'5':4};
    const idx = map[e.key.toLowerCase()];
    if(idx!==undefined && !window._scenarioAnswered){
      const q = state.scenario.session.questions[state.scenario.session.index];
      if(idx < q.o.length) selectScenarioAnswer(idx);
    }
  }
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeAddForm(); closeHiddenCards(); } });
