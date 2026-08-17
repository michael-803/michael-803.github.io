/* ============================================================
   data.js — ITパスポート試験（IP）のコンテンツ

   engine.js が参照するグローバルを同名で定義する（データ契約）。
   詳細は ../CLAUDE.md 10-3節を参照。

   カテゴリは試験要綱の中分類に合わせている。
     ストラテジ系   … 企業と法務／経営戦略／システム戦略
     マネジメント系 … 開発技術／プロジェクトマネジメント／サービスマネジメント
     テクノロジ系   … 基礎理論／コンピュータシステム／技術要素

   ★ITパスポートは分野別に足切り（各300点）があるため、
     単語帳のカテゴリ複数選択で「ストラテジ系の3つだけ」といった
     まとめ方ができるようにしてある。

   ※収録内容はすべて独自作成（過去問そのものの転載は含まない）。
   ============================================================ */

// ─── 単語帳カテゴリ ────────────────────────────────────────
// 過去問カテゴリ（QCAT）のIDは、ここのIDから 'cat_' を除いたものにすること。
const FC_CATS_DEF = [
  {id:'cat_corp',     name:'企業と法務'},
  {id:'cat_strategy', name:'経営戦略'},
  {id:'cat_syssta',   name:'システム戦略'},
  {id:'cat_dev',      name:'開発技術'},
  {id:'cat_pm',       name:'プロジェクトマネジメント'},
  {id:'cat_sm',       name:'サービスマネジメント'},
  {id:'cat_theory',   name:'基礎理論'},
  {id:'cat_comp',     name:'コンピュータシステム'},
  {id:'cat_tech',     name:'技術要素'},
];

// ─── 単語帳カード ──────────────────────────────────────────
const SAMPLE = {
  '企業と法務': [
    {id:'B0001', term:'PDCAサイクル', def:'Plan（計画）→ Do（実行）→ Check（評価）→ Act（改善）を繰り返して業務を継続的に良くしていく手法。品質管理やマネジメント全般の基本の考え方。'},
    {id:'B0002', term:'CSR（企業の社会的責任）', def:'企業が利益追求だけでなく、環境や地域社会、従業員などに対しても責任ある行動をとるべきだとする考え方。'},
    {id:'B0003', term:'コーポレートガバナンス', def:'企業統治。経営者が株主などの利害関係者の利益に沿って適切に経営しているかを監視し、規律づける仕組み。'},
    {id:'B0004', term:'コンプライアンス', def:'法令や社内規程、社会規範を守ること。法律さえ守れば良いのではなく、倫理的な観点も含む。'},
    {id:'B0005', term:'ステークホルダ', def:'株主・顧客・従業員・取引先・地域社会など、企業の活動に利害関係を持つすべての人や組織のこと。'},
    {id:'B0006', term:'株主総会と取締役会', def:'株主総会は株主が議決権を行使する最高意思決定機関。取締役会は業務執行の意思決定と取締役の監督を行う。'},
    {id:'B0007', term:'損益計算書（P/L）', def:'一定期間の収益と費用をまとめ、いくら儲かったか（利益）を示す財務諸表。'},
    {id:'B0008', term:'貸借対照表（B/S）', def:'ある時点の資産・負債・純資産を示す財務諸表。「資産＝負債＋純資産」で左右が必ず一致する。'},
    {id:'B0009', term:'損益分岐点', def:'売上高と費用が等しくなり、利益がちょうどゼロになる売上高のこと。「固定費 ÷（1 − 変動費率）」で求める。'},
    {id:'B0010', term:'ROE / ROI', def:'ROEは自己資本利益率で、株主の出したお金をどれだけ効率よく利益にしたかを示す。ROIは投資利益率で、投資額に対する利益の割合。'},
    {id:'B0011', term:'特許権', def:'新規性・進歩性のある発明を保護する権利。出願して登録される必要がある。産業財産権のひとつ。'},
    {id:'B0012', term:'著作権', def:'思想や感情を創作的に表現した著作物を保護する権利。プログラムも対象。出願や登録をしなくても、創作した時点で自動的に発生するのが特許権との大きな違い。'},
    {id:'B0013', term:'商標権と意匠権', def:'商標権は商品やサービスの名称・ロゴを保護する権利。意匠権は物のデザイン（形状・模様・色彩）を保護する権利。どちらも登録が必要。'},
    {id:'B0014', term:'不正競争防止法（営業秘密）', def:'営業秘密の不正取得や、他社の商品と混同させる行為などを禁じる法律。営業秘密と認められるには、秘密として管理され、有用で、公然と知られていないことが必要。'},
    {id:'B0015', term:'個人情報保護法', def:'個人情報を取り扱う事業者に、利用目的の特定・通知、安全管理措置、第三者提供の制限などを義務づける法律。'},
    {id:'B0016', term:'不正アクセス禁止法', def:'他人のIDやパスワードを無断で使ってコンピューターに侵入する行為などを禁じる法律。IDやパスワードを他人に不正に提供する行為も対象。'},
    {id:'B0017', term:'労働者派遣契約', def:'派遣元と雇用関係を結んだ労働者が、派遣先の指揮命令を受けて働く形態。指揮命令権が派遣先にあるのが特徴。'},
    {id:'B0018', term:'請負契約', def:'仕事の完成を約束し、その成果に対して報酬を受け取る契約。発注者に指揮命令権はない。派遣との違いが頻出。'},
    {id:'B0019', term:'下請法', def:'親事業者が下請事業者に対して、代金の支払遅延や不当な値引きなどを行うことを禁じる法律。立場の弱い側を保護する。'},
    {id:'B0020', term:'QC七つ道具', def:'品質管理に使う7つの図表。パレート図（重要な要因の特定）、特性要因図（原因の洗い出し）、ヒストグラム（ばらつきの把握）、散布図（相関の確認）などがある。'},
  ],
  '経営戦略': [
    {id:'B0021', term:'SWOT分析', def:'自社の強み（Strength）・弱み（Weakness）という内部環境と、機会（Opportunity）・脅威（Threat）という外部環境を整理して戦略を立てる手法。'},
    {id:'B0022', term:'PPM（プロダクトポートフォリオマネジメント）', def:'市場成長率と市場占有率の2軸で事業を「花形」「金のなる木」「問題児」「負け犬」に分類し、資源配分を判断する手法。'},
    {id:'B0023', term:'3C分析', def:'顧客（Customer）・競合（Competitor）・自社（Company）の3つの観点から事業環境を分析する手法。'},
    {id:'B0024', term:'コアコンピタンス', def:'他社には真似できない、自社の中核となる強み。これを軸に事業を組み立てるという戦略の考え方。'},
    {id:'B0025', term:'M&Aとアライアンス', def:'M&Aは企業の合併・買収により経営資源を取り込む手法。アライアンスは資本関係を持たず、提携によって協力する手法。'},
    {id:'B0026', term:'アウトソーシング', def:'自社の業務の一部を外部の専門企業に委託すること。コア業務に資源を集中できる反面、ノウハウが社内に蓄積しにくい。'},
    {id:'B0027', term:'マーケティングミックス（4P）', def:'製品（Product）・価格（Price）・流通（Place）・販売促進（Promotion）の4要素を組み合わせて戦略を立てる枠組み。買い手側から見た4C（顧客価値・コスト・利便性・コミュニケーション）と対応する。'},
    {id:'B0028', term:'セグメンテーション／ターゲティング／ポジショニング', def:'市場を細分化し（S）、狙う層を決め（T）、その中で自社の位置づけを明確にする（P）という一連の流れ。STP分析と呼ばれる。'},
    {id:'B0029', term:'CRM（顧客関係管理）', def:'顧客の情報や購買履歴を一元管理し、長期的な関係づくりによって顧客生涯価値を高める取り組み。'},
    {id:'B0030', term:'SCM（サプライチェーンマネジメント）', def:'調達から生産・物流・販売までの流れ全体を最適化し、在庫の削減や納期の短縮を図る取り組み。'},
    {id:'B0031', term:'ERP（企業資源計画）', def:'会計・人事・生産・販売といった基幹業務の情報を1つに統合し、経営資源を全体最適で管理する仕組み。'},
    {id:'B0032', term:'バランススコアカード（BSC）', def:'財務・顧客・業務プロセス・学習と成長という4つの視点から、業績を多面的に評価し戦略を管理する手法。'},
    {id:'B0033', term:'KGIとKPI', def:'KGIは最終的な目標（例：売上10億円）。KPIはその達成度合いを測る中間指標（例：新規顧客数）。KGIがゴール、KPIが道中の計測点。'},
    {id:'B0034', term:'ベンチマーキング', def:'他社の優れた事例と自社を比較し、その差を埋めることで業務を改善する手法。'},
    {id:'B0035', term:'技術経営（MOT）', def:'技術を経営に結びつけ、事業の競争力や収益につなげる考え方。研究開発への投資判断などを扱う。'},
    {id:'B0036', term:'キャズム', def:'新技術の普及過程で、初期採用者と初期多数派の間にある大きな溝。ここを越えられるかが普及の分かれ目になる。'},
    {id:'B0037', term:'ロングテール', def:'売れ筋以外の少量ずつしか売れない商品群の売上合計が、無視できない規模になるという現象。在庫制約の小さいネット通販で顕著。'},
    {id:'B0038', term:'BtoB / BtoC / CtoC', def:'BtoBは企業間取引、BtoCは企業と消費者の取引、CtoCは消費者どうしの取引（フリマアプリなど）。'},
    {id:'B0039', term:'IoT（モノのインターネット）', def:'家電・車・センサーなど、あらゆるモノをネットワークにつなぎ、収集したデータを活用する仕組み。'},
    {id:'B0040', term:'ビッグデータ', def:'従来のやり方では扱いきれない、量が多く・種類が多様で・発生が高速なデータ群。分析して意思決定に活かす。'},
  ],
  'システム戦略': [
    {id:'B0041', term:'情報システム戦略', def:'経営戦略を実現するために、情報システムをどう整備・活用するかを定めた中長期の方針。経営戦略と整合していることが前提。'},
    {id:'B0042', term:'エンタープライズアーキテクチャ（EA）', def:'組織全体の業務とシステムを、ビジネス・データ・アプリケーション・技術の4階層で体系的に整理し、全体最適を図る手法。'},
    {id:'B0043', term:'BPR（業務プロセス再構築）', def:'既存の業務プロセスを部分的に改善するのではなく、根本から抜本的に設計し直すこと。'},
    {id:'B0044', term:'BPM（業務プロセス管理）', def:'業務プロセスを継続的に分析・改善し続ける管理手法。BPRが一度きりの抜本改革なのに対し、BPMは継続的な改善。'},
    {id:'B0045', term:'DFD（データフロー図）', def:'業務におけるデータの流れを、処理・データストア・外部実体・データフローの記号で表した図。'},
    {id:'B0046', term:'E-R図', def:'データベース設計で、実体（エンティティ）とその関連（リレーションシップ）を図示したもの。'},
    {id:'B0047', term:'ワークフローシステム', def:'申請から承認までの一連の手続きを電子化し、順路や進捗を管理する仕組み。'},
    {id:'B0048', term:'SFA（営業支援システム）', def:'営業活動の進捗や商談情報を可視化・共有し、営業の効率と精度を高める仕組み。'},
    {id:'B0049', term:'クラウドコンピューティング', def:'サーバーやソフトウェアを自社で保有せず、ネットワーク越しにサービスとして利用する形態。必要な分だけ使えて初期投資を抑えられる。'},
    {id:'B0050', term:'SaaS / PaaS / IaaS', def:'SaaSは完成したソフトを使う形態、PaaSは開発・実行環境を借りる形態、IaaSはサーバーやストレージなどのインフラを借りる形態。利用者が管理する範囲はIaaSが最も広い。'},
    {id:'B0051', term:'オンプレミス', def:'自社の設備内にサーバーなどを設置して運用する形態。クラウドと対比される。自由度は高いが初期投資と運用負荷が大きい。'},
    {id:'B0052', term:'システム化計画', def:'システム化構想を受けて、対象範囲・スケジュール・体制・費用対効果などを具体化する工程。'},
    {id:'B0053', term:'要件定義', def:'システムに求める機能や性能を、利用者側の視点で明確にする工程。ここが曖昧だと後工程で手戻りが発生する。'},
    {id:'B0054', term:'RFI（情報提供依頼書）', def:'調達に先立ち、ベンダーに製品や技術の情報提供を依頼する文書。RFPより前に行う。'},
    {id:'B0055', term:'RFP（提案依頼書）', def:'システムの要件を提示し、ベンダーに具体的な提案と見積りを依頼する文書。調達の流れは RFI → RFP → 提案書 → 選定 → 契約。'},
    {id:'B0056', term:'ソリューションビジネス', def:'単に製品を売るのではなく、顧客の課題解決の仕組みを一括して提供する事業形態。'},
    {id:'B0057', term:'BI（ビジネスインテリジェンス）', def:'蓄積された業務データを集計・分析し、経営の意思決定に役立てる仕組み。'},
    {id:'B0058', term:'DX（デジタルトランスフォーメーション）', def:'デジタル技術を使って製品・サービス・業務プロセス・ビジネスモデルそのものを変革すること。単なるIT化・デジタル化とは区別される。'},
    {id:'B0059', term:'共通フレーム', def:'ソフトウェアの企画から開発・運用・保守までの作業内容と用語を、発注側と受注側で共通に理解するための指針。'},
    {id:'B0060', term:'RPA（ロボティックプロセスオートメーション）', def:'定型的なパソコン操作をソフトウェアのロボットに代行させ、事務作業を自動化する仕組み。'},
  ],
  '開発技術': [
    {id:'B0061', term:'ソフトウェアライフサイクル', def:'企画 → 要件定義 → 開発 → 運用 → 保守という、ソフトウェアが生まれてから廃棄されるまでの一連の流れ。'},
    {id:'B0062', term:'外部設計（基本設計）', def:'利用者から見える部分（画面・帳票・操作の流れ）を設計する工程。要件定義の次に行う。'},
    {id:'B0063', term:'内部設計（詳細設計）', def:'外部設計を受けて、プログラムの内部構造やデータの処理方法など、開発者から見える部分を設計する工程。'},
    {id:'B0064', term:'単体テスト', def:'モジュール（部品）単位で正しく動くかを確認するテスト。最初に行うテスト工程。'},
    {id:'B0065', term:'結合テスト', def:'複数のモジュールを組み合わせて、連携が正しく動くかを確認するテスト。'},
    {id:'B0066', term:'システムテスト（総合テスト）', def:'システム全体が要求どおりの機能・性能を満たすかを、開発者側で確認するテスト。'},
    {id:'B0067', term:'運用テスト（受入テスト）', def:'実際の業務に沿って利用者側が行う最終確認のテスト。ここで承認されて本稼働に移る。'},
    {id:'B0068', term:'ホワイトボックステスト', def:'プログラムの内部構造を理解したうえで、命令や分岐が網羅されるように行うテスト。主に単体テストで使う。'},
    {id:'B0069', term:'ブラックボックステスト', def:'内部構造を見ずに、入力と出力の関係が仕様どおりかを確認するテスト。'},
    {id:'B0070', term:'リグレッションテスト（回帰テスト）', def:'修正を加えた際に、これまで正常だった部分が壊れていないかを確認するテスト。'},
    {id:'B0071', term:'ウォーターフォールモデル', def:'上流工程から下流工程へ順に進め、前工程に戻らないことを前提とする開発手法。工程の区切りが明確な反面、後からの仕様変更に弱い。'},
    {id:'B0072', term:'アジャイル開発', def:'短い期間の反復で、動くソフトウェアを少しずつ作り上げていく開発手法。仕様変更に柔軟に対応できる。'},
    {id:'B0073', term:'スクラム', def:'アジャイル開発の代表的な進め方。スプリントと呼ばれる短い期間を繰り返し、デイリースクラムや振り返りを行う。'},
    {id:'B0074', term:'XP（エクストリームプログラミング）', def:'アジャイル開発手法のひとつ。ペアプログラミング、テスト駆動開発、リファクタリングなどの実践を重視する。'},
    {id:'B0075', term:'ペアプログラミング', def:'2人1組で1台の端末を使い、一方が書き一方が確認しながら開発する手法。品質向上と知識共有が狙い。'},
    {id:'B0076', term:'リファクタリング', def:'外から見た動作を変えずに、プログラムの内部構造を整理して分かりやすくすること。'},
    {id:'B0077', term:'テスト駆動開発（TDD）', def:'先にテストを書き、それを通るようにコードを書く進め方。仕様を明確にしながら開発できる。'},
    {id:'B0078', term:'DevOps', def:'開発（Development）と運用（Operations）が連携し、リリースまでの流れを自動化・迅速化する考え方。'},
    {id:'B0079', term:'プロトタイピング', def:'試作品を早い段階で作って利用者に確認してもらい、認識のずれを早期に解消する開発手法。'},
    {id:'B0080', term:'オブジェクト指向', def:'データと処理をひとまとめにした「オブジェクト」を組み合わせて作る考え方。カプセル化（内部を隠す）・継承（性質を引き継ぐ）・多態性が特徴。'},
  ],
  'プロジェクトマネジメント': [
    {id:'B0081', term:'プロジェクト', def:'独自の成果物を作るために、開始と終了が定められた有期的な活動。定常業務との違いは「有期性」と「独自性」。'},
    {id:'B0082', term:'PMBOK', def:'プロジェクトマネジメントの知識体系。スコープ・スケジュール・コスト・品質・資源・リスクなどの領域に整理されている。'},
    {id:'B0083', term:'スコープ管理', def:'プロジェクトで「何をやり、何をやらないか」の範囲を定義し、管理すること。範囲が勝手に膨らむことをスコープクリープという。'},
    {id:'B0084', term:'WBS（作業分解構成図）', def:'成果物を作るための作業を、階層的に細かく分解した図。見積りや進捗管理の土台になる。'},
    {id:'B0085', term:'アローダイアグラム（PERT図）', def:'作業の順序と所要日数を矢印で表し、全体の日程を検討する図。'},
    {id:'B0086', term:'クリティカルパス', def:'アローダイアグラム上で、最も日数がかかる経路。ここが遅れると全体の納期が遅れるため、重点的に管理する。'},
    {id:'B0087', term:'ガントチャート', def:'作業を横棒で表し、開始日と終了日、進捗を時系列で示す図。進捗の可視化に使う。'},
    {id:'B0088', term:'マイルストーン', def:'プロジェクトの節目となる重要な時点。設計完了や本稼働開始など、達成状況を確認する目印になる。'},
    {id:'B0089', term:'プロジェクト憲章', def:'プロジェクトの目的・目標・体制・責任者を公式に定めた文書。プロジェクトの開始を承認するもの。'},
    {id:'B0090', term:'QCD（品質・コスト・納期）', def:'プロジェクトで両立が難しい3要素。ひとつを優先すると他が犠牲になりやすいトレードオフの関係にある。'},
    {id:'B0091', term:'ファンクションポイント法', def:'システムの機能の数と複雑さから開発規模を見積もる手法。画面数や帳票数などを基に算出する。'},
    {id:'B0092', term:'類推見積法', def:'過去の類似プロジェクトの実績を基に規模や工数を見積もる手法。手早いが精度は経験に左右される。'},
    {id:'B0093', term:'リスクマネジメント', def:'プロジェクトに影響しうる不確実な事象を洗い出し、発生確率と影響度を評価して、回避・軽減・転嫁・受容の対応を決めること。'},
    {id:'B0094', term:'ステークホルダマネジメント', def:'プロジェクトに関わる人々の期待や関心を把握し、適切に関与してもらうよう調整すること。'},
    {id:'B0095', term:'コミュニケーションマネジメント', def:'誰に・何を・いつ・どの方法で伝えるかを計画し、情報が確実に共有されるようにすること。'},
    {id:'B0096', term:'調達マネジメント', def:'外部から製品やサービスを購入・契約する計画を立て、契約の履行を管理すること。'},
    {id:'B0097', term:'進捗管理', def:'計画と実績の差を把握し、遅れがあれば要員の追加や作業順序の変更などの対策を打つこと。'},
    {id:'B0098', term:'EVM（アーンドバリューマネジメント）', def:'計画価値・出来高・実コストを金額に換算して比較し、進捗とコストの状況を同時に把握する手法。'},
    {id:'B0099', term:'要員計画', def:'必要な人数・スキル・期間を見積もり、いつ誰を配置するかを決めること。人を増やせば必ず早くなるとは限らない点に注意。'},
    {id:'B0100', term:'プロジェクトの終結', def:'成果物の引き渡しと承認を受け、契約を完了させ、得られた教訓を組織の資産として記録する工程。'},
  ],
  'サービスマネジメント': [
    {id:'B0101', term:'ITサービスマネジメント', def:'ITを「サービス」として捉え、利用者の満足度を保ちながら継続的に提供・改善していく管理の考え方。'},
    {id:'B0102', term:'ITIL', def:'ITサービスマネジメントのベストプラクティスをまとめた指針。多くの企業が運用設計の参考にしている。'},
    {id:'B0103', term:'SLA（サービスレベル合意書）', def:'提供するサービスの品質水準（稼働率・応答時間・復旧時間など）を、提供者と利用者の間で合意した文書。'},
    {id:'B0104', term:'SLM（サービスレベル管理）', def:'SLAで定めた水準を維持できているかを継続的に測定・報告し、必要に応じて改善する活動。'},
    {id:'B0105', term:'インシデント管理', def:'障害が起きたとき、まず「サービスを一刻も早く復旧させること」を目的とする活動。根本原因の究明は問題管理の役割。'},
    {id:'B0106', term:'問題管理', def:'インシデントの根本原因を突き止め、再発を防ぐ活動。インシデント管理との役割の違いが頻出。'},
    {id:'B0107', term:'変更管理', def:'システムへの変更を、影響を評価したうえで承認・記録し、統制のとれた形で実施する活動。'},
    {id:'B0108', term:'構成管理', def:'ハードウェア・ソフトウェア・ドキュメントなどの構成情報を正確に把握し、最新の状態に保つ活動。'},
    {id:'B0109', term:'リリース管理', def:'変更を本番環境へ計画的に展開し、問題があれば元に戻せるようにする活動。'},
    {id:'B0110', term:'サービスデスク', def:'利用者からの問い合わせや障害連絡を受け付ける単一の窓口。一次対応と適切な部署への引き継ぎを行う。'},
    {id:'B0111', term:'キャパシティ管理', def:'処理能力や容量が将来の需要に対して足りるかを予測し、不足しないように計画する活動。'},
    {id:'B0112', term:'可用性管理', def:'サービスが使える状態をどれだけ維持できるかを管理する活動。稼働率が指標になる。'},
    {id:'B0113', term:'ファシリティマネジメント', def:'サーバー室の電源・空調・入退室管理など、施設や設備を適切に維持管理すること。'},
    {id:'B0114', term:'UPS（無停電電源装置）', def:'停電時に一時的に電力を供給し、機器を安全に停止させるための装置。長時間の稼働継続が目的ではない。'},
    {id:'B0115', term:'バックアップの方式', def:'フルバックアップは全件、差分バックアップは前回フル以降の変更分、増分バックアップは前回バックアップ以降の変更分を取る。復元の手間は増分が最も大きい。'},
    {id:'B0116', term:'システム監査', def:'情報システムが適切に整備・運用されているかを、独立した立場の監査人が点検・評価し、助言や勧告を行うこと。'},
    {id:'B0117', term:'監査人の独立性', def:'監査対象の部門から独立していること。自分が構築や運用に関わったシステムを自分で監査してはならない。'},
    {id:'B0118', term:'内部統制', def:'業務が適正に行われるよう組織自らが整備・運用する仕組み。業務の有効性、財務報告の信頼性、法令遵守、資産の保全を目的とする。'},
    {id:'B0119', term:'職務分掌', def:'ひとりの担当者に権限が集中しないよう、申請者と承認者を分けるなど役割を分離すること。不正の防止につながる。'},
    {id:'B0120', term:'監査証跡', def:'いつ誰が何をしたかを事後に追跡できる記録。ログなどが該当し、監査や不正の追及に使う。'},
  ],
  '基礎理論': [
    {id:'B0121', term:'2進数', def:'0と1の2つの数字だけで数を表す方法。コンピューター内部の表現。10進数の5は2進数で101になる。'},
    {id:'B0122', term:'16進数', def:'0〜9とA〜Fの16種類で数を表す方法。2進数4桁が16進数1桁に対応するため、長い2進数を短く書ける。'},
    {id:'B0123', term:'ビットとバイト', def:'ビットは0か1の1桁分の情報量。8ビットで1バイト。1バイトで256通りを表現できる。'},
    {id:'B0124', term:'論理演算', def:'AND（両方が真なら真）、OR（どちらかが真なら真）、NOT（真偽を反転）、XOR（片方だけ真なら真）の演算。'},
    {id:'B0125', term:'論理回路', def:'論理演算をハードウェアで実現した回路。AND回路・OR回路・NOT回路を組み合わせて計算を行う。'},
    {id:'B0126', term:'集合とベン図', def:'和集合（どちらか）・積集合（両方）・差集合の関係を図で表したもの。検索条件の考え方にも通じる。'},
    {id:'B0127', term:'確率', def:'ある事象の起こりやすさを0〜1で表したもの。「少なくとも1つ」を求めるときは、余事象（1 − 起こらない確率）を使うと計算が楽になる。'},
    {id:'B0128', term:'順列と組合せ', def:'順列は並べる順序を区別する数え方、組合せは順序を区別しない数え方。'},
    {id:'B0129', term:'平均・中央値・最頻値', def:'平均は合計を個数で割った値、中央値は順に並べた真ん中の値、最頻値は最も多く現れる値。極端な値があるときは中央値のほうが実態を表しやすい。'},
    {id:'B0130', term:'標準偏差', def:'データが平均からどれだけばらついているかを示す値。大きいほどばらつきが大きい。'},
    {id:'B0131', term:'相関係数', def:'2つのデータの関係の強さを −1〜1 で表す値。1に近いと正の相関、−1に近いと負の相関、0に近いと関係が薄い。相関があっても因果があるとは限らない。'},
    {id:'B0132', term:'文字コード', def:'文字をコンピューターで扱うために数値に対応づけた規則。ASCII、Shift_JIS、Unicode（UTF-8）などがある。'},
    {id:'B0133', term:'アルゴリズム', def:'問題を解くための手順を、順序立てて明確に定めたもの。同じ結果でも手順によって処理速度が変わる。'},
    {id:'B0134', term:'フローチャート', def:'処理の流れを、開始・処理・判断・終了などの記号でつないで図示したもの。'},
    {id:'B0135', term:'線形探索と二分探索', def:'線形探索は先頭から順に探す方法。二分探索は並べ替え済みのデータを半分ずつ絞り込む方法で、データが多いほど速い。'},
    {id:'B0136', term:'整列（ソート）', def:'データを昇順や降順に並べ替えること。バブルソートや選択ソートなどの方法がある。'},
    {id:'B0137', term:'変数と配列', def:'変数は値を1つ入れる箱。配列は同じ種類の値を番号付きで並べて入れる箱。'},
    {id:'B0138', term:'スタックとキュー', def:'スタックは後入れ先出し（LIFO）、キューは先入れ先出し（FIFO）でデータを出し入れするデータ構造。'},
    {id:'B0139', term:'木構造（ツリー）', def:'データを親子関係で階層的に表すデータ構造。フォルダ構成や組織図が身近な例。'},
    {id:'B0140', term:'待ち行列', def:'処理を待つ列の長さや待ち時間を数理的に分析する考え方。窓口を増やすと待ち時間がどう変わるかなどを検討できる。'},
  ],
  'コンピュータシステム': [
    {id:'B0141', term:'CPU（中央処理装置）', def:'命令の解読と演算を行う、コンピューターの中核となる装置。プロセッサとも呼ぶ。'},
    {id:'B0142', term:'クロック周波数', def:'CPUが動作するタイミングの速さ。単位はHz（ヘルツ）で、大きいほど1秒あたりの処理回数が多い。ただし性能はこれだけでは決まらない。'},
    {id:'B0143', term:'マルチコアプロセッサ', def:'1つのCPUに演算の中核（コア）を複数搭載したもの。並行して処理でき、全体の処理能力が上がる。'},
    {id:'B0144', term:'主記憶装置（メインメモリ）', def:'CPUが直接読み書きする記憶装置。高速だが電源を切ると内容が消える（揮発性）。'},
    {id:'B0145', term:'キャッシュメモリ', def:'CPUと主記憶の間に置く高速な記憶装置。よく使うデータを保持して速度差を埋める。'},
    {id:'B0146', term:'補助記憶装置', def:'SSDやHDDなど、電源を切っても内容が残る（不揮発性）記憶装置。主記憶より低速だが大容量。'},
    {id:'B0147', term:'SSDとHDD', def:'SSDはフラッシュメモリを使い、高速で衝撃に強い。HDDは磁気ディスクを回転させる方式で、容量あたりの単価が安い。'},
    {id:'B0148', term:'RAID', def:'複数の記憶装置を組み合わせて、速度や信頼性を高める技術。RAID1（ミラーリング）は同じ内容を2台に書いて冗長化し、RAID0（ストライピング）は分散して書いて高速化する。'},
    {id:'B0149', term:'インターフェース', def:'機器どうしを接続する規格。USB、HDMI、Bluetooth、Wi-Fiなど。無線か有線か、何を伝送するかで使い分ける。'},
    {id:'B0150', term:'クライアントサーバシステム', def:'サービスを提供するサーバーと、利用するクライアントに役割を分けた構成。'},
    {id:'B0151', term:'シンクライアント', def:'端末側に最小限の機能しか持たせず、処理やデータをサーバー側に集約する方式。端末の紛失時に情報漏えいしにくい。'},
    {id:'B0152', term:'仮想化', def:'1台の物理サーバー上に複数の仮想的なコンピューターを動かす技術。設備の集約と柔軟な構成変更ができる。'},
    {id:'B0153', term:'デュアルシステム', def:'同じ処理を2系統で並行して行い、結果を照合する構成。信頼性が非常に高いがコストも高い。'},
    {id:'B0154', term:'デュプレックスシステム', def:'現用系と待機系を用意し、障害時に待機系へ切り替える構成。待機系を普段どう使うかでホットスタンバイ・コールドスタンバイに分かれる。'},
    {id:'B0155', term:'クラスタリング', def:'複数のコンピューターを連携させて1台のように扱う技術。負荷分散や可用性の向上が目的。'},
    {id:'B0156', term:'稼働率', def:'システムが正常に動いている時間の割合。直列に接続した装置は掛け算、並列（冗長化）は「1 −（1 − 稼働率）の積」で求める。'},
    {id:'B0157', term:'MTBFとMTTR', def:'MTBFは平均故障間隔（壊れずに動く平均時間）、MTTRは平均修復時間。稼働率は MTBF ÷（MTBF + MTTR）で求める。'},
    {id:'B0158', term:'OS（オペレーティングシステム）', def:'ハードウェアとアプリケーションの間に立ち、資源の管理や共通機能の提供を行う基本ソフトウェア。'},
    {id:'B0159', term:'ファイルの拡張子', def:'ファイル名の末尾に付く、種類を示す文字列。.txt、.csv、.pdf、.jpg など。プログラムがどのアプリで開くかの判断に使う。'},
    {id:'B0160', term:'OSS（オープンソースソフトウェア）', def:'ソースコードが公開され、利用・改変・再配布が認められているソフトウェア。無償とは限らず、ライセンス条件を守る必要がある。'},
  ],
  '技術要素': [
    {id:'B0161', term:'関係データベース（RDB）', def:'データを行と列の表形式で管理し、表どうしを関連づけて扱うデータベース。'},
    {id:'B0162', term:'主キー', def:'表の中で各行を一意に識別するための列。重複せず、空欄（NULL）にもできない。'},
    {id:'B0163', term:'外部キー', def:'他の表の主キーを参照する列。表どうしの関連づけに使い、整合性を保つ。'},
    {id:'B0164', term:'正規化', def:'データの重複や矛盾が起きないように表を分割して整理すること。更新時の不整合を防げる。'},
    {id:'B0165', term:'SQL', def:'関係データベースを操作するための言語。SELECT（検索）、INSERT（追加）、UPDATE（更新）、DELETE（削除）などがある。'},
    {id:'B0166', term:'トランザクション', def:'関連する複数の処理をひとまとまりとして扱う単位。すべて成功（コミット）か、すべて取り消し（ロールバック）のどちらかになる。'},
    {id:'B0167', term:'排他制御', def:'複数の利用者が同じデータを同時に更新して矛盾が起きないよう、一時的にアクセスを制限する仕組み。'},
    {id:'B0168', term:'LANとWAN', def:'LANは建物内など狭い範囲のネットワーク。WANは拠点間を結ぶ広い範囲のネットワーク。'},
    {id:'B0169', term:'TCP/IP', def:'インターネットで標準的に使われる通信規約の体系。データを分割して届け、順序や欠落を管理する。'},
    {id:'B0170', term:'IPアドレス', def:'ネットワーク上の機器を識別する番号。世界で一意なグローバルIPアドレスと、組織内で使うプライベートIPアドレスがある。'},
    {id:'B0171', term:'DNS', def:'ドメイン名（例：example.com）とIPアドレスを対応づけて変換する仕組み。'},
    {id:'B0172', term:'DHCP', def:'ネットワークに接続した機器へ、IPアドレスなどの設定を自動的に割り当てる仕組み。'},
    {id:'B0173', term:'HTTPとHTTPS', def:'Webの通信規約。HTTPSはHTTPの通信をTLSで暗号化したもので、盗聴や改ざんを防ぐ。'},
    {id:'B0174', term:'情報セキュリティの3要素（CIA）', def:'機密性（許可された人だけが見られる）、完全性（改ざんされていない）、可用性（必要なときに使える）。この3つを保つことが情報セキュリティの目的。'},
    {id:'B0175', term:'マルウェア', def:'コンピューターに害を与える不正なソフトウェアの総称。ウイルス、ワーム、トロイの木馬、スパイウェアなどが含まれる。'},
    {id:'B0176', term:'ランサムウェア', def:'データを暗号化して使えなくし、復元と引き換えに身代金を要求するマルウェア。バックアップの分離保管が有効な対策。'},
    {id:'B0177', term:'フィッシングとソーシャルエンジニアリング', def:'フィッシングは偽サイトへ誘導して情報を盗む手口。ソーシャルエンジニアリングは技術ではなく人の心理や隙を突いて情報を得る手口（なりすまし電話・のぞき見など）。'},
    {id:'B0178', term:'共通鍵暗号と公開鍵暗号', def:'共通鍵暗号は暗号化と復号に同じ鍵を使い高速だが、鍵の受け渡しが課題。公開鍵暗号は公開鍵で暗号化し秘密鍵で復号するため、鍵の配布が容易。'},
    {id:'B0179', term:'デジタル署名と電子証明書', def:'デジタル署名は送信者が秘密鍵で署名し、受信者が公開鍵で検証することで、なりすましと改ざんを防ぐ。電子証明書は認証局がその公開鍵の持ち主を保証する。'},
    {id:'B0180', term:'多要素認証', def:'知識（パスワード）・所持（スマホやカード）・生体（指紋や顔）のうち2種類以上を組み合わせる認証方式。1つ破られても不正利用を防げる。'},
  ],
};

