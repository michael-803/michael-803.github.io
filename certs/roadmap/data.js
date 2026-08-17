// ═══════════════════════════════════════════════════════════
//  資格ロードマップ管理アプリ — データ
//
//  ★このリポジトリは GitHub Pages で一般公開されている。
//    そのため、待遇・費用負担・キャリア計画といった公開に適さない情報は
//    【意図的にこのファイルへ書いていない】。
//    元の計画資料は .gitignore でリポジトリから除外し、ローカルにのみ置いている。
//    そうした情報を扱う必要が出た場合も、公開されない場所で管理すること。
//
//  ここで扱うのは「取得順序・勉強時間の目安・進捗」だけに絞っている。
// ═══════════════════════════════════════════════════════════

// tone: カードの識別色（orange=AWS／blue=IPA）
// icon: _engine/icons.js のシンボル名
const ROADMAP_CERTS = [
  { id:'clf-c02', name_ja:'エーダブリューエス認定 クラウドプラクティショナー', name_en:'AWS Certified Cloud Practitioner',
    code:'CLF-C02', category:'AWS', level:'Foundational', status:'取得済み', phase:'フェーズ0以前',
    study_hours_min:null, study_hours_max:null,
    order:0, icon:'cloud', tone:'orange',
    note:'取得済み。クラウドの全体像を押さえる入口となる資格' },

  { id:'itpassport', name_ja:'ITパスポート', code:null, category:'IPA', level:'レベル1',
    status:'学習中', phase:'フェーズ0',
    study_hours_min:20, study_hours_max:50,
    order:1, icon:'passport', tone:'blue',
    note:'ITの基礎を分野横断で確認できる国家資格。ストラテジ・マネジメント・テクノロジの3分野に分野別の合格基準がある' },

  { id:'fe', name_ja:'基本情報技術者', code:null, category:'IPA', level:'レベル2',
    status:'未着手', phase:'フェーズ1',
    study_hours_min:150, study_hours_max:200,
    order:2, icon:'book', tone:'blue',
    note:'応用情報より先に取得すること。社内制度上の理由により、この順序を守る必要がある',
    prerequisite_of:'ap' },

  { id:'saa-c03', name_ja:'エーダブリューエス認定 ソリューションアーキテクト － アソシエイト', name_en:'AWS Certified Solutions Architect - Associate',
    code:'SAA-C03', category:'AWS', level:'Associate', status:'学習中', phase:'フェーズ1',
    study_hours_min:80, study_hours_max:120,
    order:3, icon:'blueprint', tone:'orange',
    exam_date:'2026-11頃', note:'受験時期の目安が決まっている。設計の考え方を問う出題が中心' },

  { id:'soa-c03', name_ja:'エーダブリューエス認定 クラウドオプスエンジニア － アソシエイト', name_en:'AWS Certified CloudOps Engineer - Associate',
    code:'SOA-C03', category:'AWS', level:'Associate', status:'未着手', phase:'フェーズ1',
    study_hours_min:60, study_hours_max:80,
    order:4, icon:'wrench', tone:'orange',
    note:'SAA合格後、1〜2ヶ月を目安に着手。運用・監視の実務寄りの知識が問われる' },

  { id:'ap', name_ja:'応用情報技術者', code:null, category:'IPA', level:'レベル3',
    status:'未着手', phase:'フェーズ1',
    study_hours_min:200, study_hours_max:500,
    order:5, icon:'doc-check', tone:'blue',
    note:'基本情報の合格後に着手する。合格すると高度試験（SC・システムアーキテクト等）の午前I試験が2年間免除される',
    prerequisite:'fe' },

  { id:'sap-c02', name_ja:'エーダブリューエス認定 ソリューションアーキテクト － プロフェッショナル', name_en:'AWS Certified Solutions Architect - Professional',
    code:'SAP-C02', category:'AWS', level:'Professional', status:'未着手', phase:'フェーズ1後半',
    study_hours_min:150, study_hours_max:200,
    order:6, icon:'compass', tone:'orange',
    note:'長文シナリオの読解と時間配分が合否を分ける。180分・75問という形式そのものへの慣れが必要' },

  { id:'scs-c03', name_ja:'エーダブリューエス認定 セキュリティ － スペシャリティ', name_en:'AWS Certified Security - Specialty',
    code:'SCS-C03', category:'AWS', level:'Specialty', status:'未着手', phase:'フェーズ1後半',
    study_hours_min:100, study_hours_max:100,
    order:7, icon:'lock', tone:'orange',
    note:'IAMポリシーの読解など、AWS内スコープのセキュリティ設計力を問う。キャリア適合性を優先して継続する方針' },

  { id:'sc', name_ja:'情報処理安全確保支援士', code:'SC', category:'IPA', level:'高度（レベル4）',
    status:'未着手', phase:'フェーズ2',
    study_hours_min:500, study_hours_max:600,
    order:8, icon:'shield', tone:'blue',
    note:'SCS-C03と補完関係にある。クラウド事業者に依存しないセキュリティ設計・監査能力の国家資格。応用情報合格済みなら午前I免除が使える' },

  { id:'sa', name_ja:'システムアーキテクト', code:null, category:'IPA', level:'高度（レベル4）',
    status:'未着手', phase:'フェーズ2',
    study_hours_min:500, study_hours_max:600,
    order:9, icon:'map', tone:'blue',
    note:'目指す職種名と直結する資格。SCとの同時進行は避け、半年〜1年空けて着手すること' },

  { id:'dop-c02', name_ja:'エーダブリューエス認定 デブオプスエンジニア － プロフェッショナル', name_en:'AWS Certified DevOps Engineer - Professional',
    code:'DOP-C02', category:'AWS', level:'Professional', status:'保留', phase:'フェーズ2（条件付き）',
    study_hours_min:120, study_hours_max:150,
    order:10, icon:'toolbox', tone:'orange',
    note:'取得するかどうかはフェーズ2の時点で判断する条件付きプラン' },
];

