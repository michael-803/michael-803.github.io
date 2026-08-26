/* ============================================================
   validate-content.js — 資格共通のコンテンツ検証ツール

   使い方:
     node _tools/validate-content.js itpass
     node _tools/validate-content.js fe
     node _tools/validate-content.js            ← 対象資格をまとめて検証

   ★CLF-C02 は合格済み（2026-08-16）のため検証対象から外している。
     作問ルールはITパスポート以降に取得する資格にだけ適用する
     （2026-08-17 さくらさん指示）。

   certs/_tools/作問ルール.md（さくらさん指示・8項目）に沿っているかを機械的に確認する。
   問題を追加・修正したら必ず実行すること。

   資格ごとの前提（分野の分け方・公式の出題比率）は下の CERT_PROFILE に持たせる。
   新しい資格を足すときはここに1件追加する。
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/* 資格ごとの検証プロファイル。
   fields   … 分野名 → その分野に属する問題カテゴリID
   official … 分野ごとの公式の出題比率（合計1になるようにする）
   skipFig  … 図の必須化を免除する場合 true（原則 false） */
const CERT_PROFILE = {
  itpass: {
    label: 'ITパスポート',
    fields: {
      'ストラテジ':   ['corp','strategy','syssta'],
      'マネジメント': ['dev','pm','sm'],
      'テクノロジ':   ['theory','comp','tech'],
    },
    official: {'ストラテジ':35/100, 'マネジメント':20/100, 'テクノロジ':45/100},
  },
  fe: {
    label: '基本情報技術者',
    /* IPAの分類に合わせている。開発技術（devtech）はテクノロジ系、
       サービスマネジメント・システム監査（sm）はマネジメント系。 */
    fields: {
      'テクノロジ':   ['theory','compute','system','software','ui','db','network','security','devtech'],
      'マネジメント': ['pm','sm'],
      'ストラテジ':   ['strategy'],
    },
    official: {'テクノロジ':41/60, 'マネジメント':7/60, 'ストラテジ':12/60},
  },
  ap: {
    label: '応用情報技術者',
    /* 基本情報と同じ3分野だが出題数の重心が違う（50/10/20）。
       カテゴリIDは certs/fe/data.js と共通にしてある。 */
    fields: {
      'テクノロジ':   ['theory','compute','system','software','ui','db','network','security','devtech'],
      'マネジメント': ['pm','sm'],
      'ストラテジ':   ['strategy'],
    },
    official: {'テクノロジ':50/80, 'マネジメント':10/80, 'ストラテジ':20/80},
  },
  'aws/saa': {
    label: 'SAA-C03',
    /* SAAは問題を公式の4ドメインで分類している（CLAUDE.md 第40節）。
       単語帳はサービス別なので、分野バランスの分母は QQ のドメインになる。 */
    fields: {
      'セキュア':   ['sec'],
      '弾力性':     ['res'],
      '高性能':     ['perf'],
      'コスト':     ['cost'],
    },
    official: {'セキュア':0.30, '弾力性':0.26, '高性能':0.24, 'コスト':0.20},
  },
  'aws/soa': {
    label: 'SOA-C03',
    /* 問題は公式の5ドメインで分類している（CLAUDE.md 第41節）。 */
    fields: {
      '監視':       ['mon'],
      '信頼性':     ['rel'],
      'デプロイ':   ['dep'],
      'セキュリティ': ['sec'],
      'ネットワーク': ['net'],
    },
    official: {'監視':0.22, '信頼性':0.22, 'デプロイ':0.22, 'セキュリティ':0.16, 'ネットワーク':0.18},
  },
  /* CLF-C02（aws/clf）は合格済みのため意図的に載せていない。
     AWS資格を今後追加するときは fields:null（3分野の枠組みが無いため
     分野バランス検証はスキップ）で1件足す。 */
};

// ─── データの読み込み ──────────────────────────────────────
function loadCert(rel){
  const dir = path.join(ROOT, rel);
  const win = {};
  const dataSrc = fs.readFileSync(path.join(dir,'data.js'),'utf8');
  new Function('window', dataSrc + `;window.__d={
    FC_CATS_DEF: typeof FC_CATS_DEF!=='undefined'?FC_CATS_DEF:[],
    SAMPLE: typeof SAMPLE!=='undefined'?SAMPLE:{},
    QCAT: typeof QCAT!=='undefined'?QCAT:[],
    QQ: typeof QQ!=='undefined'?QQ:[],
    SCENARIO_Q: typeof SCENARIO_Q!=='undefined'?SCENARIO_Q:[],
    PSEUDO_Q: typeof PSEUDO_Q!=='undefined'?PSEUDO_Q:[],
    MULTI_Q: typeof MULTI_Q!=='undefined'?MULTI_Q:[],
    CHEATSHEETS: typeof CHEATSHEETS!=='undefined'?CHEATSHEETS:[]};`)(win);
  new Function('window', fs.readFileSync(path.join(dir,'cert.js'),'utf8'))(win);
  return {d: win.__d, CERT: win.CERT};
}