// ─── 過去問カテゴリ ────────────────────────────────────────
// IDは FC_CATS_DEF のIDから 'cat_' を除いたもの（weakDiagnosis の規約）。
const QCAT = [
  {id:'corp',     name:'企業と法務',              icon:'scale',     tone:'blue'},
  {id:'strategy', name:'経営戦略',                icon:'chart-up',  tone:'orange'},
  {id:'syssta',   name:'システム戦略',            icon:'map',       tone:'ok'},
  {id:'dev',      name:'開発技術',                icon:'wrench',    tone:'orange'},
  {id:'pm',       name:'プロジェクトマネジメント',icon:'clipboard', tone:'blue'},
  {id:'sm',       name:'サービスマネジメント',    icon:'gear',      tone:'ok'},
  {id:'theory',   name:'基礎理論',                icon:'list-ol',   tone:'blue'},
  {id:'comp',     name:'コンピュータシステム',    icon:'monitor',   tone:'orange'},
  {id:'tech',     name:'技術要素',                icon:'lock',      tone:'ng'},
];

/* ─── 図（SVG）─────────────────────────────────────────────
   作問ルール第1項。図が本質的に必要な問題に埋め込む。
   色は currentColor とカラートークンのみを使い、ダークテーマでも
   見えなくならないようにする。複数の問題で使い回してよい。 */

// PPM（プロダクトポートフォリオマネジメント）の4象限
const FIG_PPM = `<svg viewBox="0 0 320 250" width="320" role="img" aria-label="市場成長率と市場占有率で4象限に分けたPPMの図">
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <line x1="56" y1="26" x2="56" y2="206"/><line x1="56" y1="206" x2="290" y2="206"/>
    <line x1="173" y1="26" x2="173" y2="206" stroke="var(--line)"/>
    <line x1="56" y1="116" x2="290" y2="116" stroke="var(--line)"/>
    <text x="10" y="60" font-size="11" fill="currentColor" stroke="none">市場</text>
    <text x="10" y="74" font-size="11" fill="currentColor" stroke="none">成長率</text>
    <text x="26" y="44" font-size="11" fill="currentColor" stroke="none">高</text>
    <text x="26" y="200" font-size="11" fill="currentColor" stroke="none">低</text>
    <text x="150" y="228" font-size="11" fill="currentColor" stroke="none">市場占有率</text>
    <text x="262" y="224" font-size="11" fill="currentColor" stroke="none">高</text>
    <text x="66" y="224" font-size="11" fill="currentColor" stroke="none">低</text>
    <text x="92" y="76" font-size="12.5" fill="currentColor" stroke="none">領域ア</text>
    <text x="208" y="76" font-size="12.5" fill="currentColor" stroke="none">花形</text>
    <text x="92" y="166" font-size="12.5" fill="currentColor" stroke="none">負け犬</text>
    <text x="208" y="166" font-size="12.5" fill="currentColor" stroke="none">領域イ</text>
  </g>
</svg>`;

// SWOT分析の4象限
const FIG_SWOT = `<svg viewBox="0 0 340 200" width="340" role="img" aria-label="内部環境と外部環境、好影響と悪影響で分けたSWOT分析の図">
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="78" y="34" width="122" height="66" rx="4" stroke="var(--ok)"/>
    <rect x="200" y="34" width="122" height="66" rx="4" stroke="var(--ng)"/>
    <rect x="78" y="100" width="122" height="66" rx="4" stroke="var(--ok)"/>
    <rect x="200" y="100" width="122" height="66" rx="4" stroke="var(--ng)"/>
    <text x="110" y="26" font-size="11.5" fill="currentColor" stroke="none">好影響</text>
    <text x="232" y="26" font-size="11.5" fill="currentColor" stroke="none">悪影響</text>
    <text x="6" y="72" font-size="11.5" fill="currentColor" stroke="none">内部環境</text>
    <text x="6" y="138" font-size="11.5" fill="currentColor" stroke="none">外部環境</text>
    <text x="118" y="72" font-size="13" fill="currentColor" stroke="none">強み</text>
    <text x="240" y="72" font-size="13" fill="currentColor" stroke="none">弱み</text>
    <text x="112" y="138" font-size="13" fill="currentColor" stroke="none">領域X</text>
    <text x="240" y="138" font-size="13" fill="currentColor" stroke="none">脅威</text>
  </g>
</svg>`;

// 損益分岐点のグラフ
const FIG_BEP = `<svg viewBox="0 0 330 230" width="330" role="img" aria-label="売上高と総費用の交点として損益分岐点を示すグラフ">
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <line x1="48" y1="20" x2="48" y2="190"/><line x1="48" y1="190" x2="300" y2="190"/>
    <text x="8" y="30" font-size="11" fill="currentColor" stroke="none">金額</text>
    <text x="252" y="212" font-size="11" fill="currentColor" stroke="none">売上高</text>
    <line x1="48" y1="190" x2="272" y2="34" stroke="var(--blue)" stroke-width="2"/>
    <text x="238" y="30" font-size="11" fill="var(--blue)" stroke="none">売上高</text>
    <line x1="48" y1="140" x2="272" y2="60" stroke="var(--orange)" stroke-width="2"/>
    <text x="228" y="72" font-size="11" fill="var(--orange)" stroke="none">総費用</text>
    <line x1="48" y1="140" x2="272" y2="140" stroke="var(--dim)" stroke-dasharray="4 4"/>
    <text x="54" y="154" font-size="10.5" fill="currentColor" stroke="none">固定費</text>
    <circle cx="182" cy="97" r="4.5" fill="var(--ng)" stroke="none"/>
    <line x1="182" y1="97" x2="182" y2="190" stroke="var(--ng)" stroke-dasharray="3 3"/>
    <text x="150" y="88" font-size="11.5" fill="var(--ng)" stroke="none">点P</text>
  </g>
</svg>`;

// パレート図
const FIG_PARETO = `<svg viewBox="0 0 320 210" width="320" role="img" aria-label="件数の棒グラフと累積比率の折れ線を組み合わせたパレート図">
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <line x1="44" y1="18" x2="44" y2="168"/><line x1="44" y1="168" x2="296" y2="168"/>
    <rect x="56" y="40" width="34" height="128" fill="var(--orange)" stroke="none" opacity="0.75"/>
    <rect x="98" y="78" width="34" height="90" fill="var(--orange)" stroke="none" opacity="0.75"/>
    <rect x="140" y="112" width="34" height="56" fill="var(--orange)" stroke="none" opacity="0.75"/>
    <rect x="182" y="136" width="34" height="32" fill="var(--orange)" stroke="none" opacity="0.75"/>
    <rect x="224" y="152" width="34" height="16" fill="var(--orange)" stroke="none" opacity="0.75"/>
    <polyline points="73,132 115,96 157,70 199,54 241,44" stroke="var(--blue)" stroke-width="2"/>
    <circle cx="73" cy="132" r="3" fill="var(--blue)" stroke="none"/>
    <circle cx="115" cy="96" r="3" fill="var(--blue)" stroke="none"/>
    <circle cx="157" cy="70" r="3" fill="var(--blue)" stroke="none"/>
    <circle cx="199" cy="54" r="3" fill="var(--blue)" stroke="none"/>
    <circle cx="241" cy="44" r="3" fill="var(--blue)" stroke="none"/>
    <text x="8" y="28" font-size="10.5" fill="currentColor" stroke="none">件数</text>
    <text x="252" y="30" font-size="10.5" fill="var(--blue)" stroke="none">累積比率</text>
    <text x="58" y="184" font-size="10.5" fill="currentColor" stroke="none">要因A</text>
    <text x="100" y="184" font-size="10.5" fill="currentColor" stroke="none">要因B</text>
    <text x="142" y="184" font-size="10.5" fill="currentColor" stroke="none">要因C</text>
    <text x="184" y="184" font-size="10.5" fill="currentColor" stroke="none">要因D</text>
    <text x="226" y="184" font-size="10.5" fill="currentColor" stroke="none">要因E</text>
  </g>
</svg>`;

// SaaS / PaaS / IaaS の管理範囲
const FIG_CLOUD = `<svg viewBox="0 0 400 210" width="400" role="img" aria-label="SaaSとPaaSとIaaSで利用者と事業者の管理範囲を比べた図">
  <g fill="none" stroke="currentColor" stroke-width="1.4" font-size="10.5">
    <text x="16" y="24" fill="currentColor" stroke="none">層</text>
    <text x="128" y="24" fill="currentColor" stroke="none">SaaS</text>
    <text x="222" y="24" fill="currentColor" stroke="none">PaaS</text>
    <text x="316" y="24" fill="currentColor" stroke="none">方式X</text>
    <text x="8" y="52" fill="currentColor" stroke="none">アプリ</text>
    <text x="8" y="86" fill="currentColor" stroke="none">ミドルウェア</text>
    <text x="8" y="120" fill="currentColor" stroke="none">OS</text>
    <text x="8" y="154" fill="currentColor" stroke="none">仮想化・HW</text>
    <rect x="106" y="36" width="76" height="26" rx="3" stroke="var(--dim)"/>
    <rect x="106" y="70" width="76" height="26" rx="3" stroke="var(--dim)"/>
    <rect x="106" y="104" width="76" height="26" rx="3" stroke="var(--dim)"/>
    <rect x="106" y="138" width="76" height="26" rx="3" stroke="var(--dim)"/>
    <rect x="200" y="36" width="76" height="26" rx="3" stroke="var(--orange)"/>
    <rect x="200" y="70" width="76" height="26" rx="3" stroke="var(--dim)"/>
    <rect x="200" y="104" width="76" height="26" rx="3" stroke="var(--dim)"/>
    <rect x="200" y="138" width="76" height="26" rx="3" stroke="var(--dim)"/>
    <rect x="294" y="36" width="76" height="26" rx="3" stroke="var(--orange)"/>
    <rect x="294" y="70" width="76" height="26" rx="3" stroke="var(--orange)"/>
    <rect x="294" y="104" width="76" height="26" rx="3" stroke="var(--orange)"/>
    <rect x="294" y="138" width="76" height="26" rx="3" stroke="var(--dim)"/>
    <text x="196" y="188" fill="var(--orange)" stroke="none">オレンジ枠＝利用者が管理する層</text>
  </g>
</svg>`;

// V字モデル
const FIG_VMODEL = `<svg viewBox="0 0 400 220" width="400" role="img" aria-label="開発工程と対応するテスト工程を結んだV字モデルの図">
  <g fill="none" stroke="currentColor" stroke-width="1.4" font-size="10.5">
    <rect x="14" y="16" width="104" height="26" rx="4" stroke="var(--blue)"/>
    <text x="34" y="34" fill="currentColor" stroke="none">要件定義</text>
    <rect x="52" y="66" width="104" height="26" rx="4" stroke="var(--blue)"/>
    <text x="70" y="84" fill="currentColor" stroke="none">外部設計</text>
    <rect x="90" y="116" width="104" height="26" rx="4" stroke="var(--blue)"/>
    <text x="108" y="134" fill="currentColor" stroke="none">内部設計</text>
    <rect x="128" y="166" width="118" height="26" rx="4" stroke="var(--orange)"/>
    <text x="146" y="184" fill="currentColor" stroke="none">プログラミング</text>
    <rect x="266" y="16" width="118" height="26" rx="4" stroke="var(--ok)"/>
    <text x="282" y="34" fill="currentColor" stroke="none">テストX</text>
    <rect x="248" y="66" width="118" height="26" rx="4" stroke="var(--ok)"/>
    <text x="262" y="84" fill="currentColor" stroke="none">システムテスト</text>
    <rect x="230" y="116" width="104" height="26" rx="4" stroke="var(--ok)"/>
    <text x="250" y="134" fill="currentColor" stroke="none">結合テスト</text>
    <rect x="212" y="166" width="104" height="26" rx="4" stroke="var(--ok)"/>
    <text x="232" y="184" fill="currentColor" stroke="none">単体テスト</text>
    <line x1="118" y1="29" x2="266" y2="29" stroke-dasharray="4 3" stroke="var(--dim)"/>
    <line x1="156" y1="79" x2="248" y2="79" stroke-dasharray="4 3" stroke="var(--dim)"/>
    <line x1="194" y1="129" x2="230" y2="129" stroke-dasharray="4 3" stroke="var(--dim)"/>
  </g>
</svg>`;

// WBS の階層
const FIG_WBS = `<svg viewBox="0 0 380 180" width="380" role="img" aria-label="プロジェクトを階層的に分解したWBSの図">
  <g fill="none" stroke="currentColor" stroke-width="1.4" font-size="11">
    <rect x="140" y="14" width="104" height="28" rx="4" stroke="var(--orange)"/>
    <text x="156" y="33" fill="currentColor" stroke="none">システム開発</text>
    <line x1="192" y1="42" x2="192" y2="60"/>
    <line x1="70" y1="60" x2="314" y2="60"/>
    <line x1="70" y1="60" x2="70" y2="76"/><line x1="192" y1="60" x2="192" y2="76"/><line x1="314" y1="60" x2="314" y2="76"/>
    <rect x="24" y="76" width="92" height="26" rx="4" stroke="var(--blue)"/>
    <text x="42" y="94" fill="currentColor" stroke="none">要件定義</text>
    <rect x="146" y="76" width="92" height="26" rx="4" stroke="var(--blue)"/>
    <text x="172" y="94" fill="currentColor" stroke="none">設計</text>
    <rect x="268" y="76" width="92" height="26" rx="4" stroke="var(--blue)"/>
    <text x="290" y="94" fill="currentColor" stroke="none">テスト</text>
    <line x1="70" y1="102" x2="70" y2="118"/>
    <line x1="40" y1="118" x2="100" y2="118"/>
    <line x1="40" y1="118" x2="40" y2="132"/><line x1="100" y1="118" x2="100" y2="132"/>
    <rect x="8" y="132" width="64" height="24" rx="4" stroke="var(--dim)"/>
    <text x="18" y="149" font-size="10" fill="currentColor" stroke="none">業務調査</text>
    <rect x="76" y="132" width="64" height="24" rx="4" stroke="var(--dim)"/>
    <text x="86" y="149" font-size="10" fill="currentColor" stroke="none">要件整理</text>
  </g>
</svg>`;

