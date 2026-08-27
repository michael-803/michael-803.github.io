/* ============================================================
   cert.js — AWS Certified Solutions Architect – Professional（SAP-C02）

   engine.js より前に読み込むこと。

   公式情報（2026-08-27 一次情報で確認）
   出典：AWS公式試験ガイド
     docs.aws.amazon.com/aws-certification/latest/solutions-architect-professional-02/
     aws.amazon.com/certification/certified-solutions-architect-professional/

   | 項目 | 値 |
   |---|---|
   | 試験コード | SAP-C02（現行） |
   | 出題数 | 75問（採点対象65問＋採点対象外10問。どれが対象外かは非公開） |
   | 試験時間 | 180分 |
   | 出題形式 | 択一式（正解1・誤答3）と複数選択式（5つ以上から2つ以上） |
   | 合格スコア | 100〜1000のスケールドスコアで 750 以上 |
   | 採点方式 | 補正スコアリング。★ドメイン別の合格ラインは無く総合点のみ |
   | 未回答 | 誤答扱い。当て推量のペナルティなし |

   ドメイン比率
     1. 組織の複雑さに対応する設計       26%
     2. 新しいソリューションのための設計   29%
     3. 既存ソリューションの継続的な改善   25%
     4. ワークロードの移行と近代化の加速   20%

   ── この資格で他と変える点（CLAUDE.md 第43節） ──
   ★1問が数百字になる。設問文が130字を超えると共通エンジンが
     自動で長文体裁（通常の太さ・行間広め・改行を活かす）に切り替える。
   ★単語帳は用語帳ではなく「設計パターン帳」。
     表に「要件・状況」、裏に「採るべき構成と、なぜ他ではないか」を書く。
     アソシエイトまでのようにサービス名と説明を1対1で覚える作りにはしない。
   ★試験ラボは無い。道場は作らない（SOA-C03と同じ理由・第41-2節）。

   ★作問は certs/_tools/作問ルール.md（8項目）に従うこと。
     選択肢は4つとも同じ粒度・同じ長さで書くこと（第40-7節の教訓）。
   ============================================================ */