const ROADMAP_PHASES = ['フェーズ0以前','フェーズ0','フェーズ1','フェーズ1後半','フェーズ2','フェーズ2（条件付き）'];

const ROADMAP_EXCLUDED = [
  { name:'AIF-C01（AI プラクティショナー）',
    reason:'現時点の学習計画では優先度が低いため対象外とした。技術的な必要性が明確になった時点で単体で再検討する' },
];

const ROADMAP_CHANGELOG = [
  { date:'初期版', change:'SCS-C03を優先候補として設定', reason:'目指すキャリア（クラウドのセキュリティ設計）との適合性を重視' },
  { date:'修正1', change:'AIF-C01を候補から除外', reason:'現時点の学習計画では優先度が低いため' },
  { date:'修正2', change:'ITパスポートを最優先（フェーズ0）に追加', reason:'クラウドプラクティショナー取得時に次はITパスポートと決めていたため' },
  { date:'修正3', change:'基本情報技術者を応用情報技術者より前に追加', reason:'社内制度上、この順序を守る必要があるため' },
  { date:'修正4', change:'AWS資格にカタカナのフルネームを併記', reason:'コード表記（SAA-C03等）だけでは分かりづらいという本人からのフィードバック' },
  { date:'2026-08-17', change:'資格ロードマップ管理アプリを certs/roadmap/ として新規実装', reason:'Study Deck（単語帳・過去問アプリ群）とは別に、取得順序と進捗を1画面で管理するため' },
  { date:'2026-08-18', change:'このアプリの管理対象を「取得順序・勉強時間・進捗」に限定', reason:'このリポジトリはGitHub Pagesで一般公開されているため、公開に適さない情報はリポジトリ外で管理する方針にした' },
];

/* 順序ルールの検証。prerequisite が指定された資格について、
   前提資格を取得する前に自分を取得済みにしていたら警告する。 */
function checkOrderViolations(certs, statusOf){
  const byId = Object.fromEntries(certs.map(c=>[c.id,c]));
  const violations = {};
  certs.forEach(c=>{
    if(!c.prerequisite) return;
    const pre = byId[c.prerequisite];
    if(!pre) return;
    if(statusOf(c.id) === '合格済み' && statusOf(pre.id) !== '合格済み'){
      violations[c.id] = `${pre.name_ja}を先に取得していないため、社内制度上の扱いが想定と変わる可能性があります`;
    }
  });
  return violations;
}

/* 総勉強時間の集計（min〜maxのレンジ） */
function totalStudyHours(certs){
  let min = 0, max = 0;
  certs.forEach(c=>{
    if(c.study_hours_min != null) min += c.study_hours_min;
    if(c.study_hours_max != null) max += c.study_hours_max;
  });
  return {min, max};
}