// アローダイアグラム
const FIG_ARROW = `<svg viewBox="0 0 420 160" width="420" role="img" aria-label="作業A〜Eの順序と所要日数を示すアローダイアグラム">
  <defs><marker id="ipah" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="30" cy="80" r="16" stroke="var(--blue)"/><text x="25" y="85" font-size="11.5" fill="currentColor" stroke="none">1</text>
    <circle cx="156" cy="32" r="16" stroke="var(--blue)"/><text x="151" y="37" font-size="11.5" fill="currentColor" stroke="none">2</text>
    <circle cx="156" cy="128" r="16" stroke="var(--blue)"/><text x="151" y="133" font-size="11.5" fill="currentColor" stroke="none">3</text>
    <circle cx="282" cy="80" r="16" stroke="var(--blue)"/><text x="277" y="85" font-size="11.5" fill="currentColor" stroke="none">4</text>
    <circle cx="392" cy="80" r="16" stroke="var(--blue)"/><text x="387" y="85" font-size="11.5" fill="currentColor" stroke="none">5</text>
    <line x1="45" y1="72" x2="139" y2="40" marker-end="url(#ipah)"/>
    <text x="70" y="46" font-size="11" fill="currentColor" stroke="none">A（5日）</text>
    <line x1="45" y1="88" x2="139" y2="120" marker-end="url(#ipah)"/>
    <text x="70" y="122" font-size="11" fill="currentColor" stroke="none">B（3日）</text>
    <line x1="172" y1="40" x2="266" y2="72" marker-end="url(#ipah)"/>
    <text x="198" y="48" font-size="11" fill="currentColor" stroke="none">C（4日）</text>
    <line x1="172" y1="120" x2="266" y2="88" marker-end="url(#ipah)"/>
    <text x="198" y="124" font-size="11" fill="currentColor" stroke="none">D（2日）</text>
    <line x1="298" y1="80" x2="374" y2="80" marker-end="url(#ipah)"/>
    <text x="306" y="72" font-size="11" fill="currentColor" stroke="none">E（6日）</text>
  </g>
</svg>`;

// 直列接続と並列接続
const FIG_SP = `<svg viewBox="0 0 400 165" width="400" role="img" aria-label="装置の直列接続と並列接続の構成図">
  <g fill="none" stroke="currentColor" stroke-width="1.6">
    <text x="10" y="20" font-size="11.5" fill="currentColor" stroke="none">構成X（直列）</text>
    <line x1="18" y1="50" x2="52" y2="50"/>
    <rect x="52" y="34" width="66" height="32" rx="5" stroke="var(--orange)"/>
    <line x1="118" y1="50" x2="160" y2="50"/>
    <rect x="160" y="34" width="66" height="32" rx="5" stroke="var(--orange)"/>
    <line x1="226" y1="50" x2="260" y2="50"/>
    <text x="68" y="54" font-size="11.5" fill="currentColor" stroke="none">装置A</text>
    <text x="176" y="54" font-size="11.5" fill="currentColor" stroke="none">装置B</text>
    <text x="10" y="96" font-size="11.5" fill="currentColor" stroke="none">構成Y（並列）</text>
    <line x1="18" y1="134" x2="46" y2="134"/>
    <path d="M46 134 L46 114 L60 114"/><path d="M46 134 L46 152 L60 152"/>
    <rect x="60" y="100" width="66" height="28" rx="5" stroke="var(--blue)"/>
    <rect x="60" y="138" width="66" height="28" rx="5" stroke="var(--blue)"/>
    <path d="M126 114 L142 114 L142 134"/><path d="M126 152 L142 152 L142 134"/>
    <line x1="142" y1="134" x2="176" y2="134"/>
    <text x="76" y="118" font-size="11.5" fill="currentColor" stroke="none">装置A</text>
    <text x="76" y="156" font-size="11.5" fill="currentColor" stroke="none">装置B</text>
  </g>
</svg>`;

// 記憶装置の階層
const FIG_MEMORY = `<svg viewBox="0 0 330 180" width="330" role="img" aria-label="レジスタから補助記憶までの記憶装置の階層構造">
  <g fill="none" stroke="currentColor" stroke-width="1.6" font-size="11.5">
    <rect x="108" y="12" width="112" height="30" rx="4" stroke="var(--ng)"/>
    <text x="144" y="32" fill="currentColor" stroke="none">レジスタ</text>
    <rect x="88" y="50" width="152" height="30" rx="4" stroke="var(--orange)"/>
    <text x="128" y="70" fill="currentColor" stroke="none">装置ア</text>
    <rect x="68" y="88" width="192" height="30" rx="4" stroke="var(--blue)"/>
    <text x="142" y="108" fill="currentColor" stroke="none">主記憶</text>
    <rect x="48" y="126" width="232" height="30" rx="4" stroke="var(--dim)"/>
    <text x="136" y="146" fill="currentColor" stroke="none">補助記憶</text>
    <text x="288" y="26" font-size="10" fill="currentColor" stroke="none">高速</text>
    <text x="288" y="40" font-size="10" fill="currentColor" stroke="none">小容量</text>
    <text x="288" y="138" font-size="10" fill="currentColor" stroke="none">低速</text>
    <text x="288" y="152" font-size="10" fill="currentColor" stroke="none">大容量</text>
  </g>
</svg>`;

// 公開鍵暗号方式の流れ
const FIG_PKI = `<svg viewBox="0 0 420 150" width="420" role="img" aria-label="送信者が受信者の公開鍵で暗号化し受信者が秘密鍵で復号する流れ">
  <defs><marker id="ippk" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11">
    <rect x="12" y="52" width="82" height="42" rx="5" stroke="var(--blue)"/>
    <text x="34" y="78" fill="currentColor" stroke="none">送信者</text>
    <rect x="160" y="52" width="96" height="42" rx="5" stroke="var(--orange)"/>
    <text x="176" y="70" fill="currentColor" stroke="none">暗号化された</text>
    <text x="196" y="86" fill="currentColor" stroke="none">データ</text>
    <rect x="322" y="52" width="82" height="42" rx="5" stroke="var(--ok)"/>
    <text x="344" y="78" fill="currentColor" stroke="none">受信者</text>
    <line x1="94" y1="73" x2="152" y2="73" marker-end="url(#ippk)"/>
    <line x1="256" y1="73" x2="314" y2="73" marker-end="url(#ippk)"/>
    <text x="86" y="36" fill="var(--orange)" stroke="none">鍵ア で暗号化</text>
    <text x="262" y="36" fill="var(--ok)" stroke="none">鍵イ で復号</text>
    <line x1="130" y1="42" x2="130" y2="62" stroke="var(--dim)" stroke-dasharray="3 3"/>
    <line x1="290" y1="42" x2="290" y2="62" stroke="var(--dim)" stroke-dasharray="3 3"/>
    <text x="16" y="124" font-size="10.5" fill="currentColor" stroke="none">※鍵アと鍵イは対になっている</text>
  </g>
</svg>`;

// スタックの動き（LIFO）
const FIG_STACK = `<svg viewBox="0 0 330 175" width="330" role="img" aria-label="スタックにデータを積み上げて上から取り出す様子">
  <defs><marker id="ipst" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11.5">
    <path d="M96 34 L96 140 L184 140 L184 34" stroke="var(--dim)" stroke-width="2"/>
    <rect x="102" y="112" width="76" height="26" fill="var(--card2)" stroke="var(--blue)"/>
    <text x="132" y="130" fill="currentColor" stroke="none">A</text>
    <rect x="102" y="84" width="76" height="26" fill="var(--card2)" stroke="var(--blue)"/>
    <text x="132" y="102" fill="currentColor" stroke="none">B</text>
    <rect x="102" y="56" width="76" height="26" fill="var(--card2)" stroke="var(--orange)"/>
    <text x="132" y="74" fill="currentColor" stroke="none">C</text>
    <line x1="230" y1="44" x2="192" y2="60" marker-end="url(#ipst)" stroke="var(--orange)"/>
    <text x="234" y="42" fill="var(--orange)" stroke="none">最後に入れたC</text>
    <text x="234" y="58" fill="var(--orange)" stroke="none">が最初に出る</text>
    <text x="16" y="132" font-size="10.5" fill="currentColor" stroke="none">A→B→C</text>
    <text x="16" y="148" font-size="10.5" fill="currentColor" stroke="none">の順に格納</text>
  </g>
</svg>`;

// 二分探索
const FIG_BINSEARCH = `<svg viewBox="0 0 400 150" width="400" role="img" aria-label="整列済みデータの中央と比較して探索範囲を半分に絞る様子">
  <g fill="none" stroke="currentColor" stroke-width="1.4" font-size="11">
    <text x="12" y="26" fill="currentColor" stroke="none">整列済みデータ（目的の値：7）</text>
    ${[1,3,5,7,9,11,13,15].map((v,i)=>`<rect x="${14+i*46}" y="36" width="40" height="28" rx="3" stroke="${v===9?'var(--orange)':'var(--dim)'}"/><text x="${28+i*46}" y="55" fill="currentColor" stroke="none">${v}</text>`).join('')}
    <text x="176" y="82" font-size="10.5" fill="var(--orange)" stroke="none">中央と比較</text>
    <text x="12" y="106" fill="currentColor" stroke="none">7 &lt; 9 なので左半分だけが残る</text>
    ${[1,3,5,7].map((v,i)=>`<rect x="${14+i*46}" y="114" width="40" height="28" rx="3" stroke="var(--ok)"/><text x="${28+i*46}" y="133" fill="currentColor" stroke="none">${v}</text>`).join('')}
  </g>
</svg>`;

// デュプレックスシステム
const FIG_DUPLEX = `<svg viewBox="0 0 390 150" width="390" role="img" aria-label="現用系と待機系を用意し障害時に切り替える構成図">
  <defs><marker id="ipdp" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11.5">
    <rect x="14" y="52" width="76" height="40" rx="5" stroke="var(--dim)"/>
    <text x="36" y="76" fill="currentColor" stroke="none">利用者</text>
    <line x1="90" y1="72" x2="140" y2="72" marker-end="url(#ipdp)"/>
    <rect x="148" y="16" width="112" height="42" rx="5" stroke="var(--ok)"/>
    <text x="176" y="42" fill="currentColor" stroke="none">現用系（稼働中）</text>
    <rect x="148" y="90" width="112" height="42" rx="5" stroke="var(--dim)" stroke-dasharray="5 4"/>
    <text x="172" y="116" fill="currentColor" stroke="none">待機系（待機中）</text>
    <line x1="204" y1="58" x2="204" y2="86" stroke="var(--orange)" stroke-dasharray="4 3" marker-end="url(#ipdp)"/>
    <text x="212" y="78" font-size="10.5" fill="var(--orange)" stroke="none">障害時に切替</text>
    <text x="286" y="42" font-size="10.5" fill="currentColor" stroke="none">通常はこちら</text>
    <text x="286" y="116" font-size="10.5" fill="currentColor" stroke="none">が処理を引継ぐ</text>
  </g>
</svg>`;

// バックアップ方式の比較
const FIG_BACKUP = `<svg viewBox="0 0 400 165" width="400" role="img" aria-label="フルバックアップと増分バックアップの取得範囲を比べた図">
  <g fill="none" stroke="currentColor" stroke-width="1.4" font-size="10.5">
    <text x="12" y="22" fill="currentColor" stroke="none">日曜</text>
    <text x="92" y="22" fill="currentColor" stroke="none">月曜</text>
    <text x="172" y="22" fill="currentColor" stroke="none">火曜</text>
    <text x="252" y="22" fill="currentColor" stroke="none">水曜</text>
    <text x="12" y="48" fill="currentColor" stroke="none">フル</text>
    <rect x="12" y="56" width="64" height="30" rx="3" stroke="var(--blue)" fill="var(--card2)"/>
    <text x="26" y="76" fill="currentColor" stroke="none">全データ</text>
    <rect x="92" y="56" width="64" height="30" rx="3" stroke="var(--blue)" fill="var(--card2)"/>
    <text x="106" y="76" fill="currentColor" stroke="none">全データ</text>
    <rect x="172" y="56" width="64" height="30" rx="3" stroke="var(--blue)" fill="var(--card2)"/>
    <text x="186" y="76" fill="currentColor" stroke="none">全データ</text>
    <text x="12" y="112" fill="currentColor" stroke="none">増分</text>
    <rect x="12" y="120" width="64" height="30" rx="3" stroke="var(--orange)" fill="var(--card2)"/>
    <text x="26" y="140" fill="currentColor" stroke="none">全データ</text>
    <rect x="92" y="120" width="30" height="30" rx="3" stroke="var(--orange)"/>
    <text x="100" y="140" fill="currentColor" stroke="none">差</text>
    <rect x="172" y="120" width="30" height="30" rx="3" stroke="var(--orange)"/>
    <text x="180" y="140" fill="currentColor" stroke="none">差</text>
    <text x="252" y="140" fill="currentColor" stroke="none">← 取得は速いが</text>
    <text x="252" y="154" fill="currentColor" stroke="none">　 復元に全部必要</text>
  </g>
</svg>`;

// 主キーと外部キー
const FIG_KEYS = `<svg viewBox="0 0 420 150" width="420" role="img" aria-label="社員表と部署表を主キーと外部キーで結んだ図">
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11">
    <rect x="14" y="26" width="150" height="92" rx="6" stroke="var(--blue)"/>
    <line x1="14" y1="50" x2="164" y2="50" stroke="var(--blue)"/>
    <text x="26" y="43" font-size="12" fill="currentColor" stroke="none">社員</text>
    <text x="26" y="70" fill="currentColor" stroke="none">社員番号（キーP）</text>
    <text x="26" y="90" fill="currentColor" stroke="none">氏名</text>
    <text x="26" y="110" fill="currentColor" stroke="none">部署コード（キーQ）</text>
    <rect x="262" y="26" width="150" height="92" rx="6" stroke="var(--orange)"/>
    <line x1="262" y1="50" x2="412" y2="50" stroke="var(--orange)"/>
    <text x="274" y="43" font-size="12" fill="currentColor" stroke="none">部署</text>
    <text x="274" y="70" fill="currentColor" stroke="none">部署コード（キーP）</text>
    <text x="274" y="90" fill="currentColor" stroke="none">部署名</text>
    <line x1="164" y1="106" x2="262" y2="70" stroke="var(--ok)"/>
    <text x="176" y="128" font-size="10.5" fill="var(--ok)" stroke="none">キーQ はキーP を参照する</text>
  </g>
</svg>`;

// 情報セキュリティのCIA
const FIG_CIA = `<svg viewBox="0 0 320 190" width="320" role="img" aria-label="機密性と完全性と可用性からなる情報セキュリティの3要素">
  <g fill="none" stroke="currentColor" stroke-width="1.6" font-size="11.5">
    <circle cx="160" cy="72" r="46" stroke="var(--ng)"/>
    <text x="132" y="46" fill="currentColor" stroke="none">機密性</text>
    <circle cx="118" cy="126" r="46" stroke="var(--blue)"/>
    <text x="82" y="158" fill="currentColor" stroke="none">完全性</text>
    <circle cx="202" cy="126" r="46" stroke="var(--ok)"/>
    <text x="188" y="158" fill="currentColor" stroke="none">要素Z</text>
    <text x="14" y="24" font-size="10.5" fill="currentColor" stroke="none">機密性：許可された人だけが見られる</text>
    <text x="14" y="182" font-size="10.5" fill="currentColor" stroke="none">完全性：内容が改ざんされていない</text>
  </g>
</svg>`;

// RFI → RFP → 契約の調達フロー
const FIG_RFP = `<svg viewBox="0 0 420 110" width="420" role="img" aria-label="情報提供依頼から契約締結までの調達の流れ">
  <defs><marker id="iprf" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11">
    <rect x="10" y="34" width="80" height="40" rx="5" stroke="var(--blue)"/>
    <text x="30" y="52" fill="currentColor" stroke="none">手順ア</text>
    <text x="20" y="68" font-size="9.5" fill="currentColor" stroke="none">情報提供依頼</text>
    <line x1="90" y1="54" x2="112" y2="54" marker-end="url(#iprf)"/>
    <rect x="118" y="34" width="80" height="40" rx="5" stroke="var(--orange)"/>
    <text x="138" y="52" fill="currentColor" stroke="none">手順イ</text>
    <text x="132" y="68" font-size="9.5" fill="currentColor" stroke="none">提案依頼</text>
    <line x1="198" y1="54" x2="220" y2="54" marker-end="url(#iprf)"/>
    <rect x="226" y="34" width="80" height="40" rx="5" stroke="var(--dim)"/>
    <text x="240" y="58" fill="currentColor" stroke="none">提案の評価</text>
    <line x1="306" y1="54" x2="328" y2="54" marker-end="url(#iprf)"/>
    <rect x="334" y="34" width="76" height="40" rx="5" stroke="var(--ok)"/>
    <text x="352" y="58" fill="currentColor" stroke="none">契約締結</text>
  </g>
</svg>`;

// バランススコアカードの4視点
const FIG_BSC = `<svg viewBox="0 0 340 200" width="340" role="img" aria-label="財務と顧客と業務プロセスと学習と成長からなるバランススコアカードの4視点">
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11.5">
    <rect x="112" y="12" width="116" height="34" rx="5" stroke="var(--orange)"/>
    <text x="150" y="34" fill="currentColor" stroke="none">財務の視点</text>
    <rect x="12" y="76" width="116" height="34" rx="5" stroke="var(--blue)"/>
    <text x="50" y="98" fill="currentColor" stroke="none">顧客の視点</text>
    <rect x="212" y="76" width="116" height="34" rx="5" stroke="var(--blue)"/>
    <text x="240" y="98" fill="currentColor" stroke="none">業務プロセス</text>
    <rect x="112" y="140" width="116" height="34" rx="5" stroke="var(--ok)"/>
    <text x="146" y="162" fill="currentColor" stroke="none">視点W</text>
    <line x1="170" y1="46" x2="170" y2="62" stroke="var(--dim)"/>
    <line x1="70" y1="62" x2="270" y2="62" stroke="var(--dim)"/>
    <line x1="70" y1="62" x2="70" y2="76" stroke="var(--dim)"/>
    <line x1="270" y1="62" x2="270" y2="76" stroke="var(--dim)"/>
    <line x1="170" y1="110" x2="170" y2="140" stroke="var(--dim)" stroke-dasharray="4 3"/>
  </g>
</svg>`;

// インシデント管理と問題管理の役割分担
const FIG_ITSM = `<svg viewBox="0 0 420 145" width="420" role="img" aria-label="障害発生から復旧と再発防止までの時系列で管理プロセスを分けた図">
  <defs><marker id="ipit" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11">
    <line x1="14" y1="112" x2="406" y2="112" marker-end="url(#ipit)" stroke="var(--dim)"/>
    <text x="352" y="132" font-size="10.5" fill="currentColor" stroke="none">時間</text>
    <line x1="60" y1="104" x2="60" y2="120" stroke="var(--ng)"/>
    <text x="30" y="136" font-size="10.5" fill="var(--ng)" stroke="none">障害発生</text>
    <line x1="212" y1="104" x2="212" y2="120" stroke="var(--ok)"/>
    <text x="188" y="136" font-size="10.5" fill="var(--ok)" stroke="none">復旧</text>
    <rect x="60" y="24" width="152" height="34" rx="5" stroke="var(--orange)"/>
    <text x="94" y="46" fill="currentColor" stroke="none">プロセスP</text>
    <text x="66" y="76" font-size="10" fill="currentColor" stroke="none">とにかく早く復旧させる</text>
    <rect x="240" y="24" width="152" height="34" rx="5" stroke="var(--blue)"/>
    <text x="272" y="46" fill="currentColor" stroke="none">問題管理</text>
    <text x="246" y="76" font-size="10" fill="currentColor" stroke="none">根本原因を特定し再発防止</text>
  </g>
</svg>`;

// 2進数の桁の重み
const FIG_BINARY = `<svg viewBox="0 0 340 130" width="340" role="img" aria-label="2進数の各桁の重みを示した図">
  <g fill="none" stroke="currentColor" stroke-width="1.4" font-size="12">
    <text x="14" y="26" font-size="11" fill="currentColor" stroke="none">桁の重み</text>
    ${[8,4,2,1].map((w,i)=>`<text x="${104+i*58}" y="26" fill="var(--orange)" stroke="none">${w}</text>`).join('')}
    <text x="14" y="66" font-size="11" fill="currentColor" stroke="none">2進数</text>
    ${[1,1,0,1].map((b,i)=>`<rect x="${92+i*58}" y="44" width="40" height="32" rx="4" stroke="var(--blue)"/><text x="${108+i*58}" y="66" fill="currentColor" stroke="none">${b}</text>`).join('')}
    <text x="14" y="106" font-size="11" fill="currentColor" stroke="none">計算</text>
    <text x="92" y="106" font-size="11" fill="currentColor" stroke="none">8 ＋ 4 ＋ 0 ＋ 1</text>
  </g>
</svg>`;

