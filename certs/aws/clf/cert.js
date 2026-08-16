/* ============================================================
   cert.js — CLF-C02（AWS Certified Cloud Practitioner）の資格定義

   engine.js より前に読み込むこと。

   ★保存先は既存の app/notebook のまま。2026-08-15の共通エンジンへの
     載せ替えでも、それまでの学習記録をそのまま引き継いでいる。
     （さくらさんは2026-08-15にCLF-C02合格済み。以降は復習用途）

   処方箋・道場ラボ名は、移設前の app.js に直書きされていたものを
   1:1でここへ移したもの。詳細は ../CLAUDE.md 第II部を参照。
   ============================================================ */

window.CERT = {
  id:   'clf',
  name: 'CLF-C02',
  doc:  'notebook',            // ★既存の保存先。変更しないこと

  /* 機能トグル。CLAUDE.md 第11節の機能マトリクスに対応。
     順序問題・マッチング問題はCLF-C02の出題形式に無いため無効。 */
  features: {
    flashcards: true,
    quiz:       true,
    multi:      true,
    scenario:   true,
    ordering:   false,
    matching:   false,
    weak:       true,
    cheatsheet: true,
    mock:       true,
    dojo:       true,
  },

  /* 過去問（QCAT）にしか存在しないカテゴリ。単語帳カテゴリと1対1で
     対応するものはここに書かない（engine.js の weakDiagnosis 参照）。 */
  quizOnlyCats: ['basics', 'arch', 'mig'],

  /* ハンズオン道場のラボ名。処方箋の lab から参照される。 */
  labNames: {
    basics:'Lab 0（コンソールの歩き方）', iam:'Lab 1（IAM）', s3:'Lab 2（S3）',
    ec2:'Lab 3（EC2）', vpc:'Lab 4（VPC）', lambda:'Lab 5（Lambda）', budgets:'Lab 6（Billing）'
  },

  /* 弱点診断の処方箋。キーは単語帳カテゴリID、および quizOnlyCats のID。 */
  prescriptions: {
    cat_compute:{ text:'EC2・Lambda・ECSなど起動方式とスケーリングの違いが頻出です。単語帳「コンピューティング」を復習し、道場のEC2ラボで手を動かしましょう。', lab:'ec2' },
    cat_storage: { text:'S3のストレージクラスとEBS/EFSの使い分けが頻出です。単語帳「ストレージ」を重点的に復習し、道場のS3ラボで実践しましょう。', lab:'s3' },
    cat_network: { text:'VPC構成要素（サブネット・IGW・NAT・SG/NACL）の役割の違いを図で整理しましょう。道場のVPCラボが実感を掴む近道です。', lab:'vpc' },
    cat_db:      { text:'RDS・Aurora・DynamoDBの使い分けと、マルチAZ/リードレプリカの違いを単語帳「データベース」で復習しましょう。', lab:null },
    cat_sec:     { text:'IAMの権限モデルとGuardDuty/WAF/Shieldの役割分担が混同されがちです。単語帳「セキュリティ」＋道場のIAMラボがおすすめです。', lab:'iam' },
    cat_sls:     { text:'SQS/SNS/EventBridgeの違いとサーバーレス構成の典型パターンを復習しましょう。道場のLambdaラボで流れを確認できます。', lab:'lambda' },
    cat_ai:      { text:'各AIサービスの用途対応（画像→Rekognition、文書→Textract等）を単語帳「AI / ML」で覚え直しましょう。', lab:null },
    cat_ops:     { text:'CloudWatch・CloudTrail・Configの役割の違いが混同されがちです。単語帳「監視・管理」で3つを並べて比較しましょう。', lab:null },
    cat_cost:    { text:'料金モデルとサポートプランの違い、Cost Explorer/Budgetsの使い分けを復習しましょう。道場のBillingラボが実践的です。', lab:'budgets' },
    basics:      { text:'責任共有モデルやリージョン/AZの定義など、クラウドの基礎用語を単語帳で確認しましょう。道場Lab 0が導入に最適です。', lab:'basics' },
    arch:        { text:'Well-Architectedフレームワークの柱と高可用性設計の考え方を過去問「アーキテクチャ設計」で復習しましょう。', lab:null },
    mig:         { text:'DMS・DataSync・Snow Familyなど移行サービスの使い分けを過去問「移行・転送」で整理しましょう。', lab:null },
  },
};
