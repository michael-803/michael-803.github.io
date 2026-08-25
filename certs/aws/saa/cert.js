/* ============================================================
   cert.js — AWS Certified Solutions Architect – Associate（SAA-C03）の資格定義

   engine.js より前に読み込むこと。

   公式情報（AWS公式試験ガイド・2026-08-25 一次情報で確認）
     出典: docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/
           aws.amazon.com/jp/certification/certified-solutions-architect-associate/

     試験コード   SAA-C03（現行）
     出題数       65問（うち採点対象50問／採点対象外15問。どれが対象外かは非公開）
     試験時間     130分
     出題形式     択一式（正解1つ・誤答3つ）と複数選択式（5つ以上の選択肢から2つ以上）
     合格スコア   100〜1000のスケールドスコアで 720 以上
     採点方式     補正スコアリング。★ドメイン別の合格ラインは無く、総合点のみで判定
     未回答       誤答扱い。当て推量のペナルティは無し

     ドメインと比率（採点対象に対する割合）
       1. セキュアなアーキテクチャの設計        30%
       2. 弾力性に優れたアーキテクチャの設計    26%
       3. 高性能なアーキテクチャの設計          24%
       4. コストを最適化したアーキテクチャの設計 20%

   ★CLF-C02との最大の違いは「知っているか」ではなく
     「要件に対してどの構成を選ぶか」を問われること。
     そのため単語帳より シナリオ問題・複数選択問題に重心を置く（CLAUDE.md 第11節）。

   ★カテゴリの持ち方（CLAUDE.md 第40節）
     単語帳＝サービス別（10カテゴリ）／問題＝公式の4ドメイン。
     AWSの成績レポートがドメイン単位で返るため、問題側はドメインで揃えている。
     弱点診断にはサービス別（単語帳）とドメイン別（問題）の両方が並ぶ。
   ============================================================ */