// ─── 過去問（四肢択一） ────────────────────────────────────
// {id, c:カテゴリID, q:設問, o:[選択肢], a:正解のindex, e:解説, d:難易度, fig:図}
// ★IDは学習記録（quizStats）の紐づけキー。絶対に振り直さないこと。
const QQ = [
{id:'Q001',c:'corp',d:1,q:'著作権と特許権の違いとして正しいものはどれですか？',o:['どちらも登録して初めて権利が発生する','著作権は創作した時点で自動的に発生するが、特許権は出願・登録が必要である','特許権は創作した時点で自動的に発生するが、著作権は登録が必要である','どちらも登録は不要である'],a:1,e:'著作権は創作した時点で自動的に発生し、登録は不要です（無方式主義）。一方、特許権は特許庁への出願と登録が必要です。「どちらも登録して初めて権利が発生する」は著作権の無方式主義に反します。「特許権は創作した時点で自動的に発生するが、著作権は登録が必要である」は両者がちょうど逆になっています。「どちらも登録は不要である」は特許権の出願・登録の要件を無視しています。'},
{id:'Q002',c:'corp',d:2,q:'派遣契約と請負契約の違いとして正しいものはどれですか？',o:['派遣は発注者に指揮命令権がなく、請負にはある','派遣・請負ともに発注者に指揮命令権がある','派遣は派遣先に指揮命令権があり、請負は発注者に指揮命令権がない','派遣・請負ともに発注者に指揮命令権がない'],a:2,e:'労働者派遣では派遣先が労働者に直接指揮命令します。請負では仕事の完成が目的で、発注者に指揮命令権はありません。「派遣は発注者に指揮命令権がなく、請負にはある」は両者が逆です。「派遣・請負ともに発注者に指揮命令権がある」は、請負で発注者が直接指示すると偽装請負になるため誤りです。「派遣・請負ともに発注者に指揮命令権がない」は派遣の制度上の特徴を否定しています。'},
{id:'Q003',c:'corp',d:3,fig:FIG_BEP,q:'図は売上高と総費用の関係を表しています。固定費が600万円、変動費率が40%のとき、点Pが示す損益分岐点売上高はいくらですか？',o:['840万円','1,000万円','1,500万円','2,400万円'],a:1,e:'損益分岐点売上高 ＝ 固定費 ÷（1 − 変動費率）＝ 600 ÷（1 − 0.4）＝ 600 ÷ 0.6 ＝ 1,000万円です。図の点Pは売上高の線と総費用の線が交わる位置で、利益がちょうどゼロになります。「840万円」は固定費に変動費率を掛けて加えた誤りです。「1,500万円」は固定費を変動費率0.4で割った値です。「2,400万円」は固定費を変動費率で割ってさらに倍にした値で、いずれも公式の分母が（1 − 変動費率）である点を取り違えています。'},
{id:'Q004',c:'strategy',d:2,fig:FIG_PPM,q:'図はPPM（プロダクトポートフォリオマネジメント）の4象限です。「金のなる木」に該当するのはどの領域ですか？',o:['領域ア（成長率が高く占有率が低い）','領域イ（成長率が低く占有率が高い）','花形（成長率・占有率ともに高い）','負け犬（成長率・占有率ともに低い）'],a:1,e:'「金のなる木」は市場成長率が低く（追加投資が少なくて済む）、市場占有率が高い（安定した収益がある）事業なので、図では右下の領域イです。「領域ア（成長率が高く占有率が低い）」は問題児にあたり、投資して育てるか撤退するかの判断が要ります。「花形（成長率・占有率ともに高い）」は収益も大きいが投資も必要な事業です。「負け犬（成長率・占有率ともに低い）」は撤退の検討対象です。'},
{id:'Q005',c:'strategy',d:1,q:'KGIとKPIの関係として正しいものはどれですか？',o:['KGIは中間指標、KPIは最終目標である','KGIは最終目標、KPIはその達成度合いを測る中間指標である','KGIとKPIは同じ意味である','KGIは定性的な指標、KPIは定量的な指標である'],a:1,e:'KGI（重要目標達成指標）は最終的なゴール、KPI（重要業績評価指標）はそこへ至る過程を測る中間指標です。「KGIは中間指標、KPIは最終目標である」は両者が逆です。「KGIとKPIは同じ意味である」は、ゴールと途中の計測点という役割の違いを無視しています。「KGIは定性的な指標、KPIは定量的な指標である」も誤りで、KGIも「売上10億円」のように定量的に設定するのが一般的です。'},
{id:'Q006',c:'syssta',d:1,fig:FIG_RFP,q:'図はシステム調達の流れです。手順アと手順イに入る組合せとして正しいものはどれですか？',o:['ア：RFP、イ：RFI','ア：RFI、イ：RFP','ア：契約、イ：RFP','ア：RFI、イ：検収'],a:1,e:'まずRFI（情報提供依頼書）でベンダーから製品・技術の情報を集め、それを踏まえてRFP（提案依頼書）で具体的な提案と見積りを依頼します。「ア：RFP、イ：RFI」は順序が逆で、情報を集める前に提案を求めることになります。「ア：契約、イ：RFP」は契約が最初に来ており、図の最後にある契約締結と矛盾します。「ア：RFI、イ：検収」の検収は納品後の確認作業なので、提案を依頼する段階には入りません。'},
{id:'Q007',c:'syssta',d:2,fig:FIG_CLOUD,q:'図はクラウドサービスの管理範囲を比べたものです。オレンジ枠が利用者の管理範囲を示すとき、「方式X」に該当するサービス形態はどれですか？',o:['SaaS','PaaS','IaaS','ASP'],a:2,e:'方式Xではアプリ・ミドルウェア・OSまで利用者が管理し、仮想化とハードウェアだけを事業者が提供しています。これはIaaSの特徴です。「SaaS」は完成したソフトを使うだけで、図の左端のように利用者の管理範囲が最も狭い形態です。「PaaS」はアプリのみを利用者が管理し、OSやミドルウェアは事業者が管理します。「ASP」はSaaSの前身にあたる形態で、やはり利用者がOSまで管理することはありません。'},
{id:'Q008',c:'syssta',d:2,q:'DX（デジタルトランスフォーメーション）の説明として最も適切なものはどれですか？',o:['紙の書類をスキャンして電子ファイルにすること','既存業務をそのままシステム化して効率を上げること','デジタル技術によって製品・サービスやビジネスモデルそのものを変革すること','社内のパソコンを最新機種に入れ替えること'],a:2,e:'DXは単なるデジタル化にとどまらず、ビジネスモデルや組織そのものを変革することを指します。「紙の書類をスキャンして電子ファイルにすること」はデジタイゼーション（単なる電子化）で、DXの前段階にあたります。「既存業務をそのままシステム化して効率を上げること」はデジタライゼーションで、業務は変わっていません。「社内のパソコンを最新機種に入れ替えること」は設備更新にすぎず、価値の生み方は変わりません。'},

// ── 企業と法務 ──
{id:'Q009',c:'corp',d:1,q:'PDCAサイクルの「C」にあたる活動はどれですか？',o:['目標と手順を決める','決めた手順を実行する','結果を目標と照らして評価する','評価を踏まえて改善する'],a:2,e:'PDCAは Plan（計画）→ Do（実行）→ Check（評価）→ Act（改善）です。Cは評価にあたります。「目標と手順を決める」はPlan、「決めた手順を実行する」はDo、「評価を踏まえて改善する」はActで、それぞれ別の段階です。4つの頭文字と日本語を対応づけて覚えると混同しません。'},
{id:'Q010',c:'corp',d:1,q:'貸借対照表について正しい説明はどれですか？',o:['一定期間の収益と費用を示す','ある時点の資産・負債・純資産を示す','現金の増減の流れを示す','従業員の人数と構成を示す'],a:1,e:'貸借対照表（B/S）はある時点の財政状態を示し、「資産＝負債＋純資産」が必ず成り立ちます。「一定期間の収益と費用を示す」のは損益計算書（P/L）です。「現金の増減の流れを示す」のはキャッシュフロー計算書です。「従業員の人数と構成を示す」のは財務諸表ではなく人事関連の資料で、財務三表のいずれにも該当しません。'},
{id:'Q011',c:'corp',d:2,q:'営業秘密として不正競争防止法で保護されるために必要な要件の組み合わせはどれですか？',o:['秘密として管理されている・有用である・公然と知られていない','特許庁に登録されている・新規性がある・有用である','文書化されている・社外に公開されている・独創的である','経営者が承認している・電子化されている・有用である'],a:0,e:'営業秘密の3要件は「秘密管理性」「有用性」「非公知性」で、3つすべてを満たす必要があります。「特許庁に登録されている・新規性がある・有用である」は特許権の要件で、営業秘密は登録を必要としません。「文書化されている・社外に公開されている・独創的である」は、公開されている時点で非公知性を失うため成立しません。「経営者が承認している・電子化されている・有用である」も、承認や電子化は法律上の要件ではありません。'},
{id:'Q012',c:'corp',d:2,q:'自社の従業員が業務で作成したプログラムの著作権は、原則として誰に帰属しますか？',o:['作成した従業員個人','所属する法人（会社）','発注元の顧客','著作権は発生しない'],a:1,e:'法人の業務として、法人名義で公表される著作物は職務著作となり、原則として法人に著作権が帰属します。「作成した従業員個人」は、職務著作にあたらない私的な創作の場合の扱いです。「発注元の顧客」は、契約で譲渡を定めない限り自動的には移転しません。「著作権は発生しない」は誤りで、プログラムは著作物として明確に保護対象に含まれます。'},
{id:'Q013',c:'corp',d:2,q:'発注者が受注企業の社員に直接作業指示を出せるのはどの契約形態ですか？',o:['請負契約','労働者派遣契約','業務委託（準委任）契約','秘密保持契約'],a:1,e:'労働者派遣では派遣先が労働者に直接指揮命令できます。「請負契約」は仕事の完成が目的で、発注者に指揮命令権はなく、直接指示すると偽装請負になります。「業務委託（準委任）契約」も業務の遂行を任せる契約で、やはり指揮命令権はありません。「秘密保持契約」は情報の取扱いを定める契約であり、そもそも作業の指示関係を定めるものではありません。'},
{id:'Q014',c:'corp',d:3,q:'売上高2,000万円、変動費800万円、固定費900万円のとき、営業利益はいくらですか？',o:['300万円','1,200万円','1,100万円','200万円'],a:0,e:'営業利益 ＝ 売上高 − 変動費 − 固定費 ＝ 2,000 − 800 − 900 ＝ 300万円です。「1,200万円」は限界利益（売上高 − 変動費 ＝ 2,000 − 800）で、固定費を引いていません。「1,100万円」は売上高から固定費だけを引いた値で、変動費を引き忘れています。「200万円」は計算過程のどこかで数値を取り違えた場合の値です。限界利益と営業利益の違いが問われる頻出パターンです。'},
{id:'Q015',c:'corp',d:2,fig:FIG_PARETO,q:'図のように、件数の棒グラフを多い順に並べ、累積比率を折れ線で重ねた図を何といいますか？',o:['ヒストグラム','散布図','パレート図','特性要因図'],a:2,e:'件数の多い順に棒を並べ、累積比率を折れ線で示す図はパレート図です。「上位の少数の要因が全体の大部分を占める」という考え方に基づき、重点的に対策すべき要因を見つけます。「ヒストグラム」はデータのばらつきの分布を階級ごとの度数で表す図で、大きい順には並べません。「散布図」は2つの項目の相関関係を点の散らばりで見る図です。「特性要因図」は原因を大骨・小骨に分けて魚の骨のように整理する図で、いずれも累積比率の折れ線は持ちません。'},
{id:'Q016',c:'corp',d:2,q:'個人情報取扱事業者が個人情報を取得する際に必要な対応はどれですか？',o:['取得後であれば利用目的を通知しなくてよい','あらかじめ利用目的を特定し、本人に通知または公表する','すべての個人情報を第三者に提供してよい','本人からの開示請求には応じなくてよい'],a:1,e:'個人情報保護法では、利用目的をできる限り特定し、取得時に本人へ通知または公表することが求められます。「取得後であれば利用目的を通知しなくてよい」は、通知または公表の義務そのものを否定しています。「すべての個人情報を第三者に提供してよい」は、第三者提供には原則として本人の同意が必要という規定に反します。「本人からの開示請求には応じなくてよい」も誤りで、事業者には開示請求へ応じる義務があります。'},
{id:'Q017',c:'corp',d:1,q:'コンプライアンスの説明として最も適切なものはどれですか？',o:['利益を最大化するために手段を選ばないこと','法令や社内規程、社会規範を守ること','株主の利益だけを優先すること','経営を第三者に監視させる仕組みのこと'],a:1,e:'コンプライアンスは法令遵守を中心に、社内規程や社会規範・倫理も含めて守ることを指します。「利益を最大化するために手段を選ばないこと」はコンプライアンスとまさに正反対の考え方です。「株主の利益だけを優先すること」は、従業員や地域社会などステークホルダー全体への配慮を欠いています。「経営を第三者に監視させる仕組みのこと」はコーポレートガバナンス（企業統治）の説明で、混同しやすい用語です。'},

// ── 経営戦略 ──
{id:'Q018',c:'strategy',d:1,fig:FIG_SWOT,q:'図はSWOT分析の枠組みです。「領域X」に分類されるものとして適切なものはどれですか？',o:['自社の技術力が高いこと','自社の資金力が乏しいこと','市場が拡大していること','競合が新製品を投入したこと'],a:2,e:'領域Xは外部環境かつ好影響の位置なので「機会」です。市場の拡大は自社の外側で起きている追い風なので機会にあたります。「自社の技術力が高いこと」は内部環境の好影響で強みです。「自社の資金力が乏しいこと」は内部環境の悪影響で弱みです。「競合が新製品を投入したこと」は外部環境ですが自社に不利なので脅威にあたり、内部／外部と好影響／悪影響の2軸で位置が決まります。'},
{id:'Q019',c:'strategy',d:2,fig:FIG_PPM,q:'図のPPMにおいて、「問題児」に該当するのはどの領域ですか？',o:['領域ア（成長率が高く占有率が低い）','領域イ（成長率が低く占有率が高い）','花形（成長率・占有率ともに高い）','負け犬（成長率・占有率ともに低い）'],a:0,e:'「問題児」は成長市場にありながら占有率が低い事業なので、図の左上の領域アです。投資して「花形」に育てるか、撤退するかの判断が必要になります。「領域イ（成長率が低く占有率が高い）」は金のなる木で、安定した資金源です。「花形（成長率・占有率ともに高い）」は既に高い地位を得ている事業です。「負け犬（成長率・占有率ともに低い）」は撤退候補で、いずれも問題児とは位置づけが異なります。'},
{id:'Q020',c:'strategy',d:1,q:'マーケティングミックス（4P）に含まれないものはどれですか？',o:['Product（製品）','Price（価格）','People（人材）','Promotion（販売促進）'],a:2,e:'4PはProduct（製品）・Price（価格）・Place（流通）・Promotion（販売促進）です。「People（人材）」は含まれません。「Product（製品）」「Price（価格）」「Promotion（販売促進）」はいずれも4Pの構成要素です。なお、残るひとつはPlace（流通）で、Peopleと取り違えやすいので注意が必要です。'},
{id:'Q021',c:'strategy',d:2,q:'コアコンピタンスの説明として適切なものはどれですか？',o:['他社が容易に模倣できない自社の中核的な強み','業界で標準となっている技術仕様','短期的な収益を生む事業','外部から調達した経営資源'],a:0,e:'コアコンピタンスは他社が真似しにくく、複数の市場へ展開でき、顧客に価値をもたらす自社独自の中核的な能力です。「業界で標準となっている技術仕様」は誰もが使えるデファクトスタンダードで、他社と差がつかないため強みになりません。「短期的な収益を生む事業」は収益性の話で、模倣困難性という条件を含みません。「外部から調達した経営資源」は他社も同様に調達できるため、独自の強みにはなりません。'},
{id:'Q022',c:'strategy',d:2,q:'CRMの主な目的はどれですか？',o:['調達から販売までの流れ全体を最適化する','顧客との関係を長期的に築き、顧客生涯価値を高める','基幹業務の情報を統合して経営資源を管理する','営業担当者の商談進捗を管理する'],a:1,e:'CRMは顧客関係管理で、顧客情報を一元管理して長期的な関係を築くことが目的です。「調達から販売までの流れ全体を最適化する」のはSCM（サプライチェーンマネジメント）です。「基幹業務の情報を統合して経営資源を管理する」のはERPです。「営業担当者の商談進捗を管理する」のはSFAで、CRMと近い領域ですが対象が営業活動に絞られる点が異なります。'},
{id:'Q023',c:'strategy',d:2,fig:FIG_BSC,q:'図はバランススコアカードの4つの視点です。「視点W」に入るものとして正しいものはどれですか？',o:['学習と成長の視点','法令遵守の視点','株主構成の視点','設備投資の視点'],a:0,e:'バランススコアカードの4視点は「財務」「顧客」「業務プロセス」「学習と成長」です。図で残っている視点Wは学習と成長にあたり、人材育成や組織能力の向上を測ります。「法令遵守の視点」「株主構成の視点」「設備投資の視点」はいずれも4視点には含まれません。財務だけに偏らず、その土台となる人材・プロセス・顧客まで多面的に評価するのがこの手法の狙いです。'},
{id:'Q024',c:'strategy',d:2,q:'KPIの例として最も適切なものはどれですか？',o:['年間売上高10億円の達成','月間の新規問い合わせ件数','企業の経営理念','長期的な事業ビジョン'],a:1,e:'KPIは最終目標（KGI）に至る過程を測る中間指標なので、日々追える「月間の新規問い合わせ件数」が該当します。「年間売上高10億円の達成」は最終的なゴールなのでKGIにあたります。「企業の経営理念」は企業の存在意義を示すもので、数値で測る指標ではありません。「長期的な事業ビジョン」も目指す姿を描いたもので、進捗を測る指標としては使えません。'},
{id:'Q025',c:'strategy',d:2,q:'ロングテールと呼ばれる現象の説明として適切なものはどれですか？',o:['少数の売れ筋商品が売上の大半を占めること','あまり売れない商品群の売上合計が無視できない規模になること','商品の価格が時間とともに下がること','新製品が市場に浸透するまでに時間がかかること'],a:1,e:'ロングテールは、在庫制約の小さいネット通販などで、ニッチな商品の売上合計が大きな比率を占める現象です。「少数の売れ筋商品が売上の大半を占めること」はパレートの法則（80対20の法則）で、ロングテールはこれと対をなす考え方です。「商品の価格が時間とともに下がること」は価格の低下傾向を述べたにすぎません。「新製品が市場に浸透するまでに時間がかかること」はイノベーター理論などの普及過程の話で、売上の分布とは別の観点です。'},
{id:'Q026',c:'strategy',d:1,q:'企業が他社と資本関係を持たずに提携して協力する形態はどれですか？',o:['M&A','アライアンス','子会社化','合併'],a:1,e:'アライアンスは資本関係を伴わない業務提携で、必要な範囲だけ協力できる柔軟な形態です。「M&A」は合併・買収により経営資源を取り込む手法で資本関係を伴います。「子会社化」は株式の過半数を取得して支配下に置くことなので、これも資本関係が生じます。「合併」は複数の企業がひとつになることで、最も強く資本が結びつく形態です。'},

// ── システム戦略 ──
{id:'Q027',c:'syssta',d:2,q:'BPRとBPMの違いとして正しいものはどれですか？',o:['BPRは継続的改善、BPMは抜本的な作り直し','BPRは抜本的な作り直し、BPMは継続的な改善','どちらも同じ意味である','BPRはシステム開発手法、BPMは調達手法'],a:1,e:'BPR（業務プロセス再構築）は業務を根本から設計し直すこと、BPM（業務プロセス管理）は継続的に分析・改善し続けることです。「BPRは継続的改善、BPMは抜本的な作り直し」は両者が逆になっています。「どちらも同じ意味である」は、一度きりの抜本改革と継続的な改善という性格の違いを無視しています。「BPRはシステム開発手法、BPMは調達手法」も誤りで、どちらも業務プロセスに関する考え方であり、開発手法や調達手法ではありません。'},
{id:'Q028',c:'syssta',d:2,q:'業務におけるデータの流れを、処理・データストア・外部実体などの記号で表す図はどれですか？',o:['E-R図','DFD','ガントチャート','アローダイアグラム'],a:1,e:'DFD（データフロー図）はデータの流れを処理・データストア・外部実体・データフローの4記号で表します。「E-R図」は実体（エンティティ）と関連（リレーションシップ）でデータの構造を表す図で、流れは表しません。「ガントチャート」は作業の日程を横棒で示す進捗管理の図です。「アローダイアグラム」は作業の順序と所要日数を矢印で表す図で、いずれもデータの流れを扱うものではありません。'},
{id:'Q029',c:'syssta',d:2,fig:FIG_CLOUD,q:'図のうち、利用者がOSやミドルウェアまで自分で管理する必要がある形態はどれですか？',o:['SaaS','PaaS','IaaS','いずれも管理不要'],a:2,e:'IaaSはサーバーやストレージなどのインフラのみを提供するため、図の右端のようにOS・ミドルウェア・アプリケーションを利用者が管理します。「SaaS」は完成したソフトを使うだけなので、利用者はデータと設定を管理するにとどまります。「PaaS」はアプリケーションの実行環境まで事業者が用意するため、OSやミドルウェアの管理は不要です。「いずれも管理不要」は、クラウドでも責任共有の考え方で利用者側の管理範囲が残る点を無視しています。'},
{id:'Q030',c:'syssta',d:2,q:'RFPに記載する内容として最も適切なものはどれですか？',o:['自社が求めるシステムの要件と提案してほしい事項','ベンダーが過去に受注した案件の一覧','自社の直近3期分の決算報告の詳細','システム部門の従業員の氏名と経歴'],a:0,e:'RFP（提案依頼書）は、システムに求める要件や制約、提案してほしい事項を示し、ベンダーに提案と見積りを依頼する文書です。「ベンダーが過去に受注した案件の一覧」はベンダー側が提案書で示す情報で、依頼する側が書くものではありません。「自社の直近3期分の決算報告の詳細」は調達の判断に必要な情報ではなく、開示する必然性もありません。「システム部門の従業員の氏名と経歴」も提案を求めるうえで必要な情報ではありません。'},
{id:'Q031',c:'syssta',d:1,q:'定型的なパソコン操作をソフトウェアのロボットに代行させて事務作業を自動化する仕組みはどれですか？',o:['BI','ERP','RPA','EA'],a:2,e:'RPA（ロボティックプロセスオートメーション）は、転記や集計といった定型的なPC操作を自動化する仕組みです。「BI」は蓄積データを分析して意思決定を支援するツールで、作業の代行はしません。「ERP」は会計・人事・生産などの基幹業務を統合管理する仕組みです。「EA」は組織全体の業務とシステムの構造を整理する考え方で、いずれも個々の操作を自動化するものではありません。'},
{id:'Q032',c:'syssta',d:1,fig:FIG_RFP,q:'図のシステム調達の流れにおいて、最も早い段階で行うものはどれですか？',o:['RFPの提示による提案の依頼','RFIによるベンダー情報の収集','ベンダーとの契約の締結','提出された提案書の評価'],a:1,e:'調達は RFI（情報提供依頼）→ RFP（提案依頼）→ 提案書の受領と評価 → 選定 → 契約 の順に進みます。図でも左端が情報提供依頼です。「RFPの提示による提案の依頼」は、集めた情報をもとに要件を固めてから行う2番目の段階です。「ベンダーとの契約の締結」は図の右端にある最後の段階です。「提出された提案書の評価」はRFPを出した後でなければ行えません。'},

// ── 開発技術 ──
{id:'Q033',c:'dev',d:1,fig:FIG_VMODEL,q:'図のV字モデルにおいて、開発工程を左上から順に正しく並べたものはどれですか？',o:['要件定義 → 外部設計 → 内部設計 → プログラミング','外部設計 → 要件定義 → プログラミング → 内部設計','要件定義 → プログラミング → 外部設計 → 内部設計','プログラミング → 要件定義 → 外部設計 → 内部設計'],a:0,e:'V字モデルの左側は上から順に要件定義 → 外部設計（基本設計）→ 内部設計（詳細設計）→ プログラミングと、抽象的なものから具体的なものへ降りていきます。「外部設計 → 要件定義 → プログラミング → 内部設計」は、何を作るか決める前に設計を始めることになり成立しません。「要件定義 → プログラミング → 外部設計 → 内部設計」は設計を飛ばして実装しています。「プログラミング → 要件定義 → 外部設計 → 内部設計」は順序が完全に逆転しています。'},
{id:'Q034',c:'dev',d:2,q:'プログラムの内部構造に着目し、分岐や命令が網羅されるように行うテストはどれですか？',o:['ブラックボックステスト','ホワイトボックステスト','運用テスト','システムテスト'],a:1,e:'ホワイトボックステストは内部構造を理解したうえで、命令や分岐が網羅されるようにテストケースを作る手法で、主に単体テストで使われます。「ブラックボックステスト」は内部を見ずに入出力の関係だけを確認する手法で、着眼点が逆です。「運用テスト」は利用者が業務に沿って行う最終確認です。「システムテスト」はシステム全体が要求どおりかを見るテストで、いずれも内部構造の網羅を目的とはしていません。'},
{id:'Q035',c:'dev',d:2,fig:FIG_VMODEL,q:'図のV字モデルで、要件定義に対応する「テストX」に入るものはどれですか？',o:['単体テスト','結合テスト','システムテスト','運用テスト（受入テスト）'],a:3,e:'V字モデルでは各設計工程と対応するテスト工程が結ばれます。最上位の要件定義に対応するのは運用テスト（受入テスト）で、利用者が業務に沿って確認し、承認をもって本稼働に移ります。「単体テスト」はプログラミングに対応する最下位のテストです。「結合テスト」は内部設計に対応します。「システムテスト」は外部設計に対応し、いずれも要件定義より下の階層に位置します。'},
{id:'Q036',c:'dev',d:1,q:'アジャイル開発の特徴として適切なものはどれですか？',o:['工程を後戻りさせない前提で順に進める','短い反復を繰り返し、変化に柔軟に対応する','全ての仕様を確定してから開発に着手する','設計書の作成を最優先する'],a:1,e:'アジャイル開発は短い反復（イテレーション）で動くソフトウェアを作り、変更に柔軟に対応します。「工程を後戻りさせない前提で順に進める」はウォーターフォールモデルの特徴です。「全ての仕様を確定してから開発に着手する」も同様にウォーターフォール型の考え方で、変更を前提とするアジャイルとは相容れません。「設計書の作成を最優先する」も誤りで、アジャイルでは包括的なドキュメントより動くソフトウェアを重視します。'},
{id:'Q037',c:'dev',d:2,q:'外部から見た動作を変えずに、プログラムの内部構造を分かりやすく整理することを何と呼びますか？',o:['リファクタリング','リグレッションテスト','リバースエンジニアリング','プロトタイピング'],a:0,e:'リファクタリングは動作を変えずに内部構造を改善することです。動作が変わらないことが前提なので、実施後はリグレッションテストで確認します。「リグレッションテスト」は変更によって既存機能が壊れていないかを確かめるテストそのものです。「リバースエンジニアリング」は完成物を解析して仕様や構造を明らかにすることです。「プロトタイピング」は試作品を作って早期に確認する開発手法で、いずれも内部構造の整理とは目的が異なります。'},
{id:'Q038',c:'dev',d:2,q:'オブジェクト指向における「カプセル化」の説明として適切なものはどれですか？',o:['上位クラスの性質を下位クラスが引き継ぐこと','データと処理をまとめ、内部の詳細を外から隠すこと','同じ操作名で異なる振る舞いをすること','クラスから実体を作ること'],a:1,e:'カプセル化はデータとそれを操作する処理を一体にまとめ、内部の実装を外から隠蔽することです。「上位クラスの性質を下位クラスが引き継ぐこと」は継承の説明です。「同じ操作名で異なる振る舞いをすること」は多態性（ポリモーフィズム）です。「クラスから実体を作ること」はインスタンス化で、いずれもオブジェクト指向の別の概念です。'},

// ── プロジェクトマネジメント ──
{id:'Q039',c:'pm',d:1,q:'プロジェクトの特徴として適切なものはどれですか？',o:['終わりが定められていない継続的な活動である','独自の成果物を作る、期限のある活動である','毎日繰り返される定型的な業務である','必ず複数の企業が関わる活動である'],a:1,e:'プロジェクトは「有期性（開始と終了がある）」と「独自性（独自の成果物を作る）」が特徴です。「終わりが定められていない継続的な活動である」は有期性に反し、定常業務の説明です。「毎日繰り返される定型的な業務である」は独自性に反します。「必ず複数の企業が関わる活動である」は誤りで、社内だけで完結するプロジェクトも数多く存在します。'},
{id:'Q040',c:'pm',d:1,fig:FIG_WBS,q:'図のように、プロジェクトの作業を階層的に分解して整理した図を何といいますか？',o:['ガントチャート','WBS','アローダイアグラム','特性要因図'],a:1,e:'成果物に必要な作業を階層的に分解した図はWBS（作業分解構成図）で、見積りや進捗管理の土台になります。「ガントチャート」は作業の開始日と終了日を横棒で示す日程管理の図です。「アローダイアグラム」は作業の順序と最長経路（クリティカルパス）を求める図です。「特性要因図」は品質管理で原因を整理する図で、いずれも作業の階層分解を目的とはしていません。'},
{id:'Q041',c:'pm',d:3,fig:FIG_ARROW,q:'図のアローダイアグラムにおいて、結合点1から結合点5までの最短所要日数は何日ですか？',o:['11日','13日','15日','20日'],a:2,e:'経路は2通りあります。1→2→4→5 は A(5)＋C(4)＋E(6)＝15日、1→3→4→5 は B(3)＋D(2)＋E(6)＝11日です。結合点4は先行するすべての作業の完了を待つため、遅いほうの15日が全体の最短所要日数となり、この経路がクリティカルパスです。「11日」は短いほうの経路だけを見た誤りです。「13日」は経路の一部を取り違えたものです。「20日」はすべての作業日数を単純に合計した値で、並行して進む作業を考慮していません。'},
{id:'Q042',c:'pm',d:2,q:'プロジェクトのスコープが当初の合意を超えて次々に広がってしまう状態を何と呼びますか？',o:['クリティカルパス','マイルストーン','スコープクリープ','トレードオフ'],a:2,e:'スコープクリープは、変更管理の手続きを経ずに要求が追加され、範囲がじわじわ広がる状態で、納期やコストの超過につながります。「クリティカルパス」は全体の所要日数を決める最長経路のことです。「マイルストーン」は進捗を確認する節目の時点を指します。「トレードオフ」は一方を優先すると他方が犠牲になる関係のことで、いずれも範囲の膨張を表す用語ではありません。'},
{id:'Q043',c:'pm',d:1,q:'プロジェクトのQCDに含まれないものはどれですか？',o:['品質（Quality）','コスト（Cost）','納期（Delivery）','顧客数（Customer）'],a:3,e:'QCDは品質（Quality）・コスト（Cost）・納期（Delivery）の3つで、互いにトレードオフの関係にあります。「品質（Quality）」「コスト（Cost）」「納期（Delivery）」はいずれもQCDの構成要素です。「顧客数（Customer）」は事業の成果を表す指標ではありますが、プロジェクトの制約条件を示すQCDには含まれません。'},
{id:'Q044',c:'pm',d:2,q:'リスクへの対応のうち、保険をかけて損失を第三者に移すことを何と呼びますか？',o:['リスクの回避','リスクの軽減','リスクの転嫁','リスクの受容'],a:2,e:'リスクの転嫁は、保険や外部委託によって損失の負担を第三者に移す対応です。「リスクの回避」はリスクの原因となる活動そのものをやめる対応です。「リスクの軽減」は対策によって発生確率や影響度を下げる対応です。「リスクの受容」は影響が小さいと判断して対策せず受け入れる対応で、4つは目的が異なるため区別して覚えます。'},
{id:'Q045',c:'pm',d:2,q:'システムの機能の数と複雑さから開発規模を見積もる手法はどれですか？',o:['ファンクションポイント法','クリティカルパス法','パレート分析','ABC分析'],a:0,e:'ファンクションポイント法は、画面数や帳票数、ファイル数などから機能量を数値化して見積もる手法で、プログラム言語に依存しないのが特長です。「クリティカルパス法」は日程を分析して最長経路を求める手法で、規模の見積りではありません。「パレート分析」は重点対策すべき要因を見つける品質管理の手法です。「ABC分析」は在庫や商品を重要度で分類する手法で、いずれも開発規模の見積りには使いません。'},

// ── サービスマネジメント ──
{id:'Q046',c:'sm',d:1,fig:FIG_ITSM,q:'図の「プロセスP」にあたる管理はどれですか？',o:['インシデント管理','問題管理','変更管理','構成管理'],a:0,e:'図でプロセスPは障害発生から復旧までの区間に置かれ、「とにかく早く復旧させる」とあるのでインシデント管理です。「問題管理」は図の右側にあるとおり復旧後に根本原因を突き止め再発を防ぐ役割で、この2つは逆に覚えられやすい代表例です。「変更管理」は変更を加える前に評価・承認する役割です。「構成管理」は機器や設定の情報を常時最新に保つ役割で、いずれも復旧そのものを担うものではありません。'},
{id:'Q047',c:'sm',d:1,q:'SLAに記載する内容として最も適切なものはどれですか？',o:['開発に使用するプログラミング言語','サービスの稼働率や障害復旧時間などの品質水準','従業員の給与体系','株主総会の開催日程'],a:1,e:'SLA（サービスレベル合意書）は、稼働率・応答時間・復旧時間といったサービス品質の水準を提供者と利用者の間で合意する文書です。「開発に使用するプログラミング言語」は実装上の選択にすぎず、利用者が受け取るサービスの品質を表しません。「従業員の給与体系」は人事の内部事項です。「株主総会の開催日程」は企業運営に関する事項で、いずれもサービス品質の合意とは関係がありません。'},
{id:'Q048',c:'sm',d:2,q:'システム監査人に求められる最も重要な要件はどれですか？',o:['監査対象の部門に所属していること','監査対象から独立していること','システムを自ら開発した経験があること','経営者と親族関係にあること'],a:1,e:'監査人には外観上・精神上の独立性が求められ、監査対象から独立した立場で客観的に評価する必要があります。「監査対象の部門に所属していること」は独立性を根本から損ないます。「システムを自ら開発した経験があること」は知識としては有用でも、自分が構築したシステムを自分で監査すれば自己監査となり不適切です。「経営者と親族関係にあること」も客観性を疑わせる要因になります。'},
{id:'Q049',c:'sm',d:2,q:'あるシステムのMTBFが480時間、MTTRが20時間のとき、稼働率はいくつですか？',o:['0.90','0.94','0.96','0.98'],a:2,e:'稼働率 ＝ MTBF ÷（MTBF + MTTR）＝ 480 ÷（480 + 20）＝ 480 ÷ 500 ＝ 0.96 です。「0.90」は分母を500ではなく別の値として計算した場合の誤りです。「0.94」も同様に分母や分子の取り違えによる値です。「0.98」はMTTRを10時間とした場合の値で、与えられた数値と一致しません。分母がMTBFとMTTRの合計（＝1サイクル全体の時間）である点が要点です。'},
{id:'Q050',c:'sm',d:2,q:'申請する人と承認する人を別々にして、不正が起こりにくくする内部統制の考え方を何と呼びますか？',o:['職務分掌','監査証跡','ファシリティマネジメント','キャパシティ管理'],a:0,e:'職務分掌は、ひとりに権限が集中しないよう役割を分離することで不正やミスを防ぐ考え方です。「監査証跡」は誰が何をしたかを後から追跡できる記録のことで、防止ではなく事後の検証に使います。「ファシリティマネジメント」は建物や設備を最適に維持管理する取り組みです。「キャパシティ管理」はシステムの処理能力を needs に合わせて確保する管理で、いずれも権限分離とは異なります。'},

// ── 基礎理論 ──
{id:'Q051',c:'theory',d:1,fig:FIG_BINARY,q:'図のように各桁の重みを考えるとき、2進数の 1101 を10進数で表すといくつですか？',o:['11','13','14','15'],a:1,e:'各桁の重みは右から 1・2・4・8 です。1101 は 8＋4＋0＋1 ＝ 13 となります。「11」は 8＋2＋1 として、4の位の1を見落とした場合の値です。「14」は 8＋4＋2 として、2の位が0であることを取り違えた値です。「15」は 8＋4＋2＋1 で、すべての桁を1として計算した場合の値です。'},
{id:'Q052',c:'theory',d:2,q:'10進数の 26 を2進数で表すとどれですか？',o:['11010','10110','11100','10011'],a:0,e:'26 ＝ 16＋8＋2 なので、16の位・8の位・2の位が1となり 11010 です。「10110」は 16＋4＋2 ＝ 22 を表します。「11100」は 16＋8＋4 ＝ 28 です。「10011」は 16＋2＋1 ＝ 19 で、いずれも26にはなりません。2で割り続けて余りを下から読む方法でも同じ結果が得られます。'},
{id:'Q053',c:'theory',d:3,q:'16進数の 1F を10進数で表すといくつですか？',o:['25','29','31','35'],a:2,e:'16進数の1桁目の重みは16、0桁目は1です。F は 15 なので、1×16 ＋ 15 ＝ 31 となります。「25」は F を 9 と取り違えた場合の値です。「29」は F を 13 とした場合の値です。「35」は上位桁の重みを20として計算した誤りで、16進数では上位桁の重みが16である点が要点です。'},
{id:'Q054',c:'theory',d:1,q:'1バイトで表現できる値の個数はいくつですか？',o:['8通り','16通り','128通り','256通り'],a:3,e:'1バイトは8ビットなので、2の8乗 ＝ 256通りを表現できます。「8通り」はビット数そのものを答えたものです。「16通り」は2の4乗で、4ビット分にあたります。「128通り」は2の7乗で、1ビット少なく数えた場合の値です。ビット数と表現できる個数を混同しないことが要点です。'},
{id:'Q055',c:'theory',d:1,q:'AとBの論理積（AND）が真になるのはどの場合ですか？',o:['AとBの少なくとも一方が真','AとBの両方が真','AとBが異なる値','AとBの両方が偽'],a:1,e:'論理積（AND）は両方が真のときだけ真になります。「AとBの少なくとも一方が真」で真になるのは論理和（OR）です。「AとBが異なる値」のとき真になるのは排他的論理和（XOR）です。「AとBの両方が偽」のとき真になるのはNOR（否定論理和）にあたり、いずれもANDとは条件が異なります。'},
{id:'Q056',c:'theory',d:1,q:'排他的論理和（XOR）の結果が真になる組み合わせはどれですか？',o:['真と真','偽と偽','真と偽','どの場合も偽'],a:2,e:'XORは2つの値が異なるときだけ真になるため、「真と偽」の組み合わせが該当します。「真と真」は値が同じなので結果は偽です。「偽と偽」も値が同じなので偽になります。「どの場合も偽」は誤りで、値が異なる組み合わせでは必ず真になります。同じ値で2回XORすると元に戻る性質も併せて押さえておくとよいです。'},
{id:'Q057',c:'theory',d:1,q:'赤玉3個、白玉2個が入った袋から1個取り出すとき、白玉が出る確率はいくつですか？',o:['2/5','3/5','1/2','2/3'],a:0,e:'全部で5個のうち白玉は2個なので、確率は 2/5 です。「3/5」は赤玉が出る確率で、問われている色を取り違えたものです。「1/2」は赤と白が同数だと誤って考えた場合の値です。「2/3」は白玉2個と赤玉3個の比を取り違え、分母を3としてしまった誤りです。分母は全体の個数である点が要点です。'},
{id:'Q058',c:'theory',d:3,q:'異なる5冊の本から3冊を選ぶ組合せは何通りですか？',o:['10通り','15通り','20通り','60通り'],a:0,e:'組合せは 5C3 ＝ (5×4×3) ÷ (3×2×1) ＝ 10通りです。「60通り」は順序を区別する順列 5P3 ＝ 5×4×3 の値で、選ぶだけなら順序は区別しません。「15通り」「20通り」は計算途中で割る数を誤った場合の値です。「選ぶだけ」なら組合せ、「並べる」なら順列と区別するのが要点です。'},
{id:'Q059',c:'theory',d:3,q:'データ 10, 20, 30, 40, 900 において、代表値として中央値が平均値より実態を表しやすい理由はどれですか？',o:['中央値のほうが計算の手間が少なくて済むから','極端に大きい値（900）の影響を受けにくいから','データの個数が奇数で中央が定まるから','データがすべて正の数で構成されているから'],a:1,e:'平均は 200 ですが、これは900という外れ値に引っ張られた値です。中央値は 30 で、外れ値の影響を受けにくいため実態を表しやすくなります。「中央値のほうが計算の手間が少なくて済むから」は理由になっておらず、そもそも並べ替えが必要なぶん手間は増えることもあります。「データの個数が奇数で中央が定まるから」は中央値の求め方の話で、平均より優れる理由にはなりません。「データがすべて正の数で構成されているから」も代表値の選択とは無関係です。'},
{id:'Q060',c:'theory',d:1,q:'標準偏差が示すものはどれですか？',o:['データの中心の位置','データのばらつきの大きさ','データの個数','2つのデータの関係の強さ'],a:1,e:'標準偏差はデータが平均からどれだけ散らばっているかを示す指標です。「データの中心の位置」を示すのは平均値や中央値といった代表値です。「データの個数」は度数であり、ばらつきとは無関係です。「2つのデータの関係の強さ」を示すのは相関係数で、標準偏差は1つのデータ群の中の散らばりを見る点が異なります。'},
{id:'Q061',c:'theory',d:2,q:'相関係数が −0.9 のとき、2つのデータの関係として正しいものはどれですか？',o:['一方が増えると他方も増える強い関係がある','一方が増えると他方は減る強い関係がある','2つのデータに関係はない','一方が他方の原因である'],a:1,e:'相関係数が −1 に近いほど強い負の相関、つまり一方が増えると他方が減る関係を示します。「一方が増えると他方も増える強い関係がある」は正の相関で、係数が ＋1 に近い場合です。「2つのデータに関係はない」のは係数が0付近の場合です。「一方が他方の原因である」は誤りで、相関があっても因果関係があるとは限らない点が重要な注意事項です。'},
{id:'Q062',c:'theory',d:1,fig:FIG_STACK,q:'図のように、最後に入れたデータが最初に取り出される方式を何といいますか？',o:['先入れ先出し（FIFO）','後入れ先出し（LIFO）','ランダムアクセス','優先度順の取り出し'],a:1,e:'図ではA→B→Cの順に積み上げ、最後に入れたCが最初に取り出されています。これは後入れ先出し（LIFO）で、スタックの方式です。「先入れ先出し（FIFO）」は最初に入れたものから取り出す方式で、キューが該当します。「ランダムアクセス」は任意の位置へ直接アクセスする方式です。「優先度順の取り出し」は優先度付きキューの動きで、いずれも図の動作とは一致しません。'},
{id:'Q063',c:'theory',d:2,fig:FIG_BINSEARCH,q:'図のように、整列済みのデータの中央と比較して探索範囲を半分ずつ絞り込む方法はどれですか？',o:['線形探索','二分探索','ハッシュ探索','深さ優先探索'],a:1,e:'図では中央の9と目的の値7を比較し、7が小さいので左半分だけを残しています。これが二分探索で、あらかじめ整列されている必要がありますが、データ量が多いほど高速になります。「線形探索」は先頭から順に1つずつ調べる方法で、範囲を半分に絞る動きはしません。「ハッシュ探索」は計算で格納位置を直接求める方法です。「深さ優先探索」は木やグラフをたどる方法で、いずれも図の動作とは異なります。'},
{id:'Q064',c:'theory',d:1,q:'アルゴリズムの説明として最も適切なものはどれですか？',o:['プログラムを書くための言語','問題を解くための明確な手順','データを保存する形式','コンピューターの部品'],a:1,e:'アルゴリズムは問題を解くための手順を順序立てて明確に定めたものです。同じ結果が得られても手順の違いで処理速度が変わります。「プログラムを書くための言語」はプログラミング言語の説明です。「データを保存する形式」はファイル形式やデータ構造の話です。「コンピューターの部品」はハードウェアを指し、いずれも手順そのものを表す言葉ではありません。'},

// ── コンピュータシステム ──
{id:'Q065',c:'comp',d:1,fig:FIG_MEMORY,q:'図の記憶階層において、「装置ア」に入るものとして適切なものはどれですか？',o:['キャッシュメモリ','補助記憶装置','仮想記憶','磁気テープ装置'],a:0,e:'記憶階層は上ほど高速・小容量です。レジスタと主記憶の間に位置するのはキャッシュメモリで、CPUが主記憶へアクセスする回数を減らします。「補助記憶装置」は図の最下層にあたり、最も低速・大容量です。「仮想記憶」は主記憶と補助記憶を組み合わせて大きな記憶空間に見せる仕組みで、階層上の物理的な装置ではありません。「磁気テープ装置」は補助記憶の一種で、やはり主記憶より上には入りません。'},
{id:'Q066',c:'comp',d:1,q:'電源を切っても記憶内容が消えない装置はどれですか？',o:['主記憶（DRAM）','キャッシュメモリ','SSD','レジスタ'],a:2,e:'SSDは不揮発性メモリを使っており、電源を切っても内容が残ります。「主記憶（DRAM）」は揮発性で、電源が切れると内容が失われます。「キャッシュメモリ」も揮発性で、高速な代わりに電源に依存します。「レジスタ」はCPU内部の最も高速な記憶で、これも揮発性です。補助記憶は不揮発、主記憶より上は揮発と整理すると覚えやすくなります。'},
{id:'Q067',c:'comp',d:2,q:'RAID1（ミラーリング）の主な目的はどれですか？',o:['複数台に分散して書き込み速度を上げる','同じ内容を2台に書いて信頼性を高める','データを圧縮して容量を節約する','消費電力を下げる'],a:1,e:'RAID1は同じ内容を複数台に書き込む冗長化で、1台が故障してもデータが失われません。「複数台に分散して書き込み速度を上げる」のはRAID0（ストライピング）で、冗長性がないため1台の故障で全データを失います。「データを圧縮して容量を節約する」のは圧縮技術の役割で、RAIDの機能ではありません。「消費電力を下げる」も目的ではなく、むしろ台数が増えるぶん増加します。'},
{id:'Q068',c:'comp',d:3,fig:FIG_SP,q:'図の構成Xのように、稼働率0.9の装置を2台直列に接続したシステム全体の稼働率はいくつですか？',o:['0.81','0.90','0.95','0.99'],a:0,e:'直列は両方が動いて初めて機能するため、稼働率の積になります。0.9 × 0.9 ＝ 0.81 です。「0.90」は1台分の稼働率がそのまま残ると誤解した値で、直列では必ず個々の稼働率より低くなります。「0.95」は2台の稼働率を平均したような誤りです。「0.99」は構成Yのように並列接続した場合の値で、直列と並列を取り違えると選んでしまいます。'},
{id:'Q069',c:'comp',d:3,fig:FIG_SP,q:'図の構成Yのように、稼働率0.8の装置を2台並列（冗長化）にしたシステム全体の稼働率はいくつですか？',o:['0.64','0.80','0.90','0.96'],a:3,e:'並列はどちらか一方でも動けば機能するため、全体の稼働率 ＝ 1 −（1 − 0.8）×（1 − 0.8）＝ 1 − 0.04 ＝ 0.96 です。「0.64」は構成Xのように直列接続した場合の値（0.8×0.8）で、直列と並列の取り違えです。「0.80」は1台分の稼働率のままで、冗長化の効果を計算していません。「0.90」は2台の稼働率を単純平均したような誤りで、並列では必ず個々の稼働率より高くなる点が要点です。'},
{id:'Q070',c:'comp',d:1,q:'MTBFの説明として正しいものはどれですか？',o:['平均して修理にかかる時間','平均して故障せずに動作する時間','1年間の故障回数','システムの稼働率'],a:1,e:'MTBF（平均故障間隔）は平均して故障せずに動く時間です。「平均して修理にかかる時間」はMTTR（平均修復時間）の説明で、この2つは対になる指標です。「1年間の故障回数」は故障頻度そのもので、時間を表すMTBFとは単位が異なります。「システムの稼働率」はMTBFとMTTRから計算される別の指標です。'},
{id:'Q071',c:'comp',d:1,q:'1台の物理サーバー上で複数のサーバーを動作させる技術はどれですか？',o:['仮想化','クラスタリング','ミラーリング','シンクライアント'],a:0,e:'仮想化は1台の物理サーバー上に複数の仮想サーバーを構築する技術で、設備を集約でき構成変更も柔軟に行えます。「クラスタリング」は複数台をまとめて1つのシステムのように動かす技術で、方向が逆です。「ミラーリング」は同じ内容を複製して信頼性を高める技術です。「シンクライアント」は端末側の機能を最小化する方式で、いずれもサーバーの集約とは異なります。'},
{id:'Q072',c:'comp',d:2,q:'端末側に最小限の機能しか持たせず、処理やデータをサーバー側に集約する方式はどれですか？',o:['ピアツーピア','シンクライアント','スタンドアロン','エッジコンピューティング'],a:1,e:'シンクライアントは端末にデータを残さないため、紛失時の情報漏えいリスクを下げられます。「ピアツーピア」は各端末が対等に通信し合う方式で、集約とは逆の考え方です。「スタンドアロン」はネットワークに接続せず単独で動作する形態です。「エッジコンピューティング」は処理を端末に近い場所へ分散させる考え方で、サーバー側への集約とは方向が正反対です。'},
{id:'Q073',c:'comp',d:2,fig:FIG_DUPLEX,q:'図のように、現用系と待機系を用意し、障害時に待機系へ切り替える構成はどれですか？',o:['デュアルシステム','デュプレックスシステム','ロードシェアシステム','スタンドアロンシステム'],a:1,e:'図のように普段は現用系だけが処理を行い、障害時に待機系へ切り替える構成をデュプレックスシステムといいます。「デュアルシステム」は2系統で同じ処理を並行して行い結果を照合する方式で、待機ではなく常時稼働している点が異なります。「ロードシェアシステム」は複数台で負荷を分担する方式です。「スタンドアロンシステム」は単独構成で冗長性がなく、いずれも図の動作とは一致しません。'},
{id:'Q074',c:'comp',d:1,q:'停電時に一時的に電力を供給し、機器を安全に停止させるための装置はどれですか？',o:['UPS','RAID','NAS','ルータ'],a:0,e:'UPS（無停電電源装置）は、停電時に安全な停止やシステム切り替えのための時間を確保する装置です。「RAID」は複数ディスクによる冗長化の技術で、電源とは無関係です。「NAS」はネットワークに接続する共有ストレージです。「ルータ」はネットワーク間の経路制御を行う機器で、いずれも電力供給の役割は持ちません。'},
{id:'Q075',c:'comp',d:2,q:'OSS（オープンソースソフトウェア）に関する説明として正しいものはどれですか？',o:['例外なくすべて無償で提供される','ソースコードが公開され改変や再配布が認められる','商用の目的では一切利用してはならない','利用にあたりライセンス条件を守る必要はない'],a:1,e:'OSSはソースコードが公開され、利用・改変・再配布が認められているソフトウェアです。「例外なくすべて無償で提供される」は誤りで、有償サポート付きで提供されるOSSも存在します。「商用の目的では一切利用してはならない」も誤りで、商用利用を制限しないことがOSSの定義に含まれます。「利用にあたりライセンス条件を守る必要はない」は最も危険な誤解で、GPLなど各ライセンスの条件には従う義務があります。'},
{id:'Q076',c:'comp',d:1,q:'OSの役割として適切なものはどれですか？',o:['文書を作成して印刷する','表計算により集計を行う','ハードウェア資源を管理し共通機能を提供する','Webサイトを閲覧して情報を集める'],a:2,e:'OSは基本ソフトウェアとして、CPUやメモリなどの資源管理とアプリケーションへの共通機能提供を担います。「文書を作成して印刷する」はワープロソフト、「表計算により集計を行う」は表計算ソフト、「Webサイトを閲覧して情報を集める」はWebブラウザの役割で、いずれもOSの上で動くアプリケーションソフトウェアの機能です。'},
{id:'Q077',c:'comp',d:3,fig:FIG_BACKUP,q:'図はフルバックアップと増分バックアップを比べたものです。増分バックアップの特徴として正しいものはどれですか？',o:['バックアップ時間は短いが、復元に手間がかかる','バックアップ時間も復元時間もどちらも短い','バックアップ時間は長いが、復元は簡単に済む','フルバックアップと比べて違いはない'],a:0,e:'増分バックアップは前回以降の変更分だけを取るため取得は速いですが、復元にはフルバックアップと以降すべての増分が必要になり手間がかかります。「バックアップ時間も復元時間もどちらも短い」は、復元時に複数世代を順に適用する必要がある点を見落としています。「バックアップ時間は長いが、復元は簡単に済む」は特徴がちょうど逆で、これはフルバックアップの性質です。「フルバックアップと比べて違いはない」は図が示す取得範囲の差を無視しています。'},

// ── 技術要素 ──
{id:'Q078',c:'tech',d:1,fig:FIG_KEYS,q:'図の社員表において、各行を一意に識別する「キーP」にあたるものはどれですか？',o:['外部キー','主キー','インデックス','ビュー'],a:1,e:'各行を一意に識別する列は主キーで、重複せず空欄（NULL）にもできません。図では社員表の社員番号、部署表の部署コードがこれにあたります。「外部キー」は図のキーQのように他の表の主キーを参照する列です。「インデックス」は検索を高速化するための索引で、行の識別には使いません。「ビュー」は表示上の仮想的な表であり、列の役割を表す用語ではありません。'},
{id:'Q079',c:'tech',d:2,q:'データベースの正規化を行う主な目的はどれですか？',o:['検索速度を必ず速くするため','データの重複や矛盾を防ぐため','記憶装置の寿命を延ばすため','通信量を増やすため'],a:1,e:'正規化はデータの重複をなくし、更新時の矛盾（更新不整合）を防ぐことが目的です。「検索速度を必ず速くするため」は誤りで、正規化して表が分割されると結合が増え、かえって遅くなることもあります。「記憶装置の寿命を延ばすため」はハードウェアの話で、論理設計とは無関係です。「通信量を増やすため」は目的として成立せず、そもそも増やすことに利点はありません。'},
{id:'Q080',c:'tech',d:2,q:'トランザクションが「すべて成功するか、すべて取り消されるか」のいずれかになる性質はどれですか？',o:['原子性','一貫性','独立性','永続性'],a:0,e:'原子性（Atomicity）は、処理の一部だけが反映される中途半端な状態を作らないことを保証する性質です。「一貫性」はデータベースの整合性が保たれることを指します。「独立性」は複数のトランザクションが互いに干渉しないことです。「永続性」は完了した結果が障害後も失われないことで、いずれもACID特性の別の要素です。'},
{id:'Q081',c:'tech',d:1,q:'ドメイン名とIPアドレスを対応づけて変換する仕組みはどれですか？',o:['DHCP','DNS','NAT','ARP'],a:1,e:'DNSはドメイン名とIPアドレスを対応づける仕組みです。「DHCP」はIPアドレスなどの設定を自動で割り当てる仕組みで、名前解決は行いません。「NAT」はプライベートアドレスとグローバルアドレスを相互変換する技術です。「ARP」はIPアドレスからMACアドレスを求める仕組みで、いずれも変換する対象が異なります。'},
{id:'Q082',c:'tech',d:1,q:'ネットワークに接続した機器へIPアドレスを自動的に割り当てる仕組みはどれですか？',o:['DNS','DHCP','SMTP','FTP'],a:1,e:'DHCPはIPアドレスやサブネットマスクなどの設定を自動で配布する仕組みで、手動設定の手間と設定ミスを減らせます。「DNS」はドメイン名とIPアドレスを対応づける仕組みで、アドレスの割当ては行いません。「SMTP」は電子メールを送信するためのプロトコルです。「FTP」はファイルを転送するためのプロトコルで、いずれもアドレス配布の機能はありません。'},
{id:'Q083',c:'tech',d:1,q:'HTTPSがHTTPと比べて優れている点はどれですか？',o:['通信の速度が必ず向上する','通信内容が暗号化され盗聴や改ざんを防げる','表示できる画像の枚数が増える','必要なサーバーの台数を減らせる'],a:1,e:'HTTPSはHTTPの通信をTLSで暗号化したもので、盗聴・改ざん・なりすましを防ぎます。「通信の速度が必ず向上する」は誤りで、暗号化と復号の処理が加わるぶんむしろ負荷は増えます。「表示できる画像の枚数が増える」は暗号化とは無関係です。「必要なサーバーの台数を減らせる」も誤りで、HTTPSの導入によって台数が減ることはありません。'},
{id:'Q084',c:'tech',d:1,fig:FIG_CIA,q:'図は情報セキュリティの3要素を表しています。「要素Z」に入るものはどれですか？',o:['可用性','効率性','拡張性','経済性'],a:0,e:'情報セキュリティの3要素（CIA）は機密性・完全性・可用性です。図で残っている要素Zは可用性にあたり、必要なときに使える状態を保つことを指します。「効率性」「拡張性」「経済性」はいずれもシステムの品質特性ではありますが、CIAには含まれません。3つの頭文字（Confidentiality／Integrity／Availability）で覚えるのが確実です。'},
{id:'Q085',c:'tech',d:1,q:'「データが改ざんされていないこと」を指す情報セキュリティの要素はどれですか？',o:['機密性','完全性','可用性','否認防止'],a:1,e:'完全性は、データが正確で改ざんされていない状態を保つことを指します。「機密性」は許可された人だけが情報にアクセスできることです。「可用性」は必要なときに使える状態を保つことです。「否認防止」は行った操作を後から否定できないようにすることで、3要素を補う概念として扱われます。'},
{id:'Q086',c:'tech',d:1,q:'データを暗号化して使えなくし、復元と引き換えに金銭を要求するマルウェアはどれですか？',o:['スパイウェア','ランサムウェア','アドウェア','ボット'],a:1,e:'ランサムウェアは身代金（ransom）を要求するマルウェアで、ネットワークから切り離したバックアップの保管が有効な対策になります。「スパイウェア」は利用者の情報をひそかに収集して外部へ送信するもので、金銭の要求はしません。「アドウェア」は広告を強制的に表示するものです。「ボット」は外部からの指令で動作し、攻撃の踏み台にされるもので、いずれも暗号化による脅迫は行いません。'},
{id:'Q087',c:'tech',d:1,q:'技術的な手段ではなく、人の心理や不注意につけ込んで情報を盗み出す手口はどれですか？',o:['SQLインジェクション','ソーシャルエンジニアリング','ブルートフォース攻撃','DoS攻撃'],a:1,e:'ソーシャルエンジニアリングは、なりすまし電話、肩越しののぞき見、ゴミ箱あさりなど、人間の心理や隙を突く手口です。「SQLインジェクション」は入力欄に不正なSQL文を注入する技術的な攻撃です。「ブルートフォース攻撃」はパスワードを総当たりで試す技術的な攻撃です。「DoS攻撃」は大量のアクセスでサービスを停止させる攻撃で、いずれも人ではなくシステムを直接狙います。'},
{id:'Q088',c:'tech',d:2,fig:FIG_PKI,q:'図は公開鍵暗号方式で機密の情報を送る流れです。「鍵ア」と「鍵イ」の組合せとして正しいものはどれですか？',o:['ア：受信者の公開鍵、イ：受信者の秘密鍵','ア：受信者の秘密鍵、イ：受信者の公開鍵','ア：送信者の公開鍵、イ：送信者の秘密鍵','ア：送信者の秘密鍵、イ：受信者の公開鍵'],a:0,e:'受信者の公開鍵で暗号化すれば、対応する受信者の秘密鍵を持つ本人だけが復号できます。「ア：受信者の秘密鍵、イ：受信者の公開鍵」は逆で、秘密鍵は本人しか持たないため送信者が暗号化に使うことはできません。「ア：送信者の公開鍵、イ：送信者の秘密鍵」は送信者の鍵ペアを使っており、受信者が復号できません。「ア：送信者の秘密鍵、イ：受信者の公開鍵」は署名の場面と取り違えた組合せです。'},
{id:'Q089',c:'tech',d:2,q:'デジタル署名によって確認できることの組み合わせとして正しいものはどれですか？',o:['送信者のなりすましと、内容の改ざんの検知','通信内容の秘匿と、通信速度の向上','データの圧縮と、記憶容量の削減','サーバーの負荷分散と、可用性の向上'],a:0,e:'デジタル署名は、送信者が本人であること（なりすましの防止）と、内容が改ざんされていないこと（完全性）を確認できます。「通信内容の秘匿と、通信速度の向上」の秘匿は暗号化の役割で、署名は内容を隠すものではありません。「データの圧縮と、記憶容量の削減」は圧縮技術の効果です。「サーバーの負荷分散と、可用性の向上」はロードバランサなどの役割で、いずれも署名の機能ではありません。'},
{id:'Q090',c:'tech',d:2,q:'多要素認証の例として適切なものはどれですか？',o:['パスワードと秘密の質問の2つを使う','パスワードとスマホに届くコードを使う','同じパスワードを2回続けて入力する','パスワードを定期的に変更して使う'],a:1,e:'多要素認証は「知識（パスワード）」「所持（スマホ・カード）」「生体（指紋・顔）」のうち2種類以上を組み合わせます。パスワード（知識）とスマホに届くコード（所持）は異なる要素なので該当します。「パスワードと秘密の質問の2つを使う」はどちらも知識の要素なので、2段階ではあっても多要素にはなりません。「同じパスワードを2回続けて入力する」は単なる再入力です。「パスワードを定期的に変更して使う」は運用上の対策で、認証の要素を増やすものではありません。'},
];

