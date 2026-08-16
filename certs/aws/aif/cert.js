/* ============================================================
   cert.js — AIF-C01（AWS Certified AI Practitioner）の資格定義

   engine.js より前に読み込むこと。engine.js はこのファイルの
   window.CERT だけを見て資格ごとの差分を吸収する。

   公式試験ガイドの確定値（2026-08-16 一次情報で確認）
     65問（採点対象50＋採点対象外15）／90分／合格700点（100〜1000）
     出題形式：択一式・複数選択式・順序問題・マッチング問題
     ドメイン比率：20% / 24% / 28% / 14% / 14%
   詳細は ../CLAUDE.md 14-1節を参照。
   ============================================================ */

window.CERT = {
  id:   'aif',
  name: 'AIF-C01',
  doc:  'notebook-aif',        // Firestore の保存先（資格ごとに分離。CLAUDE.md 10-5節）

  /* 機能トグル。CLAUDE.md 第11節の機能マトリクスに対応。
     AIF-C01は実技要素が無いためハンズオン道場のみ無効。
     順序問題・マッチング問題は本番で出題されるため有効にしている。

     mock は「機能として不要」ではなく、まだ aif/mock-exam.html を作って
     いないため一時的にfalseにしている。作ったらtrueに戻すこと。
     falseの間、模擬試験のリンクは自動で隠れる（404を踏まない）。 */
  features: {
    flashcards: true,
    quiz:       true,
    multi:      true,
    scenario:   true,
    ordering:   true,
    matching:   true,
    weak:       true,
    cheatsheet: true,
    mock:       true,    // aif/mock-exam.html（65問／90分・4形式混在）
    dojo:       false,
  },

  /* 過去問（QCAT）にしか存在しないカテゴリ。単語帳カテゴリと1対1で
     対応するものはここに書かない（engine.js の weakDiagnosis 参照）。 */
  quizOnlyCats: [],

  /* 道場を持たないので空。 */
  labNames: {},

  /* 弱点診断の処方箋。キーは単語帳カテゴリID、および quizOnlyCats のID。
     道場が無いため lab は全て null。 */
  prescriptions: {
    cat_ai_basic: {
      text:'教師あり学習・教師なし学習・強化学習の区別と、それぞれが向くユースケースが頻出です。単語帳「AI・MLの基礎」で用語を固め、過剰適合（オーバーフィッティング）と過少適合の違いも押さえましょう。',
      lab:null },
    cat_ml_flow: {
      text:'データ準備から学習・評価・デプロイまでの流れと、評価指標の使い分けが弱点です。チートシート「評価指標一覧」で、分類系（適合率・再現率・F1）と生成系（ROUGE・BLEU）を並べて比較しましょう。',
      lab:null },
    cat_genai: {
      text:'基盤モデル・トークン・埋め込み・コンテキストウィンドウなど、生成AI特有の用語で失点しています。単語帳「生成AIの基礎」を重点的に回し、温度（Temperature）が出力に与える影響も確認しましょう。',
      lab:null },
    cat_prompt: {
      text:'ゼロショット・フューショット・思考の連鎖（Chain-of-Thought）の違いを整理しましょう。プロンプトインジェクションなどの攻撃手法と対策もこの分野から出題されます。',
      lab:null },
    cat_bedrock: {
      text:'Bedrockの構成要素（Knowledge Bases・Agents・Guardrails・モデル評価）の役割分担が混同されがちです。チートシート「RAG vs ファインチューニング vs 継続的事前学習」が最重要なので必ず確認しましょう。',
      lab:null },
    cat_sagemaker: {
      text:'SageMakerの機能名（Canvas・JumpStart・Clarify・Model Monitor・Ground Truth）と用途の対応が弱点です。単語帳「Amazon SageMaker」で1つずつ用途を言えるようにしましょう。',
      lab:null },
    cat_aiservices: {
      text:'入力の種類とサービスの対応（画像→Rekognition、文書→Textract、音声→Transcribe など）で失点しています。チートシート「AIサービス対応表」を見ながら単語帳を回すのが近道です。',
      lab:null },
    cat_responsible: {
      text:'公平性・説明可能性・透明性といった責任あるAIの観点と、それを支えるAWSの機能（Guardrails・Clarify・AI Service Cards）の対応を整理しましょう。配点14%と小さくないので取りこぼさないように。',
      lab:null },
    cat_secgov: {
      text:'AIワークロード特有のセキュリティ（データ主権・モデルへのアクセス制御・推論データの扱い）が弱点です。IAM・KMS・VPCの基礎と、それがAIサービスにどう適用されるかを結びつけて復習しましょう。',
      lab:null },
  },
};
