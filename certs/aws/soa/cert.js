/* ============================================================
   cert.js — AWS Certified CloudOps Engineer – Associate（SOA-C03）の資格定義

   engine.js より前に読み込むこと。

   公式情報（AWS公式試験ガイド・2026-08-26 一次情報で確認）
     出典: docs.aws.amazon.com/aws-certification/latest/sysops-administrator-associate-03/
           aws.amazon.com/certification/certified-cloudops-engineer-associate/

     ★試験名が変わっている：SysOps Administrator → CloudOps Engineer
       （試験コードは SOA-C03 のまま。旧称で検索すると古い情報に当たるので注意）

     出題数     65問（採点対象50問／採点対象外15問。どれが対象外かは非公開）
     試験時間   130分
     出題形式   択一式と複数選択式のみ
     合格スコア 100〜1000のスケールドスコアで 720 以上
     採点方式   補正スコアリング。★ドメイン別の合格ラインは無く、総合点のみで判定
     未回答     誤答扱い。当て推量のペナルティは無し

     ドメインと比率（採点対象に対する割合）
       1. モニタリング、ログ、分析、修復、パフォーマンス最適化  22%
       2. 信頼性とビジネス継続性                              22%
       3. デプロイ、プロビジョニング、自動化                   22%
       4. セキュリティとコンプライアンス                       16%
       5. ネットワークとコンテンツ配信                         18%

   ★【重要】試験ラボ（exam labs）は無い。
     公式ガイドの出題形式は択一式と複数選択式だけで、ラボの記載が無い。
     CLAUDE.md 第19節に「SOA-C03はハンズオン道場が最重要」と書いてあるが、
     これは試験ラボがあった旧SOA-C02時代の前提。**この資格でも道場は作らない**
     （features.dojo は false）。運用手順の理解は問題文とチートシートで扱う。

   ★出題の重心はSAAと違う。「設計」ではなく「運用」。
     すでに動いているものが壊れた・遅い・高いときに、どのサービスの
     どの機能で調べ、直し、自動化するかが問われる。
     そのためシナリオ問題は「障害対応・原因切り分け」の形にする。
   ============================================================ */