// ─── シナリオ問題（「〜したい場合」形式）─────────────────────
// ★IDは学習記録（scenarioStats）の紐づけキー。絶対に振り直さないこと。
const SCENARIO_Q = [
{id:'S001',c:'corp',d:2,q:'自社で開発したプログラムのソースコードを、社外に漏らさないよう秘密として管理しています。これを法的に保護する根拠として最も適切なものはどれですか？',o:['不正競争防止法の営業秘密','特許法の実用新案','商標法','下請法'],a:0,e:'秘密として管理され、有用で、公然と知られていない情報は不正競争防止法上の「営業秘密」として保護されます。「特許法の実用新案」は物品の形状・構造の考案を対象とし、出願・登録が必要で内容も公開されるため、秘密のまま守る用途には合いません。「商標法」は商品やサービスの名称・ロゴを保護する法律です。「下請法」は親事業者による支払遅延などを禁じる法律で、いずれも秘密情報の保護を目的としていません。'},
{id:'S002',c:'strategy',d:1,fig:FIG_SWOT,q:'新規事業の立ち上げにあたり、図のように自社の強み・弱みと、市場の機会・脅威を整理したいと考えています。適切な分析手法はどれですか？',o:['SWOT分析','損益分岐点分析','ABC分析','回帰分析'],a:0,e:'SWOT分析は内部環境（強み・弱み）と外部環境（機会・脅威）を2軸で整理する手法で、図の枠組みがまさにそれです。「損益分岐点分析」は利益がゼロになる売上高を求める会計上の分析です。「ABC分析」は金額や件数の大きい順に分類して重点管理の対象を決める手法です。「回帰分析」は数値どうしの関係を式で表す統計手法で、いずれも内部・外部環境の整理には使いません。'},
{id:'S003',c:'syssta',d:1,q:'請求書の処理という定型的なパソコン操作を自動化し、事務担当者の負担を減らしたいと考えています。最も適した仕組みはどれですか？',o:['BI','RPA','CRM','SFA'],a:1,e:'RPAは定型的なパソコン操作をソフトウェアのロボットに代行させる仕組みで、転記や集計の自動化に適しています。「BI」は蓄積データを分析して意思決定を支援するツールで、операции の代行はしません。「CRM」は顧客との関係を管理する仕組みです。「SFA」は営業活動の進捗を管理する仕組みで、いずれも事務処理そのものを自動化するものではありません。'},

// ── 企業と法務 ──
{id:'S004',c:'corp',d:2,q:'取引先から受け取った技術資料を、社内で厳重に管理し限られた担当者だけが閲覧できるようにしています。この管理を怠った場合に失われる可能性が高い保護はどれですか？',o:['特許権による保護','営業秘密としての保護','商標権による保護','意匠権による保護'],a:1,e:'営業秘密は「秘密管理性」が要件のひとつなので、誰でも見られる状態にすると不正競争防止法による保護を受けられなくなります。「特許権による保護」は出願・登録によって発生するため、社内の管理状態では失われません。「商標権による保護」も登録により発生し、名称やロゴが対象です。「意匠権による保護」は物品のデザインが対象で登録が必要なので、いずれも管理の緩みで直ちに失われるものではありません。'},
{id:'S005',c:'corp',d:1,q:'自社製品の名称を他社に無断で使われないようにしたいと考えています。取得すべき権利はどれですか？',o:['著作権','特許権','商標権','実用新案権'],a:2,e:'商品やサービスの名称・ロゴを保護するのは商標権で、特許庁への出願と登録が必要です。「著作権」は創作的な表現を保護する権利で、短い商品名は原則として対象になりません。「特許権」は高度な発明を保護します。「実用新案権」は物品の形状・構造の考案を保護するもので、いずれも名称そのものを独占する権利ではありません。'},
{id:'S006',c:'corp',d:2,q:'外部の開発会社に開発を委託しましたが、自社の担当者が先方の技術者に直接、日々の作業指示を出しています。契約が請負契約である場合、この状態はどう評価されますか？',o:['契約どおりで特に問題はない','偽装請負にあたるおそれがある','自動的に派遣契約へ切り替わる','下請法違反として扱われる'],a:1,e:'請負契約では発注者に指揮命令権がないため、直接指示を出すと実態が派遣に近くなり偽装請負として問題になります。「契約どおりで特に問題はない」は請負の性質を無視しています。「自動的に派遣契約へ切り替わる」ことはなく、契約の切替えには手続きが必要です。「下請法違反として扱われる」は誤りで、下請法が禁じるのは支払遅延や不当な減額であり、指揮命令の問題とは別の法律の話です。'},
{id:'S007',c:'corp',d:2,q:'製品の不良原因を洗い出すため、要因を「人・機械・材料・方法」といった大きな分類から枝分かれさせて整理したいと考えています。適した図はどれですか？',o:['パレート図','特性要因図','散布図','ヒストグラム'],a:1,e:'特性要因図（魚の骨図）は、結果に対する要因を大骨・小骨に分けて体系的に整理する図です。「パレート図」は件数の多い順に並べて重点対策の対象を絞る図で、原因の枝分かれは表しません。「散布図」は2項目の相関を点で見る図です。「ヒストグラム」は値の分布を柱で表す図で、いずれも要因の階層構造を整理する用途には向きません。'},
{id:'S008',c:'corp',d:2,q:'収集した顧客情報を、取得時に伝えた目的とは異なる用途に使いたいと考えています。原則として必要な対応はどれですか？',o:['特段の対応は必要とされない','あらかじめ本人の同意を得る','社内の会議で決議すれば足りる','情報を暗号化すれば足りる'],a:1,e:'個人情報保護法では、特定した利用目的の範囲を超えて取り扱う場合、原則としてあらかじめ本人の同意が必要です。「特段の対応は必要とされない」は目的外利用の制限そのものを否定しています。「社内の会議で決議すれば足りる」は、同意すべき主体が本人である点を取り違えています。「情報を暗号化すれば足りる」は安全管理措置の話で、利用目的の制限とは別の論点です。'},
{id:'S009',c:'corp',d:2,fig:FIG_PARETO,q:'図のように売上を金額の大きい順に並べ、上位が全体に占める割合を確認して重点管理の対象を決めたいと考えています。適した手法はどれですか？',o:['ABC分析','SWOT分析','回帰分析','待ち行列分析'],a:0,e:'ABC分析はパレート図の考え方に基づき、金額や件数の大きい順にA・B・Cへ分類して重点管理の対象を決める手法です。「SWOT分析」は内部・外部環境を整理する経営戦略の手法で、重点品目の抽出には使いません。「回帰分析」は数値の関係を式で表す統計手法です。「待ち行列分析」は行列の長さや待ち時間を求める手法で、いずれも図の考え方とは異なります。'},

// ── 経営戦略 ──
{id:'S010',c:'strategy',d:2,fig:FIG_PPM,q:'図のPPMで、成長市場に参入しているものの自社の占有率が低い事業（領域ア）について、一般的にとるべき判断はどれですか？',o:['投資を抑えて資金の回収に専念する','投資して育てるか撤退するかを判断する','何もせず現状のまま維持する','直ちに他社へ売却する'],a:1,e:'成長市場かつ低占有率の領域アは「問題児」です。資金を投入して「花形」に育てるか、見込みがなければ撤退するかの判断が必要になります。「投資を抑えて資金の回収に専念する」のは金のなる木（領域イ）に対する方針です。「何もせず現状のまま維持する」は成長市場での機会損失につながります。「直ちに他社へ売却する」は判断を尽くさずに結論を出しており、育成の可能性を検討していません。'},
{id:'S011',c:'strategy',d:2,q:'新サービスの企画にあたり、市場を年齢層で細分化し、その中から狙う層を絞り込みたいと考えています。この一連の考え方はどれですか？',o:['STP分析','PDCAサイクル','バリューチェーン分析','ファイブフォース分析'],a:0,e:'セグメンテーション（細分化）→ ターゲティング（狙う層の決定）→ ポジショニング（位置づけ）という流れをSTP分析と呼びます。「PDCAサイクル」は計画・実行・評価・改善を繰り返す業務改善の考え方です。「バリューチェーン分析」は自社の活動を価値の連鎖として分解する手法です。「ファイブフォース分析」は業界の競争環境を5つの力で分析する手法で、いずれも市場の細分化と標的の選定を扱うものではありません。'},
{id:'S012',c:'strategy',d:2,q:'調達から生産・物流・販売までの流れ全体を見直し、在庫を減らして納期を短縮したいと考えています。適した取り組みはどれですか？',o:['CRM','SCM','SFA','BSC'],a:1,e:'SCM（サプライチェーンマネジメント）は供給の流れ全体を最適化する取り組みで、在庫削減と納期短縮に直結します。「CRM」は顧客との関係を管理する仕組みで、供給側の流れは扱いません。「SFA」は営業活動を支援する仕組みです。「BSC」は業績を多面的に評価する手法で、いずれも調達から販売までの流れの最適化を目的としていません。'},
{id:'S013',c:'strategy',d:2,q:'会計・人事・生産・販売の情報がそれぞれ別のシステムに分散しており、全体像が把握できません。統合したい場合に適した仕組みはどれですか？',o:['ERP','RPA','CRM','BI'],a:0,e:'ERP（企業資源計画）は基幹業務の情報を1つに統合し、経営資源を全体最適で管理する仕組みです。「RPA」は定型的なPC操作を自動化する仕組みで、システムの統合は行いません。「CRM」は顧客情報に特化した管理です。「BI」は既にあるデータを分析する仕組みで、分散したシステムそのものを統合するものではありません。'},
{id:'S014',c:'strategy',d:2,fig:FIG_BSC,q:'図のように、業績評価を財務だけに偏らせず、顧客満足や人材育成の観点も含めて多面的に行いたいと考えています。適した手法はどれですか？',o:['損益分岐点分析','バランススコアカード','ABC分析','SWOT分析'],a:1,e:'バランススコアカードは財務・顧客・業務プロセス・学習と成長の4視点から多面的に業績を評価する手法で、図の構造がこれにあたります。「損益分岐点分析」は費用と売上の関係だけを見る分析です。「ABC分析」は重点管理の対象を選ぶ手法です。「SWOT分析」は環境を整理する手法で、いずれも業績評価の枠組みではありません。'},

// ── システム戦略 ──
{id:'S015',c:'syssta',d:1,fig:FIG_CLOUD,q:'初期投資を抑えてすぐに業務システムを使い始めたいと考えており、サーバーの調達もOSの管理も行いたくありません。図のうち適した形態はどれですか？',o:['オンプレミス','IaaS','SaaS','ハウジング'],a:2,e:'SaaSは完成したソフトウェアをネットワーク越しに使う形態で、図の左端のようにインフラもOSも事業者が管理するためすぐに使い始められます。「オンプレミス」は自社で機器を保有・運用する形態で初期投資が大きくなります。「IaaS」は図の右端のようにOS以上を利用者が管理します。「ハウジング」は自社機器を事業者の施設に設置する形態で、機器の調達と管理は自社に残ります。'},
{id:'S016',c:'syssta',d:2,fig:FIG_CLOUD,q:'自社の業務に合わせてOSやミドルウェアを細かく設定したいが、物理的なサーバーは持ちたくありません。図のうち適した形態はどれですか？',o:['SaaS','PaaS','IaaS','ASP'],a:2,e:'IaaSはサーバーやストレージなどのインフラのみを借りる形態で、図の右端のようにOS以上を利用者が自由に設定できます。「SaaS」は完成したソフトを使うだけで、OSの設定はできません。「PaaS」はアプリの実行環境まで事業者が用意するため、OSやミドルウェアの細かな設定はできません。「ASP」はSaaSの前身にあたる形態で、やはりOSの管理権限は得られません。'},
{id:'S017',c:'syssta',d:1,fig:FIG_RFP,q:'新システムの調達にあたり、まずどのような製品や技術が存在するかを把握したいと考えています。図の流れのうち最初に行うべきことはどれですか？',o:['RFPを提示して提案を求める','RFIで情報提供を依頼する','ベンダーと契約を締結する','受入テストを実施する'],a:1,e:'RFI（情報提供依頼書）で市場にどのような選択肢があるかを把握し、それを踏まえてRFPで具体的な提案を依頼します。図でも左端が情報提供依頼です。「RFPを提示して提案を求める」のは要件を固めた後の2番目の段階です。「ベンダーと契約を締結する」は図の最後の段階です。「受入テストを実施する」は納品後の確認作業で、調達の開始時点では行えません。'},
{id:'S018',c:'syssta',d:1,q:'蓄積された販売データを多角的に集計・分析し、経営判断に役立てたいと考えています。適した仕組みはどれですか？',o:['BI','RPA','SFA','EA'],a:0,e:'BI（ビジネスインテリジェンス）は蓄積データを集計・分析して意思決定を支援する仕組みです。「RPA」は定型的なPC操作を自動化する仕組みで、分析そのものは行いません。「SFA」は営業活動の進捗管理に特化しています。「EA」は組織全体の業務とシステムの構造を整理する考え方で、いずれもデータ分析の基盤ではありません。'},
{id:'S019',c:'syssta',d:2,q:'申請書の提出から上長の承認までの流れを電子化し、今どこで止まっているかを見えるようにしたいと考えています。適した仕組みはどれですか？',o:['ワークフローシステム','グループウェアの掲示板','BIツール','CADシステム'],a:0,e:'ワークフローシステムは申請から承認までの経路と進捗を管理する仕組みで、滞留箇所を可視化できます。「グループウェアの掲示板」は情報共有の場であり、承認経路の制御はできません。「BIツール」は蓄積データの分析に用います。「CADシステム」は設計図面を作成するソフトで、いずれも承認フローの管理を目的としていません。'},

// ── 開発技術 ──
{id:'S020',c:'dev',d:1,q:'利用者の要望が固まりきっておらず、作りながら方向性を確認していきたいと考えています。適した開発手法はどれですか？',o:['ウォーターフォールモデル','アジャイル開発','V字モデル','要件凍結型の開発'],a:1,e:'アジャイル開発は短い反復で動くものを作り、利用者の反応を見ながら進めるため、要望が固まりきっていない場合に適しています。「ウォーターフォールモデル」は工程を後戻りさせない前提なので、途中の方向転換に弱い手法です。「V字モデル」は設計とテストを対応づけた考え方で、ウォーターフォールを前提としています。「要件凍結型の開発」は要件を確定してから進める方式で、状況と正反対です。'},
{id:'S021',c:'dev',d:1,q:'画面のイメージを早い段階で利用者に見せて、認識のずれを解消したいと考えています。適した手法はどれですか？',o:['プロトタイピング','リファクタリング','ペアプログラミング','リグレッションテスト'],a:0,e:'プロトタイピングは試作品を早期に作って確認してもらう手法で、要件の認識ずれを早く発見できます。「リファクタリング」は動作を変えずに内部構造を整理することで、利用者に見える成果はありません。「ペアプログラミング」は2人1組で開発する手法です。「リグレッションテスト」は修正後に既存機能が壊れていないか確かめるテストで、いずれも認識合わせを目的としていません。'},
{id:'S022',c:'dev',d:2,q:'不具合を1件修正したあと、これまで正常に動いていた他の機能に影響が出ていないかを確認したいと考えています。実施すべきテストはどれですか？',o:['単体テスト','リグレッションテスト','負荷テスト','ペネトレーションテスト'],a:1,e:'リグレッションテスト（回帰テスト）は、修正によって既存の機能が壊れていないかを確認するテストです。「単体テスト」は個々のモジュールが仕様どおり動くかを見るテストで、他機能への波及は対象外です。「負荷テスト」は大量のアクセス時の性能を確かめるテストです。「ペネトレーションテスト」は擬似的な攻撃で脆弱性を確認するテストで、いずれも修正の副作用を見るものではありません。'},
{id:'S023',c:'dev',d:2,q:'開発したモジュール単体が仕様どおり動くかを、内部の分岐をすべて通るように確認したいと考えています。適した方法はどれですか？',o:['ブラックボックステストによるシステムテスト','ホワイトボックステストによる単体テスト','利用者による運用テスト','大量アクセスによる負荷テスト'],a:1,e:'内部構造に着目して分岐や命令を網羅するのはホワイトボックステストで、モジュール単位の単体テストで用いられます。「ブラックボックステストによるシステムテスト」は内部を見ず、対象もシステム全体なので条件が二重に合いません。「利用者による運用テスト」は業務に沿った最終確認です。「大量アクセスによる負荷テスト」は性能の確認で、いずれも内部分岐の網羅とは目的が異なります。'},

// ── プロジェクトマネジメント ──
{id:'S024',c:'pm',d:2,fig:FIG_ARROW,q:'図のような日程計画から、どの作業が遅れると納期に響くかを把握したいと考えています。適した手法はどれですか？',o:['ガントチャートで進捗を追う','クリティカルパスを求める','WBSで作業を分解する','パレート図で重点を絞る'],a:1,e:'図のアローダイアグラムで作業の順序と所要日数を表し、最長経路であるクリティカルパスを求めることで、遅れると納期に直結する作業が分かります。「ガントチャートで進捗を追う」は期間と進捗を見る図で、作業間の依存関係や余裕の有無は表せません。「WBSで作業を分解する」は作業を洗い出す段階の手法です。「パレート図で重点を絞る」は品質管理で要因を絞る手法で、日程分析には使いません。'},
{id:'S025',c:'pm',d:1,fig:FIG_WBS,q:'見積りの根拠を明確にするため、まず成果物を作るのに必要な作業を漏れなく洗い出したいと考えています。図のように最初に作るべきものはどれですか？',o:['ガントチャート','WBS','SLA','RFP'],a:1,e:'WBS（作業分解構成図）で作業を階層的に分解することが、見積りや日程計画の出発点になります。「ガントチャート」は洗い出した作業に日程を割り当てる段階で作る図です。「SLA」はサービス品質の水準を合意する文書です。「RFP」はベンダーに提案を依頼する文書で、いずれも作業の洗い出しそのものには使いません。'},
{id:'S026',c:'pm',d:2,q:'プロジェクトの途中で顧客から次々に追加要望が出され、当初の範囲を大きく超えそうです。この状況を指す言葉はどれですか？',o:['スコープクリープ','クリティカルパス','マイルストーン','トレードオフ'],a:0,e:'スコープクリープは、変更管理の手続きを経ずに要求が追加され範囲がじわじわ広がる状態です。「クリティカルパス」は全体の所要日数を決める最長経路のことです。「マイルストーン」は進捗を確認する節目の時点です。「トレードオフ」は一方を優先すると他方が犠牲になる関係で、いずれも範囲の膨張そのものを表す用語ではありません。'},
{id:'S027',c:'pm',d:2,q:'重要なデータを扱うプロジェクトで、情報漏えいのリスクに対して外部の保険を活用することにしました。これはリスク対応のどれにあたりますか？',o:['リスクの回避','リスクの軽減','リスクの転嫁','リスクの受容'],a:2,e:'保険の活用は損失の負担を第三者に移すため、リスクの転嫁にあたります。「リスクの回避」はその活動自体をやめる対応です。「リスクの軽減」は暗号化や教育などで発生確率や影響を下げる対応です。「リスクの受容」は影響が小さいと判断して対策せず受け入れる対応で、保険は損失を自社で負わない点がこれらと異なります。'},

// ── サービスマネジメント ──
{id:'S028',c:'sm',d:1,fig:FIG_ITSM,q:'業務システムが停止し、利用者から問い合わせが殺到しています。図の時系列で、運用担当としてまず優先すべきことはどれですか？',o:['根本原因を徹底的に究明する','サービスを一刻も早く復旧させる','再発防止策の文書を作成する','構成管理データベースを更新する'],a:1,e:'図のとおり障害発生から復旧までの区間はインシデント管理の領域で、目的は迅速な復旧です。「根本原因を徹底的に究明する」のは復旧後に行う問題管理の役割で、先にやると停止時間が延びます。「再発防止策の文書を作成する」も問題管理の成果物です。「構成管理データベースを更新する」は常時行う構成管理の活動で、いずれも復旧より優先されるものではありません。'},
{id:'S029',c:'sm',d:2,q:'利用者からの問い合わせ窓口を一本化し、担当部署への振り分けも含めて対応したいと考えています。適した仕組みはどれですか？',o:['サービスデスク','データセンター','変更諮問委員会（CAB）','セキュリティ監視センター（SOC）'],a:0,e:'サービスデスクは利用者からの問い合わせを受け付ける単一の窓口で、一次対応と適切な部署への引き継ぎを行います。「データセンター」は機器を設置・運用する施設です。「変更諮問委員会（CAB）」は変更の可否を審議する会議体です。「セキュリティ監視センター（SOC）」は攻撃の監視・分析を行う組織で、いずれも一般利用者の窓口ではありません。'},
{id:'S030',c:'sm',d:2,q:'ランサムウェアによる被害に備え、バックアップの運用を見直しています。最も有効な対策はどれですか？',o:['本番と同じネットワークに常時接続して保管する','ネットワークから切り離して保管する','取得の頻度を年に1回だけにする','復旧手順書だけを整備して取得はしない'],a:1,e:'ランサムウェアは接続されている記憶装置も暗号化するため、ネットワークから切り離したオフライン保管が有効です。「本番と同じネットワークに常時接続して保管する」ではバックアップごと暗号化される恐れがあります。「取得の頻度を年に1回だけにする」では失うデータが大きくなりすぎます。「復旧手順書だけを整備して取得はしない」は、戻すべきデータがないため復旧できません。'},

// ── 基礎理論 ──
{id:'S031',c:'theory',d:1,q:'商品Aと商品Bの売上に関係があるかを視覚的に確認したいと考えています。適した図はどれですか？',o:['散布図','パレート図','ヒストグラム','特性要因図'],a:0,e:'散布図は2つの項目の関係（相関）を点の分布で表す図です。「パレート図」は件数の多い順に並べて重点対策の対象を絞る図で、2項目の関係は見られません。「ヒストグラム」は1つの項目の分布を柱で表す図です。「特性要因図」は原因を階層的に整理する図で、いずれも2項目の相関を確認する用途には向きません。'},
{id:'S032',c:'theory',d:1,q:'試験の点数の分布を確認し、どの得点帯に人数が集中しているかを見たいと考えています。適した図はどれですか？',o:['散布図','ヒストグラム','アローダイアグラム','E-R図'],a:1,e:'ヒストグラムは値の範囲（階級）ごとの度数を柱で表し、分布やばらつきを把握する図です。「散布図」は2項目の相関を見る図で、1項目の分布は分かりません。「アローダイアグラム」は作業の順序と日数を表す図です。「E-R図」はデータの構造を表す図で、いずれも度数分布を示すものではありません。'},
{id:'S033',c:'theory',d:1,q:'印刷ジョブを、受け付けた順に処理していきたいと考えています。適したデータ構造はどれですか？',o:['スタック','キュー','木構造','ハッシュ表'],a:1,e:'先に来たものから順に処理するのは先入れ先出し（FIFO）で、キューが該当します。「スタック」は後入れ先出し（LIFO）で、最後に入れたものから処理されるため受付順になりません。「木構造」は階層関係を表すデータ構造です。「ハッシュ表」は키から値を高速に引く構造で、いずれも順番待ちの管理には使いません。'},
{id:'S034',c:'theory',d:1,fig:FIG_STACK,q:'ブラウザの「戻る」機能のように、図の要領で直前の操作から順にさかのぼりたいと考えています。適したデータ構造はどれですか？',o:['キュー','スタック','配列','ハッシュ表'],a:1,e:'図のように最後に入れたものから取り出す後入れ先出し（LIFO）はスタックです。「キュー」は先入れ先出しなので、最も古い操作から取り出されてしまいます。「配列」は要素番号で任意の位置にアクセスする構造で、出し入れの順序は定めません。「ハッシュ表」は키から値を引く構造で、いずれも履歴をさかのぼる動きには合いません。'},
{id:'S035',c:'theory',d:2,fig:FIG_BINSEARCH,q:'100万件の整列済みデータから目的の値を高速に探したいと考えています。図の要領にあたる方法はどれですか？',o:['先頭から順に比較していく','範囲を半分ずつ絞り込む','ランダムに選んで比較する','すべての組み合わせを試す'],a:1,e:'整列済みであれば図のように中央と比較して範囲を半分ずつ絞る二分探索が使え、1回の比較で候補が半分になるためデータ量が多いほど有利です。「先頭から順に比較していく」のは線形探索で、100万件では平均50万回の比較が必要になります。「ランダムに選んで比較する」は整列済みという条件を活かせません。「すべての組み合わせを試す」は探索ではなく総当たりで、現実的な時間で終わりません。'},
{id:'S036',c:'theory',d:2,q:'あるアンケートの回答を集計したところ、平均値が一部の極端な回答に引っ張られていました。分布の中心をより実態に近く表す代表値はどれですか？',o:['最大値','中央値','分散','標準偏差'],a:1,e:'中央値は順に並べた真ん中の値で、極端な外れ値の影響を受けにくい代表値です。「最大値」は最も大きい値そのもので、外れ値の影響を最も強く受けます。「分散」と「標準偏差」はどちらもデータの散らばりの大きさを示す指標で、分布の中心を表す代表値ではありません。'},
{id:'S037',c:'comp',d:2,fig:FIG_SP,q:'サーバーが1台故障してもサービスを止めたくないと考えています。図のうち適した構成はどれですか？',o:['構成X（直列接続）','構成Y（並列接続）','単一のサーバーを高性能化する','バックアップだけを強化する'],a:1,e:'図の構成Yのように並列に冗長化しておけば、1台が故障しても残りで処理を継続でき、稼働率も 1 −（1 − 稼働率）の積 で向上します。「構成X（直列接続）」は1台でも止まると全体が停止するため、目的と正反対です。「単一のサーバーを高性能化する」のは処理速度の向上で、故障には備えられません。「バックアップだけを強化する」はデータの復旧手段であり、サービスの継続とは別の対策です。'},
{id:'S038',c:'comp',d:2,q:'ノートパソコンの紛失による情報漏えいを防ぎたいと考えています。端末側にデータを残さない方式はどれですか？',o:['シンクライアント','スタンドアロン','ピアツーピア','デュアルシステム'],a:0,e:'シンクライアントは処理とデータをサーバー側に集約するため、端末を紛失してもデータが残りません。「スタンドアロン」はネットワークに接続せず単独で動く形態で、データは端末に残ります。「ピアツーピア」は端末どうしが対等に通信する方式で、やはり各端末にデータを持ちます。「デュアルシステム」は2系統で同じ処理を行う信頼性向上の構成で、情報漏えい対策ではありません。'},
{id:'S039',c:'comp',d:1,q:'物理サーバーの台数を減らして設備コストを下げつつ、複数の業務システムを動かし続けたいと考えています。適した技術はどれですか？',o:['仮想化','ミラーリング','デフラグ','データの圧縮'],a:0,e:'仮想化により1台の物理サーバー上で複数の仮想サーバーを動かせるため、設備を集約できます。「ミラーリング」は同じ内容を複製して信頼性を高める技術で、むしろ台数は増えます。「デフラグ」はディスク上の断片化を解消する処理です。「データの圧縮」は容量を減らす技術で、いずれもサーバー台数の削減には直結しません。'},
{id:'S040',c:'comp',d:2,q:'ディスクが1台故障してもデータを失いたくありません。適した構成はどれですか？',o:['RAID0（ストライピング）','RAID1（ミラーリング）','単体ディスクの高速化','ディスクの増設のみ'],a:1,e:'RAID1は同じ内容を2台に書き込むため、1台が故障してもデータが残ります。「RAID0（ストライピング）」は分散書き込みで高速化する構成ですが冗長性がなく、1台の故障で全データを失います。「単体ディスクの高速化」は性能の話で耐障害性は上がりません。「ディスクの増設のみ」では容量が増えるだけで、冗長化の仕組みが伴いません。'},
{id:'S041',c:'comp',d:1,q:'落雷による瞬間的な停電から、サーバーを安全にシャットダウンする時間を確保したいと考えています。導入すべき装置はどれですか？',o:['UPS','NAS','ルータ','スイッチングハブ'],a:0,e:'UPS（無停電電源装置）は停電時に一時的に電力を供給し、安全な停止やシステム切り替えの時間を確保します。「NAS」はネットワーク接続型の共有ストレージです。「ルータ」はネットワーク間の経路制御を行う機器です。「スイッチングハブ」は同一ネットワーク内で通信を中継する機器で、いずれも電源を供給する機能は持ちません。'},
{id:'S042',c:'comp',d:2,fig:FIG_BACKUP,q:'図のように毎日の変更分だけを短時間で保存したいが、復元時に手間がかかっても構わないと考えています。適した方式はどれですか？',o:['フルバックアップ','増分バックアップ','バックアップを取らない','ミラーリング'],a:1,e:'図の下段のように前回のバックアップ以降の変更分だけを取るのが増分バックアップで、取得は速い一方、復元にはフルと以降すべての増分が必要になります。「フルバックアップ」は毎回すべてを取るため取得に時間がかかります。「バックアップを取らない」は保存という要件を満たしません。「ミラーリング」は常時複製する冗長化技術で、世代管理を伴うバックアップとは目的が異なります。'},
{id:'S043',c:'tech',d:1,fig:FIG_KEYS,q:'図の社員表で、社員番号を使って各行を一意に識別したいと考えています。この列に設定すべきものはどれですか？',o:['外部キー','主キー','インデックスのみ','ビュー'],a:1,e:'各行を一意に識別する列には主キーを設定し、重複と空欄（NULL）が許されなくなります。「外部キー」は図のキーQのように他の表を参照する列に設定するものです。「インデックスのみ」では検索は速くなりますが一意性は保証されません。「ビュー」は表示上の仮想的な表で、列に設定する制約ではありません。'},
{id:'S044',c:'tech',d:2,fig:FIG_KEYS,q:'図のように、社員表の「部署コード」を部署表の部署コードと対応づけて整合性を保ちたいと考えています。設定すべきものはどれですか？',o:['主キー','外部キー','チェック制約','インデックス'],a:1,e:'他の表の主キーを参照する列には外部キーを設定し、存在しない部署コードの登録を防げます。「主キー」は自分の表の行を一意に識別する列に設定するもので、参照関係を表しません。「チェック制約」は値の範囲などを制限する仕組みで、他表との対応は保証しません。「インデックス」は検索を速くする索引で、整合性の維持は行いません。'},
{id:'S045',c:'tech',d:2,q:'銀行の振込処理で、出金だけが記録されて入金が記録されない事態を避けたいと考えています。必要な仕組みはどれですか？',o:['トランザクション処理','インデックスの追加','正規化','バックアップ'],a:0,e:'トランザクションは複数の処理をひとまとまりとして扱い、すべて成功（コミット）かすべて取り消し（ロールバック）のいずれかにします。「インデックスの追加」は検索を速くするだけで、処理の一貫性とは無関係です。「正規化」は重複を排除する設計手法です。「バックアップ」は障害後に戻すための備えで、いずれも処理の途中で中断した場合の整合性を保証しません。'},
{id:'S046',c:'tech',d:1,q:'社外から会社のメールを確認する際に、通信内容を盗み見られないようにしたいと考えています。適した対策はどれですか？',o:['通信を暗号化する','パスワードを短くする','公衆無線LANを優先して使う','送信先の宛先を増やす'],a:0,e:'通信の暗号化（TLSなど）により、経路上での盗聴や改ざんを防げます。「パスワードを短くする」は総当たり攻撃に弱くなるだけで、通信内容の保護にはなりません。「公衆無線LANを優先して使う」は盗聴の危険がむしろ高まります。「送信先の宛先を増やす」は情報が拡散するだけで、対策として成立しません。'},
{id:'S047',c:'tech',d:1,q:'取引先を名乗る電話で社員のパスワードを聞き出そうとする行為を受けました。この手口はどれに分類されますか？',o:['SQLインジェクション','ソーシャルエンジニアリング','ゼロデイ攻撃','DoS攻撃'],a:1,e:'技術ではなく人の心理や不注意につけ込む手口はソーシャルエンジニアリングで、本人確認の手順化と教育が対策になります。「SQLインジェクション」は入力欄に不正なSQL文を注入する技術的な攻撃です。「ゼロデイ攻撃」は修正プログラムが出る前の脆弱性を突く攻撃です。「DoS攻撃」は大量アクセスでサービスを止める攻撃で、いずれも人を直接だます手口ではありません。'},
{id:'S048',c:'tech',d:2,q:'パスワードが漏えいしても不正ログインされにくくしたいと考えています。最も効果的な対策はどれですか？',o:['パスワードをより長い文字列にする','多要素認証を導入する','ログイン画面のデザインを変える','パスワードを紙にメモして保管する'],a:1,e:'多要素認証は「知識」「所持」「生体」のうち2種類以上を組み合わせるため、パスワードが漏れても別の要素で不正ログインを防げます。「パスワードをより長い文字列にする」は総当たりには有効ですが、漏えい後は長さに関係なく使われてしまいます。「ログイン画面のデザインを変える」は認証の強度と無関係です。「パスワードを紙にメモして保管する」はむしろ漏えいの危険を高めます。'},
{id:'S049',c:'corp',d:1,q:'社内の業務改善活動で、計画を立てて実行し、結果を評価して次の計画に反映する流れを定着させたいと考えています。適した考え方はどれですか？',o:['PDCAサイクル','QCD','STP分析','SWOT分析'],a:0,e:'PDCA（計画・実行・評価・改善）を繰り返すことで、業務を継続的に良くしていけます。「QCD」は品質・コスト・納期というプロジェクトの制約条件を表す言葉で、改善の手順ではありません。「STP分析」は市場を細分化して標的を定める手法です。「SWOT分析」は環境を整理する手法で、いずれも繰り返しによる改善の枠組みではありません。'},
{id:'S050',c:'corp',d:2,q:'新しく開発した装置の構造上の工夫を、他社に模倣されないよう保護したいと考えています。取得を検討すべき権利はどれですか？',o:['著作権','特許権または実用新案権','商標権','肖像権'],a:1,e:'技術的な発明・考案を保護するのは特許権（高度な発明）または実用新案権（物品の形状・構造の考案）で、いずれも出願と登録が必要です。「著作権」は創作的な表現を保護する権利で、装置の構造という技術的アイデアは対象外です。「商標権」は名称やロゴを保護します。「肖像権」は個人の容貌に関する権利で、いずれも技術の保護には使えません。'},
{id:'S051',c:'corp',d:2,q:'親事業者として下請事業者に発注しましたが、資金繰りを理由に支払を大幅に遅らせようとしています。この行為はどう評価されますか？',o:['契約自由の原則により問題ない','下請法に違反するおそれがある','独占禁止法の適用対象外である','不正アクセス禁止法の問題である'],a:1,e:'下請法は親事業者による支払遅延や不当な減額を禁じ、立場の弱い下請事業者を保護しています。「契約自由の原則により問題ない」は、当事者間の力関係の差を是正するために特別法が設けられている点を無視しています。「独占禁止法の適用対象外である」も誤りで、下請法は独占禁止法を補完する法律です。「不正アクセス禁止法の問題である」はコンピュータへの不正侵入を規律する法律で、支払いとは無関係です。'},
{id:'S052',c:'corp',d:2,q:'株主が経営者を適切に監視し、経営の透明性を確保する仕組みを整えたいと考えています。この取り組みを指す言葉はどれですか？',o:['コンプライアンス','コーポレートガバナンス','CSR','内部統制'],a:1,e:'コーポレートガバナンス（企業統治）は、経営者が適切に経営しているかを株主などが監視し規律づける仕組みです。「コンプライアンス」は法令や社内規程を守ることを指します。「CSR」は企業の社会的責任で、環境や地域社会への配慮を含む考え方です。「内部統制」は組織自らが業務の適正を確保する仕組みで、監視する主体が経営者側にある点が異なります。'},
{id:'S053',c:'strategy',d:2,q:'自社にない技術を短期間で取り込みたいが、相手企業を買収するほどの資金はありません。適した選択肢はどれですか？',o:['M&Aによる完全子会社化','アライアンス（業務提携）','自社での一から研究開発','その事業からの撤退'],a:1,e:'アライアンスは資本関係を持たずに提携して協力する形態で、資金負担を抑えつつ相互の強みを活かせます。「M&Aによる完全子会社化」は多額の資金が必要で、前提条件に反します。「自社での一から研究開発」は短期間という条件に合いません。「その事業からの撤退」は技術を取り込むという目的そのものを放棄しています。'},
{id:'S054',c:'strategy',d:2,q:'業界で優れた実績を上げている他社の業務のやり方を調べ、自社との差を埋めたいと考えています。適した手法はどれですか？',o:['ベンチマーキング','ブレーンストーミング','バリューチェーン分析','デルファイ法'],a:0,e:'ベンチマーキングは優れた事例と自社を比較し、その差を明らかにして改善につなげる手法です。「ブレーンストーミング」は批判を控えて自由にアイデアを出し合う発想法です。「バリューチェーン分析」は自社の活動を価値の連鎖として分解する手法で、他社との比較は主目的ではありません。「デルファイ法」は専門家の意見を繰り返し集約して予測する手法です。'},
{id:'S055',c:'strategy',d:3,q:'新技術を用いた製品が、一部の先進的な利用者には受け入れられたものの、一般層への普及が進まず伸び悩んでいます。この状況を表す言葉はどれですか？',o:['ロングテール','キャズム','カニバリゼーション','デファクトスタンダード'],a:1,e:'キャズムは初期採用者と初期多数派の間にある大きな溝で、ここを越えられるかが本格普及の分かれ目になります。「ロングテール」はニッチ商品の売上合計が大きくなる現象で、普及の段階を表す言葉ではありません。「カニバリゼーション」は自社製品どうしが顧客を奪い合う共食い現象です。「デファクトスタンダード」は事実上の業界標準を指し、いずれも普及が止まる状況の説明にはなりません。'},
{id:'S056',c:'strategy',d:2,q:'営業担当者ごとに管理されている商談の進捗を全社で共有し、案件の取りこぼしを防ぎたいと考えています。適した仕組みはどれですか？',o:['SFA','SCM','ERP','MRP'],a:0,e:'SFA（営業支援システム）は商談情報や進捗を可視化・共有し、営業活動の効率と精度を高めます。「SCM」は調達から販売までの供給の流れを最適化する仕組みです。「ERP」は基幹業務全体を統合する仕組みで、商談管理に特化してはいません。「MRP」は生産に必要な資材の所要量を計画する仕組みで、いずれも営業案件の管理を主目的としていません。'},
{id:'S057',c:'syssta',d:2,q:'既存の業務手順を部分的に手直しするのではなく、そもそもの進め方から根本的に見直したいと考えています。適した取り組みはどれですか？',o:['BPM','BPR','PDCA','KAIZEN'],a:1,e:'BPR（業務プロセス再構築）は業務を根本から設計し直す抜本的な取り組みです。「BPM」は業務プロセスを継続的に分析・改善し続ける管理手法で、根本からの作り直しではありません。「PDCA」も繰り返しによる継続的改善の枠組みです。「KAIZEN」は現場主導の小さな改善の積み重ねで、いずれも部分的な手直しの延長にあたります。'},
{id:'S058',c:'syssta',d:3,q:'組織全体の業務とシステムの現状を体系的に整理し、あるべき姿とのギャップを把握したいと考えています。適した手法はどれですか？',o:['エンタープライズアーキテクチャ（EA）','ファンクションポイント法','ウォーターフォールモデル','ITIL'],a:0,e:'EAはビジネス・データ・アプリケーション・技術の4階層で組織全体を整理し、現状と目標のギャップから移行計画を立てる手法です。「ファンクションポイント法」は開発規模を見積もる手法で、対象は個々のシステムです。「ウォーターフォールモデル」は開発の進め方であり、全体像の整理には使いません。「ITIL」はITサービス運用のベストプラクティス集で、組織構造の設計を扱うものではありません。'},
{id:'S059',c:'syssta',d:1,fig:FIG_RFP,q:'発注前に、ベンダーから具体的な提案内容と見積金額を集めて比較したいと考えています。図のうち提示すべき文書はどれですか？',o:['RFI','RFP','SLA','NDA'],a:1,e:'RFP（提案依頼書）は要件を提示して具体的な提案と見積りを依頼する文書で、図の2番目にあたります。「RFI」はその前段階で、どのような製品や技術があるかを把握するための情報収集です。「SLA」はサービス品質の水準を合意する文書で、契約後の運用に関わります。「NDA」は秘密保持契約で、提案を求める前提として結ぶことはあっても提案依頼そのものではありません。'},
{id:'S060',c:'syssta',d:2,q:'紙で行っていた稟議を電子化するだけでなく、承認の階層そのものを見直して意思決定を速くしたいと考えています。この取り組みに最も近い概念はどれですか？',o:['デジタイゼーション（単純な電子化）','DX（デジタルトランスフォーメーション）','バックアップ体制の強化','ハードウェアの更改'],a:1,e:'業務のやり方や仕組みそのものを変革するのがDXです。「デジタイゼーション（単純な電子化）」は紙をそのまま電子データにする段階で、承認の階層は変わりません。「バックアップ体制の強化」はデータ保全の話で、意思決定の速さとは関係がありません。「ハードウェアの更改」は設備の入替えにすぎず、業務プロセスは変わらないままです。'},
{id:'S061',c:'dev',d:1,fig:FIG_VMODEL,q:'仕様が明確に固まっており、図のように工程ごとに成果物を確定させながら順に進めたいと考えています。適した開発手法はどれですか？',o:['ウォーターフォールモデル','アジャイル開発','スクラム','エクストリームプログラミング'],a:0,e:'図のV字モデルが前提とするように、工程を後戻りさせず順に進めるのがウォーターフォールモデルで、仕様が固まっている場合に適しています。「アジャイル開発」は短い反復で変更に対応する手法で、工程を確定させながら進める方式とは考え方が異なります。「スクラム」と「エクストリームプログラミング」はいずれもアジャイル開発の代表的な進め方で、同様に反復を前提としています。'},
{id:'S062',c:'dev',d:1,q:'2人1組で1台の端末を使い、一方が書いてもう一方が確認しながら開発することで、品質向上と知識共有を同時に図りたいと考えています。適した手法はどれですか？',o:['ペアプログラミング','プロトタイピング','リバースエンジニアリング','ウォークスルー'],a:0,e:'ペアプログラミングはXP（エクストリームプログラミング）の代表的な実践で、その場でレビューしながら書くため品質と知識共有を同時に高められます。「プロトタイピング」は試作品を作って要件を確認する手法です。「リバースエンジニアリング」は完成物を解析して仕様を明らかにすることです。「ウォークスルー」は成果物を関係者で読み合わせるレビュー手法で、2人1組で同時に書く形態ではありません。'},
{id:'S063',c:'dev',d:3,q:'開発チームと運用チームが分断されており、リリースのたびに調整に時間がかかっています。改善のための考え方はどれですか？',o:['DevOps','MOT','BPO','ITIL'],a:0,e:'DevOpsは開発（Development）と運用（Operations）が連携し、自動化を通じてリリースまでの流れを速く安定させる考え方です。「MOT」は技術経営で、技術を事業成果に結びつける経営手法です。「BPO」は業務の外部委託で、分断の解消にはなりません。「ITIL」はITサービス運用のベストプラクティス集で、運用側の整備が中心であり開発との連携そのものを主題としていません。'},
{id:'S064',c:'pm',d:1,q:'各作業の開始日と終了日、現在の進捗状況をひと目で把握できるようにしたいと考えています。適した図はどれですか？',o:['アローダイアグラム','ガントチャート','WBS','特性要因図'],a:1,e:'ガントチャートは作業を横棒で表し、期間と進捗を時系列で示します。「アローダイアグラム」は作業順序と最長経路を求める図で、日々の進捗は表しません。「WBS」は作業を階層的に分解した図で、日程の情報を持ちません。「特性要因図」は品質管理で原因を整理する図で、いずれも進捗の可視化には使いません。'},
{id:'S065',c:'pm',d:1,q:'プロジェクトの節目ごとに、成果物の完成状況を関係者で確認する時点を設けたいと考えています。この時点を何と呼びますか？',o:['クリティカルパス','マイルストーン','スコープ','ベースライン'],a:1,e:'マイルストーンは設計完了や本稼働開始など、達成状況を確認する節目の目印です。「クリティカルパス」は全体の所要日数を決める最長経路で、時点ではなく経路を指します。「スコープ」はプロジェクトが扱う作業の範囲のことです。「ベースライン」は変更管理の基準として確定させた計画や成果物で、いずれも確認の時点そのものを表す言葉ではありません。'},
{id:'S066',c:'sm',d:2,fig:FIG_ITSM,q:'同じ障害が何度も繰り返し発生しています。図の時系列のうち、強化すべき活動はどれですか？',o:['インシデント管理','問題管理','リリース管理','キャパシティ管理'],a:1,e:'繰り返す障害には根本原因の究明と再発防止が必要で、これは図の右側にある問題管理の役割です。「インシデント管理」は図の左側にあたり、目の前の障害を早く復旧させることが目的なので再発は防げません。「リリース管理」は変更を本番へ展開する活動です。「キャパシティ管理」は処理能力を計画する活動で、いずれも原因の除去を担いません。'},
{id:'S067',c:'sm',d:2,q:'利用者数の増加に備え、将来必要になる処理能力や記憶容量を見積もっておきたいと考えています。適した活動はどれですか？',o:['キャパシティ管理','インシデント管理','構成管理','変更管理'],a:0,e:'キャパシティ管理は将来の需要を予測し、能力や容量が不足しないよう計画する活動です。「インシデント管理」は発生した障害を早期に復旧させる活動です。「構成管理」は機器や設定の情報を最新に保つ活動です。「変更管理」は変更を評価・承認する活動で、いずれも将来の需要予測を目的としていません。'},
{id:'S068',c:'theory',d:2,q:'2進数の 1010 と 0110 の論理積（AND）を求めるといくつになりますか？',o:['1110','0010','1100','0000'],a:1,e:'ANDは各桁で両方が1のときだけ1になります。桁ごとに見ると 1と0→0、0と1→0、1と1→1、0と0→0 なので、結果は 0010 です。「1110」は論理和（OR）の結果です。「1100」は排他的論理和（XOR）の結果です。「0000」は共通する1の桁が存在しない場合の結果で、この2つの値には3桁目に共通の1があるため該当しません。'},
{id:'S069',c:'theory',d:2,q:'2進数の 1101 と 1011 の排他的論理和（XOR）を求めるといくつになりますか？',o:['0110','1001','1111','1000'],a:0,e:'XORは各桁の値が異なるときだけ1になります。桁ごとに見ると 1と1→0、1と0→1、0と1→1、1と1→0 なので、結果は 0110 です。「1001」は各桁が一致するときに1とする否定排他的論理和の結果です。「1111」は論理和（OR）の結果です。「1000」は論理積（AND）の結果で、演算の種類を取り違えると選んでしまいます。'},
{id:'S070',c:'theory',d:3,q:'10進数の 200 を2進数で表すとき、必要なビット数は最低いくつですか？',o:['6ビット','7ビット','8ビット','9ビット'],a:2,e:'7ビットでは 0〜127 までしか表せず、8ビットなら 0〜255 を表せるため、200 には8ビット必要です。「6ビット」は 0〜63 までしか表せません。「7ビット」は上限が127なので200に届きません。「9ビット」は 0〜511 を表せますが、8ビットで足りるため「最低」という条件に反します。'},
{id:'S071',c:'theory',d:1,q:'サイコロを1回振って、3以上の目が出る確率はいくつですか？',o:['1/3','1/2','2/3','5/6'],a:2,e:'3以上の目は 3・4・5・6 の4通りで、全部で6通りなので 4/6 ＝ 2/3 となります。「1/3」は2通りと数えた場合の値です。「1/2」は3通り、つまり「4以上」と取り違えた場合の値です。「5/6」は5通りで、「2以上」と読み違えた場合の値にあたり、境界の3を含めるかどうかが要点です。'},
{id:'S072',c:'theory',d:3,q:'4人の中から委員長と副委員長を1人ずつ選ぶ場合、選び方は何通りありますか？',o:['6通り','12通り','16通り','24通り'],a:1,e:'役割が異なるため順序を区別する順列です。4P2 ＝ 4×3 ＝ 12通りとなります。「6通り」は順序を区別しない組合せ 4C2 の値で、役職の違いを無視しています。「16通り」は同じ人を重複して選べるとした 4×4 の値です。「24通り」は4人全員を並べる 4! の値で、選ぶ人数を取り違えています。'},
{id:'S073',c:'theory',d:2,q:'ある部署の残業時間のデータに、1人だけ極端に長い値が含まれています。全体の傾向を示す代表値として適切なのはどれですか？',o:['平均値','中央値','最大値','合計値'],a:1,e:'極端な外れ値があると平均は引っ張られるため、外れ値の影響を受けにくい中央値のほうが全体の傾向を表しやすくなります。「平均値」はまさに外れ値に引っ張られている値です。「最大値」は外れ値そのものを指してしまいます。「合計値」は全体量を示す数字で、1人あたりの傾向を表す代表値ではありません。'},
{id:'S074',c:'theory',d:1,q:'フォルダの中にさらにフォルダがあるような、親子関係の階層構造を表すのに適したデータ構造はどれですか？',o:['スタック','キュー','木構造','配列'],a:2,e:'木構造（ツリー）は親子関係を階層的に表すデータ構造で、フォルダ構成や組織図の表現に適しています。「スタック」は後入れ先出しの1列の構造です。「キュー」は先入れ先出しの1列の構造です。「配列」は要素を番号で並べた構造で、いずれも枝分かれする階層関係を自然には表せません。'},
{id:'S075',c:'theory',d:1,q:'処理手順を、開始・処理・判断・終了などの記号でつないで図示し、関係者と共有したいと考えています。適した図はどれですか？',o:['フローチャート','E-R図','散布図','ガントチャート'],a:0,e:'フローチャートは処理の流れを記号で図示したもので、アルゴリズムの共有に使われます。「E-R図」は実体と関連でデータの構造を表す図です。「散布図」は2項目の相関を点で表す図です。「ガントチャート」は作業の日程を横棒で表す図で、いずれも処理の分岐や順序を表現するものではありません。'},
{id:'S076',c:'comp',d:3,fig:FIG_SP,q:'図の構成Xのように、稼働率0.95の装置を2台直列に接続した場合、システム全体の稼働率はおよそいくつですか？',o:['0.90','0.9025','0.95','0.9975'],a:1,e:'直列は両方が動いて初めて機能するため掛け算になり、0.95 × 0.95 ＝ 0.9025 となります。「0.90」は概算で丸めすぎた値です。「0.95」は1台分の稼働率のままで、直列では必ず個々の稼働率より低くなる点を見落としています。「0.9975」は構成Yのように並列接続した場合の値 1 −（0.05）² で、直列と並列の取り違えです。'},
{id:'S077',c:'comp',d:3,fig:FIG_SP,q:'図の構成Yのように、稼働率0.7の装置を2台並列に冗長化した場合、システム全体の稼働率はいくつですか？',o:['0.49','0.70','0.91','1.00'],a:2,e:'並列はどちらかが動けば機能するため、1 −（1 − 0.7）×（1 − 0.7）＝ 1 − 0.09 ＝ 0.91 です。「0.49」は構成Xのように直列接続した場合の値（0.7×0.7）で、直列と並列の取り違えです。「0.70」は1台分の稼働率のままで、冗長化の効果を計算していません。「1.00」は故障が起きなくなることを意味しますが、両方が同時に停止する確率は0にはなりません。'},
{id:'S078',c:'comp',d:3,q:'MTBFが950時間、MTTRが50時間のシステムの稼働率はいくつですか？',o:['0.90','0.95','0.98','0.99'],a:1,e:'稼働率 ＝ MTBF ÷（MTBF + MTTR）＝ 950 ÷（950 + 50）＝ 950 ÷ 1,000 ＝ 0.95 です。「0.90」は分母を別の値として計算した誤りです。「0.98」はMTTRを20時間程度とした場合の値です。「0.99」はMTTRを10時間とした場合の値で、いずれも与えられた数値と一致しません。分母がMTBFとMTTRの合計である点が要点です。'},
{id:'S079',c:'comp',d:3,fig:FIG_DUPLEX,q:'図の構成とは異なり、同じ処理を2系統で並行して行い、結果を照合することで極めて高い信頼性を確保したいと考えています。適した構成はどれですか？',o:['デュアルシステム','デュプレックスシステム','シンクライアント','スタンドアロン'],a:0,e:'デュアルシステムは2系統で同じ処理を行い結果を照合する構成で、信頼性は非常に高い一方コストも高くなります。「デュプレックスシステム」は図のとおり現用系と待機系を用意する構成で、待機系は普段処理を行わないため結果の照合はできません。「シンクライアント」は端末の機能を最小化する方式です。「スタンドアロン」は単独構成で冗長性がなく、いずれも二重処理による照合とは異なります。'},
{id:'S080',c:'comp',d:2,q:'複数のディスクにデータを分散して書き込み、読み書きを高速化したいと考えています。冗長性は求めません。適した構成はどれですか？',o:['RAID0（ストライピング）','RAID1（ミラーリング）','単体ディスクの利用','バックアップの多重化'],a:0,e:'RAID0は複数台に分散して書き込むことで高速化します。ただし冗長性はなく、1台の故障で全体が失われます。「RAID1（ミラーリング）」は同じ内容を複製する冗長化構成で、速度向上が目的ではありません。「単体ディスクの利用」は分散が起きないため高速化しません。「バックアップの多重化」は復旧のための備えで、日常の読み書き速度には影響しません。'},
{id:'S081',c:'comp',d:2,q:'ソースコードが公開されたソフトウェアを業務で利用することになりました。注意すべき点として最も適切なものはどれですか？',o:['例外なく無償なので費用の検討は不要','ライセンス条件を確認しそれに従って利用する','改変することは一切認められていない','再配布することは必ず禁止されている'],a:1,e:'OSSは改変・再配布が認められていますが、ライセンスごとに条件（改変部分の公開義務など）が異なるため確認が必要です。「例外なく無償なので費用の検討は不要」は誤りで、有償サポート付きの提供形態もあります。「改変することは一切認められていない」「再配布することは必ず禁止されている」はいずれもOSSの定義に反し、これらが認められていることこそがOSSの特徴です。'},
{id:'S082',c:'comp',d:2,fig:FIG_BACKUP,q:'図のように週末にフルバックアップを取り、平日は前日からの変更分だけを取る運用にしたいと考えています。平日に取る方式はどれですか？',o:['フルバックアップ','増分バックアップ','ミラーリング','アーカイブ'],a:1,e:'前回のバックアップ以降の変更分だけを取るのが増分バックアップで、図の下段がこれにあたります。「フルバックアップ」は毎回すべてを取る方式で、平日に取ると時間がかかります。「ミラーリング」は常時複製する冗長化技術で、世代を残すバックアップとは目的が異なります。「アーカイブ」は長期保存のためにデータを退避することで、日々の変更分の保存とは用途が違います。なお前回のフル以降すべての変更分を取る方式は差分バックアップと呼ばれます。'},
{id:'S083',c:'tech',d:2,q:'顧客の住所を1か所で修正すれば、関連するすべての帳票に反映されるようにしたいと考えています。データベース設計で行うべきことはどれですか？',o:['正規化して顧客情報を1つの表にまとめる','すべての表に住所を重複して持たせる','インデックスをすべて削除する','バックアップの頻度を上げる'],a:0,e:'正規化により重複を排除すれば、1か所の更新で整合性が保たれます。「すべての表に住所を重複して持たせる」は更新漏れによる不整合をまさに引き起こす設計です。「インデックスをすべて削除する」は検索が遅くなるだけで、更新の整合性とは無関係です。「バックアップの頻度を上げる」は障害への備えであり、日常の更新の反映とは別の話です。'},
{id:'S084',c:'tech',d:2,q:'複数の担当者が同時に同じ在庫データを更新しようとしています。数量の矛盾を防ぐために必要な仕組みはどれですか？',o:['排他制御','正規化','インデックス','バックアップ'],a:0,e:'排他制御により、一方が更新している間は他方のアクセスを制限し、同時更新による矛盾を防ぎます。「正規化」はテーブル設計で重複を排除する手法で、同時実行の制御はできません。「インデックス」は検索を高速化する索引です。「バックアップ」は障害後に戻すための備えで、いずれも同時更新そのものを制御する機能はありません。'},
{id:'S085',c:'tech',d:1,q:'社内のパソコンにIPアドレスを手作業で設定しており、設定ミスが多発しています。改善策として適したものはどれですか？',o:['DNSを導入する','DHCPを導入する','ファイアウォールを導入する','プロキシを導入する'],a:1,e:'DHCPはIPアドレスなどの設定を自動で割り当てるため、手作業の手間と設定ミスをなくせます。「DNSを導入する」のはドメイン名とIPアドレスを対応づける仕組みで、アドレスの割当ては行いません。「ファイアウォールを導入する」のは通信を制御して不正侵入を防ぐ仕組みです。「プロキシを導入する」のは通信を代理する仕組みで、いずれもアドレス設定の自動化にはなりません。'},
{id:'S086',c:'tech',d:1,q:'社員が受け取ったメールのリンクから、本物そっくりの銀行サイトに誘導され、IDとパスワードを入力してしまいました。この手口はどれですか？',o:['フィッシング','DoS攻撃','SQLインジェクション','ゼロデイ攻撃'],a:0,e:'フィッシングは偽サイトへ誘導して認証情報などを盗み取る手口で、URLの確認と多要素認証が有効な対策です。「DoS攻撃」は大量アクセスでサービスを停止させる攻撃で、情報を盗む手口ではありません。「SQLインジェクション」はサーバー側の入力処理の欠陥を突く攻撃です。「ゼロデイ攻撃」は修正前の脆弱性を突く攻撃で、いずれも利用者をだます手口ではありません。'},
{id:'S087',c:'tech',d:2,fig:FIG_CIA,q:'Webサイトに大量のアクセスを集中させ、サービスを利用できない状態にする攻撃を受けました。図の3要素のうち、主に損なわれるのはどれですか？',o:['機密性','完全性','可用性','否認防止'],a:2,e:'サービスが使えなくなる被害なので、必要なときに使える状態を指す可用性が損なわれます。これはDoS攻撃にあたります。「機密性」は情報が漏れることで損なわれる要素で、この攻撃では情報の流出は起きていません。「完全性」はデータが改ざんされることで損なわれます。「否認防止」は操作を後から否定できないようにする概念で、いずれもサービス停止とは直接結びつきません。'},
{id:'S088',c:'tech',d:2,q:'受信したファイルが送信者本人のもので、途中で書き換えられていないことを確認したいと考えています。適した仕組みはどれですか？',o:['共通鍵暗号による暗号化','デジタル署名','パスワード付きの圧縮','データの圧縮'],a:1,e:'デジタル署名は送信者が秘密鍵で署名し受信者が公開鍵で検証することで、なりすましと改ざんを検知できます。「共通鍵暗号による暗号化」は内容を秘匿する仕組みで、送信者が本人かどうかは確認できません。「パスワード付きの圧縮」もアクセス制限にすぎず、改ざんの検知はできません。「データの圧縮」は容量を減らす処理で、真正性とは無関係です。'},
{id:'S089',c:'tech',d:2,fig:FIG_PKI,q:'図のように公開鍵暗号方式で、送信者が受信者だけに読める形で文書を送りたいと考えています。暗号化に使う「鍵ア」はどれですか？',o:['受信者の公開鍵','受信者の秘密鍵','送信者の公開鍵','送信者の秘密鍵'],a:0,e:'受信者の公開鍵で暗号化すれば、対応する秘密鍵を持つ受信者本人だけが復号できます。「受信者の秘密鍵」は受信者本人しか持たないため、送信者が暗号化に使うことはできません。「送信者の公開鍵」で暗号化すると送信者の秘密鍵でしか復号できず、受信者が読めません。「送信者の秘密鍵」を使うのはデジタル署名の場面で、機密性の確保とは目的が異なります。'},
{id:'S090',c:'tech',d:1,q:'退職した社員のアカウントが有効なまま残っていることが分かりました。まず行うべき対応はどれですか？',o:['パスワードをより長いものに変更する','アカウントを速やかに無効化または削除する','ログの保存期間を延長する','ウイルス対策ソフトを更新する'],a:1,e:'不要になったアカウントは不正アクセスの入口になるため、速やかな無効化または削除が最優先です。「パスワードをより長いものに変更する」は、そもそも使われるべきでないアカウントを残す点で解決になりません。「ログの保存期間を延長する」は事後の追跡には役立ちますが、侵入自体は防げません。「ウイルス対策ソフトを更新する」はマルウェア対策で、アカウント管理とは別の論点です。'},
];