window.CERT = {
  id:   'saa',
  name: 'SAA-C03',
  doc:  'notebook-saa',      // Firestoreの保存先（資格ごとに分離。CLAUDE.md 10-5節）

  features: {
    flashcards: true,
    quiz:       true,    // 四択（ドメイン別）
    multi:      true,    // 複数選択式（本番にある形式）
    scenario:   true,    // 要件→構成を選ぶ問題。SAAの主戦場
    ordering:   false,
    matching:   false,
    pseudo:     false,
    weak:       true,
    cheatsheet: true,
    mock:       true,    // aws/saa/mock-exam.html（65問／130分）
    dojo:       false,
  },

  /* 単語帳カテゴリ（FC_CATS_DEF）には無く、問題側（QCAT）にしかないカテゴリ。
     SAAでは問題を公式の4ドメインで分類しているため、4件すべてが該当する。 */
  quizOnlyCats: ['sec', 'res', 'perf', 'cost'],
  labNames: {},

  /* ── 模擬試験の設定（_engine/mock.js が読む） ──
     65問／130分／総合720点。ドメイン別の足切りは無い（補正スコアリング）。
     配分は公式比率をそのまま65問へ按分：30%→20問／26%→17問／24%→15問／20%→13問。 */
  mock: {
    title: 'SAA-C03 模擬試験',
    icon:  'blueprint',
    keys:  { hist:'saaMockHistoryV1', wrong:'saaMockWrongV1' },
    pass:  { total: 720 },

    sections: [{
      id:'main', name:'SAA-C03', minutes:130,
      pools:['QQ', 'SCENARIO_Q', 'MULTI_Q'],
      groups:[
        { id:'sec',  name:'セキュアなアーキテクチャ',       cats:['sec'],  n:20 },
        { id:'res',  name:'弾力性に優れたアーキテクチャ',   cats:['res'],  n:17 },
        { id:'perf', name:'高性能なアーキテクチャ',         cats:['perf'], n:15 },
        { id:'cost', name:'コストを最適化したアーキテクチャ', cats:['cost'], n:13 },
      ],
    }],

    scoreNote: '本番は100〜1000のスケールドスコアで、換算式は公開されていません。' +
               'ここでは<strong>正答率を 100＋正答率×900 で換算した目安</strong>を表示しています' +
               '（合格ライン720点は、およそ69%の正答に相当します）。',
  },

  /* 弱点診断の処方箋。キーは単語帳カテゴリID＋問題側のドメインID。 */
  prescriptions: {
    cat_compute: {
      text:'コンピューティング（EC2・Auto Scaling・ELB）が弱点です。インスタンスタイプの選び方より、「スケールアウトさせる構成」と「ヘルスチェックで異常なインスタンスを切り離す流れ」を押さえるとシナリオ問題に効きます。',
      lab:null },
    cat_storage: {
      text:'ストレージ（S3・EBS・EFS）が弱点です。「1台からブロックとして使うならEBS、複数台から同時にファイル共有ならEFS、HTTPで取り出すオブジェクトならS3」という住み分けを最初に確認してください。',
      lab:null },
    cat_network: {
      text:'ネットワーク（VPC・サブネット・Route 53・CloudFront）が弱点です。SAAで最も配点に効く土台です。パブリック／プライベートサブネットとNAT Gatewayの経路を図で描けるようにしましょう。',
      lab:null },
    cat_db: {
      text:'データベース（RDS・Aurora・DynamoDB・ElastiCache）が弱点です。「読み取りを増やすならリードレプリカ、可用性ならマルチAZ、キー検索で低レイテンシならDynamoDB」の対応づけが要点です。',
      lab:null },
    cat_security: {
      text:'セキュリティ（IAM・KMS・Secrets Manager・WAF）が弱点です。出題比率が最大（30%）のドメインを支える分野です。「認証情報を配らない＝ロールを使う」が繰り返し問われます。',
      lab:null },
    cat_serverless: {
      text:'サーバーレス（Lambda・API Gateway・Step Functions・Fargate）が弱点です。サーバー管理をなくす選択肢として頻出します。実行時間やペイロードの上限が選定理由になる点も押さえましょう。',
      lab:null },
    cat_integration: {
      text:'アプリケーション統合（SQS・SNS・EventBridge・Kinesis）が弱点です。「疎結合にする」「急な負荷を吸収する」という要件が出たらまずここを思い出せる状態にしてください。',
      lab:null },
    cat_monitor: {
      text:'監視・運用（CloudWatch・CloudTrail・Config・Systems Manager）が弱点です。「誰が何をしたか＝CloudTrail」「設定が基準どおりか＝Config」「メトリクスとログ＝CloudWatch」の役割分担が問われます。',
      lab:null },
    cat_cost: {
      text:'コスト最適化（購入オプション・S3ストレージクラス・データ転送）が弱点です。ドメイン4（20%）に直結します。「使い方が読めるならSavings Plans、途切れても良いならスポット」の判断が軸です。',
      lab:null },
    cat_migration: {
      text:'移行とディザスタリカバリ（DMS・Snowファミリー・AWS Backup・RTO/RPO）が弱点です。DR方式は「バックアップ＆リストア→パイロットライト→ウォームスタンバイ→マルチサイト」の順に速く・高くなる、と覚えると選べます。',
      lab:null },

    /* 問題側（公式ドメイン） */
    sec: {
      text:'ドメイン1「セキュアなアーキテクチャの設計」が弱点です。出題比率30%と最大のドメインなので最優先です。IAMロールと最小権限、保存時／転送時の暗号化、VPC内での通信経路の制御を重点的に。',
      lab:null },
    res: {
      text:'ドメイン2「弾力性に優れたアーキテクチャの設計」が弱点です。マルチAZによる冗長化、疎結合（キューによる切り離し）、自動復旧、バックアップとDRの4本柱で整理しましょう。',
      lab:null },
    perf: {
      text:'ドメイン3「高性能なアーキテクチャの設計」が弱点です。「遅い」の原因を、計算・ストレージ・データベース・ネットワークのどこかに切り分ける練習が効きます。キャッシュ（CloudFront・ElastiCache）の使いどころも頻出です。',
      lab:null },
    cost: {
      text:'ドメイン4「コストを最適化したアーキテクチャの設計」が弱点です。購入オプション、ストレージクラスとライフサイクル、データ転送料金、使っていない資源の削減という4つの切り口で見直しましょう。',
      lab:null },
  },
};