window.CERT = {
  id:   'soa',
  name: 'SOA-C03',
  doc:  'notebook-soa',      // Firestoreの保存先（資格ごとに分離。CLAUDE.md 10-5節）

  features: {
    flashcards: true,
    quiz:       true,
    multi:      true,    // 複数選択式（本番にある形式）
    scenario:   true,    // 障害対応・原因切り分けの形で出す
    ordering:   false,
    matching:   false,
    pseudo:     false,
    weak:       true,
    cheatsheet: true,
    mock:       true,    // aws/soa/mock-exam.html（65問／130分）
    dojo:       false,   // ★試験ラボが無いため作らない（上のコメント参照）
  },

  /* 問題は公式の5ドメインで分類する（SAAと同じ方針。CLAUDE.md 第40節） */
  quizOnlyCats: ['mon', 'rel', 'dep', 'sec', 'net'],
  labNames: {},

  /* ── 模擬試験の設定（_engine/mock.js が読む） ──
     65問／130分／総合720点。ドメイン別の足切りは無い。
     配分は公式比率を65問へ按分：22%→14／22%→14／22%→14／16%→11／18%→12。 */
  mock: {
    title: 'SOA-C03 模擬試験',
    icon:  'wrench',
    keys:  { hist:'soaMockHistoryV1', wrong:'soaMockWrongV1' },
    pass:  { total: 720 },

    sections: [{
      id:'main', name:'SOA-C03', minutes:130,
      pools:['QQ', 'SCENARIO_Q', 'MULTI_Q'],
      groups:[
        { id:'mon', name:'モニタリング・ログ・修復',   cats:['mon'], n:14 },
        { id:'rel', name:'信頼性とビジネス継続性',     cats:['rel'], n:14 },
        { id:'dep', name:'デプロイ・自動化',           cats:['dep'], n:14 },
        { id:'sec', name:'セキュリティとコンプライアンス', cats:['sec'], n:11 },
        { id:'net', name:'ネットワークとコンテンツ配信', cats:['net'], n:12 },
      ],
    }],

    scoreNote: '本番は100〜1000のスケールドスコアで、換算式は公開されていません。' +
               'ここでは<strong>正答率を 100＋正答率×900 で換算した目安</strong>を表示しています' +
               '（合格ライン720点は、およそ69%の正答に相当します）。',
  },

  /* 弱点診断の処方箋。キーは単語帳カテゴリID＋問題側のドメインID。 */
  prescriptions: {
    cat_monitor: {
      text:'モニタリングとログ（CloudWatch・Logs Insights・X-Ray）が弱点です。SOAで最も配点に効く分野です。「メトリクスで気付く→ログで絞る→トレースで特定する」という調べる順番を体で覚えてください。',
      lab:null },
    cat_automation: {
      text:'自動化とIaC（Systems Manager・CloudFormation・EventBridge）が弱点です。手作業の運用をどう自動化するかが繰り返し問われます。SSM Automationのランブックが要点です。',
      lab:null },
    cat_deploy: {
      text:'デプロイと構成管理が弱点です。CloudFormationのスタック操作、AMIとAuto Scalingの更新、Elastic Beanstalkのデプロイ方式の違いを押さえましょう。',
      lab:null },
    cat_reliability: {
      text:'信頼性とバックアップが弱点です。AWS Backupのプラン、スナップショットの世代管理、マルチAZとリードレプリカの使い分けを整理してください。',
      lab:null },
    cat_network: {
      text:'ネットワーク運用が弱点です。「つながらない」を切り分ける順番（セキュリティグループ→ネットワークACL→ルートテーブル→DNS）を固定手順として覚えると強いです。',
      lab:null },
    cat_security: {
      text:'セキュリティ運用が弱点です。IAMの権限不足の切り分け、証明書の更新、Configによる準拠チェックなど、運用で触る部分が中心に問われます。',
      lab:null },
    cat_storage: {
      text:'ストレージ運用が弱点です。EBSのボリューム変更とスナップショット、S3のライフサイクルとバージョニング、EFSのパフォーマンスモードを押さえましょう。',
      lab:null },
    cat_compute: {
      text:'コンピューティング運用が弱点です。EC2のステータスチェック、Auto Scalingのライフサイクルフック、ELBのヘルスチェック異常時の見方が要点です。',
      lab:null },
    cat_db: {
      text:'データベース運用が弱点です。RDSのパラメータグループ、Performance Insights、スナップショットからの復元手順を確認してください。',
      lab:null },
    cat_cost: {
      text:'コストとキャパシティ管理が弱点です。Cost Explorer・Budgets・Compute Optimizer・サービスクォータの引き上げ申請といった運用の道具立てを覚えましょう。',
      lab:null },

    /* 問題側（公式ドメイン） */
    mon: {
      text:'ドメイン1「モニタリング、ログ、分析、修復、パフォーマンス最適化」が弱点です。22%と最大級のドメインです。CloudWatchのメトリクス・アラーム・ログ・ダッシュボードと、EventBridgeによる自動修復までを一続きで理解しましょう。',
      lab:null },
    rel: {
      text:'ドメイン2「信頼性とビジネス継続性」が弱点です。スケーリング、マルチAZ、バックアップと復元、RTO/RPOに沿ったDR方式の選択が問われます。',
      lab:null },
    dep: {
      text:'ドメイン3「デプロイ、プロビジョニング、自動化」が弱点です。CloudFormationとSystems Managerが主役です。手作業を減らす方向の選択肢を選ぶ、と覚えておくと当たりやすくなります。',
      lab:null },
    sec: {
      text:'ドメイン4「セキュリティとコンプライアンス」が弱点です。IAMの権限、暗号化、Config・CloudTrail・GuardDutyによる検知と監査が中心です。',
      lab:null },
    net: {
      text:'ドメイン5「ネットワークとコンテンツ配信」が弱点です。VPCの経路とファイアウォール、Route 53、CloudFrontの運用が問われます。疎通できないときの切り分け手順を固定化しておきましょう。',
      lab:null },
  },
};