// ─── チートシート ──────────────────────────────────────────
const CHEATSHEETS = [
  { id:'ip', icon:'scale', title:'知的財産権の早見表',
    headers:['権利','対象','登録の要否','存続期間の目安'],
    rows:[
      ['著作権','思想・感情の創作的表現（文章・音楽・プログラム等）','不要（創作時に自動発生）','原則、著作者の死後70年'],
      ['特許権','高度な発明','必要','出願から20年'],
      ['実用新案権','物品の形状・構造の考案','必要','出願から10年'],
      ['意匠権','物品のデザイン','必要','出願から25年'],
      ['商標権','商品・サービスの名称やロゴ','必要','登録から10年（更新可）'],
    ] },
  { id:'cloud', icon:'cloud', title:'SaaS / PaaS / IaaS の管理範囲',
    headers:['項目','SaaS','PaaS','IaaS'],
    rows:[
      ['利用者が管理','データ・設定のみ','アプリケーション・データ','OS・ミドルウェア・アプリ・データ'],
      ['事業者が管理','アプリ以下すべて','OS・ミドルウェア以下','ハードウェア・仮想化基盤'],
      ['自由度','低い','中くらい','高い'],
      ['運用の手間','小さい','中くらい','大きい'],
      ['例','メールサービス・会計ソフト','開発実行環境','仮想サーバー・ストレージ'],
    ] },
  { id:'devtest', icon:'wrench', title:'開発工程とテストの対応（V字モデル）',
    headers:['開発工程','対応するテスト','誰が主体か','何を確認するか'],
    rows:[
      ['要件定義','運用テスト（受入テスト）','利用者','業務で使えるか。承認されると本稼働へ'],
      ['外部設計（基本設計）','システムテスト（総合テスト）','開発者','システム全体が要求どおりか'],
      ['内部設計（詳細設計）','結合テスト','開発者','モジュール間の連携が正しいか'],
      ['プログラミング','単体テスト','開発者','モジュール単体が仕様どおりか'],
    ] },
  { id:'itsm', icon:'gear', title:'サービスマネジメント：似ている管理の役割分担',
    headers:['管理の名称','目的','いつ動くか','混同しやすい点'],
    rows:[
      ['インシデント管理','とにかく早くサービスを復旧させる','障害の発生直後','原因究明はしない。応急処置でもよい'],
      ['問題管理','根本原因を突き止め再発を防ぐ','復旧後','インシデント管理と役割が逆'],
      ['変更管理','変更を評価・承認し統制する','変更を加える前','承認なしの変更を防ぐのが目的'],
      ['構成管理','機器や設定の情報を最新に保つ','常時','「何がどこにあるか」の台帳づくり'],
      ['リリース管理','変更を本番へ計画的に展開する','変更の適用時','切り戻しできる状態にしておく'],
    ] },
  { id:'sec', icon:'lock', title:'情報セキュリティ：脅威と対策の対応',
    headers:['脅威','内容','有効な対策'],
    rows:[
      ['ランサムウェア','データを暗号化し身代金を要求','ネットワークから切り離したバックアップ'],
      ['フィッシング','偽サイトへ誘導して情報を盗む','URLの確認・多要素認証'],
      ['ソーシャルエンジニアリング','人の心理や隙を突いて聞き出す','本人確認の手順化・教育'],
      ['なりすまし','他人になりすまして操作する','デジタル署名・多要素認証'],
      ['盗聴・改ざん','通信経路で内容を見る／書き換える','暗号化（HTTPS・TLS）'],
      ['不正アクセス','他人のIDで侵入する','アクセス制御・ログの監視'],
    ] },
  { id:'calc', icon:'list-ol', title:'計算問題の公式まとめ（得点源）',
    headers:['求めるもの','公式','例'],
    rows:[
      ['損益分岐点売上高','固定費 ÷（1 − 変動費率）','固定費600万・変動費率40% → 600 ÷ 0.6 ＝ 1,000万円'],
      ['限界利益','売上高 − 変動費','売上2,000万・変動費800万 → 1,200万円'],
      ['稼働率','MTBF ÷（MTBF + MTTR）','MTBF480・MTTR20 → 480 ÷ 500 ＝ 0.96'],
      ['直列システムの稼働率','各稼働率の掛け算','0.9 × 0.9 ＝ 0.81'],
      ['並列システムの稼働率','1 −（1 − 各稼働率）の掛け算','1 −（0.1 × 0.1）＝ 0.99'],
      ['2進数→10進数','各桁の重み（1・2・4・8…）を足す','1101 → 8＋4＋1 ＝ 13'],
      ['組合せ','nCr ＝ n! ÷ ( r! ×(n−r)! )','5C3 ＝ (5×4×3)÷(3×2×1) ＝ 10通り'],
    ] },
];