window.CERT = {
  id:   'sap',
  name: 'SAP-C02',
  doc:  'notebook-sap',     // Firestoreの保存先（資格ごとに分離。CLAUDE.md 10-5節）

  features: {
    flashcards: true,    // 設計パターン帳
    quiz:       true,    // 四択
    pseudo:     false,
    multi:      true,    // 複数選択（5つ以上から2つ以上）
    scenario:   true,    // ★この資格の主役
    ordering:   false,
    matching:   false,
    weak:       true,
    cheatsheet: true,
    mock:       true,    // aws/sap/mock-exam.html（75問／180分）
    dojo:       false,   // 試験ラボは無い
  },

  /* 設問文を長文体裁に切り替えるしきい値（文字数）。
     既定は130字。SAPは長文が前提なので明示しておく。 */
  longStem: 130,

  mock: {
    title: 'SAP-C02 模擬試験',
    icon:  'blueprint',
    keys:  { hist:'sapMockHistoryV1', wrong:'sapMockWrongV1' },
    pass:  { total: 750 },

    sections: [{
      id:'main', name:'SAP-C02', minutes:180,
      pools:['QQ', 'SCENARIO_Q', 'MULTI_Q'],
      /* 公式比率を75問へ按分（26/29/25/20% → 20/22/19/14問） */
      groups:[
        { id:'org', name:'組織の複雑さに対応する設計',     cats:['org'], n:20 },
        { id:'new', name:'新しいソリューションのための設計', cats:['new'], n:22 },
        { id:'imp', name:'既存ソリューションの継続的な改善', cats:['imp'], n:19 },
        { id:'mig', name:'ワークロードの移行と近代化の加速', cats:['mig'], n:14 },
      ],
    }],

    scoreNote: '本番は100〜1000のスケールドスコアで、換算式は公開されていません。' +
               'ここでは<strong>正答率を 100＋正答率×900 で換算した目安</strong>を表示しています' +
               '（合格ライン750点は、およそ72%の正答に相当します）。' +
               '<strong>180分という長さそのものが対策になる試験</strong>なので、' +
               '途中で切り上げず通しで解くことをおすすめします。',
  },

  /* 単語帳（設計パターン別）には無く、問題側にしかないカテゴリ＝公式4ドメイン。
     SAA・SOAと同じ持ち方（CLAUDE.md 第40-2節）。 */
  quizOnlyCats: ['org', 'new', 'imp', 'mig'],
  labNames: {},

  /* 弱点診断の処方箋。単語帳カテゴリ（設計テーマ別）＋問題の4ドメイン。 */
  prescriptions: {
    cat_org: {
      text:'マルチアカウント設計が弱点です。SAPで最も配点が重い領域につながります。Organizations・SCP・IAM Identity Center・Control Towerの役割分担と、「誰が何をどこまで制限できるか」を設計パターン帳で確認してください。',
      lab:null },
    cat_network: {
      text:'大規模ネットワーク設計が弱点です。Transit Gateway・VPCピアリング・PrivateLink・Direct Connectの使い分けは、SAPでは「拠点数が増えたとき何が破綻するか」の形で問われます。',
      lab:null },
    cat_migrate: {
      text:'移行設計が弱点です。7R（リホスト・リプラットフォーム・リファクタなど）の選択基準と、DMS・Snow Family・DataSync・Application Migration Serviceの使い分けを押さえてください。',
      lab:null },
    cat_data: {
      text:'データ設計が弱点です。RDS・Aurora・DynamoDB・Redshift・S3の選び分けに加え、SAPでは「グローバル分散」「読み取り拡張」「アーカイブ」といった要件からの逆引きが問われます。',
      lab:null },
    cat_resil: {
      text:'回復性の設計が弱点です。RTO・RPOの数値から構成を逆算する問題が頻出です。バックアップ／パイロットライト／ウォームスタンバイ／マルチサイトの4段階を、費用と復旧時間の対で覚えてください。',
      lab:null },
    cat_sec: {
      text:'セキュリティ設計が弱点です。KMSのキーポリシーとグラント、クロスアカウントの権限委譲、証明書と秘密情報の管理が中心です。アソシエイトより一段深く、「組織全体にどう強制するか」まで問われます。',
      lab:null },
    cat_cost: {
      text:'コスト最適化が弱点です。SAPでは単価の暗記ではなく、「要件を満たしたうえで最も安い構成はどれか」という比較で問われます。データ転送料とNAT Gateway、ストレージクラス、購入オプションの3点を優先してください。',
      lab:null },
    cat_ops: {
      text:'運用設計が弱点です。CloudFormationのスタックセット、Systems Manager、Config・Security Hubによる統制など、「複数アカウントに同じ運用をどう行き渡らせるか」を押さえてください。',
      lab:null },
    cat_modern: {
      text:'近代化の設計が弱点です。モノリスの分割、コンテナとサーバーレスの選び分け、イベント駆動への置き換えが中心です。「今の構成の何が制約になっているか」から考える癖をつけてください。',
      lab:null },
    cat_hybrid: {
      text:'ハイブリッド構成が弱点です。Direct Connectと VPNの併用、Outposts・Storage Gateway・Route 53 Resolverなど、オンプレミスと接続し続ける前提の設計が問われます。',
      lab:null },
    org: {
      text:'ドメイン1「組織の複雑さに対応する設計」が弱点です。出題の26%を占めます。複数アカウント・複数リージョン・複数チームという前提で、権限とネットワークと請求をどう束ねるかを考える練習をしてください。',
      lab:null },
    new: {
      text:'ドメイン2「新しいソリューションのための設計」が弱点です。出題の29%と最大の領域です。要件（可用性・性能・コスト・法令）から構成を組み立てる問題なので、シナリオ問題を繰り返してください。',
      lab:null },
    imp: {
      text:'ドメイン3「既存ソリューションの継続的な改善」が弱点です。出題の25%を占めます。「動いてはいるが遅い・高い・壊れやすい」構成を、どこから直すかという順序の判断が問われます。',
      lab:null },
    mig: {
      text:'ドメイン4「ワークロードの移行と近代化の加速」が弱点です。出題の20%を占めます。移行方式の選択基準と、移行中の並行稼働・切り戻しをどう設計するかを押さえてください。',
      lab:null },
  },
};