// ─── 検証本体 ──────────────────────────────────────────────
function validate(rel){
  const profile = CERT_PROFILE[rel] || {label: rel, fields: null, official: null};
  const {d, CERT} = loadCert(rel);
  const {FC_CATS_DEF, SAMPLE, QCAT, QQ, SCENARIO_Q, PSEUDO_Q, MULTI_Q, CHEATSHEETS} = d;

  let ng = 0;
  const ok  = m => console.log('  OK   ' + m);
  const bad = m => { ng++; console.log('  NG   ' + m); };
  const head= m => console.log('\n■ ' + m);

  console.log('\n' + '='.repeat(60));
  console.log(`${profile.label}（${rel}）`);
  console.log('='.repeat(60));

  const banks = [['QQ',QQ],['SCENARIO_Q',SCENARIO_Q],['PSEUDO_Q',PSEUDO_Q],['MULTI_Q',MULTI_Q]]
    .filter(([,a])=>a.length);
  const all = banks.flatMap(([,a])=>a);

  // ── データ契約 ──
  head('データ契約');
  const cards = Object.values(SAMPLE).flat();
  const cardIds = cards.map(c=>c.id);
  const dupCard = cardIds.filter((v,i)=>cardIds.indexOf(v)!==i);
  dupCard.length ? bad('カードIDの重複: '+dupCard) : ok(`カード ${cards.length}枚・ID重複なし`);

  const nums = cardIds.map(i=>+i.slice(1)).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
  if(nums.length){
    const gaps=[]; for(let i=1;i<=nums[nums.length-1];i++) if(!nums.includes(i)) gaps.push(i);
    gaps.length ? bad('カードIDの欠番: '+gaps) : ok('カードIDの欠番なし');
  }

  const catNames = FC_CATS_DEF.map(c=>c.name), sampleKeys = Object.keys(SAMPLE);
  const miss = catNames.filter(n=>!sampleKeys.includes(n)).concat(sampleKeys.filter(n=>!catNames.includes(n)));
  miss.length ? bad('FC_CATS_DEF と SAMPLE のキー不一致: '+miss) : ok(`カテゴリ ${catNames.length}件・SAMPLEと一致`);

  /* QCAT（問題側のカテゴリ）のIDは、単語帳カテゴリ（cat_ を除いたID）か
     quizOnlyCats のどちらかに載っている必要がある。
     ★完全一致は求めない。SAA-C03のように「問題は公式の4ドメイン／
       単語帳はサービス別」という持ち方をする資格があるため（CLAUDE.md 第40節）。
       単語帳にしか無いカテゴリは、弱点診断でカードの記録だけが集計される。 */
  const fcIds = FC_CATS_DEF.map(c=>c.id.replace(/^cat_/,''));
  const known = new Set([...fcIds, ...(CERT.quizOnlyCats||[])]);
  const qIds = QCAT.map(c=>c.id);
  const unknownCats = qIds.filter(id=>!known.has(id));
  const missingCats = (CERT.quizOnlyCats||[]).filter(id=>!qIds.includes(id));
  (unknownCats.length || missingCats.length)
    ? bad('QCAT のID不整合'
        + (unknownCats.length ? '\n       FC_CATS_DEF にも quizOnlyCats にも無いID: '+unknownCats : '')
        + (missingCats.length ? '\n       quizOnlyCats にあるが QCAT に無いID: '+missingCats : ''))
    : ok('QCAT のIDが FC_CATS_DEF ＋ quizOnlyCats の範囲に収まっている');

  const pKeys = Object.keys(CERT.prescriptions||{}).sort();
  const needKeys = [...FC_CATS_DEF.map(c=>c.id), ...(CERT.quizOnlyCats||[])].sort();
  JSON.stringify(pKeys)===JSON.stringify(needKeys)
    ? ok('処方箋が全カテゴリを網羅')
    : bad('処方箋の過不足: 不足='+needKeys.filter(k=>!pKeys.includes(k))+' 余分='+pKeys.filter(k=>!needKeys.includes(k)));

  const qcatIds = new Set(QCAT.map(c=>c.id));
  banks.forEach(([label,arr])=>{
    const ids = arr.map(q=>q.id);
    const dup = ids.filter((v,i)=>ids.indexOf(v)!==i);
    const badCat = arr.filter(q=>!qcatIds.has(q.c)).map(q=>q.id);
    const isMulti = label==='MULTI_Q';
    const badAns = arr.filter(q=>isMulti
      ? !(Array.isArray(q.a) && q.a.every(i=>i>=0 && i<q.o.length))
      : !(Number.isInteger(q.a) && q.a>=0 && q.a<q.o.length)).map(q=>q.id);
    const noExp = arr.filter(q=>!q.e || q.e.length<20).map(q=>q.id);
    const probs=[];
    if(dup.length) probs.push('ID重複='+dup);
    if(badCat.length) probs.push('不明カテゴリ='+badCat);
    if(badAns.length) probs.push('正解index異常='+badAns);
    if(noExp.length) probs.push('解説が短い/無い='+noExp);
    probs.length ? bad(`${label}: `+probs.join(' / ')) : ok(`${label}: ${arr.length}問・異常なし`);
  });

  // ── ルール1：図つき20%以上 ──
  head('ルール1：視覚要素（図つき問題が20%以上）');
  const withFig = all.filter(q=>q.fig).length;
  const figPct = Math.round(withFig/all.length*1000)/10;
  figPct >= 20
    ? ok(`図つき ${withFig}/${all.length}問 = ${figPct}%（基準20%以上）`)
    : bad(`図つき ${withFig}/${all.length}問 = ${figPct}% — 20%に届いていない。あと約${Math.ceil((0.2*all.length-withFig)/0.8)}問に図が必要`);

  // ── ルール2：計算問題の数値重複 ──
  head('ルール2：計算問題の数値バリエーション');
  const numsOf = s => (s.match(/\d[\d,\.]*/g)||[]).join('|');
  const calcQ = all.filter(q=>/いくつ|何[問日回個%]|求め|計算|なりますか/.test(q.q) && /\d/.test(q.q));
  const seen = new Map(); let dupCalc = 0;
  calcQ.forEach(q=>{
    const key = q.c + '::' + numsOf(q.q);
    if(!numsOf(q.q)) return;
    if(seen.has(key)){ bad(`${q.id} と ${seen.get(key)} が同一カテゴリ・同一数値パターン`); dupCalc++; }
    else seen.set(key, q.id);
  });
  if(!dupCalc) ok(`計算問題 ${calcQ.length}問・数値パターンの重複なし`);

  // ── ルール3：擬似言語の書式 ──
  if(PSEUDO_Q.length){
    head('ルール3：擬似言語の書式（IPA公式準拠）');
    const banned = [
      [/[<>!]=/, '半角の比較演算子（<= >= !=）。全角の ≦ ≧ ≠ を使うこと'],
      [/==/,     '== 。等価比較は全角の ＝ を使うこと'],
      [/&&|\|\|/,'&& や || 。and / or を使うこと'],
      [/\+\+|--/,'++ や -- 。擬似言語には存在しない'],
    ];
    let pb = 0;
    PSEUDO_Q.forEach(q=>{
      banned.forEach(([re,msg])=>{ if(re.test(q.code)){ bad(`${q.id}: ${msg}`); pb++; } });
      if(/\[\[[a-z]\]\]/.test(q.code) && !/\[ ?[a-z] ?\]/.test(q.q)){
        bad(`${q.id}: コードに空欄があるが設問文が空欄に言及していない`); pb++; }
      if(/配列|\[i\]|\[1\]/.test(q.code) && !(q.note||'').includes('要素番号は 1 から始まる')){
        bad(`${q.id}: 配列を扱っているが「配列の要素番号は 1 から始まる」の注記がない`); pb++; }
    });
    if(!pb) ok(`PSEUDO_Q ${PSEUDO_Q.length}問すべて書式チェックを通過`);
  }

  // ── ルール4：難易度分布 ──
  head('ルール4：難易度分布（目安 易3 : 中5 : 難2）');
  const noD = all.filter(q=>!q.d).map(q=>q.id);
  if(noD.length) bad(`難易度 d が未設定: ${noD.length}問（${noD.slice(0,8).join(',')}${noD.length>8?'…':''}）`);
  const tagged = all.filter(q=>q.d);
  if(tagged.length){
    const dist = [1,2,3].map(x=>tagged.filter(q=>q.d===x).length);
    const pctD = dist.map(n=>Math.round(n/tagged.length*100));
    console.log(`       易${dist[0]}(${pctD[0]}%) 中${dist[1]}(${pctD[1]}%) 難${dist[2]}(${pctD[2]}%)`);
    const within=(v,t,tol)=>Math.abs(v-t)<=tol;
    (within(pctD[0],30,12)&&within(pctD[1],50,12)&&within(pctD[2],20,12))
      ? ok('分布は許容範囲内（各±12ポイント）')
      : bad('分布が目安から外れている。易30% 中50% 難20% に近づけること');
  }

  // ── ルール5：分野バランス ──
  if(profile.fields){
    head('ルール5：出題分野のバランス');
    Object.entries(profile.fields).forEach(([field,ids])=>{
      const n = QQ.filter(q=>ids.includes(q.c)).length;
      const pct = n/QQ.length, target = profile.official[field];
      const line = `${field}系: ${n}問 (${Math.round(pct*100)}%) — 公式 ${Math.round(target*100)}%`;
      Math.abs(pct-target) <= 0.15 ? ok(line) : bad(line + ' — 乖離が大きい');
    });
    const netSec = ['security','network','tech'].filter(c=>qcatIds.has(c));
    const n2 = QQ.filter(q=>netSec.includes(q.c)).length;
    const p2 = Math.round(n2/QQ.length*100);
    p2 <= 40 ? ok(`ネットワーク＋セキュリティ系 ${n2}問 (${p2}%) — 偏りなし`)
             : bad(`ネットワーク＋セキュリティ系 ${n2}問 (${p2}%) — 偏りすぎ`);
  }
  const emptyCats = QCAT.filter(c=>!all.some(q=>q.c===c.id)).map(c=>c.name);
  emptyCats.length ? bad('問題が1問も無いカテゴリ: '+emptyCats) : ok('全カテゴリに問題が存在');

  // ── ルール6：誤答の質 ──
  head('ルール6：誤答選択肢の質');
  /* 用語を選ばせる問題では「インシデント管理」対「問題管理」のように
     正解のほうが自然に長くなることがあり、これは giveaway ではない。
     狙うのは「正解だけが長い説明文で、誤答は短い単語」という作問ミスなので、
     正解が絶対値としても長い（15文字以上）場合に限って指摘する。 */
  const giveaway = all.filter(q=>{
    if(Array.isArray(q.a)) return false;
    const lens = q.o.map(o=>o.length);
    const correct = lens[q.a];
    if(correct < 15) return false;
    const others = lens.filter((_,i)=>i!==q.a).sort((a,b)=>b-a);
    return correct >= others[0]*1.6;
  }).map(q=>q.id);
  giveaway.length
    ? bad(`正解の選択肢だけが極端に長い（読まずに当てられる）: ${giveaway.length}問 ${giveaway.slice(0,12).join(',')}${giveaway.length>12?'…':''}`)
    : ok('正解だけが目立って長い問題はなし');

  // ── ルール7：解説の質 ──
  head('ルール7：解説の質（各誤答がなぜ誤りかを書く）');
  const weakExp = [];
  all.forEach(q=>{
    if(Array.isArray(q.a)) return;
    const distractors = q.o.filter((_,i)=>i!==q.a);
    const touched = distractors.filter(x=>{
      const t = x.replace(/[（(].*$/,'').trim();
      if(q.e.includes('「'+t+'」') || q.e.includes('「'+x+'」')) return true;
      if(t.length <= 5) return false;
      const kw = (t.match(/[ァ-ヴー]{3,}|[一-龠]{2,}|[A-Za-z]{3,}/g)||[]);
      return kw.some(k=>q.e.includes(k));
    }).length;
    if(touched < Math.max(1, distractors.length-1)) weakExp.push(`${q.id}(${touched}/${distractors.length})`);
  });
  weakExp.length
    ? bad(`解説が誤答に十分触れていない: ${weakExp.length}問\n       ${weakExp.slice(0,14).join(' ')}${weakExp.length>14?' …':''}`)
    : ok('全問の解説が誤答選択肢を具体的に引用して説明している');

  // ── まとめ ──
  console.log('\n' + '─'.repeat(60));
  console.log(`収録： 単語帳${cards.length}枚 / ` + banks.map(([l,a])=>`${l} ${a.length}問`).join(' / ') + ` / チートシート${CHEATSHEETS.length}本`);
  console.log(ng === 0 ? '✓ すべての検証を通過しました' : `✗ ${ng} 件の指摘があります`);
  return ng;
}

// ─── 実行 ──────────────────────────────────────────────────
const arg = process.argv[2];
const targets = arg ? [arg] : Object.keys(CERT_PROFILE).filter(r=>fs.existsSync(path.join(ROOT,r,'data.js')));
let total = 0;
targets.forEach(t=>{ total += validate(t); });
if(targets.length > 1){
  console.log('\n' + '='.repeat(60));
  console.log(total === 0 ? '✓ 全資格が検証を通過しました' : `✗ 合計 ${total} 件の指摘`);
}
process.exit(total === 0 ? 0 : 1);
