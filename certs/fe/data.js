/* ============================================================
   data.js — 基本情報技術者試験（FE）のコンテンツ

   engine.js が参照するグローバルを同名で定義する（データ契約）。
   詳細は ../CLAUDE.md 10-3節を参照。

   ★作問は certs/_tools/作問ルール.md（さくらさん指示・8項目）に従うこと。
     擬似言語の書式は certs/fe/擬似言語仕様_IPA公式.md を唯一の正とする。

   ★問題オブジェクトの追加フィールド（作問ルール対応）
       d   … 難易度 1=易 / 2=中 / 3=難（ルール4：易3・中5・難2を維持）
       fig … 図が必要な問題のインラインSVG（ルール1：全体の20%以上）

   カテゴリは公式の出題数比率（テクノロジ系41／マネジメント系7／
   ストラテジ系12、計60問）に合わせて配分してある。

   ※収録内容はすべて独自作成（過去問そのものの転載は含まない）。
   ============================================================ */

// ─── 単語帳カテゴリ ────────────────────────────────────────
const FC_CATS_DEF = [
  {id:'cat_theory',   name:'基礎理論'},
  {id:'cat_compute',  name:'コンピュータ構成要素・ハードウェア'},
  {id:'cat_system',   name:'システム構成要素・信頼性設計'},
  {id:'cat_software', name:'ソフトウェア・OS'},
  {id:'cat_ui',       name:'ヒューマンインタフェース・マルチメディア'},
  {id:'cat_db',       name:'データベース'},
  {id:'cat_network',  name:'ネットワーク'},
  {id:'cat_security', name:'セキュリティ'},
  {id:'cat_devtech',  name:'システム開発技術'},
  {id:'cat_pm',       name:'プロジェクトマネジメント'},
  {id:'cat_sm',       name:'サービスマネジメント・システム監査'},
  {id:'cat_strategy', name:'経営戦略・システム戦略・法務'},
];

// ─── 単語帳カード ──────────────────────────────────────────
// ★IDは学習記録（fcStats）の紐づけキー。絶対に振り直さないこと。
//   追加するときは最大番号の次から続ける。
const SAMPLE = {
  '基礎理論': [
    {id:'B0001', term:'2の補数', def:'負の数を2進数で表現する方式。正の数の各ビットを反転し、1を加えることで求める。コンピュータ内部の減算はこの方式で加算として処理される。'},
    {id:'B0002', term:'オーダー記法（計算量）', def:'アルゴリズムの実行時間がデータ量nに対してどう増えるかを表す記法。O(n)は線形、O(n²)は二乗、O(log n)は対数的に増加する。二分探索はO(log n)、線形探索はO(n)。'},
    {id:'B0003', term:'浮動小数点数の丸め誤差', def:'限られたビット数で小数を表すために生じる誤差。0.1のような値は2進数で有限桁に表せないため、加算を繰り返すと誤差が蓄積する。'},
    {id:'B0004', term:'スタックとキュー', def:'スタックは後入れ先出し（LIFO）。キューは先入れ先出し（FIFO）。関数の呼び出し管理はスタック、印刷待ち行列などはキューが使われる。'},
    {id:'B0005', term:'排他的論理和（XOR）', def:'2つの入力が異なるとき1、同じとき0になる論理演算。同じ値で2回XORすると元に戻る性質があり、暗号やパリティ計算に使われる。'},
    {id:'B0050', term:'基数変換', def:'10進数を2進数に直すには2で割り続けて余りを下から読む。16進数の1桁は2進数の4桁にちょうど対応するため、相互変換は4桁ずつ区切って行える。'},
    {id:'B0051', term:'シフト演算', def:'ビット列を左右にずらす演算。左へ1ビットシフトすると値は2倍、右へ1ビットシフトすると1/2になる（符号なしの場合）。乗除算の高速化に使われる。'},
    {id:'B0052', term:'ド・モルガンの法則', def:'not(A and B) = (not A) or (not B)、not(A or B) = (not A) and (not B)。論理式を変形して簡単にするときに使う。'},
    {id:'B0053', term:'半加算器と全加算器', def:'半加算器は2ビットの加算で桁上げ出力を持つ。全加算器は下位からの桁上げ入力も受け取る。全加算器を並べると多ビットの加算器になる。'},
    {id:'B0054', term:'集合と包除原理', def:'2つの集合の和の要素数は「A＋B−AとBの共通部分」で求まる。アンケート集計などの数え上げ問題で頻出。'},
    {id:'B0055', term:'順列と組合せ', def:'順列は並べ方（順序を区別する）でnPr。組合せは選び方（順序を区別しない）でnCr＝nPr÷r!。「選ぶだけ」か「並べるか」で使い分ける。'},
    {id:'B0056', term:'期待値', def:'各結果の値にその確率を掛けて合計したもの。「1回あたり平均していくらになるか」を表し、意思決定の比較に使う。'},
    {id:'B0057', term:'線形探索と二分探索', def:'線形探索は先頭から順に調べる方式でO(n)。二分探索は整列済みデータの中央と比較して範囲を半分に絞る方式でO(log n)。整列が前提となる点が違い。'},
    {id:'B0058', term:'バブルソートと選択ソート', def:'バブルソートは隣り合う要素を比較して交換を繰り返す。選択ソートは最小値を選んで先頭と交換する。どちらも計算量はO(n²)。'},
    {id:'B0059', term:'クイックソートとマージソート', def:'クイックソートは基準値で分割して再帰的に整列（平均O(n log n)）。マージソートは分割して整列後に併合（常にO(n log n)）。どちらも分割統治法。'},
    {id:'B0060', term:'ハッシュ法と衝突', def:'キーから計算で格納位置を求める方式。理想的にはO(1)で探索できる。異なるキーが同じ位置になることを衝突といい、チェーン法などで対処する。'},
  ],
  'コンピュータ構成要素・ハードウェア': [
    {id:'B0006', term:'キャッシュメモリ', def:'CPUと主記憶の速度差を埋めるための高速・小容量のメモリ。CPUに近いほど高速・小容量になる階層構造（L1/L2/L3）を持つ。'},
    {id:'B0007', term:'実効アクセス時間', def:'キャッシュのヒット率をhとすると「h×キャッシュのアクセス時間＋(1−h)×主記憶のアクセス時間」で求める平均アクセス時間。'},
    {id:'B0008', term:'パイプライン処理', def:'命令の実行を「命令フェッチ→解読→実行→書き込み」などの段階に分割し、複数の命令を並行して処理することでスループットを高める方式。'},
    {id:'B0009', term:'MIPSとクロック周波数', def:'MIPSは1秒間に実行できる命令数（百万単位）。クロック周波数が同じでも1命令あたりのクロック数（CPI）が違えば性能は変わる。'},
    {id:'B0061', term:'CPUのレジスタ', def:'CPU内部にある最も高速な記憶装置。プログラムカウンタ（次の命令の番地）、命令レジスタ、アキュムレータ（演算結果）などがある。'},
    {id:'B0062', term:'割込み', def:'実行中の処理を一時中断して別の処理を行う仕組み。入出力完了などの外部割込みと、ゼロ除算などの内部割込みに分かれる。'},
    {id:'B0063', term:'DMA', def:'CPUを介さずに入出力装置と主記憶が直接データをやり取りする方式。CPUの負担を減らし、転送中も他の処理を進められる。'},
    {id:'B0064', term:'RAMとROM', def:'RAMは読み書き可能で揮発性。DRAMは安価で主記憶に、SRAMは高速でキャッシュに使う。ROMは読み出し専用で不揮発性。'},
    {id:'B0065', term:'SSDとHDD', def:'SSDはフラッシュメモリを使い、機械的な動作がないため高速で衝撃に強い。HDDは磁気ディスクを回転させる方式で、容量あたりの単価が安い。'},
    {id:'B0066', term:'GPU', def:'画像処理用に多数の演算コアを備えたプロセッサ。単純な計算を大量に並列処理できるため、機械学習の学習処理にも広く使われる。'},
    {id:'B0067', term:'アクチュエータとセンサ', def:'センサは温度や光などの物理量を電気信号に変換して取り込む装置。アクチュエータは電気信号を動きに変換する装置で、IoT機器では対で使われる。'},
    {id:'B0068', term:'スループットとレスポンスタイム', def:'スループットは単位時間あたりの処理量。レスポンスタイムは要求から応答が返るまでの時間。ターンアラウンドタイムは投入から結果を得るまでの全体時間。'},
    {id:'B0069', term:'ベンチマークテスト', def:'標準的なプログラムを実行して性能を数値で比較する評価方法。実際の業務に近い処理で測らないと、実運用の性能とずれることがある。'},
    {id:'B0070', term:'ムーアの法則', def:'半導体の集積度が約1.5〜2年で2倍になるという経験則。性能向上とコスト低下の見通しを示す指標として長く使われてきた。'},
  ],
  'システム構成要素・信頼性設計': [
    {id:'B0010', term:'RAID', def:'複数のディスクを組み合わせて冗長性や速度を高める技術。RAID1はミラーリング、RAID5は分散パリティで1台までの故障に耐えられる。'},
    {id:'B0011', term:'稼働率（直列・並列）', def:'直列接続の稼働率は各装置の稼働率の積（低くなる）。並列接続は「1−(1−稼働率)の積」で、冗長化により高くなる。'},
    {id:'B0012', term:'MTBFとMTTR', def:'MTBFは平均故障間隔（壊れずに動く平均時間）、MTTRは平均修復時間。稼働率＝MTBF÷(MTBF＋MTTR)。'},
    {id:'B0013', term:'フェールセーフとフォールトトレラント', def:'フェールセーフは故障時に安全側へ倒す設計。フォールトトレラントは故障が起きても機能を維持する設計。フールプルーフは誤操作を防ぐ設計。'},
    {id:'B0071', term:'クラスタリング', def:'複数のコンピュータをまとめて1台のように動かす構成。障害時に処理を引き継ぐHAクラスタと、計算能力を高めるHPCクラスタがある。'},
    {id:'B0072', term:'負荷分散（ロードバランサ）', def:'複数のサーバへ処理を振り分けて負荷を平準化する仕組み。1台が停止しても残りで処理を続けられるため、可用性の向上にもつながる。'},
    {id:'B0073', term:'デュアルシステムとデュプレックスシステム', def:'デュアルは2系統で同じ処理を行い結果を照合する（高信頼だが高コスト）。デュプレックスは現用系と待機系を用意し障害時に切り替える。'},
    {id:'B0074', term:'ホットスタンバイとコールドスタンバイ', def:'ホットスタンバイは待機系も起動しており即座に切替可能。コールドスタンバイは停止状態で待機し、切替に時間がかかるがコストは低い。'},
    {id:'B0075', term:'スケールアップとスケールアウト', def:'スケールアップは1台の性能を上げる方式。スケールアウトは台数を増やして処理を分担する方式で、可用性も同時に高められる。'},
    {id:'B0076', term:'仮想化とコンテナ', def:'仮想化は1台の物理サーバ上に複数の仮想マシンを作る技術。コンテナはOSを共有してアプリ単位で隔離する方式で、より軽量で起動が速い。'},
    {id:'B0077', term:'システムの評価指標', def:'可用性は使いたいときに使える度合い、信頼性は故障しにくさ、保守性は復旧しやすさ。RASISは信頼性・可用性・保守性・完全性・安全性の頭文字。'},
    {id:'B0078', term:'TCO（総所有コスト）', def:'導入費用（イニシャルコスト）だけでなく、運用・保守・電力・人件費といった維持費用（ランニングコスト）まで含めた総額のこと。'},
    {id:'B0079', term:'バッチ処理とリアルタイム処理', def:'バッチ処理は一定量をまとめて後から処理する方式（給与計算など）。リアルタイム処理は要求のたびに即座に処理する方式（座席予約など）。'},
  ],
  'ソフトウェア・OS': [
    {id:'B0014', term:'仮想記憶（ページング方式）', def:'主記憶と補助記憶を組み合わせ、実際の主記憶容量より大きなアドレス空間があるように見せる技術。データをページ単位で補助記憶とやり取りする。'},
    {id:'B0015', term:'ページフォールトとスラッシング', def:'必要なページが主記憶に無い状態がページフォールト。これが多発してページの入替えばかりに時間を取られる状態がスラッシング。'},
    {id:'B0016', term:'マルチタスクとタイムスライス', def:'複数のプログラムを並行実行するようOSが管理する仕組み。1つのCPUを短い時間（タイムスライス）で切り替えて割り当て、同時実行しているように見せる。'},
    {id:'B0017', term:'デッドロック', def:'複数のプロセスが互いに相手の持つ資源の解放を待ち続け、処理が進まなくなる状態。資源の獲得順序を統一することで防げる。'},
    {id:'B0080', term:'プロセスとスレッド', def:'プロセスは独立したメモリ空間を持つ実行単位。スレッドはプロセス内でメモリを共有する実行単位で、生成や切替えのコストが小さい。'},
    {id:'B0081', term:'ページ置換えアルゴリズム', def:'主記憶が満杯のとき、どのページを追い出すかを決める規則。LRUは最後に使われてから最も時間が経ったページ、FIFOは最も古く読み込んだページを選ぶ。'},
    {id:'B0082', term:'スプーリング', def:'低速な出力装置への出力を、いったん補助記憶に書き出しておく仕組み。CPUが装置の完了を待たずに次の処理へ進めるため、全体の効率が上がる。'},
    {id:'B0083', term:'ファイルの絶対パスと相対パス', def:'絶対パスはルートから辿る完全な位置指定。相対パスは現在位置からの指定で、「.」は現在、「..」は1つ上の階層を表す。'},
    {id:'B0084', term:'フラグメンテーションとデフラグ', def:'ファイルの書き換えを繰り返すと空き領域が細切れになる（断片化）。デフラグはこれを整理して連続領域を確保し、アクセス効率を改善する処理。'},
    {id:'B0085', term:'OSSのライセンス', def:'GPLは改変して再配布する場合にソースコードの公開を求める（コピーレフト）。MITやBSDはより制限が緩い。OSSでも条件を守る義務がある。'},
    {id:'B0086', term:'API', def:'ソフトウェアの機能を外部から呼び出すための取り決め。内部の実装を知らなくても機能を利用でき、システム間の連携を容易にする。'},
    {id:'B0087', term:'ミドルウェア', def:'OSとアプリケーションの間に位置し、共通機能を提供するソフトウェア。データベース管理システムやWebアプリケーションサーバが代表例。'},
  ],
  'ヒューマンインタフェース・マルチメディア': [
    {id:'B0018', term:'アクセシビリティとユーザビリティ', def:'アクセシビリティは誰もが利用できること（対象の広さ）。ユーザビリティは使いやすさ（使い勝手の良さ）。混同しやすい。'},
    {id:'B0019', term:'可逆圧縮と不可逆圧縮', def:'可逆圧縮は元のデータへ完全に復元できる（ZIP・PNG）。不可逆圧縮は一部の情報を削除して高い圧縮率を得る（JPEG・MP3）。'},
    {id:'B0020', term:'標本化・量子化・符号化', def:'アナログをデジタルに変換する3段階。標本化＝時間を区切る、量子化＝値を段階に丸める、符号化＝2進数で表す。'},
    {id:'B0088', term:'サンプリング周波数と量子化ビット数', def:'サンプリング周波数は1秒あたりに標本を取る回数、量子化ビット数は1標本を何段階で表すか。どちらも大きいほど音質は良いがデータ量は増える。'},
    {id:'B0089', term:'解像度と色深度', def:'解像度は画素数（画像の細かさ）、色深度は1画素あたりの色情報のビット数。画像のデータ量は「幅×高さ×色深度」で概算できる。'},
    {id:'B0090', term:'ユニバーサルデザイン', def:'年齢・能力・状況にかかわらず、できるだけ多くの人がそのまま利用できるよう最初から設計する考え方。バリアフリーは障壁を後から取り除く発想。'},
    {id:'B0091', term:'GUIの構成要素', def:'ラジオボタンは複数から1つを選ぶ、チェックボックスは複数選択可、プルダウンは省スペースで多数から選ぶ。選択方式に応じて使い分ける。'},
    {id:'B0092', term:'VRとARとMR', def:'VRは仮想空間に没入する技術。ARは現実の映像に情報を重ねる技術。MRは現実と仮想を融合し相互に作用させる技術。'},
  ],
  'データベース': [
    {id:'B0021', term:'正規化', def:'データの重複を排除し、更新時の矛盾（更新異常）が起きないようテーブルを分割していく設計手法。第1〜第3正規形が代表的。'},
    {id:'B0022', term:'主キーと外部キー', def:'主キーは行を一意に識別する列（重複・NULL不可）。外部キーは他の表の主キーを参照する列で、参照整合性を保つ。'},
    {id:'B0023', term:'ACID特性', def:'トランザクションが満たすべき4性質。原子性（Atomicity）・一貫性（Consistency）・独立性（Isolation）・永続性（Durability）。'},
    {id:'B0024', term:'排他制御（ロック）', def:'複数の利用者が同時に同じデータを更新しても矛盾が起きないようにする仕組み。共有ロック（読取り可）と専有ロック（読書き不可）がある。'},
    {id:'B0025', term:'ロールバックとロールフォワード', def:'ロールバックは障害時にトランザクション開始前へ戻す（更新前ログを使用）。ロールフォワードはバックアップ以降の更新を再適用する（更新後ログを使用）。'},
    {id:'B0093', term:'第1〜第3正規形', def:'第1正規形は繰返し項目を排除。第2正規形は主キーの一部にだけ依存する項目を分離。第3正規形は主キー以外の項目間の依存（推移的関数従属）を排除する。'},
    {id:'B0094', term:'SQLの基本構文', def:'SELECT〜FROM〜WHEREで抽出。GROUP BYで集計単位を指定し、集計結果の絞り込みはWHEREではなくHAVINGを使う点が頻出。'},
    {id:'B0095', term:'結合（JOIN）', def:'内部結合は両方の表に対応する行がある場合だけ返す。外部結合は片方に対応がなくても残し、対応する値をNULLとして返す。'},
    {id:'B0096', term:'インデックス', def:'列の値と行の位置を対応づけた索引で、検索を高速化する。ただし更新のたびに索引も書き換わるため、更新が多い表では性能が落ちることもある。'},
    {id:'B0097', term:'ビュー', def:'実データを持たず、問合せの結果を仮想的な表として見せる仕組み。必要な列だけを見せることでアクセス権の制御にも使える。'},
    {id:'B0098', term:'2相コミット', def:'複数のデータベースにまたがる更新で整合性を保つ手順。まず全体に確定可能かを問い合わせ（第1相）、全てが可能なら確定を指示する（第2相）。'},
    {id:'B0099', term:'デッドロックの検出と回避', def:'複数のトランザクションが互いのロック解放を待つ状態。検出したら一方を強制的に取り消す。資源の獲得順序を統一すれば予防できる。'},
    {id:'B0100', term:'NoSQL', def:'関係モデルによらないデータベースの総称。キーバリュー型やドキュメント型などがあり、大量データの分散処理や柔軟なスキーマに向く。'},
    {id:'B0101', term:'データウェアハウスとデータマイニング', def:'データウェアハウスは分析目的で時系列に蓄積したデータの倉庫。データマイニングはそこから規則性や相関を見つけ出す手法。'},
    {id:'B0102', term:'E-R図', def:'実体（エンティティ）と関連（リレーションシップ）でデータ構造を表す図。1対1・1対多・多対多といった対応関係（カーディナリティ）を示す。'},
  ],
  'ネットワーク': [
    {id:'B0026', term:'TCP/IPの階層構造', def:'アプリケーション層・トランスポート層・インターネット層・ネットワークインタフェース層の4階層モデル。IPアドレスによる経路制御はインターネット層が担う。'},
    {id:'B0027', term:'TCPとUDP', def:'TCPはコネクション型で再送制御があり確実に届く（Web・メール）。UDPはコネクションレスで高速だが到達保証がない（動画配信・DNS）。'},
    {id:'B0028', term:'サブネットマスク', def:'IPアドレスのうちネットワーク部とホスト部を区切るための値。/24なら上位24ビットがネットワーク部で、ホストは254台まで割当てできる。'},
    {id:'B0029', term:'DNSとDHCP', def:'DNSはドメイン名とIPアドレスを対応づける。DHCPはIPアドレスなどのネットワーク設定を自動で配布する。役割が異なる。'},
    {id:'B0103', term:'OSI基本参照モデル', def:'物理・データリンク・ネットワーク・トランスポート・セッション・プレゼンテーション・アプリケーションの7階層。TCP/IPの4階層と対応づけて理解する。'},
    {id:'B0104', term:'ネットワーク機器の階層', def:'リピータは物理層、ブリッジとスイッチングハブはデータリンク層（MACアドレスで転送）、ルータはネットワーク層（IPアドレスで経路制御）で動作する。'},
    {id:'B0105', term:'MACアドレスとIPアドレス', def:'MACアドレスは機器に固有の物理アドレスで変わらない。IPアドレスはネットワーク上の論理的な位置を表し、接続先によって変わる。'},
    {id:'B0106', term:'プライベートIPアドレスとNAT', def:'組織内でのみ使えるアドレスがプライベートIP。インターネットへ出るときにグローバルIPへ変換する仕組みがNAT（ポート番号も変換する方式はNAPT）。'},
    {id:'B0107', term:'ポート番号', def:'1台の機器で動く複数のサービスを識別する番号。HTTPは80、HTTPSは443、SMTPは25、SSHは22といったウェルノウンポートがある。'},
    {id:'B0108', term:'メール関連のプロトコル', def:'SMTPは送信に使う。POP3は受信時にサーバからダウンロードして削除する方式、IMAPはサーバ上で管理するため複数端末で同じ状態を見られる。'},
    {id:'B0109', term:'伝送時間の計算', def:'伝送時間＝データ量÷実効速度。回線速度に伝送効率を掛けたものが実効速度になる。ビットとバイトの単位換算（8倍）に注意する。'},
    {id:'B0110', term:'CSMA/CD方式', def:'有線LANで使われてきたアクセス制御方式。回線が空いているか確認して送信し、衝突を検出したら一定時間待って再送する。無線ではCSMA/CA方式を使う。'},
    {id:'B0111', term:'VPN', def:'公衆網の上に暗号化した仮想的な専用線を構築する技術。拠点間接続や社外からの安全なリモートアクセスに使う。'},
    {id:'B0112', term:'プロキシサーバ', def:'内部の端末に代わって外部と通信する中継サーバ。アクセス制御やログ取得、よく使うデータのキャッシュによる高速化の役割を持つ。'},
    {id:'B0113', term:'5GとLPWA', def:'5Gは高速・大容量・低遅延・多数同時接続が特長。LPWAは低消費電力で長距離通信ができる方式で、IoT機器の少量データ送信に向く。'},
  ],
  'セキュリティ': [
    {id:'B0030', term:'共通鍵暗号方式と公開鍵暗号方式', def:'共通鍵は暗号化と復号に同じ鍵を使い高速だが鍵配送が課題。公開鍵は異なる鍵（公開鍵・秘密鍵）を使い鍵配送問題を解決できるが低速。'},
    {id:'B0031', term:'デジタル署名', def:'送信者の秘密鍵でハッシュ値を暗号化したもの。受信者は送信者の公開鍵で検証し、改ざんの有無と送信者本人であることを確認できる。暗号化とは鍵の使い方が逆。'},
    {id:'B0032', term:'SQLインジェクション', def:'入力欄に悪意あるSQL文を注入し、データベースを不正に操作する攻撃。プレースホルダ（バインド機構）を使った実装で防げる。'},
    {id:'B0033', term:'クロスサイトスクリプティング（XSS）', def:'Webページに悪意あるスクリプトを埋め込み、閲覧者のブラウザ上で実行させる攻撃。出力時のエスケープ処理で防ぐ。'},
    {id:'B0034', term:'リスク対応の4分類', def:'リスク回避（活動をやめる）・リスク低減（対策で下げる）・リスク移転（保険や外部委託）・リスク保有（受容する）。'},
    {id:'B0114', term:'情報セキュリティの3要素（CIA）', def:'機密性は許可された者だけがアクセスできること、完全性は改ざんされていないこと、可用性は必要なときに使えること。真正性・責任追跡性などを加えることもある。'},
    {id:'B0115', term:'ハッシュ関数', def:'任意の長さのデータから固定長の値を作る一方向の関数。元のデータへ戻せず、少しでも内容が変わると値が大きく変わるため、改ざん検知に使う。'},
    {id:'B0116', term:'ハイブリッド暗号方式', def:'共通鍵で本文を高速に暗号化し、その共通鍵を公開鍵暗号で安全に相手へ渡す方式。両方式の長所を組み合わせており、TLSで使われている。'},
    {id:'B0117', term:'PKIと認証局（CA）', def:'公開鍵が本人のものだと第三者が保証する仕組み。認証局がデジタル証明書を発行し、その正当性を保証することでなりすましを防ぐ。'},
    {id:'B0118', term:'ファイアウォールとWAF', def:'ファイアウォールはIPアドレスやポート番号で通信を制御する。WAFはHTTPの中身を検査し、SQLインジェクションなどWebアプリへの攻撃を防ぐ。'},
    {id:'B0119', term:'IDSとIPS', def:'IDSは不正な通信を検知して管理者に通知する（検知まで）。IPSは検知に加えて通信を自動で遮断する（防御まで行う）。'},
    {id:'B0120', term:'クロスサイトリクエストフォージェリ（CSRF）', def:'ログイン中の利用者に、意図しない操作の要求を別サイトから送らせる攻撃。要求ごとに使い捨てのトークンを埋め込むことで防ぐ。'},
    {id:'B0121', term:'標的型攻撃', def:'特定の組織を狙い、業務を装ったメールなどでマルウェアに感染させる攻撃。不特定多数を狙うばらまき型より発見が難しい。'},
    {id:'B0122', term:'ゼロデイ攻撃', def:'脆弱性の修正プログラムが提供される前に、その脆弱性を突く攻撃。修正前のため対策が難しく、多層防御や振る舞い検知が有効になる。'},
    {id:'B0123', term:'多要素認証', def:'知識（パスワード）・所持（スマホ・カード）・生体（指紋・顔）のうち2種類以上を組み合わせる認証。同じ要素を2つ使っても多要素にはならない。'},
    {id:'B0124', term:'ISMSとPDCA', def:'情報セキュリティを組織的に管理する仕組み。方針策定（Plan）→運用（Do）→点検（Check）→改善（Act）を回して継続的に維持改善する。'},
    {id:'B0125', term:'ソーシャルエンジニアリング', def:'技術ではなく人の心理や不注意につけ込んで情報を得る手口。なりすまし電話、肩越しののぞき見、ゴミ箱あさりなどが該当する。'},
  ],
  'システム開発技術': [
    {id:'B0035', term:'ウォーターフォールモデルとV字モデル', def:'工程を順に進める開発手法。V字モデルは各設計工程と対応するテスト工程を結びつけた図で表す（要件定義↔受入テスト、詳細設計↔単体テスト）。'},
    {id:'B0036', term:'アジャイル開発', def:'短い期間（イテレーション）で計画・設計・実装・テストを繰り返し、少しずつ機能をリリースしていく開発手法。要件変更に強い。'},
    {id:'B0037', term:'ブラックボックステストとホワイトボックステスト', def:'ブラックボックステストは内部構造を意識せず入出力に着目する。ホワイトボックステストはソースコードの内部構造（命令網羅・分岐網羅）に着目する。'},
    {id:'B0038', term:'リファクタリング', def:'プログラムの外部から見た動作を変えずに、内部の構造を整理して保守しやすくすること。機能追加とは区別する。'},
    {id:'B0126', term:'要件定義と外部設計・内部設計', def:'要件定義は「何を作るか」を決める。外部設計は利用者から見える画面や帳票を設計する。内部設計は処理の分割やデータ構造など内部の作りを設計する。'},
    {id:'B0127', term:'同値分割と限界値分析', def:'同値分割は同じ結果になる入力をグループにまとめて代表値でテストする。限界値分析は境界の値（上限・下限とその前後）を重点的にテストする。'},
    {id:'B0128', term:'命令網羅・分岐網羅・条件網羅', def:'命令網羅は全命令を1回は通す。分岐網羅は各判定の真と偽を通す。複合条件網羅は条件の組合せを網羅する。右へ行くほど基準が厳しい。'},
    {id:'B0129', term:'テストの工程', def:'単体テスト→結合テスト→システムテスト→運用テストの順に範囲が広がる。結合の進め方にはトップダウンとボトムアップがある。'},
    {id:'B0130', term:'スクラム', def:'アジャイル開発の代表的な進め方。スプリントという短い期間を繰り返し、プロダクトオーナー・スクラムマスター・開発チームが役割を分担する。'},
    {id:'B0131', term:'XP（エクストリームプログラミング）の実践', def:'ペアプログラミング（2人1組で開発）、テスト駆動開発（テストを先に書く）、継続的インテグレーション（頻繁に統合して検証）などの実践がある。'},
    {id:'B0132', term:'オブジェクト指向の3要素', def:'カプセル化（データと処理をまとめ内部を隠す）、継承（上位クラスの性質を引き継ぐ）、多態性（同じ操作名で異なる振る舞い）。'},
    {id:'B0133', term:'UMLの主な図', def:'クラス図はクラス間の静的な関係、シーケンス図はメッセージの時間的な順序、ユースケース図は利用者から見た機能、状態遷移図は状態の移り変わりを表す。'},
    {id:'B0134', term:'DevOpsとCI/CD', def:'開発と運用が連携して速く安定したリリースを目指す考え方。CIは変更を頻繁に統合して自動検証すること、CDはリリースまでを自動化することを指す。'},
    {id:'B0135', term:'ソフトウェアの再利用と保守', def:'保守は是正保守（不具合修正）・適応保守（環境変化への対応）・完全化保守（性能や保守性の改善）・予防保守（将来の問題の未然防止）に分類される。'},
  ],
  'プロジェクトマネジメント': [
    {id:'B0039', term:'WBS（作業分解構成図）', def:'プロジェクトの作業を階層的に細かく分解し、抜け漏れなく管理できるようにする手法。Work Breakdown Structureの略。'},
    {id:'B0040', term:'クリティカルパス', def:'アローダイアグラムにおいて、プロジェクト全体の所要日数を決める最も余裕（フロート）のない経路。ここが遅れると全体が遅延する。'},
    {id:'B0041', term:'ファンクションポイント法', def:'画面や帳票などの機能の数と複雑さから開発規模を見積もる手法。プログラムの行数（LOC法）に依存しないのが特徴。'},
    {id:'B0136', term:'プロジェクトの制約（QCD）', def:'品質（Quality）・コスト（Cost）・納期（Delivery）。互いにトレードオフの関係にあり、ひとつを優先すると他が犠牲になりやすい。'},
    {id:'B0137', term:'ガントチャートとアローダイアグラム', def:'ガントチャートは作業の期間と進捗を横棒で示す。アローダイアグラムは作業の前後関係と所要日数を矢印で示し、クリティカルパスを求められる。'},
    {id:'B0138', term:'スコープとスコープクリープ', def:'スコープはプロジェクトが扱う作業の範囲。変更管理を経ずに要求が追加されて範囲が膨らむ状態をスコープクリープという。'},
    {id:'B0139', term:'マイルストーンとベースライン', def:'マイルストーンは進捗を確認する節目の時点。ベースラインは変更管理の基準として確定させた計画で、これと実績を比較して差異を管理する。'},
    {id:'B0140', term:'EVM（アーンドバリューマネジメント）', def:'計画値・出来高・実コストを金額で表し、進捗とコストの状況を同じ尺度で管理する手法。予定より遅れているか、費用を使いすぎているかが分かる。'},
    {id:'B0141', term:'リスクマネジメントの手順', def:'リスクの特定→分析（発生確率と影響度の評価）→対応計画（回避・軽減・転嫁・受容）→監視の順に進める。'},
    {id:'B0142', term:'ステークホルダ', def:'プロジェクトの結果に利害を持つ関係者。発注者・利用者・開発チーム・運用部門などが該当し、期待と影響力を把握して関与を管理する。'},
  ],
  'サービスマネジメント・システム監査': [
    {id:'B0042', term:'SLA（サービスレベルアグリーメント）', def:'サービス提供者と利用者の間で、稼働率や応答時間などサービスの品質水準についてあらかじめ合意しておく文書。'},
    {id:'B0043', term:'インシデント管理と問題管理', def:'インシデント管理はサービスの早期復旧が目的（原因究明はしない）。問題管理は根本原因を特定し再発を防ぐのが目的。役割が逆になりやすい。'},
    {id:'B0044', term:'システム監査の独立性', def:'システム監査人が、監査対象の業務や組織から独立した立場で客観的に評価すること。監査対象の開発に関与した者が監査人になってはならない。'},
    {id:'B0143', term:'変更管理とリリース管理', def:'変更管理は変更の影響を評価して承認する（加える前）。リリース管理は承認された変更を本番環境へ計画的に展開する（適用時）。'},
    {id:'B0144', term:'構成管理とCMDB', def:'機器・ソフトウェア・設定などの構成情報を最新に保つ活動。CMDBはその情報を蓄積するデータベースで、影響範囲の調査に使う。'},
    {id:'B0145', term:'キャパシティ管理と可用性管理', def:'キャパシティ管理は将来の需要に対して処理能力や容量を確保する。可用性管理は合意した稼働水準を維持できるよう設計・監視する。'},
    {id:'B0146', term:'サービスデスク', def:'利用者からの問い合わせを受け付ける単一の窓口。一次対応を行い、解決できないものを適切な部署へ引き継ぐ（エスカレーション）。'},
    {id:'B0147', term:'監査証跡と内部統制', def:'監査証跡は誰がいつ何をしたかを追跡できる記録。内部統制は業務の適正を確保する仕組みで、職務分掌（申請者と承認者を分ける）が代表的な統制。'},
    {id:'B0148', term:'ファシリティマネジメント', def:'建物や設備を最適な状態に維持管理する活動。サーバ室の空調・電源・入退室管理・耐震対策などが含まれる。'},
  ],
  '経営戦略・システム戦略・法務': [
    {id:'B0045', term:'SWOT分析', def:'自社の強み（Strength）・弱み（Weakness）という内部環境と、機会（Opportunity）・脅威（Threat）という外部環境を整理して戦略を立てる手法。'},
    {id:'B0046', term:'損益分岐点', def:'売上高と費用が等しく利益がゼロになる売上高。「固定費 ÷（1 − 変動費率）」で求める。'},
    {id:'B0047', term:'労働者派遣契約と請負契約', def:'労働者派遣では派遣先が労働者に直接指揮命令できる。請負では仕事の完成が目的で、発注者に指揮命令権はない（指示すると偽装請負）。'},
    {id:'B0048', term:'著作権と特許権', def:'著作権は創作した時点で自動的に発生し登録不要。特許権は出願・登録が必要。プログラムは著作権の保護対象。'},
    {id:'B0049', term:'ROIとROE', def:'ROIは投資利益率で、投資額に対する利益の割合。ROEは自己資本利益率で、株主の出資に対する利益の効率を示す。'},
    {id:'B0149', term:'PPM（プロダクトポートフォリオマネジメント）', def:'市場成長率と市場占有率の2軸で事業を「花形」「金のなる木」「問題児」「負け犬」に分類し、資源配分を判断する手法。'},
    {id:'B0150', term:'コアコンピタンスとベンチマーキング', def:'コアコンピタンスは他社が模倣しにくい自社の中核的な強み。ベンチマーキングは優れた他社と比較して自社との差を明らかにする手法。'},
    {id:'B0151', term:'バリューチェーン分析', def:'企業の活動を購買・製造・出荷・販売・サービスといった主活動と、人事や技術開発などの支援活動に分解し、どこで価値が生まれているかを分析する手法。'},
    {id:'B0152', term:'ERPとSCMとCRM', def:'ERPは基幹業務の情報を統合する。SCMは調達から販売までの供給の流れを最適化する。CRMは顧客との関係を管理して顧客生涯価値を高める。'},
    {id:'B0153', term:'BPRとBPM', def:'BPRは業務プロセスを根本から設計し直す抜本的な改革。BPMは業務プロセスを継続的に分析・改善し続ける管理手法。'},
    {id:'B0154', term:'RFIとRFP', def:'RFIは市場にどのような製品・技術があるかを把握するための情報提供依頼。RFPは要件を示して具体的な提案と見積りを依頼する提案依頼書。RFI→RFPの順。'},
    {id:'B0155', term:'損益計算書と貸借対照表', def:'損益計算書（P/L）は一定期間の収益と費用を示す。貸借対照表（B/S）はある時点の資産・負債・純資産を示し、「資産＝負債＋純資産」が成り立つ。'},
    {id:'B0156', term:'減価償却', def:'長期間使う資産の取得費用を、使用する各年度に分けて費用計上する会計処理。定額法は毎年同額、定率法は初期に多く計上する。'},
    {id:'B0157', term:'不正競争防止法の営業秘密', def:'秘密として管理され（秘密管理性）、有用で（有用性）、公然と知られていない（非公知性）情報を保護する。3要件すべてを満たす必要がある。'},
    {id:'B0158', term:'個人情報保護法', def:'利用目的の特定と通知・公表、安全管理措置、第三者提供の制限などを事業者に義務づける。目的外利用には原則として本人の同意が必要。'},
    {id:'B0159', term:'不正アクセス禁止法とサイバーセキュリティ基本法', def:'不正アクセス禁止法は他人のIDでの侵入やID・パスワードの不正提供を禁じる。サイバーセキュリティ基本法は国の施策の基本方針を定める。'},
    {id:'B0160', term:'標準化と標準化団体', def:'ISOは国際標準化機構（品質のISO9001、情報セキュリティのISO27001など）、JISは日本産業規格、IEEEは電気電子分野の標準を定める団体。'},
  ],
};

// ─── 過去問カテゴリ ────────────────────────────────────────
const QCAT = [
  {id:'theory',   name:'基礎理論',                       icon:'list-ol',   tone:'blue'},
  {id:'compute',  name:'コンピュータ構成要素・ハードウェア', icon:'server',    tone:'orange'},
  {id:'system',   name:'システム構成要素・信頼性設計',       icon:'gear',      tone:'orange'},
  {id:'software', name:'ソフトウェア・OS',                  icon:'toolbox',   tone:'orange'},
  {id:'ui',       name:'ヒューマンインタフェース・マルチメディア', icon:'monitor', tone:'blue'},
  {id:'db',       name:'データベース',                      icon:'database',  tone:'blue'},
  {id:'network',  name:'ネットワーク',                      icon:'globe',     tone:'blue'},
  {id:'security', name:'セキュリティ',                      icon:'lock',      tone:'ng'},
  {id:'devtech',  name:'システム開発技術',                  icon:'doc-check', tone:'orange'},
  {id:'pm',       name:'プロジェクトマネジメント',           icon:'clipboard', tone:'blue'},
  {id:'sm',       name:'サービスマネジメント・システム監査',   icon:'flag',      tone:'ok'},
  {id:'strategy', name:'経営戦略・システム戦略・法務',        icon:'chart-up',  tone:'ok'},
  {id:'algo',     name:'アルゴリズムとプログラミング',        icon:'code',      tone:'orange'},
];

/* ─── 図（SVG）─────────────────────────────────────────────
   作問ルール第1項。図が本質的に必要な問題に埋め込む。
   色は currentColor とカラートークンのみを使い、ダークテーマで
   見えなくならないようにする。 */

// 稼働率：直列と並列を並べた構成図
const FIG_RELIABILITY = `<svg viewBox="0 0 420 170" width="420" role="img" aria-label="装置の直列接続と並列接続の構成図">
  <g fill="none" stroke="currentColor" stroke-width="1.6">
    <text x="10" y="20" font-size="12" fill="currentColor" stroke="none">構成X（直列）</text>
    <line x1="18" y1="52" x2="52" y2="52"/>
    <rect x="52" y="36" width="70" height="32" rx="5" stroke="var(--orange)"/>
    <line x1="122" y1="52" x2="166" y2="52"/>
    <rect x="166" y="36" width="70" height="32" rx="5" stroke="var(--orange)"/>
    <line x1="236" y1="52" x2="270" y2="52"/>
    <text x="70" y="56" font-size="12" fill="currentColor" stroke="none">装置A</text>
    <text x="184" y="56" font-size="12" fill="currentColor" stroke="none">装置B</text>

    <text x="10" y="100" font-size="12" fill="currentColor" stroke="none">構成Y（並列）</text>
    <line x1="18" y1="140" x2="46" y2="140"/>
    <path d="M46 140 L46 118 L60 118"/>
    <path d="M46 140 L46 158 L60 158"/>
    <rect x="60" y="104" width="70" height="28" rx="5" stroke="var(--blue)"/>
    <rect x="60" y="144" width="70" height="28" rx="5" stroke="var(--blue)"/>
    <path d="M130 118 L146 118 L146 140"/>
    <path d="M130 158 L146 158 L146 140"/>
    <line x1="146" y1="140" x2="180" y2="140"/>
    <text x="78" y="122" font-size="12" fill="currentColor" stroke="none">装置A</text>
    <text x="78" y="162" font-size="12" fill="currentColor" stroke="none">装置B</text>
  </g>
</svg>`;

// ER図：受注と受注明細（1対多）
const FIG_ER = `<svg viewBox="0 0 430 150" width="430" role="img" aria-label="受注表と受注明細表のER図">
  <g fill="none" stroke="currentColor" stroke-width="1.6">
    <rect x="14" y="26" width="150" height="86" rx="6" stroke="var(--blue)"/>
    <line x1="14" y1="50" x2="164" y2="50" stroke="var(--blue)"/>
    <text x="26" y="43" font-size="12.5" fill="currentColor" stroke="none">受注</text>
    <text x="26" y="70" font-size="11.5" fill="currentColor" stroke="none">受注番号（主キー）</text>
    <text x="26" y="90" font-size="11.5" fill="currentColor" stroke="none">受注日</text>
    <text x="26" y="106" font-size="11.5" fill="currentColor" stroke="none">顧客番号</text>

    <rect x="266" y="26" width="152" height="86" rx="6" stroke="var(--orange)"/>
    <line x1="266" y1="50" x2="418" y2="50" stroke="var(--orange)"/>
    <text x="278" y="43" font-size="12.5" fill="currentColor" stroke="none">受注明細</text>
    <text x="278" y="70" font-size="11.5" fill="currentColor" stroke="none">受注番号</text>
    <text x="278" y="90" font-size="11.5" fill="currentColor" stroke="none">明細番号</text>
    <text x="278" y="106" font-size="11.5" fill="currentColor" stroke="none">商品番号・数量</text>

    <line x1="164" y1="69" x2="266" y2="69"/>
    <text x="190" y="62" font-size="12" fill="currentColor" stroke="none">1</text>
    <text x="246" y="62" font-size="12" fill="currentColor" stroke="none">多</text>
  </g>
</svg>`;

// ネットワーク構成図：DMZ
const FIG_DMZ = `<svg viewBox="0 0 440 180" width="440" role="img" aria-label="インターネットとDMZと内部LANのネットワーク構成図">
  <g fill="none" stroke="currentColor" stroke-width="1.6">
    <ellipse cx="52" cy="86" rx="40" ry="26" stroke="var(--dim)"/>
    <text x="20" y="90" font-size="11.5" fill="currentColor" stroke="none">インターネット</text>
    <line x1="92" y1="86" x2="126" y2="86"/>
    <rect x="126" y="62" width="46" height="48" rx="5" stroke="var(--ng)"/>
    <text x="132" y="82" font-size="10.5" fill="currentColor" stroke="none">ファイア</text>
    <text x="132" y="96" font-size="10.5" fill="currentColor" stroke="none">ウォール</text>
    <line x1="172" y1="86" x2="206" y2="86"/>
    <rect x="206" y="26" width="106" height="120" rx="6" stroke="var(--orange)" stroke-dasharray="5 4"/>
    <text x="234" y="44" font-size="12" fill="currentColor" stroke="none">領域P</text>
    <rect x="220" y="56" width="80" height="30" rx="5" stroke="var(--orange)"/>
    <text x="230" y="76" font-size="11" fill="currentColor" stroke="none">Webサーバ</text>
    <rect x="220" y="100" width="80" height="30" rx="5" stroke="var(--orange)"/>
    <text x="228" y="120" font-size="11" fill="currentColor" stroke="none">メールサーバ</text>
    <line x1="312" y1="86" x2="346" y2="86"/>
    <rect x="346" y="62" width="80" height="48" rx="5" stroke="var(--blue)"/>
    <text x="356" y="82" font-size="11" fill="currentColor" stroke="none">内部LAN</text>
    <text x="356" y="98" font-size="11" fill="currentColor" stroke="none">（社内PC）</text>
  </g>
</svg>`;

// フローチャート：条件分岐
const FIG_FLOW = `<svg viewBox="0 0 300 250" width="300" role="img" aria-label="判定処理のフローチャート">
  <g fill="none" stroke="currentColor" stroke-width="1.6">
    <ellipse cx="150" cy="22" rx="42" ry="16" stroke="var(--dim)"/>
    <text x="133" y="27" font-size="11.5" fill="currentColor" stroke="none">開始</text>
    <line x1="150" y1="38" x2="150" y2="58"/>
    <path d="M150 58 L206 92 L150 126 L94 92 Z" stroke="var(--orange)"/>
    <text x="118" y="88" font-size="11" fill="currentColor" stroke="none">点数 ≧ 80</text>
    <text x="122" y="103" font-size="11" fill="currentColor" stroke="none">か？</text>
    <line x1="206" y1="92" x2="248" y2="92"/>
    <text x="212" y="86" font-size="10.5" fill="currentColor" stroke="none">はい</text>
    <rect x="248" y="76" width="46" height="32" rx="4" stroke="var(--ok)"/>
    <text x="258" y="96" font-size="11" fill="currentColor" stroke="none">A評価</text>
    <line x1="150" y1="126" x2="150" y2="150"/>
    <text x="156" y="142" font-size="10.5" fill="currentColor" stroke="none">いいえ</text>
    <path d="M150 150 L200 180 L150 210 L100 180 Z" stroke="var(--orange)"/>
    <text x="122" y="177" font-size="11" fill="currentColor" stroke="none">点数 ≧ 60</text>
    <text x="126" y="191" font-size="11" fill="currentColor" stroke="none">か？</text>
    <line x1="200" y1="180" x2="240" y2="180"/>
    <text x="206" y="174" font-size="10.5" fill="currentColor" stroke="none">はい</text>
    <rect x="240" y="164" width="46" height="32" rx="4" stroke="var(--ok)"/>
    <text x="250" y="184" font-size="11" fill="currentColor" stroke="none">B評価</text>
    <line x1="100" y1="180" x2="60" y2="180"/>
    <text x="64" y="174" font-size="10.5" fill="currentColor" stroke="none">いいえ</text>
    <rect x="14" y="164" width="46" height="32" rx="4" stroke="var(--ng)"/>
    <text x="24" y="184" font-size="11" fill="currentColor" stroke="none">C評価</text>
  </g>
</svg>`;

// アローダイアグラム
const FIG_ARROW = `<svg viewBox="0 0 440 170" width="440" role="img" aria-label="作業A〜Eのアローダイアグラム">
  <defs><marker id="ah" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.6">
    <circle cx="34" cy="84" r="17" stroke="var(--blue)"/><text x="29" y="89" font-size="12" fill="currentColor" stroke="none">1</text>
    <circle cx="164" cy="34" r="17" stroke="var(--blue)"/><text x="159" y="39" font-size="12" fill="currentColor" stroke="none">2</text>
    <circle cx="164" cy="134" r="17" stroke="var(--blue)"/><text x="159" y="139" font-size="12" fill="currentColor" stroke="none">3</text>
    <circle cx="296" cy="84" r="17" stroke="var(--blue)"/><text x="291" y="89" font-size="12" fill="currentColor" stroke="none">4</text>
    <circle cx="410" cy="84" r="17" stroke="var(--blue)"/><text x="405" y="89" font-size="12" fill="currentColor" stroke="none">5</text>
    <line x1="50" y1="76" x2="146" y2="42" marker-end="url(#ah)"/>
    <text x="80" y="48" font-size="11.5" fill="currentColor" stroke="none">A（4日）</text>
    <line x1="50" y1="92" x2="146" y2="126" marker-end="url(#ah)"/>
    <text x="80" y="126" font-size="11.5" fill="currentColor" stroke="none">B（3日）</text>
    <line x1="181" y1="42" x2="278" y2="76" marker-end="url(#ah)"/>
    <text x="208" y="52" font-size="11.5" fill="currentColor" stroke="none">C（5日）</text>
    <line x1="181" y1="126" x2="278" y2="92" marker-end="url(#ah)"/>
    <text x="208" y="128" font-size="11.5" fill="currentColor" stroke="none">D（2日）</text>
    <line x1="313" y1="84" x2="392" y2="84" marker-end="url(#ah)"/>
    <text x="322" y="76" font-size="11.5" fill="currentColor" stroke="none">E（6日）</text>
  </g>
</svg>`;

// UMLシーケンス図
const FIG_SEQ = `<svg viewBox="0 0 400 200" width="400" role="img" aria-label="利用者・Webサーバ・DBのシーケンス図">
  <defs><marker id="sa" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="14" y="10" width="76" height="28" rx="4" stroke="var(--blue)"/>
    <text x="34" y="29" font-size="11.5" fill="currentColor" stroke="none">利用者</text>
    <rect x="156" y="10" width="88" height="28" rx="4" stroke="var(--orange)"/>
    <text x="170" y="29" font-size="11.5" fill="currentColor" stroke="none">Webサーバ</text>
    <rect x="308" y="10" width="76" height="28" rx="4" stroke="var(--ok)"/>
    <text x="332" y="29" font-size="11.5" fill="currentColor" stroke="none">DB</text>
    <line x1="52" y1="38" x2="52" y2="192" stroke-dasharray="4 4"/>
    <line x1="200" y1="38" x2="200" y2="192" stroke-dasharray="4 4"/>
    <line x1="346" y1="38" x2="346" y2="192" stroke-dasharray="4 4"/>
    <line x1="52" y1="66" x2="192" y2="66" marker-end="url(#sa)"/>
    <text x="72" y="60" font-size="11" fill="currentColor" stroke="none">1: 検索요求</text>
    <line x1="200" y1="100" x2="338" y2="100" marker-end="url(#sa)"/>
    <text x="216" y="94" font-size="11" fill="currentColor" stroke="none">2: SQL発行</text>
    <line x1="346" y1="132" x2="208" y2="132" marker-end="url(#sa)" stroke-dasharray="5 3"/>
    <text x="228" y="126" font-size="11" fill="currentColor" stroke="none">3: 結果</text>
    <line x1="192" y1="166" x2="60" y2="166" marker-end="url(#sa)" stroke-dasharray="5 3"/>
    <text x="80" y="160" font-size="11" fill="currentColor" stroke="none">4: 画面表示</text>
  </g>
</svg>`;

// メモリ階層
const FIG_MEMORY = `<svg viewBox="0 0 340 190" width="340" role="img" aria-label="記憶装置の階層構造">
  <g fill="none" stroke="currentColor" stroke-width="1.6">
    <rect x="112" y="14" width="116" height="32" rx="4" stroke="var(--ng)"/>
    <text x="150" y="34" font-size="11.5" fill="currentColor" stroke="none">レジスタ</text>
    <rect x="90" y="54" width="160" height="32" rx="4" stroke="var(--orange)"/>
    <text x="128" y="74" font-size="11.5" fill="currentColor" stroke="none">装置ア</text>
    <rect x="68" y="94" width="204" height="32" rx="4" stroke="var(--blue)"/>
    <text x="146" y="114" font-size="11.5" fill="currentColor" stroke="none">主記憶</text>
    <rect x="46" y="134" width="248" height="32" rx="4" stroke="var(--dim)"/>
    <text x="140" y="154" font-size="11.5" fill="currentColor" stroke="none">補助記憶</text>
    <text x="300" y="30" font-size="10.5" fill="currentColor" stroke="none">高速</text>
    <text x="300" y="46" font-size="10.5" fill="currentColor" stroke="none">小容量</text>
    <text x="300" y="150" font-size="10.5" fill="currentColor" stroke="none">低速</text>
    <text x="300" y="166" font-size="10.5" fill="currentColor" stroke="none">大容量</text>
    <line x1="20" y1="20" x2="20" y2="164" stroke="var(--dim)"/>
    <text x="6" y="98" font-size="10.5" fill="currentColor" stroke="none" transform="rotate(-90 12 98)">階層</text>
  </g>
</svg>`;


// ── 追加分の図（2026-08-18） ──
// 二分探索の絞り込み
const FIG_BINSEARCH2 = `<svg viewBox="0 0 400 150" width="400" role="img" aria-label="整列済みデータの中央と比較して探索範囲を半分に絞る様子">
  <g fill="none" stroke="currentColor" stroke-width="1.4" font-size="11">
    <text x="12" y="24" fill="currentColor" stroke="none">整列済みデータ（目的の値：11）</text>
    ${[2,4,6,8,10,12,14,16].map((v,i)=>`<rect x="${14+i*46}" y="34" width="40" height="28" rx="3" stroke="${v===10?'var(--orange)':'var(--dim)'}"/><text x="${26+i*46}" y="53" fill="currentColor" stroke="none">${v}</text>`).join('')}
    <text x="170" y="80" font-size="10.5" fill="var(--orange)" stroke="none">中央と比較</text>
    <text x="12" y="104" fill="currentColor" stroke="none">11 &gt; 10 なので右半分だけが残る</text>
    ${[12,14,16].map((v,i)=>`<rect x="${14+i*46}" y="112" width="40" height="28" rx="3" stroke="var(--ok)"/><text x="${26+i*46}" y="131" fill="currentColor" stroke="none">${v}</text>`).join('')}
  </g>
</svg>`;

// 並列＋直列の複合構成
const FIG_RELIABILITY2 = `<svg viewBox="0 0 420 150" width="420" role="img" aria-label="装置AとBの並列接続に装置Cを直列でつないだ構成図">
  <g fill="none" stroke="currentColor" stroke-width="1.6" font-size="11.5">
    <line x1="14" y1="72" x2="46" y2="72"/>
    <path d="M46 72 L46 44 L62 44"/><path d="M46 72 L46 100 L62 100"/>
    <rect x="62" y="30" width="78" height="28" rx="5" stroke="var(--blue)"/>
    <text x="80" y="48" fill="currentColor" stroke="none">装置A 0.9</text>
    <rect x="62" y="86" width="78" height="28" rx="5" stroke="var(--blue)"/>
    <text x="80" y="104" fill="currentColor" stroke="none">装置B 0.9</text>
    <path d="M140 44 L158 44 L158 72"/><path d="M140 100 L158 100 L158 72"/>
    <line x1="158" y1="72" x2="212" y2="72"/>
    <rect x="212" y="58" width="94" height="28" rx="5" stroke="var(--orange)"/>
    <text x="226" y="76" fill="currentColor" stroke="none">装置C 0.95</text>
    <line x1="306" y1="72" x2="340" y2="72"/>
    <text x="66" y="136" font-size="10.5" fill="currentColor" stroke="none">並列部分</text>
    <text x="224" y="136" font-size="10.5" fill="currentColor" stroke="none">直列で接続</text>
  </g>
</svg>`;

// 正規化の段階
const FIG_NORMAL = `<svg viewBox="0 0 420 120" width="420" role="img" aria-label="非正規形から第3正規形までの正規化の段階">
  <defs><marker id="fenm" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11">
    <rect x="10" y="40" width="82" height="38" rx="5" stroke="var(--dim)"/>
    <text x="30" y="63" fill="currentColor" stroke="none">非正規形</text>
    <line x1="92" y1="59" x2="112" y2="59" marker-end="url(#fenm)"/>
    <rect x="118" y="40" width="82" height="38" rx="5" stroke="var(--blue)"/>
    <text x="130" y="63" fill="currentColor" stroke="none">第1正規形</text>
    <line x1="200" y1="59" x2="220" y2="59" marker-end="url(#fenm)"/>
    <rect x="226" y="40" width="82" height="38" rx="5" stroke="var(--orange)"/>
    <text x="248" y="63" fill="currentColor" stroke="none">段階X</text>
    <line x1="308" y1="59" x2="328" y2="59" marker-end="url(#fenm)"/>
    <rect x="334" y="40" width="82" height="38" rx="5" stroke="var(--ok)"/>
    <text x="346" y="63" fill="currentColor" stroke="none">第3正規形</text>
    <text x="112" y="102" font-size="10" fill="currentColor" stroke="none">繰返し項目を排除</text>
    <text x="330" y="102" font-size="10" fill="currentColor" stroke="none">項目間の依存を排除</text>
  </g>
</svg>`;

// ハイブリッド暗号方式
const FIG_HYBRID = `<svg viewBox="0 0 420 175" width="420" role="img" aria-label="本文を共通鍵で暗号化し共通鍵を公開鍵で暗号化して送る方式">
  <defs><marker id="fehy" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11">
    <rect x="12" y="60" width="76" height="44" rx="5" stroke="var(--blue)"/>
    <text x="34" y="87" fill="currentColor" stroke="none">送信者</text>
    <rect x="150" y="18" width="130" height="38" rx="5" stroke="var(--orange)"/>
    <text x="160" y="35" fill="currentColor" stroke="none">本文（大きい）</text>
    <text x="160" y="50" font-size="10" fill="var(--orange)" stroke="none">共通鍵で暗号化＝高速</text>
    <rect x="150" y="106" width="130" height="38" rx="5" stroke="var(--ok)"/>
    <text x="160" y="123" fill="currentColor" stroke="none">共通鍵（小さい）</text>
    <text x="160" y="138" font-size="10" fill="var(--ok)" stroke="none">公開鍵で暗号化＝安全</text>
    <line x1="88" y1="72" x2="142" y2="42" marker-end="url(#fehy)"/>
    <line x1="88" y1="92" x2="142" y2="122" marker-end="url(#fehy)"/>
    <rect x="330" y="60" width="76" height="44" rx="5" stroke="var(--blue)"/>
    <text x="352" y="87" fill="currentColor" stroke="none">受信者</text>
    <line x1="280" y1="42" x2="326" y2="72" marker-end="url(#fehy)"/>
    <line x1="280" y1="122" x2="326" y2="92" marker-end="url(#fehy)"/>
  </g>
</svg>`;

// アローダイアグラム（余裕の計算用）
const FIG_ARROW2 = `<svg viewBox="0 0 380 155" width="380" role="img" aria-label="作業AからDまでの順序と所要日数を示すアローダイアグラム">
  <defs><marker id="fear" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="32" cy="76" r="16" stroke="var(--blue)"/><text x="27" y="81" font-size="11.5" fill="currentColor" stroke="none">1</text>
    <circle cx="180" cy="30" r="16" stroke="var(--blue)"/><text x="175" y="35" font-size="11.5" fill="currentColor" stroke="none">2</text>
    <circle cx="180" cy="124" r="16" stroke="var(--blue)"/><text x="175" y="129" font-size="11.5" fill="currentColor" stroke="none">3</text>
    <circle cx="336" cy="76" r="16" stroke="var(--blue)"/><text x="331" y="81" font-size="11.5" fill="currentColor" stroke="none">4</text>
    <line x1="47" y1="68" x2="163" y2="38" marker-end="url(#fear)"/>
    <text x="76" y="44" font-size="11" fill="currentColor" stroke="none">A（6日）</text>
    <line x1="47" y1="84" x2="163" y2="116" marker-end="url(#fear)"/>
    <text x="76" y="118" font-size="11" fill="currentColor" stroke="none">B（3日）</text>
    <line x1="196" y1="38" x2="320" y2="68" marker-end="url(#fear)"/>
    <text x="228" y="44" font-size="11" fill="currentColor" stroke="none">C（5日）</text>
    <line x1="196" y1="116" x2="320" y2="84" marker-end="url(#fear)"/>
    <text x="228" y="120" font-size="11" fill="currentColor" stroke="none">D（6日）</text>
  </g>
</svg>`;

// ITサービスマネジメントの時系列（変更管理を含む）
const FIG_ITSM2 = `<svg viewBox="0 0 420 160" width="420" role="img" aria-label="変更前から障害発生と復旧までの時系列で管理プロセスを配置した図">
  <defs><marker id="feit" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11">
    <line x1="14" y1="124" x2="406" y2="124" marker-end="url(#feit)" stroke="var(--dim)"/>
    <text x="356" y="146" font-size="10.5" fill="currentColor" stroke="none">時間</text>
    <line x1="90" y1="116" x2="90" y2="132" stroke="var(--orange)"/>
    <text x="54" y="150" font-size="10" fill="var(--orange)" stroke="none">変更を適用</text>
    <line x1="216" y1="116" x2="216" y2="132" stroke="var(--ng)"/>
    <text x="192" y="150" font-size="10" fill="var(--ng)" stroke="none">障害発生</text>
    <line x1="322" y1="116" x2="322" y2="132" stroke="var(--ok)"/>
    <text x="304" y="150" font-size="10" fill="var(--ok)" stroke="none">復旧</text>
    <rect x="14" y="20" width="76" height="32" rx="5" stroke="var(--orange)"/>
    <text x="34" y="41" fill="currentColor" stroke="none">時点P</text>
    <rect x="216" y="20" width="106" height="32" rx="5" stroke="var(--ng)"/>
    <text x="226" y="41" fill="currentColor" stroke="none">インシデント管理</text>
    <rect x="322" y="20" width="84" height="32" rx="5" stroke="var(--blue)"/>
    <text x="342" y="41" fill="currentColor" stroke="none">問題管理</text>
    <line x1="52" y1="52" x2="52" y2="116" stroke="var(--dim)" stroke-dasharray="3 3"/>
    <line x1="268" y1="52" x2="268" y2="116" stroke="var(--dim)" stroke-dasharray="3 3"/>
    <line x1="364" y1="52" x2="364" y2="116" stroke="var(--dim)" stroke-dasharray="3 3"/>
  </g>
</svg>`;

// PPMの4象限
const FIG_PPM2 = `<svg viewBox="0 0 320 245" width="320" role="img" aria-label="市場成長率と市場占有率で4象限に分けたPPMの図">
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <line x1="56" y1="24" x2="56" y2="200"/><line x1="56" y1="200" x2="290" y2="200"/>
    <line x1="173" y1="24" x2="173" y2="200" stroke="var(--line)"/>
    <line x1="56" y1="112" x2="290" y2="112" stroke="var(--line)"/>
    <text x="8" y="58" font-size="11" fill="currentColor" stroke="none">市場</text>
    <text x="8" y="72" font-size="11" fill="currentColor" stroke="none">成長率</text>
    <text x="26" y="42" font-size="11" fill="currentColor" stroke="none">高</text>
    <text x="26" y="194" font-size="11" fill="currentColor" stroke="none">低</text>
    <text x="148" y="224" font-size="11" fill="currentColor" stroke="none">市場占有率</text>
    <text x="262" y="220" font-size="11" fill="currentColor" stroke="none">高</text>
    <text x="66" y="220" font-size="11" fill="currentColor" stroke="none">低</text>
    <text x="92" y="72" font-size="12.5" fill="var(--orange)" stroke="none">領域ア</text>
    <text x="206" y="72" font-size="12.5" fill="currentColor" stroke="none">花形</text>
    <text x="92" y="160" font-size="12.5" fill="currentColor" stroke="none">負け犬</text>
    <text x="196" y="160" font-size="12.5" fill="currentColor" stroke="none">金のなる木</text>
  </g>
</svg>`;

// スタック（後入れ先出し）
const FIG_STACK = `<svg viewBox="0 0 330 175" width="330" role="img" aria-label="スタックにデータを積み上げて上から取り出す様子">
  <defs><marker id="fest" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11.5">
    <path d="M96 34 L96 140 L184 140 L184 34" stroke="var(--dim)" stroke-width="2"/>
    <rect x="102" y="112" width="76" height="26" fill="var(--card2)" stroke="var(--blue)"/>
    <text x="132" y="130" fill="currentColor" stroke="none">A</text>
    <rect x="102" y="84" width="76" height="26" fill="var(--card2)" stroke="var(--blue)"/>
    <text x="132" y="102" fill="currentColor" stroke="none">B</text>
    <rect x="102" y="56" width="76" height="26" fill="var(--card2)" stroke="var(--orange)"/>
    <text x="132" y="74" fill="currentColor" stroke="none">C</text>
    <line x1="230" y1="44" x2="192" y2="60" marker-end="url(#fest)" stroke="var(--orange)"/>
    <text x="234" y="42" fill="var(--orange)" stroke="none">最後に入れたC</text>
    <text x="234" y="58" fill="var(--orange)" stroke="none">が最初に出る</text>
    <text x="16" y="132" font-size="10.5" fill="currentColor" stroke="none">A→B→C</text>
    <text x="16" y="148" font-size="10.5" fill="currentColor" stroke="none">の順に格納</text>
  </g>
</svg>`;

// デュプレックスシステム（現用系と待機系）
const FIG_DUPLEX = `<svg viewBox="0 0 390 150" width="390" role="img" aria-label="現用系と待機系を用意し障害時に切り替える構成図">
  <defs><marker id="fedp" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="currentColor"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11.5">
    <rect x="14" y="52" width="76" height="40" rx="5" stroke="var(--dim)"/>
    <text x="36" y="76" fill="currentColor" stroke="none">利用者</text>
    <line x1="90" y1="72" x2="140" y2="72" marker-end="url(#fedp)"/>
    <rect x="148" y="16" width="112" height="42" rx="5" stroke="var(--ok)"/>
    <text x="176" y="42" fill="currentColor" stroke="none">現用系（稼働中）</text>
    <rect x="148" y="90" width="112" height="42" rx="5" stroke="var(--dim)" stroke-dasharray="5 4"/>
    <text x="172" y="116" fill="currentColor" stroke="none">待機系（待機中）</text>
    <line x1="204" y1="58" x2="204" y2="86" stroke="var(--orange)" stroke-dasharray="4 3" marker-end="url(#fedp)"/>
    <text x="212" y="78" font-size="10.5" fill="var(--orange)" stroke="none">障害時に切替</text>
    <text x="286" y="42" font-size="10.5" fill="currentColor" stroke="none">通常はこちら</text>
    <text x="286" y="116" font-size="10.5" fill="currentColor" stroke="none">が処理を引継ぐ</text>
  </g>
</svg>`;

// 主キーと外部キー
const FIG_KEYS = `<svg viewBox="0 0 420 150" width="420" role="img" aria-label="社員表と部署表を主キーと外部キーで結んだ図">
  <g fill="none" stroke="currentColor" stroke-width="1.5" font-size="11">
    <rect x="14" y="26" width="150" height="92" rx="6" stroke="var(--blue)"/>
    <line x1="14" y1="50" x2="164" y2="50" stroke="var(--blue)"/>
    <text x="26" y="43" font-size="12" fill="currentColor" stroke="none">社員</text>
    <text x="26" y="70" fill="currentColor" stroke="none">社員番号（主キー）</text>
    <text x="26" y="90" fill="currentColor" stroke="none">氏名</text>
    <text x="26" y="110" fill="currentColor" stroke="none">部署コード</text>
    <rect x="262" y="26" width="150" height="92" rx="6" stroke="var(--orange)"/>
    <line x1="262" y1="50" x2="412" y2="50" stroke="var(--orange)"/>
    <text x="274" y="43" font-size="12" fill="currentColor" stroke="none">部署</text>
    <text x="274" y="70" fill="currentColor" stroke="none">部署コード（主キー）</text>
    <text x="274" y="90" fill="currentColor" stroke="none">部署名</text>
    <line x1="164" y1="106" x2="262" y2="70" stroke="var(--ok)"/>
    <text x="170" y="132" font-size="10.5" fill="var(--ok)" stroke="none">社員表の部署コードは部署表を参照する</text>
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
    <text x="278" y="34" fill="currentColor" stroke="none">運用テスト</text>
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

// ─── 科目A：過去問（四肢択一） ─────────────────────────────
// {id, c:カテゴリID, q:設問, o:[選択肢], a:正解のindex, e:解説, d:難易度, fig:図}
// 2次元配列（3行4列）。科目Bの行合計問題で使う
const FIG_MATRIX = `<svg viewBox="0 0 340 150" width="340" role="img" aria-label="3行4列の2次元配列tblの内容を示す表">
  <g fill="none" stroke="currentColor" stroke-width="1.3" font-size="11.5">
    <text x="12" y="20" fill="currentColor" stroke="none">2次元配列 tbl（3行4列）</text>
    <text x="12" y="46" font-size="10.5" fill="var(--dim)" stroke="none">列→</text>
    ${[1,2,3,4].map(function(c){ return '<text x="' + (78 + (c-1)*56) + '" y="46" font-size="10.5" fill="var(--dim)" stroke="none">' + c + '</text>'; }).join('')}
    ${[[2,5,1,3],[4,4,6,1],[7,2,2,5]].map(function(row, r){
      return '<text x="30" y="' + (74 + r*30) + '" font-size="10.5" fill="var(--dim)" stroke="none">' + (r+1) + '行</text>' +
        row.map(function(v, c){
          const hi = (r === 1);
          return '<rect x="' + (62 + c*56) + '" y="' + (56 + r*30) + '" width="50" height="24" rx="3" stroke="' + (hi ? 'var(--orange)' : 'var(--dim)') + '"/>' +
                 '<text x="' + (84 + c*56) + '" y="' + (73 + r*30) + '" fill="currentColor" stroke="none">' + v + '</text>';
        }).join('');
    }).join('')}
    <text x="12" y="142" font-size="10.5" fill="var(--orange)" stroke="none">オレンジの枠が2行目</text>
  </g>
</svg>`;

// 整列済み配列への挿入位置。科目Bの挿入位置問題で使う
const FIG_INSERT = `<svg viewBox="0 0 400 130" width="400" role="img" aria-label="昇順に並んだ配列のどこに値15が入るかを示す図">
  <defs><marker id="feins" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 9 3.5, 0 7" fill="var(--orange)"/></marker></defs>
  <g fill="none" stroke="currentColor" stroke-width="1.4" font-size="11.5">
    <text x="12" y="22" fill="currentColor" stroke="none">昇順に整列済みの配列 data</text>
    ${[4,9,12,18,25].map(function(v, i){
      return '<rect x="' + (14 + i*70) + '" y="34" width="60" height="28" rx="3" stroke="var(--dim)"/>' +
             '<text x="' + (38 + i*70) + '" y="53" fill="currentColor" stroke="none">' + v + '</text>' +
             '<text x="' + (38 + i*70) + '" y="76" font-size="10" fill="var(--dim)" stroke="none">' + (i+1) + '番目</text>';
    }).join('')}
    <rect x="14" y="96" width="92" height="26" rx="3" stroke="var(--orange)"/>
    <text x="26" y="114" fill="var(--orange)" stroke="none">key ＝ 15</text>
    <text x="118" y="114" font-size="10.5" fill="currentColor" stroke="none">この値を、昇順を保つように挿入する</text>
  </g>
</svg>`;

// EVM（出来高管理）の3本の線。プロジェクトマネジメントの進捗・コスト判断で使う
const FIG_EVM = `<svg viewBox="0 0 400 210" width="400" role="img" aria-label="計画価値PVと出来高EVと実コストACの3本の線を比べたEVMのグラフ">
  <g fill="none" stroke="currentColor" stroke-width="1.4" font-size="11">
    <line x1="46" y1="26" x2="46" y2="164"/>
    <line x1="46" y1="164" x2="352" y2="164"/>
    <text x="10" y="30" fill="currentColor" stroke="none">金額</text>
    <text x="330" y="182" fill="currentColor" stroke="none">時間</text>
    <path d="M46 164 L250 62" stroke="var(--dim)" stroke-width="2"/>
    <text x="256" y="60" fill="var(--dim)" stroke="none">PV（計画）</text>
    <path d="M46 164 L250 96" stroke="var(--blue)" stroke-width="2"/>
    <text x="256" y="98" fill="var(--blue)" stroke="none">EV（出来高）</text>
    <path d="M46 164 L250 78" stroke="var(--orange)" stroke-width="2"/>
    <text x="256" y="80" fill="var(--orange)" stroke="none">AC（実コスト）</text>
    <line x1="250" y1="52" x2="250" y2="170" stroke="var(--ng)" stroke-dasharray="4 3"/>
    <text x="212" y="186" fill="var(--ng)" stroke="none">この時点で比べる</text>
    <text x="60" y="44" font-size="10.5" fill="currentColor" stroke="none">SV ＝ EV － PV（進捗の差）</text>
    <text x="60" y="60" font-size="10.5" fill="currentColor" stroke="none">CV ＝ EV － AC（コストの差）</text>
  </g>
</svg>`;

const QQ = [
// ── 基礎理論 ──
{id:'Q001',c:'theory',d:2,q:'8ビットの2進数 11101100 を、2の補数表現の符号付き整数として解釈すると、10進数でいくつになりますか？',o:['−20','−19','−108','236'],a:0,e:'最上位ビットが1なので負の数です。各ビットを反転すると 00010011（＝19）、これに1を加えて 00010100（＝20）となるため、値は−20です。「−19」はビット反転だけして1を加え忘れた場合の誤りです。「−108」は符号ビットを除いた残り7ビット（1101100＝108）を絶対値と誤読したものです。「236」は符号なしとして解釈した値で、2の補数表現という前提を無視しています。'},
{id:'Q002',c:'theory',d:2,q:'要素数が 4096 個の整列済み配列に対して二分探索を行うとき、目的の要素が見つからない場合の比較回数は最大で何回ですか？',o:['11回','12回','13回','2048回'],a:1,e:'二分探索は1回の比較で候補が半分になります。4096 = 2¹² なので、4096→2048→1024→…→1 と絞り込むのに12回で候補が1個になります。「11回」は 2¹¹＝2048 と取り違えたものです。「13回」は1個になった後に余分に1回数えたものです。「2048回」は線形探索の平均回数のイメージで、二分探索の性質（O(log n)）を使っていません。'},
{id:'Q003',c:'theory',d:1,q:'スタックに対して push(5)、push(8)、pop、push(3)、pop の順に操作を行いました。最後の pop で取り出される値はどれですか？',o:['3','5','8','空になっているため取り出せない'],a:0,e:'スタックは後入れ先出し（LIFO）です。push(5)、push(8) で下から5,8となり、popで8が出ます。次にpush(3)で下から5,3となり、最後のpopでは一番上の3が取り出されます。「5」は先入れ先出し（キュー）と取り違えた場合の誤りです。「8」は最初のpopで既に取り出されています。この時点でスタックには5が残っているため空ではありません。'},
{id:'Q004',c:'theory',d:3,q:'ビット列 A と B について、A XOR B の結果に対してさらに B を XOR すると何が得られますか？',o:['B','A','すべて0のビット列','すべて1のビット列'],a:1,e:'XORは同じ値を2回適用すると元に戻る性質があります（(A XOR B) XOR B = A XOR (B XOR B) = A XOR 0 = A）。この性質は簡易な暗号化やスワップ処理に利用されます。「B」は演算の対象を取り違えたものです。「すべて0」になるのは A XOR A のように同じ値どうしをXORした場合です。「すべて1」になるのはNOT演算やAとBが全ビット反転の関係にある特殊な場合に限られます。'},

// ── コンピュータ構成要素（図あり） ──
{id:'Q005',c:'compute',d:2,fig:FIG_MEMORY,q:'図は記憶装置の階層構造を示しています。「装置ア」に入るものとして適切なものはどれですか？',o:['キャッシュメモリ','磁気ディスク装置','光ディスク装置','磁気テープ装置'],a:0,e:'記憶階層は上へ行くほど高速・小容量、下へ行くほど低速・大容量です。レジスタと主記憶の間に位置するのはキャッシュメモリで、CPUと主記憶の速度差を埋める役割を持ちます。「磁気ディスク装置」「光ディスク装置」「磁気テープ装置」はいずれも補助記憶にあたり、図の最下層より下、あるいは補助記憶の内部の分類になるため、主記憶より上の階層には入りません。'},
{id:'Q006',c:'compute',d:3,q:'キャッシュメモリのアクセス時間が 10 ナノ秒、主記憶のアクセス時間が 90 ナノ秒、キャッシュのヒット率が 0.9 のとき、実効アクセス時間は何ナノ秒ですか？',o:['18ナノ秒','20ナノ秒','50ナノ秒','82ナノ秒'],a:0,e:'実効アクセス時間 ＝ ヒット率×キャッシュのアクセス時間 ＋ (1−ヒット率)×主記憶のアクセス時間 ＝ 0.9×10 ＋ 0.1×90 ＝ 9 ＋ 9 ＝ 18ナノ秒です。「20ナノ秒」はミス時に主記憶へアクセスする分を概算で丸めた誤りです。「50ナノ秒」は単純に両者の平均を取ったもので、ヒット率を考慮していません。「82ナノ秒」はヒット率とミス率を逆にして計算した場合の値（0.1×10＋0.9×90）です。'},
{id:'Q007',c:'compute',d:2,q:'CPUのクロック周波数が 2.5 GHz、平均CPI（1命令あたりの平均クロック数）が 5 のとき、このCPUの処理性能は何MIPSですか？',o:['200 MIPS','500 MIPS','1,250 MIPS','12,500 MIPS'],a:1,e:'1秒間のクロック数は 2.5×10⁹ です。1命令に平均5クロックかかるので、実行できる命令数は 2.5×10⁹ ÷ 5 ＝ 5×10⁸ 命令／秒 ＝ 500 MIPS です。「200 MIPS」はクロック周波数とCPIの割り算を逆にした誤りです。「1,250 MIPS」はCPIを2として計算した値です。「12,500 MIPS」はCPIで割らずに掛けてしまった場合の値です。'},

// ── システム構成要素（図あり） ──
{id:'Q008',c:'system',d:3,fig:FIG_RELIABILITY,q:'図の構成XとYについて、装置A・装置Bの稼働率がいずれも 0.8 のとき、構成Xと構成Yの稼働率の組合せとして正しいものはどれですか？',o:['X：0.64、Y：0.96','X：0.96、Y：0.64','X：0.64、Y：0.90','X：0.80、Y：0.96'],a:0,e:'直列（構成X）はどちらか一方でも停止すると全体が停止するため、稼働率は積で 0.8×0.8＝0.64 です。並列（構成Y）は両方が同時に停止したときだけ全体が停止するため、1−(1−0.8)×(1−0.8)＝1−0.04＝0.96 です。「X：0.96、Y：0.64」は直列と並列の計算を取り違えたものです。「X：0.64、Y：0.90」は並列の稼働率を単純平均で求めた誤りで、正しくは両方が同時に停止する確率を1から引きます。「X：0.80、Y：0.96」は直列でも1台分の稼働率がそのまま残ると誤解したもので、直列では必ず個々の稼働率より低くなります。'},
{id:'Q009',c:'system',d:2,q:'あるシステムのMTBFが 480 時間、MTTRが 20 時間のとき、このシステムの稼働率はいくつですか？',o:['0.94','0.96','0.98','0.99'],a:1,e:'稼働率 ＝ MTBF ÷（MTBF ＋ MTTR）＝ 480 ÷（480＋20）＝ 480 ÷ 500 ＝ 0.96 です。「0.94」は分母を誤って計算したものです。「0.98」はMTTRを10時間として計算した場合の値です。「0.99」はMTTRをさらに小さく見積もった場合の値で、与えられた数値とは一致しません。'},
{id:'Q010',c:'system',d:2,q:'フェールセーフの説明として最も適切なものはどれですか？',o:['故障が発生しても、システム全体の機能を落とさずに動作を継続させる','故障が発生したとき、被害が拡大しないよう安全な状態へ移行させる','利用者が誤った操作をしても、危険な結果にならないようにする','故障の起こりにくい高品質な部品を使い、故障そのものを防ぐ'],a:1,e:'フェールセーフは、故障時に安全側へ倒す設計思想です（信号機が故障したら赤で停止するなど）。「機能を落とさずに継続」はフォールトトレラントの説明です。「誤操作しても危険にならない」はフールプルーフの説明です。「故障そのものを防ぐ」はフォールトアボイダンスの説明で、いずれも紛らわしいので区別して覚える必要があります。'},

// ── ソフトウェア・OS ──
{id:'Q011',c:'software',d:2,q:'仮想記憶方式において、ページの置換えが頻発してCPUの処理効率が著しく低下する現象を何といいますか？',o:['フラグメンテーション','スラッシング','デッドロック','スワップイン'],a:1,e:'スラッシングは、主記憶が不足してページフォールトが多発し、ページの入替えばかりに時間を取られてCPUの実効的な処理量が落ちる現象です。「フラグメンテーション」は記憶領域が断片化して連続した空き領域が確保しにくくなる現象で、原因も結果も異なります。「デッドロック」は複数のプロセスが互いの資源解放を待ち合って停止する状態です。「スワップイン」は補助記憶から主記憶へデータを読み込む個別の動作そのものを指し、性能低下の現象名ではありません。'},
{id:'Q012',c:'software',d:3,q:'4つのプロセスが動作しているシステムでデッドロックを防止する方法として、最も適切なものはどれですか？',o:['各プロセスが資源を獲得する順序をあらかじめ統一しておく','各プロセスに割り当てる主記憶の容量を均等にする','各プロセスのタイムスライスを短く設定する','各プロセスの優先度をすべて同じ値に設定する'],a:0,e:'デッドロックは複数のプロセスが互いに相手の持つ資源を待ち合うことで発生します。資源の獲得順序を統一すれば循環待ちが起こらなくなり、防止できます。「主記憶を均等に割り当てる」のは資源の待ち合い関係とは無関係です。「タイムスライスを短くする」と切替えは頻繁になりますが、待ち合いの構造自体は解消されません。「優先度を同じにする」のも同様で、循環待ちは依然として起こりえます。'},

// ── ヒューマンインタフェース・マルチメディア ──
{id:'Q013',c:'ui',d:2,q:'サンプリング周波数 44.1 kHz、量子化ビット数 16 ビット、ステレオ（2チャネル）で 60 秒間の音声をデジタル化したとき、圧縮しない場合のデータ量はおよそ何Mバイトですか？',o:['約 5.3 Mバイト','約 10.6 Mバイト','約 21.2 Mバイト','約 84.7 Mバイト'],a:1,e:'1秒あたりのデータ量は 44,100×16ビット×2チャネル ＝ 1,411,200ビット ＝ 176,400バイトです。60秒では約 10,584,000バイト ≒ 10.6Mバイトになります。「約5.3Mバイト」はモノラル（1チャネル）として計算したものです。「約21.2Mバイト」はチャネル数を4として計算した場合の値です。「約84.7Mバイト」はビットとバイトの換算（÷8）を忘れた場合の値です。'},
{id:'Q014',c:'ui',d:1,q:'不可逆圧縮方式に分類されるものはどれですか？',o:['ZIP','PNG','JPEG','可逆圧縮のみを行うGIF'],a:2,e:'JPEGは人間が知覚しにくい情報を削除して圧縮率を高める不可逆圧縮方式で、保存を繰り返すと画質が劣化します。「ZIP」は完全に元へ復元できる可逆圧縮です。「PNG」も可逆圧縮で、劣化しないため図やロゴに向きます。「GIF」も可逆圧縮方式で、色数が256色に制限されるという別の特徴を持ちますが、圧縮そのものは可逆です。'},

// ── データベース（図あり） ──
{id:'Q015',c:'db',d:2,fig:FIG_ER,q:'図のER図で、「受注明細」表における受注番号の役割として正しいものはどれですか？',o:['受注明細表の行を一意に識別する主キーである','受注表を参照する外部キーである','値の重複が許されないユニーク制約の列である','索引を作成できない特別な列である'],a:1,e:'受注1件に対して受注明細が複数ぶら下がる1対多の関係なので、受注明細側の受注番号は受注表の主キーを参照する外部キーです。「主キー」は受注明細の場合、受注番号だけでは行を一意に特定できず、明細番号と組み合わせる必要があるため誤りです。「重複が許されない」のも誤りで、同じ受注番号が複数の明細行に現れるのがこの関係の前提です。「索引を作成できない」という制約は存在せず、むしろ外部キーには索引を張ることが多いです。'},
{id:'Q016',c:'db',d:3,q:'データベースの障害回復において、ロールフォワードを行う場面として適切なものはどれですか？',o:['トランザクション実行中にプログラムが異常終了したとき','ディスク障害でデータベースが破損し、バックアップから復旧するとき','デッドロックが検出され、一方のトランザクションを取り消すとき','利用者が誤ったデータを入力し、その操作だけを取り消すとき'],a:1,e:'ロールフォワードは、バックアップを復元したうえで更新後ログを再適用し、障害直前の状態まで進める処理です。媒体障害（ディスク破損）からの復旧が典型例です。「トランザクションの異常終了」「デッドロックによる取消し」はいずれも更新前ログを使って開始前へ戻すロールバックの場面です。「誤入力の取消し」も個別のトランザクションを巻き戻す話なので、ロールフォワードではありません。'},
{id:'Q017',c:'db',d:2,q:'関係データベースの第3正規形が満たしている条件として正しいものはどれですか？',o:['繰返し項目が排除されている','主キー以外の項目が主キー全体に関数従属している','主キー以外の項目の間に関数従属が存在しない','すべての項目が数値型で定義されている'],a:2,e:'第3正規形は、第2正規形を満たしたうえで、主キー以外の項目どうしの関数従属（推移的関数従属）を排除した状態です。「繰返し項目の排除」は第1正規形の条件です。「主キー全体への関数従属」は部分関数従属の排除で第2正規形の条件です。「すべて数値型」はデータ型の話であり、正規化の条件とはまったく関係がありません。'},

// ── ネットワーク（図あり） ──
{id:'Q018',c:'network',d:2,fig:FIG_DMZ,q:'図のネットワーク構成において、「領域P」の名称と目的として適切なものはどれですか？',o:['DMZ。外部に公開するサーバを内部LANから隔離して設置する','VLAN。物理構成とは別に論理的なネットワークを分割する','VPN。公衆回線上に暗号化された仮想的な専用線を構築する','サブネット。IPアドレスのホスト部を分割して管理する'],a:0,e:'外部に公開するWebサーバやメールサーバを、インターネットとも内部LANとも切り離した緩衝地帯に置く構成をDMZ（非武装地帯）といいます。公開サーバが侵害されても内部LANへ直接波及しないようにするのが目的です。「VLAN」はスイッチ上で論理的にネットワークを分ける技術で、公開サーバの隔離という目的とは異なります。「VPN」は拠点間を暗号化して接続する技術です。「サブネット」はアドレス設計上の分割であり、セキュリティ境界を示す用語ではありません。'},
{id:'Q019',c:'network',d:3,q:'IPアドレス 192.168.10.0/26 のネットワークにおいて、ホストに割り当てられるアドレスの最大数はいくつですか？',o:['30個','62個','64個','126個'],a:1,e:'/26 はホスト部が 32−26＝6 ビットなので、2⁶＝64個のアドレスが表せます。このうちネットワークアドレスとブロードキャストアドレスの2個は割当てできないため、62個です。「30個」は /27 の場合の値です。「64個」は使用できない2個を差し引いていません。「126個」は /25 の場合の値で、プレフィックス長を取り違えています。'},
{id:'Q020',c:'network',d:1,q:'UDPを用いることが適切な通信はどれですか？',o:['ファイルを1バイトの欠落もなく転送する','電子メールの本文を確実に届ける','リアルタイム性が重視される映像のストリーミング配信','Webページのフォームに入力した内容を送信する'],a:2,e:'UDPはコネクションレスで再送制御を行わないため、多少の欠落より遅延の少なさが優先されるストリーミング配信などに向きます。「ファイル転送」「電子メール」「フォーム送信」はいずれもデータが1バイトでも欠けると問題になるため、再送制御と順序保証があるTCPを使います。'},

// ── セキュリティ ──
{id:'Q021',c:'security',d:2,q:'デジタル署名において、送信者が署名の作成に使用する鍵と、受信者が検証に使用する鍵の組合せとして正しいものはどれですか？',o:['作成：送信者の秘密鍵、検証：送信者の公開鍵','作成：送信者の公開鍵、検証：送信者の秘密鍵','作成：受信者の公開鍵、検証：受信者の秘密鍵','作成：受信者の秘密鍵、検証：受信者の公開鍵'],a:0,e:'デジタル署名は送信者が自分の秘密鍵で署名を作り、受信者は誰でも入手できる送信者の公開鍵で検証します。秘密鍵を持つのは本人だけなので、本人であることと改ざんの無いことを確認できます。「送信者の公開鍵で作成」は誰でも署名を偽造できることになり成立しません。受信者の鍵を使う2つの選択肢は、メッセージの暗号化（機密性の確保）の場面と取り違えたもので、署名の目的である真正性の確認には使えません。'},
{id:'Q022',c:'security',d:2,q:'Webアプリケーションにおいて、SQLインジェクション攻撃を防ぐ対策として最も直接的で有効なものはどれですか？',o:['入力値をプレースホルダ（バインド機構）を用いてSQL文へ渡す','通信経路をTLSで暗号化する','利用者にパスワードを定期的に変更させる','サーバのディスクを暗号化する'],a:0,e:'SQLインジェクションは入力値がSQL文の構文として解釈されることで成立します。プレースホルダを使えば入力値は必ず値として扱われるため、根本的に防げます。「TLSで暗号化」は通信の盗聴を防ぐ対策で、サーバ側で組み立てるSQL文には影響しません。「パスワードの定期変更」は不正ログイン対策であり別の脅威に対応するものです。「ディスクの暗号化」は媒体を持ち出された場合の対策で、稼働中のアプリ経由の攻撃には効きません。'},
{id:'Q023',c:'security',d:3,q:'リスク対応のうち「リスク移転」に該当するものはどれですか？',o:['保険に加入して、損害発生時の金銭的な負担を第三者に負ってもらう','脆弱性を修正するプログラムを適用し、発生の可能性を下げる','影響が小さいと判断し、対策を取らずに受け入れる','その事業活動そのものを取りやめる'],a:0,e:'リスク移転は、リスクによる損失を保険会社や外部委託先など第三者に肩代わりしてもらう対応です。「脆弱性の修正」は発生可能性や影響度を下げるリスク低減です。「対策を取らず受け入れる」はリスク保有（受容）です。「事業活動を取りやめる」はリスク回避で、4分類のいずれも紛らわしいため対応の目的で区別します。'},

// ── システム開発技術（図あり） ──
{id:'Q024',c:'devtech',d:2,fig:FIG_FLOW,q:'図のフローチャートに従って処理を行うとき、点数が 60 の場合に出力される評価はどれですか？',o:['A評価','B評価','C評価','評価は出力されない'],a:1,e:'最初の判定「点数 ≧ 80」は 60 なので偽となり、いいえの経路へ進みます。次の判定「点数 ≧ 60」は 60 ≧ 60 で真となるため、B評価が出力されます。「A評価」は最初の条件を満たす80以上の場合です。「C評価」は2つ目の条件も偽になる60未満の場合で、境界値である60をどちらに含めるかを取り違えると選んでしまいます。すべての経路が評価の出力につながっているため、出力されないことはありません。'},
{id:'Q025',c:'devtech',d:2,fig:FIG_SEQ,q:'図のUMLシーケンス図が表しているものとして、最も適切な説明はどれですか？',o:['クラス間の静的な継承関係','オブジェクト間でやり取りされるメッセージの時間的な順序','システムが取りうる状態と状態間の遷移','業務の担当者ごとの作業の割り振り'],a:1,e:'シーケンス図は、縦軸を時間としてオブジェクト間のメッセージのやり取りを時系列で表す図です。「クラス間の静的な継承関係」を表すのはクラス図です。「状態と状態遷移」を表すのは状態遷移図（ステートマシン図）です。「担当者ごとの作業の割り振り」を表すのはアクティビティ図のスイムレーンで、いずれもUMLの別の図種です。'},
{id:'Q026',c:'devtech',d:3,q:'ホワイトボックステストにおける「分岐網羅（判定条件網羅）」を満たすために必要な条件はどれですか？',o:['すべての命令が少なくとも1回は実行される','すべての判定において、真と偽の両方の結果が少なくとも1回ずつ実行される','すべての条件の組合せが網羅的に実行される','すべての入力値の同値クラスから代表値が選ばれる'],a:1,e:'分岐網羅は、各判定が真になる場合と偽になる場合の両方を通すテストです。「すべての命令が1回は実行される」のは命令網羅で、分岐網羅より弱い基準です。「すべての条件の組合せ」は複合条件網羅で、分岐網羅より強い基準になります。「同値クラスから代表値を選ぶ」のは同値分割であり、ブラックボックステストの技法なので分類そのものが異なります。'},

// ── プロジェクトマネジメント（図あり） ──
{id:'Q027',c:'pm',d:3,fig:FIG_ARROW,q:'図のアローダイアグラムにおいて、作業開始（結合点1）から終了（結合点5）までの最短所要日数は何日ですか？',o:['13日','15日','17日','20日'],a:1,e:'経路は2通りあります。1→2→4→5 は A(4)＋C(5)＋E(6)＝15日、1→3→4→5 は B(3)＋D(2)＋E(6)＝11日です。結合点4は先行するすべての作業の完了を待つため、遅いほうの15日が決まり、これがクリティカルパスとなって全体の最短所要日数は15日です。「13日」は各経路の一部を取り違えたものです。「17日」は存在しない経路を足したものです。「20日」はすべての作業日数を単純に合計したもので、並行作業を考慮していません。'},
{id:'Q028',c:'pm',d:2,q:'ファンクションポイント法による見積りの説明として正しいものはどれですか？',o:['プログラムの行数を基準に開発工数を見積もる','画面や帳票などの機能の数と複雑さを基準に開発規模を見積もる','過去の類似プロジェクトの実績から全体を概算する','開発者一人ひとりの経験年数を積み上げて算出する'],a:1,e:'ファンクションポイント法は、外部入力・外部出力・内部論理ファイルなど利用者から見える機能を数え、複雑さで重み付けして規模を測る手法です。プログラム言語に依存しないのが特長です。「行数を基準にする」のはLOC法（ステップ法）です。「過去の実績から概算する」のは類推見積法です。「経験年数を積み上げる」という見積技法は一般的に存在せず、要員計画の話と混同したものです。'},

// ── サービスマネジメント・システム監査 ──
{id:'Q029',c:'sm',d:2,q:'ITサービスマネジメントにおけるインシデント管理の第一の目的はどれですか？',o:['インシデントの根本原因を特定し、再発を防止する','サービスを可能な限り迅速に復旧させる','変更作業を評価・承認し、統制する','構成情報を最新の状態に維持する'],a:1,e:'インシデント管理の目的は、原因究明よりもまずサービスを早く復旧させることです。暫定的な回避策でも構いません。「根本原因を特定し再発を防止する」のは問題管理の目的で、この2つの役割は逆に覚えられやすい代表例です。「変更の評価・承認」は変更管理、「構成情報の維持」は構成管理の目的で、それぞれ別のプロセスです。'},
{id:'Q030',c:'sm',d:2,q:'システム監査人に求められる独立性に関する記述として適切なものはどれですか？',o:['監査対象システムの開発を担当した者が、内容に精通しているため監査人を務める','監査対象部門の上長の指示に従って、監査の結論を調整する','監査対象の業務や組織から独立した立場で、客観的に評価する','監査結果は監査対象部門にだけ報告し、経営者には報告しない'],a:2,e:'システム監査人には外観上・精神上の独立性が求められ、監査対象から独立した立場で客観的に評価する必要があります。「開発担当者が監査する」のは自己監査となり独立性を欠きます。「上長の指示で結論を調整する」のは監査の客観性を損なう行為です。「経営者に報告しない」のも誤りで、監査結果は本来、経営者に報告されるべきものです。'},

// ── 経営戦略・システム戦略・法務 ──
{id:'Q031',c:'strategy',d:2,q:'固定費が 840 万円、変動費率が 30% のとき、損益分岐点売上高はいくらですか？',o:['1,092万円','1,200万円','2,520万円','2,800万円'],a:1,e:'損益分岐点売上高 ＝ 固定費 ÷（1 − 変動費率）＝ 840 ÷（1 − 0.3）＝ 840 ÷ 0.7 ＝ 1,200万円です。「1,092万円」は固定費に変動費率を掛けて足した誤りです。「2,520万円」は固定費を変動費率で割ったものです。「2,800万円」は変動費率を 0.7 と取り違えて計算した場合の値です。'},
{id:'Q032',c:'strategy',d:3,q:'A社がB社に業務を委託しました。B社の従業員に対してA社の社員が直接、作業手順や進め方を指示している場合、契約形態と照らして問題となるのはどれですか？',o:['労働者派遣契約であれば適法だが、請負契約であれば偽装請負となる','請負契約であれば適法だが、労働者派遣契約であれば偽装請負となる','いずれの契約形態でも適法である','いずれの契約形態でも違法である'],a:0,e:'労働者派遣では派遣先が労働者に直接指揮命令することが制度上認められています。一方、請負は仕事の完成を目的とする契約で、発注者に指揮命令権はないため、直接指示を出すと実質的に派遣とみなされ偽装請負となります。したがって契約形態によって適法性が分かれます。「請負であれば適法」は指揮命令権の所在が逆です。「いずれも適法」「いずれも違法」は契約ごとの違いを無視しているため誤りです。'},
{id:'Q033',c:'strategy',d:1,q:'SWOT分析における「機会（Opportunity）」に分類されるものはどれですか？',o:['自社が保有する高い技術力','自社の営業拠点が少ないこと','市場規模が拡大していること','競合他社が低価格で参入してきたこと'],a:2,e:'機会は自社にとって追い風となる外部環境の要因です。市場規模の拡大は外部環境かつ好影響なので機会にあたります。「高い技術力」は内部環境の好影響で強み、「営業拠点が少ない」は内部環境の悪影響で弱みです。「競合の低価格参入」は外部環境ですが自社に不利なので脅威にあたり、内部／外部と好影響／悪影響の2軸で整理すると区別できます。'},
// ── 追加分：図つき・易しめの問題（作問ルール1・4の分布調整） ──
{id:'Q034',c:'system',d:1,fig:FIG_RELIABILITY,q:'図の構成Xのように、装置Aと装置Bのどちらか一方でも停止するとシステム全体が停止する接続方式を何といいますか？',o:['直列接続','並列接続','デュプレックスシステム','ロードシェアシステム'],a:0,e:'すべての装置が正常でなければ全体が動かない接続を直列接続といい、稼働率は各装置の稼働率の積になります。「並列接続」は図の構成Yのように、どちらか一方が動いていれば全体が動く方式で条件が逆です。「デュプレックスシステム」は主系と待機系を用意する構成の呼び名で、接続方式そのものを指す用語ではありません。「ロードシェアシステム」は複数台で負荷を分担する構成で、これも1台停止時に全体が止まるとは限りません。'},
{id:'Q035',c:'db',d:1,fig:FIG_ER,q:'図のER図で、「受注」と「受注明細」の間に成り立っている関係はどれですか？',o:['1対1','1対多','多対多','関係は存在しない'],a:1,e:'図の線の両端に「1」と「多」が記されており、受注1件に対して受注明細が複数存在する1対多の関係です。「1対1」は受注1件に明細が必ず1件だけ対応する場合で、図の表記と一致しません。「多対多」は双方が複数対応する関係で、通常は中間の表を設けて表現します。「関係は存在しない」は外部キーで結ばれている図の内容と矛盾します。'},
{id:'Q036',c:'network',d:1,fig:FIG_DMZ,q:'図の構成で、インターネットと内部LANの境界に置かれ、通信を許可・遮断する機器はどれですか？',o:['ファイアウォール','リピータ','プリントサーバ','ロードバランサ'],a:0,e:'図でインターネットと領域Pの間に置かれ、通信の可否を制御しているのはファイアウォールです。「リピータ」は信号を増幅して伝送距離を延ばす機器で、通信内容の許可・遮断は行いません。「プリントサーバ」は印刷要求を管理する機器で境界防御とは無関係です。「ロードバランサ」は複数サーバへ負荷を振り分ける機器で、負荷分散が目的であり通信の遮断が役割ではありません。'},
{id:'Q037',c:'devtech',d:1,fig:FIG_FLOW,q:'図のフローチャートで、ひし形（◇）の記号が表しているものはどれですか？',o:['判断（条件分岐）','処理','データの入出力','端子（開始・終了）'],a:0,e:'フローチャートではひし形が判断（条件分岐）を表し、条件の真偽で進む経路が分かれます。「処理」を表すのは長方形です。「データの入出力」を表すのは平行四辺形です。「端子（開始・終了）」を表すのは図の上端にあるような角丸の長円で、記号ごとに意味が定められています。'},
{id:'Q038',c:'pm',d:1,fig:FIG_ARROW,q:'図のアローダイアグラムで、結合点4から結合点5へ向かう作業Eを開始できるのはどの時点ですか？',o:['作業Cと作業Dの両方が完了した時点','作業Cまたは作業Dの一方が完了した時点','作業Aと作業Bの両方が完了した時点','先行作業の完了を待たず任意の時点'],a:0,e:'アローダイアグラムでは、ある結合点から出る作業は、その結合点に入るすべての作業が完了しないと開始できません。結合点4には作業Cと作業Dが入っているため、両方の完了が必要です。「作業Cまたは作業Dの一方が完了した時点」は片方だけで開始できるという誤りで、先行作業の合流という考え方に反します。「作業Aと作業Bの両方が完了した時点」は結合点2と3に到達しただけで、まだ結合点4には至っていません。「先行作業の完了を待たず任意の時点」は作業の順序関係を表すというアローダイアグラムの前提そのものを否定しています。'},
{id:'Q039',c:'ui',d:1,q:'アクセシビリティの説明として最も適切なものはどれですか？',o:['年齢や障がいの有無にかかわらず、誰もが情報やサービスを利用できること','熟練した利用者が短時間で操作を完了できること','画面の配色やフォントが統一され、見た目に美しいこと','システムが単位時間あたりに処理できる仕事量が多いこと'],a:0,e:'アクセシビリティは利用できる人の範囲の広さを指し、音声読み上げ対応や文字サイズの変更などが具体策です。「熟練者が短時間で操作できる」のはユーザビリティ（使いやすさ）の側面で、対象の広さとは異なる観点です。「見た目に美しい」のはデザインの一貫性の話で、利用可能性そのものを保証しません。「単位時間あたりの処理量」はスループットというシステム性能の指標で、まったく別の概念です。'},
{id:'Q040',c:'software',d:1,q:'OSがもつタスク管理の役割として最も適切なものはどれですか？',o:['複数のプログラムにCPUの実行時間を割り当てて制御する','ファイルを補助記憶装置へ物理的に書き込む','ディスプレイに文字や図形を描画する','電源の投入時にハードウェアの自己診断を行う'],a:0,e:'タスク管理は、複数のプログラムにCPUの実行権を切り替えながら割り当て、並行して動いているように見せるOSの機能です。「ファイルを物理的に書き込む」のはファイル管理およびデバイスドライバの役割です。「文字や図形を描画する」のは表示制御の機能で、タスク管理とは別です。「電源投入時の自己診断」はBIOS／UEFIが行うPOSTの処理で、OSが起動する前の段階にあたります。'},
// ── 追加分（2026-08-18）：本番の科目A（60問）規模へ拡充 ──
// 分野比率を公式（テクノロジ41／マネジメント7／ストラテジ12）へ寄せるため、
// ストラテジ系を重点的に追加している。
{id:'Q041',c:'theory',d:2,fig:FIG_BINSEARCH2,q:'図のように整列済みの配列に対して二分探索を行います。要素数が 1,000 件のとき、目的の値が見つからない場合の比較回数は最大で何回ですか？',o:['9回','10回','500回','1,000回'],a:1,e:'二分探索は1回の比較で候補が半分になります。2⁹＝512、2¹⁰＝1,024なので、1,000件を1件まで絞り込むには最大10回必要です。「9回」は512件までしか絞り込めず不足します。「500回」は線形探索の平均比較回数の考え方です。「1,000回」は線形探索で最後まで調べた場合の回数で、いずれも範囲を半分にするという二分探索の性質を使っていません。'},
{id:'Q042',c:'theory',d:1,q:'2進数の 1011 と 1101 の論理和（OR）を求めるといくつになりますか？',o:['1001','1111','0110','1011'],a:1,e:'ORは各桁のどちらかが1なら1になります。桁ごとに 1と1→1、0と1→1、1と0→1、1と1→1 なので結果は 1111 です。「1001」は論理積（AND）の結果です。「0110」は排他的論理和（XOR）の結果です。「1011」は一方の値をそのまま答えたもので、演算の種類を取り違えると選んでしまいます。'},
{id:'Q043',c:'theory',d:3,q:'ある処理の実行時間がデータ件数 n に対して O(n²) で増えるとき、データ件数を 3 倍にすると実行時間はおよそ何倍になりますか？',o:['3倍','6倍','9倍','27倍'],a:2,e:'O(n²)は実行時間が件数の2乗に比例するため、件数が3倍になると 3²＝9倍になります。「3倍」はO(n)（線形）の場合の増え方です。「6倍」は2乗ではなく2倍して3を掛けたような誤りです。「27倍」は3乗（O(n³)）の場合の値で、指数を取り違えています。'},
{id:'Q044',c:'compute',d:2,q:'CPUの動作クロックが 2.0 GHz、ある命令の実行に平均 4 クロック必要なとき、この命令を 1 億回実行するのにかかる時間はおよそ何秒ですか？',o:['0.05秒','0.2秒','0.5秒','2秒'],a:1,e:'1命令あたり 4 ÷ 2.0×10⁹ ＝ 2×10⁻⁹ 秒です。1億回（10⁸）では 2×10⁻⁹ × 10⁸ ＝ 0.2秒となります。「0.05秒」はクロック数で割らずに計算した場合の値です。「0.5秒」はクロック周波数を取り違えた値です。「2秒」は10倍の桁を誤ったもので、単位の換算に注意が必要です。'},
{id:'Q045',c:'compute',d:2,q:'割込みのうち、内部割込み（プログラム割込み）に分類されるものはどれですか？',o:['ゼロによる除算が発生した','入出力装置の処理が完了した','電源異常が検知された','タイマが設定時間に達した'],a:0,e:'内部割込みは実行中のプログラム自身が原因で起きるもので、ゼロ除算やオーバフロー、不正な命令などが該当します。「入出力装置の処理が完了した」は外部割込み（入出力割込み）です。「電源異常が検知された」は機械チェック割込みで、これも外部要因です。「タイマが設定時間に達した」もタイマ割込みという外部割込みにあたります。'},
{id:'Q046',c:'system',d:3,fig:FIG_RELIABILITY2,q:'図のように、稼働率 0.9 の装置Aと装置Bを並列に接続し、その全体に稼働率 0.95 の装置Cを直列でつないだ場合、システム全体の稼働率はおよそいくつですか？',o:['0.855','0.941','0.950','0.990'],a:1,e:'まず並列部分は 1 −（1−0.9）×（1−0.9）＝ 0.99 です。これに直列で装置Cがつながるので 0.99 × 0.95 ＝ 0.9405 ≒ 0.941 となります。「0.855」は 0.9×0.95 として並列の効果を計算していません。「0.950」は装置Cの稼働率そのままで、並列部分を掛けていません。「0.990」は並列部分だけの値で、直列の装置Cを掛け忘れています。'},
{id:'Q047',c:'system',d:2,q:'スケールアウトの説明として正しいものはどれですか？',o:['サーバの台数を増やして処理を分担させる','1台のサーバのCPUやメモリを増強する','使用するディスクの容量だけを増やす','システムの利用者数の上限を引き下げる'],a:0,e:'スケールアウトは台数を増やして処理を分担する方式で、可用性の向上にもつながります。「1台のサーバのCPUやメモリを増強する」のはスケールアップで、方向が異なります。「使用するディスクの容量だけを増やす」のは記憶容量の拡張にすぎず、処理能力の分担にはなりません。「システムの利用者数の上限を引き下げる」のは需要を絞る対応で、能力の拡張ではありません。'},
{id:'Q048',c:'software',d:2,q:'ページ置換えアルゴリズムのLRU方式の説明として正しいものはどれですか？',o:['最後に使われてから最も時間が経過したページを追い出す','最も早く主記憶に読み込まれたページを追い出す','今後最も長く使われないページを追い出す','最も参照回数が多いページを追い出す'],a:0,e:'LRU（Least Recently Used）は、最後に参照されてから最も時間が経ったページを追い出す方式です。「最も早く主記憶に読み込まれたページを追い出す」のはFIFO方式です。「今後最も長く使われないページを追い出す」のはOPT（最適）方式で、未来が分からないため実装できない理論上の方式です。「最も参照回数が多いページを追い出す」は、よく使うものを捨てることになり効率が下がります。'},
{id:'Q049',c:'software',d:2,q:'プロセスとスレッドの違いとして正しいものはどれですか？',o:['スレッドはプロセス内でメモリ空間を共有する','プロセスはスレッド内に複数作られる','スレッドはプロセスより生成コストが大きい','プロセスどうしは常にメモリ空間を共有する'],a:0,e:'スレッドは同一プロセス内でメモリ空間を共有するため、切替えや生成のコストが小さくなります。「プロセスはスレッド内に複数作られる」は包含関係が逆です。「スレッドはプロセスより生成コストが大きい」も逆で、軽量である点がスレッドの利点です。「プロセスどうしは常にメモリ空間を共有する」も誤りで、プロセスは独立した空間を持つため、やり取りにはプロセス間通信が必要です。'},
{id:'Q050',c:'ui',d:2,q:'解像度 1,024×768 画素、1画素あたり 24 ビットで表現する画像の、圧縮しない場合のデータ量はおよそ何Mバイトですか？',o:['約 0.8 Mバイト','約 2.4 Mバイト','約 6.3 Mバイト','約 18.9 Mバイト'],a:1,e:'総ビット数は 1,024×768×24 ＝ 約18,874,368ビットです。8で割ると約2,359,296バイト ≒ 2.4Mバイトになります。「約0.8Mバイト」は1画素8ビット（256色）として計算した値です。「約6.3Mバイト」は3で割るなど換算を誤った値です。「約18.9Mバイト」はビットをバイトに換算（÷8）し忘れた場合の値です。'},
{id:'Q051',c:'db',d:2,fig:FIG_NORMAL,q:'図は正規化の段階を示しています。「段階X」で行う作業として正しいものはどれですか？',o:['繰返し項目を排除して表を分ける','主キーの一部にだけ依存する項目を分離する','主キー以外の項目間の依存を排除する','すべての列にインデックスを作成する'],a:1,e:'第1正規形と第3正規形の間にある段階Xは第2正規形で、主キーの一部にだけ依存する項目（部分関数従属）を別表へ分離します。「繰返し項目を排除して表を分ける」のは第1正規形の作業です。「主キー以外の項目間の依存を排除する」のは第3正規形の作業です。「すべての列にインデックスを作成する」は性能面の設計で、正規化の段階とは無関係です。'},
{id:'Q052',c:'db',d:3,q:'SQLで、集計した結果に対して絞り込みの条件を指定するために使う句はどれですか？',o:['WHERE句','HAVING句','ORDER BY句','GROUP BY句'],a:1,e:'HAVING句はGROUP BYで集計したあとの結果に対して条件を指定します。「WHERE句」は集計する前の個々の行を絞り込む句で、集計関数の結果は指定できません。「ORDER BY句」は結果の並べ替えを指定する句です。「GROUP BY句」は集計の単位を指定する句であり、絞り込みの条件そのものは書けません。'},
{id:'Q053',c:'network',d:3,q:'実効速度 8 Mビット/秒の回線で、24 Mバイトのファイルを転送するのにかかる時間はおよそ何秒ですか？',o:['3秒','8秒','24秒','192秒'],a:2,e:'24Mバイトはビットに直すと 24×8 ＝ 192Mビットです。これを8Mビット/秒で割ると 192 ÷ 8 ＝ 24秒となります。「3秒」はバイトとビットの換算を逆に行った場合の値です。「8秒」は回線速度の数値をそのまま答えたものです。「192秒」はビットに直したところで止まり、回線速度で割っていない値です。'},
{id:'Q054',c:'network',d:2,q:'OSI基本参照モデルにおいて、ルータが主に動作する層はどれですか？',o:['物理層','データリンク層','ネットワーク層','トランスポート層'],a:2,e:'ルータはIPアドレスを見て経路を決めるため、ネットワーク層で動作します。「物理層」で動作するのはリピータで、信号の増幅と中継を行います。「データリンク層」で動作するのはブリッジやスイッチングハブで、MACアドレスを見て転送します。「トランスポート層」はTCPやUDPが担う層で、機器としてはより上位のロードバランサなどが関わります。'},
{id:'Q055',c:'security',d:2,q:'ハッシュ関数の性質として正しいものはどれですか？',o:['出力から元のデータを容易に復元できる','入力が少し変われば出力が大きく変わる','入力の長さに比例して出力も長くなる','同じ入力からは毎回異なる出力が得られる'],a:1,e:'ハッシュ関数は入力がわずかに変わると出力が大きく変わるため、改ざんの検知に使えます。「出力から元のデータを容易に復元できる」は誤りで、一方向性があるため復元できません。「入力の長さに比例して出力も長くなる」も誤りで、出力は常に固定長です。「同じ入力からは毎回異なる出力が得られる」も誤りで、同じ入力からは必ず同じ出力が得られます。'},
{id:'Q056',c:'security',d:3,fig:FIG_HYBRID,q:'図は、共通鍵暗号と公開鍵暗号を組み合わせた方式を表しています。この方式を採用する主な理由はどれですか？',o:['本文を高速に暗号化しつつ、鍵を安全に渡せるから','公開鍵だけで本文を暗号化すると復号できないから','共通鍵暗号のほうが公開鍵暗号より安全性が高いから','鍵を用意する必要がまったくなくなるから'],a:0,e:'公開鍵暗号は安全に鍵を渡せる一方で処理が遅く、共通鍵暗号は高速な一方で鍵の受け渡しが課題です。そこで本文は共通鍵で高速に暗号化し、その共通鍵だけを公開鍵暗号で安全に渡します。「公開鍵だけで本文を暗号化すると復号できない」は誤りで、復号自体は可能ですが遅くなります。「共通鍵暗号のほうが安全性が高い」は理由が違い、選ばれているのは速度のためです。「鍵を用意する必要がなくなる」は誤りで、両方の鍵を使います。'},
{id:'Q057',c:'security',d:2,q:'IDSとIPSの違いとして正しいものはどれですか？',o:['IDSは検知して通知し、IPSは通信の遮断まで行う','IDSは通信を遮断し、IPSは検知して通知するだけである','どちらも通信の内容を暗号化する装置である','どちらも利用者の認証だけを行う装置である'],a:0,e:'IDSは不正な通信を検知して管理者へ通知するところまでを担い、IPSは検知に加えて通信の遮断まで行います。「IDSは通信を遮断し、IPSは検知して通知するだけ」は両者の役割が逆です。「どちらも通信の内容を暗号化する」のはTLSなど暗号化技術の役割で、検知や遮断とは別です。「どちらも利用者の認証だけを行う」のも誤りで、認証は別の仕組みが担います。'},
{id:'Q058',c:'devtech',d:2,q:'テスト技法のうち、限界値分析の説明として正しいものはどれですか？',o:['同じ結果になる入力をまとめ、代表値だけをテストする','境界となる値とその前後を重点的にテストする','内部の分岐をすべて通るようテストケースを作る','大量のアクセスを与えて性能を確認する'],a:1,e:'限界値分析は、条件の境界付近で不具合が起きやすいという経験に基づき、境界値とその前後を重点的にテストする技法です。「同じ結果になる入力をまとめ、代表値だけをテストする」のは同値分割で、限界値分析と組み合わせて使われます。「内部の分岐をすべて通るようテストケースを作る」のはホワイトボックステストの網羅基準です。「大量のアクセスを与えて性能を確認する」のは負荷テストです。'},
{id:'Q059',c:'devtech',d:2,q:'UMLのクラス図が表すものとして正しいものはどれですか？',o:['クラス間の静的な関係や属性・操作','オブジェクト間のメッセージの時間的順序','システムが取りうる状態とその遷移','利用者から見たシステムの機能の一覧'],a:0,e:'クラス図はクラスの属性や操作と、継承や集約といったクラス間の静的な関係を表します。「オブジェクト間のメッセージの時間的順序」を表すのはシーケンス図です。「システムが取りうる状態とその遷移」を表すのは状態遷移図です。「利用者から見たシステムの機能の一覧」を表すのはユースケース図で、いずれもUMLの別の図種です。'},
{id:'Q060',c:'pm',d:3,fig:FIG_ARROW2,q:'図のアローダイアグラムにおいて、作業Bの最遅開始日（全体の納期を遅らせずに開始できる最も遅い日）は第何日ですか？',o:['第0日','第2日','第4日','第6日'],a:1,e:'クリティカルパスは 1→2→4 の A(6)＋C(5)＝11日です。作業Bを含む経路は B(3)＋D(6)＝9日なので、余裕（フロート）は 11−9＝2日あります。したがって作業Bは第2日まで開始を遅らせても全体の納期に影響しません。「第0日」は余裕がまったくない場合の値で、これはクリティカルパス上の作業Aに当てはまります。「第4日」「第6日」は余裕を過大に見積もった値で、これ以上遅れると納期が延びます。'},
{id:'Q061',c:'pm',d:2,q:'EVM（アーンドバリューマネジメント）で管理する対象として適切な組合せはどれですか？',o:['進捗とコストを同じ金額の尺度で管理する','品質と要員の稼働率を管理する','障害の発生件数と復旧時間を管理する','取引先の与信と支払条件を管理する'],a:0,e:'EVMは計画値・出来高・実コストをすべて金額で表し、進捗の遅れとコストの超過を同じ尺度で把握する手法です。「品質と要員の稼働率を管理する」のは品質管理や要員計画の領域です。「障害の発生件数と復旧時間を管理する」のはサービスマネジメントの指標です。「取引先の与信と支払条件を管理する」のは購買・財務の管理で、いずれもEVMの対象ではありません。'},
{id:'Q062',c:'sm',d:2,fig:FIG_ITSM2,q:'図の時系列で、変更管理が主に行われるのはどの時点ですか？',o:['変更を本番環境へ加える前','障害が発生した直後','障害の復旧が完了した後','構成情報を棚卸しするとき'],a:0,e:'変更管理は、変更による影響を評価して承認するプロセスなので、変更を加える前に行います。「障害が発生した直後」に行うのはインシデント管理で、早期復旧が目的です。「障害の復旧が完了した後」に行うのは問題管理で、根本原因の究明と再発防止が目的です。「構成情報を棚卸しするとき」は構成管理の活動で、いずれも変更の承認とは目的が異なります。'},
{id:'Q063',c:'strategy',d:2,fig:FIG_PPM2,q:'図はPPMの4象限です。「領域ア」に分類される事業に対する一般的な方針として適切なものはどれですか？',o:['追加投資を抑えて資金を回収する','投資して育てるか撤退するかを判断する','市場から直ちに撤退する','設備を売却して現金化する'],a:1,e:'領域アは市場成長率が高く占有率が低い「問題児」です。資金を投入して「花形」に育てるか、見込みがなければ撤退するかの判断が必要になります。「追加投資を抑えて資金を回収する」のは成長率が低く占有率が高い「金のなる木」への方針です。「市場から直ちに撤退する」「設備を売却して現金化する」は成長市場である点を考慮しておらず、育成の可能性を検討していません。'},
{id:'Q064',c:'strategy',d:2,q:'バリューチェーン分析における「主活動」に分類されるものはどれですか？',o:['購買物流や製造、出荷物流','人事や労務の管理','技術の研究開発','調達活動の管理'],a:0,e:'バリューチェーンの主活動は、購買物流・製造・出荷物流・販売とマーケティング・サービスの5つで、価値を直接生み出す活動です。「人事や労務の管理」「技術の研究開発」「調達活動の管理」はいずれも支援活動に分類され、主活動を後方から支える役割を担います。'},
{id:'Q065',c:'strategy',d:3,q:'固定費が 480 万円、変動費率が 60% のとき、損益分岐点売上高はいくらですか？',o:['768万円','800万円','1,200万円','2,400万円'],a:2,e:'損益分岐点売上高 ＝ 固定費 ÷（1 − 変動費率）＝ 480 ÷（1 − 0.6）＝ 480 ÷ 0.4 ＝ 1,200万円です。「768万円」は固定費に変動費率を掛けて加えた誤りです。「800万円」は変動費率を0.4として計算した値です。「2,400万円」は固定費を0.2で割った値で、分母が（1 − 変動費率）である点を取り違えています。'},
{id:'Q066',c:'strategy',d:2,q:'ROI（投資利益率）の説明として正しいものはどれですか？',o:['投資額に対して得られた利益の割合','自己資本に対する当期純利益の割合','売上高に対する営業利益の割合','総資産に対する売上高の割合'],a:0,e:'ROIは投資額に対してどれだけ利益が得られたかを示す指標で、投資判断の比較に使います。「自己資本に対する当期純利益の割合」はROE（自己資本利益率）です。「売上高に対する営業利益の割合」は売上高営業利益率です。「総資産に対する売上高の割合」は総資産回転率で、いずれも分母が異なる別の指標です。'},
{id:'Q067',c:'strategy',d:1,q:'RFIとRFPの順序と目的の組合せとして正しいものはどれですか？',o:['先にRFIで情報を集め、次にRFPで提案を依頼する','先にRFPで提案を集め、次にRFIで情報を依頼する','RFIとRFPは同時に提示する','RFIは契約締結後に提示する'],a:0,e:'まずRFI（情報提供依頼書）で市場にどのような製品や技術があるかを把握し、それを踏まえてRFP（提案依頼書）で具体的な提案と見積りを依頼します。「先にRFPで提案を集め、次にRFIで情報を依頼する」は順序が逆で、要件を固める前に提案を求めることになります。「同時に提示する」では情報収集の意味がありません。「契約締結後に提示する」のも誤りで、RFIは調達の最初の段階に位置します。'},
{id:'Q068',c:'strategy',d:2,q:'BPRとBPMの違いとして正しいものはどれですか？',o:['BPRは抜本的な作り直し、BPMは継続的な改善','BPRは継続的な改善、BPMは抜本的な作り直し','どちらも同じ意味で使い分けは存在しない','BPRは開発手法、BPMは調達手法である'],a:0,e:'BPR（業務プロセス再構築）は業務を根本から設計し直す抜本的な改革、BPM（業務プロセス管理）は継続的に分析・改善し続ける管理手法です。「BPRは継続的な改善、BPMは抜本的な作り直し」は両者が逆です。「どちらも同じ意味」は、一度きりの改革と継続的な管理という性格の違いを無視しています。「BPRは開発手法、BPMは調達手法」も誤りで、どちらも業務プロセスに関する考え方です。'},
{id:'Q069',c:'strategy',d:2,q:'減価償却の説明として正しいものはどれですか？',o:['長期間使う資産の取得費用を各年度に分けて費用計上する','資産の市場価値の変動を毎年評価し直して計上する','取得した年度に取得費用の全額を費用計上する','売却時にはじめて取得費用を費用計上する'],a:0,e:'減価償却は、長期間にわたって使用する資産の取得費用を、使用する各年度に分けて費用として計上する会計処理です。「市場価値の変動を毎年評価し直す」のは時価評価の考え方で、減価償却とは別の処理です。「取得した年度に全額を費用計上する」のは一括費用処理で、長期使用資産には原則として認められません。「売却時にはじめて費用計上する」も期間対応の原則に反します。'},
{id:'Q070',c:'strategy',d:1,q:'ISO 27001 が対象とする分野はどれですか？',o:['情報セキュリティマネジメントシステム','品質マネジメントシステム','環境マネジメントシステム','労働安全衛生マネジメントシステム'],a:0,e:'ISO 27001は情報セキュリティマネジメントシステム（ISMS）の国際規格です。「品質マネジメントシステム」はISO 9001が対象とします。「環境マネジメントシステム」はISO 14001です。「労働安全衛生マネジメントシステム」はISO 45001で、番号と対象分野の対応が問われます。'},
{id:'Q071',c:'strategy',d:2,q:'ソフトウェアのライセンスに関する記述のうち、OSSの説明として正しいものはどれですか？',o:['ソースコードが公開され改変や再配布が認められる','ソースコードは非公開だが無償で利用できる','個人利用に限り無償で商用利用は禁止される','利用者が独自に作成したソフトウェアを指す'],a:0,e:'OSSはソースコードが公開され、利用・改変・再配布が認められているソフトウェアです。「ソースコードは非公開だが無償で利用できる」のはフリーウェアの説明で、公開されていない点が異なります。「個人利用に限り無償で商用利用は禁止される」のはシェアウェアや一部の独自ライセンスの条件で、商用利用を制限しないことがOSSの定義に含まれます。「利用者が独自に作成したソフトウェア」は自作ソフトのことで、公開の有無とは関係がありません。'},
{id:'Q072',c:'strategy',d:2,q:'請負契約における瑕疵担保責任（契約不適合責任）に関する説明として正しいものはどれですか？',o:['納品物が契約内容に適合しない場合、受注者が責任を負う','発注者が指揮命令を行った場合にのみ責任が生じる','納品後は一切の責任を負わないのが原則である','責任を負うのは常に発注者の側である'],a:0,e:'請負契約は仕事の完成を目的とするため、納品物が契約の内容に適合しない場合は受注者が修補や損害賠償などの責任を負います。「発注者が指揮命令を行った場合にのみ責任が生じる」は誤りで、そもそも請負では発注者に指揮命令権がありません。「納品後は一切の責任を負わない」も誤りで、一定期間は責任が続きます。「責任を負うのは常に発注者」も、完成義務を負う受注者側の責任である点と食い違います。'},
];

// ─── シナリオ問題（「〜したい場合」形式） ───────────────────
const SCENARIO_Q = [
{id:'S001',c:'network',d:2,q:'本社と支社の間で、インターネット回線を利用しながら通信内容を暗号化し、安全にデータをやり取りしたいと考えています。最も適した技術はどれですか？',o:['VPN','DNS','DHCP','NAT'],a:0,e:'VPNは公衆網の上に暗号化された仮想的な専用線を構築する技術で、拠点間の安全な通信という要件に合致します。「DNS」はドメイン名とIPアドレスの対応づけ、「DHCP」はネットワーク設定の自動配布、「NAT」はプライベートアドレスとグローバルアドレスの変換を行う技術で、いずれも暗号化の機能は持ちません。'},
{id:'S002',c:'db',d:2,q:'複数の担当者が同じ在庫データを同時に更新しても、数量に矛盾が生じないようにしたいと考えています。適切な仕組みはどれですか？',o:['正規化','排他制御（ロック）','インデックスの作成','ビューの定義'],a:1,e:'排他制御により、あるトランザクションが更新中のデータへの同時アクセスを制限し、整合性を保てます。「正規化」はテーブル設計で重複を排除する手法であり、同時実行の制御はできません。「インデックス」は検索性能を上げる仕組み、「ビュー」は表示上の仮想表であり、いずれも同時更新の矛盾を防ぐ機能ではありません。'},
{id:'S003',c:'security',d:2,q:'自社のWebサイトの問合せフォームに悪意あるスクリプトを埋め込まれ、閲覧した利用者のブラウザ上で実行される被害を防ぎたいと考えています。適切な対策はどれですか？',o:['出力時に特殊文字をエスケープ処理する','データベースのバックアップを毎日取得する','サーバの物理的な設置場所を施錠する','利用者にウイルス対策ソフトの導入を促す'],a:0,e:'これはクロスサイトスクリプティング（XSS）で、投稿内容をHTMLとして出力する際に特殊文字をエスケープすればスクリプトとして解釈されなくなります。「バックアップ」は被害後の復旧手段で予防にはなりません。「物理的な施錠」は不正侵入対策で、Web経由の攻撃には無関係です。「利用者側のウイルス対策」も、サイト側の脆弱性そのものを解消するものではありません。'},
{id:'S004',c:'system',d:2,q:'サーバが1台故障してもサービスを停止させずに運用を継続したいと考えています。適切な構成はどれですか？',o:['サーバの性能を高いものに入れ替える','複数台で冗長構成（クラスタ構成）を組む','バックアップの取得頻度を上げる','ログの保存期間を延長する'],a:1,e:'冗長構成を組めば、1台が故障しても他のサーバが処理を引き継ぎ、サービスを継続できます。「性能を高める」のは処理速度の向上であり、故障そのものへの備えにはなりません。「バックアップの頻度」はデータ損失時の復旧に関わるもので、稼働の継続とは別です。「ログの保存期間」は原因調査には役立ちますが可用性は上がりません。'},
{id:'S005',c:'pm',d:1,q:'プロジェクトの作業を漏れなく洗い出し、階層的に整理して管理したいと考えています。適切な手法はどれですか？',o:['WBS','SLA','SWOT分析','ROI分析'],a:0,e:'WBSは成果物や作業を階層的に分解し、抜け漏れなく管理するための手法です。「SLA」はサービス品質水準の合意文書、「SWOT分析」は経営環境の分析手法、「ROI分析」は投資対効果の評価手法であり、いずれも作業の洗い出しには使いません。'},
{id:'S006',c:'devtech',d:2,q:'要件が固まりきっておらず、開発中に変更が頻繁に発生することが見込まれます。短い期間で開発とリリースを繰り返しながら進めたい場合、適した開発手法はどれですか？',o:['ウォーターフォールモデル','アジャイル開発','要件をすべて確定してから着手する開発','外部設計完了後は変更を一切認めない開発'],a:1,e:'アジャイル開発は短いイテレーションを繰り返し、変更を前提に進める手法なのでこの状況に適します。「ウォーターフォールモデル」は工程を順に進め後戻りを想定しないため、頻繁な変更には不向きです。「要件をすべて確定してから着手」「変更を一切認めない」も同様に、変更が多い前提と矛盾します。'},
{id:'S007',c:'strategy',d:2,q:'社内の定型的なパソコン操作（請求書データの転記など）を自動化し、事務担当者の負担を減らしたいと考えています。最も適した仕組みはどれですか？',o:['RPA','BI','CRM','SFA'],a:0,e:'RPAはソフトウェアのロボットが定型的なPC操作を代行する仕組みで、転記作業の自動化に適します。「BI」は蓄積データを分析して意思決定を支援するツール、「CRM」は顧客との関係を管理する仕組み、「SFA」は営業活動を支援する仕組みで、いずれも事務作業の自動化を主目的とするものではありません。'},
{id:'S008',c:'sm',d:2,q:'システム障害が発生しました。まず利用者へのサービスを一刻も早く復旧させたい場合、優先して行うべき対応はどれですか？',o:['根本原因を完全に特定してから対処する','暫定的な回避策を適用してサービスを復旧させる','再発防止策の文書化を先に完了させる','構成管理データベースの更新を先に行う'],a:1,e:'インシデント管理の目的はサービスの早期復旧であり、暫定的な回避策でも構いません。「根本原因の特定」は問題管理の役割で、復旧より先に行うと停止時間が延びてしまいます。「再発防止策の文書化」「構成管理DBの更新」も重要ですが、いずれも復旧後に行うべき作業です。'},
// ── 追加分（2026-08-18） ──
{id:'S009',c:'theory',d:1,fig:FIG_STACK,q:'図のように、最後に入れたものから先に取り出す形で関数の呼び出し順を管理したいと考えています。適したデータ構造はどれですか？',o:['スタック','キュー','木構造','ハッシュ表'],a:0,e:'関数呼び出しは、最後に呼ばれたものから先に戻るため後入れ先出し（LIFO）のスタックで管理します。「キュー」は先入れ先出しなので、最初に呼ばれた関数から戻ることになり順序が合いません。「木構造」は階層関係を表す構造です。「ハッシュ表」はキーから値を高速に引く構造で、いずれも戻り順の管理には使いません。'},
{id:'S010',c:'theory',d:1,fig:FIG_BINSEARCH2,q:'図の二分探索より更に高速に、キーから計算で格納位置を直接求めて取り出す方式を使いたいと考えています。適した手法はどれですか？',o:['線形探索','二分探索','ハッシュ法','バブルソート'],a:2,e:'ハッシュ法はキーから計算で格納位置を求めるため、理想的にはデータ量によらず一定時間で取り出せます。「線形探索」は先頭から順に調べる方式で、データ量に比例して時間がかかります。「二分探索」は高速ですが整列済みであることが前提です。「バブルソート」は整列の手法であり、探索の方式ではありません。'},
{id:'S011',c:'compute',d:1,q:'CPUの負担を減らすため、入出力装置と主記憶の間でCPUを介さずに直接データを転送させたいと考えています。適した仕組みはどれですか？',o:['DMA','パイプライン','キャッシュ','仮想記憶'],a:0,e:'DMAは入出力装置と主記憶が直接データをやり取りする方式で、転送中もCPUは他の処理を進められます。「パイプライン」は命令の実行を段階に分けて並行処理する技術で、入出力とは別です。「キャッシュ」はCPUと主記憶の速度差を埋める記憶装置です。「仮想記憶」は主記憶より大きな空間を見せる技術で、いずれも転送そのものを肩代わりしません。'},
{id:'S012',c:'compute',d:1,q:'ノートパソコンを持ち歩くため、衝撃に強く起動も速い補助記憶装置を選びたいと考えています。適したものはどれですか？',o:['SSD','HDD','磁気テープ','光ディスク'],a:0,e:'SSDはフラッシュメモリを使い機械的な動作がないため、衝撃に強く読み書きも高速です。「HDD」は磁気ディスクを回転させる方式で、持ち運び時の衝撃に弱い面があります。「磁気テープ」は大容量・低単価ですが順次アクセスのため低速で、長期保管向けです。「光ディスク」は配布や保管に向きますが、日常的な読み書きには適しません。'},
{id:'S013',c:'system',d:1,fig:FIG_RELIABILITY2,q:'図のように装置を増やして処理を分担させ、利用者の増加に対応したいと考えています。この方式を何といいますか？',o:['スケールアップ','スケールアウト','デフラグ','アーカイブ'],a:1,e:'台数を増やして処理を分担する方式をスケールアウトといい、可用性の向上にもつながります。「スケールアップ」は1台の性能そのものを上げる方式で、方向が異なります。「デフラグ」はディスクの断片化を解消する処理です。「アーカイブ」はデータを長期保存のために退避することで、いずれも処理能力の分担ではありません。'},
{id:'S014',c:'system',d:2,fig:FIG_DUPLEX,q:'図のように現用系と待機系を用意したうえで、待機系も常に起動しておき、障害発生時に短時間で切り替えたいと考えています。適した構成はどれですか？',o:['ホットスタンバイ','コールドスタンバイ','スタンドアロン','シンクライアント'],a:0,e:'ホットスタンバイは待機系も起動状態にしておくため、障害時にごく短時間で切り替えられます。「コールドスタンバイ」は待機系を停止させておく方式で、切替えに時間がかかる代わりに費用は抑えられます。「スタンドアロン」は単独構成で冗長性がありません。「シンクライアント」は端末の機能を最小化する方式で、冗長構成とは別の話です。'},
{id:'S015',c:'software',d:1,q:'1台のサーバ上で、アプリケーションごとに環境を分けつつ、仮想マシンより軽量に動かしたいと考えています。適した技術はどれですか？',o:['コンテナ','RAID','スプーリング','デフラグ'],a:0,e:'コンテナはOSのカーネルを共有したままアプリ単位で環境を隔離する方式で、仮想マシンより軽量で起動も高速です。「RAID」は複数ディスクによる冗長化の技術です。「スプーリング」は出力を一時的に補助記憶へ書き出す仕組みです。「デフラグ」は断片化の解消処理で、いずれも実行環境の分離とは関係がありません。'},
{id:'S016',c:'software',d:2,q:'印刷処理の完了を待たずにCPUへ次の仕事をさせたいと考えています。適した仕組みはどれですか？',o:['スプーリング','ページング','デッドロック検出','ガーベジコレクション'],a:0,e:'スプーリングは出力データをいったん補助記憶へ書き出し、CPUが低速な装置の完了を待たずに次の処理へ進める仕組みです。「ページング」は仮想記憶の実現方式です。「デッドロック検出」は資源の待ち合いを見つける処理です。「ガーベジコレクション」は不要になったメモリ領域を回収する処理で、いずれも出力待ちの解消とは異なります。'},
{id:'S017',c:'ui',d:1,q:'複数の選択肢から1つだけを選ばせる画面部品を使いたいと考えています。適したものはどれですか？',o:['ラジオボタン','チェックボックス','テキストボックス','スクロールバー'],a:0,e:'ラジオボタンは複数の選択肢から1つだけを選ばせる部品です。「チェックボックス」は複数を同時に選べる部品なので、1つだけという条件に合いません。「テキストボックス」は自由入力用の部品です。「スクロールバー」は表示領域を移動させる部品で、いずれも排他的な選択には使いません。'},
{id:'S018',c:'ui',d:1,q:'ロゴ画像を、拡大しても劣化せず何度保存しても品質が落ちない形式で保存したいと考えています。適した形式はどれですか？',o:['PNG','JPEG','MP3','MPEG'],a:0,e:'PNGは可逆圧縮なので、保存を繰り返しても劣化せずロゴや図に向きます。「JPEG」は不可逆圧縮で、保存のたびに情報が失われて劣化します。「MP3」は音声用の不可逆圧縮形式です。「MPEG」は動画用の圧縮形式で、いずれも静止画のロゴ保存には適しません。'},
{id:'S019',c:'db',d:1,fig:FIG_KEYS,q:'図の社員表のうち、氏名などの一部の列だけを利用者に見せ、他は隠したいと考えています。データベースで使う仕組みはどれですか？',o:['ビュー','インデックス','トリガ','ロールバック'],a:0,e:'ビューは問合せの結果を仮想的な表として見せる仕組みで、必要な列だけを公開することでアクセス制御にも使えます。「インデックス」は検索を高速化する索引です。「トリガ」は特定の操作をきっかけに自動実行される処理です。「ロールバック」は更新を取り消す処理で、いずれも列の公開範囲を制御するものではありません。'},
{id:'S020',c:'db',d:2,fig:FIG_NORMAL,q:'図のような正規化で表を分けた結果、複数の表やデータベースにまたがる更新が生じました。すべて成功かすべて取消しかのどちらかにしたい場合、適した仕組みはどれですか？',o:['2相コミット','正規化','インデックスの追加','ビューの定義'],a:0,e:'2相コミットは、まず全体に確定可能かを問い合わせ、すべてが可能な場合にのみ確定を指示する手順で、分散環境の整合性を保ちます。「正規化」は重複を排除する設計手法です。「インデックスの追加」は検索の高速化です。「ビューの定義」は仮想表の作成で、いずれも分散更新の整合性を保証しません。'},
{id:'S021',c:'network',d:1,q:'社内のプライベートIPアドレスを持つ端末から、インターネット上のサイトへ接続できるようにしたいと考えています。必要な仕組みはどれですか？',o:['NAT','DNS','ARP','SMTP'],a:0,e:'NATはプライベートIPアドレスとグローバルIPアドレスを相互に変換する仕組みで、内部の端末が外部と通信できるようにします。「DNS」はドメイン名とIPアドレスを対応づける仕組みです。「ARP」はIPアドレスからMACアドレスを求める仕組みです。「SMTP」はメール送信のプロトコルで、いずれもアドレス変換は行いません。'},
{id:'S022',c:'network',d:1,q:'複数の端末から同じメールを見たいので、サーバ上でメールを管理する方式にしたいと考えています。適したプロトコルはどれですか？',o:['IMAP','POP3','SMTP','FTP'],a:0,e:'IMAPはサーバ上でメールを管理するため、複数の端末から同じ状態を参照できます。「POP3」は受信時に端末へダウンロードしてサーバから削除する方式が基本なので、複数端末での共有に向きません。「SMTP」は送信用のプロトコルです。「FTP」はファイル転送用で、いずれもメールの受信管理には使いません。'},
{id:'S023',c:'security',d:1,q:'Webアプリケーションへの攻撃を、HTTPの通信内容を検査して防ぎたいと考えています。適した仕組みはどれですか？',o:['WAF','ファイアウォール','UPS','ロードバランサ'],a:0,e:'WAFはHTTPの中身を検査し、SQLインジェクションやXSSなどWebアプリへの攻撃を防ぎます。「ファイアウォール」はIPアドレスやポート番号で通信を制御しますが、正規の通信に紛れた攻撃の中身までは見ません。「UPS」は停電対策の電源装置です。「ロードバランサ」は負荷分散の装置で、いずれも攻撃内容の検査は行いません。'},
{id:'S024',c:'security',d:2,fig:FIG_HYBRID,q:'ログイン中の利用者が、別サイトから意図しない操作を実行させられる被害を防ぎたいと考えています。適した対策はどれですか？',o:['要求ごとに使い捨てのトークンを埋め込む','パスワードの文字数を増やす','通信速度を制限する','ログの保存期間を延ばす'],a:0,e:'これはCSRFで、正規の画面から送られた要求かどうかを確かめるため、使い捨てのトークンを埋め込んで検証します。「パスワードの文字数を増やす」のは総当たり対策で、ログイン済みの状態を悪用するこの攻撃には効きません。「通信速度を制限する」も攻撃の成立を防げません。「ログの保存期間を延ばす」は事後の追跡に役立つだけで、予防にはなりません。'},
{id:'S025',c:'security',d:1,q:'修正プログラムがまだ提供されていない脆弱性を突く攻撃に備えたいと考えています。この種の攻撃を何といいますか？',o:['ゼロデイ攻撃','辞書攻撃','DoS攻撃','フィッシング'],a:0,e:'ゼロデイ攻撃は修正プログラムの提供前に脆弱性を突く攻撃で、対策が難しいため多層防御や振る舞い検知が有効です。「辞書攻撃」はよく使われる語句を試してパスワードを破る手口です。「DoS攻撃」は大量アクセスでサービスを止める攻撃です。「フィッシング」は偽サイトへ誘導して情報を盗む手口で、いずれも未修正の脆弱性を前提としません。'},
{id:'S026',c:'devtech',d:1,q:'変更を頻繁に統合し、そのたびに自動でビルドとテストを実行して問題を早期に見つけたいと考えています。適した取り組みはどれですか？',o:['継続的インテグレーション（CI）','ウォーターフォールモデル','リバースエンジニアリング','ベンチマークテスト'],a:0,e:'継続的インテグレーション（CI）は変更を頻繁に統合し、自動でビルドとテストを行って不具合を早期に発見する実践です。「ウォーターフォールモデル」は工程を順に進める開発手法で、統合は終盤に集中します。「リバースエンジニアリング」は完成物から仕様を解析することです。「ベンチマークテスト」は性能を比較評価する手法です。'},
{id:'S027',c:'devtech',d:1,q:'テストケースを作るにあたり、同じ結果になる入力をグループにまとめて代表値だけを試したいと考えています。適した技法はどれですか？',o:['同値分割','限界値分析','命令網羅','負荷テスト'],a:0,e:'同値分割は、同じ結果になる入力をグループ（同値クラス）にまとめ、代表値でテストする技法です。「限界値分析」は境界の値とその前後を重点的に試す技法で、同値分割と組み合わせて使われます。「命令網羅」は内部構造に着目したホワイトボックステストの基準です。「負荷テスト」は性能の確認で、いずれも入力の分類とは目的が異なります。'},
{id:'S028',c:'devtech',d:2,fig:FIG_VMODEL,q:'システムが取りうる状態と、その間の移り変わりを図で整理したいと考えています。適したUMLの図はどれですか？',o:['状態遷移図','クラス図','ユースケース図','シーケンス図'],a:0,e:'状態遷移図は、システムが取りうる状態と、イベントによる状態の移り変わりを表す図です。「クラス図」はクラス間の静的な関係を表します。「ユースケース図」は利用者から見た機能の一覧を表します。「シーケンス図」はオブジェクト間のメッセージの時間的な順序を表す図で、いずれも状態の遷移そのものは表しません。'},
{id:'S029',c:'pm',d:1,fig:FIG_ARROW2,q:'図のアローダイアグラムでは作業の前後関係は分かりますが、各作業の期間と進み具合を関係者と共有したいと考えています。適した図はどれですか？',o:['ガントチャート','アローダイアグラム','WBS','パレート図'],a:0,e:'ガントチャートは作業を横棒で表し、期間と進捗を時系列で示すため、進み具合の共有に適しています。「アローダイアグラム」は作業の前後関係と最長経路を求める図で、日々の進捗表示には向きません。「WBS」は作業を階層的に分解した図で日程情報を持ちません。「パレート図」は重点対策の要因を絞る品質管理の図です。'},
{id:'S030',c:'pm',d:2,q:'プロジェクトの進捗とコストの状況を、同じ金額の尺度でまとめて把握したいと考えています。適した手法はどれですか？',o:['EVM','WBS','SWOT分析','ABC分析'],a:0,e:'EVM（アーンドバリューマネジメント）は計画値・出来高・実コストをすべて金額で表し、進捗の遅れとコストの超過を同じ尺度で管理します。「WBS」は作業を洗い出して分解する手法です。「SWOT分析」は経営環境を整理する手法です。「ABC分析」は重点管理の対象を選ぶ手法で、いずれも進捗とコストの同時管理には使いません。'},
{id:'S031',c:'sm',d:1,q:'利用者からの問い合わせを一つの窓口で受け付け、必要に応じて担当部署へ引き継ぐ体制を作りたいと考えています。適した仕組みはどれですか？',o:['サービスデスク','データセンター','変更諮問委員会','セキュリティ監視センター'],a:0,e:'サービスデスクは利用者からの問い合わせを受け付ける単一の窓口で、一次対応と適切な部署への引き継ぎを行います。「データセンター」は機器を設置・運用する施設です。「変更諮問委員会」は変更の可否を審議する会議体です。「セキュリティ監視センター」は攻撃の監視・分析を行う組織で、いずれも一般利用者の窓口ではありません。'},
{id:'S032',c:'sm',d:2,fig:FIG_ITSM2,q:'図の時系列で「時点P」にあたる、本番環境へ変更を加える前に影響を評価して承認する管理はどれですか？',o:['変更管理','インシデント管理','問題管理','キャパシティ管理'],a:0,e:'変更管理は、変更による影響を評価し承認したうえで実施させるプロセスです。「インシデント管理」は発生した障害を早期に復旧させる活動で、変更の事前評価は行いません。「問題管理」は根本原因を究明して再発を防ぐ活動です。「キャパシティ管理」は将来の需要に対して能力を確保する活動で、いずれも変更の承認を担いません。'},
{id:'S033',c:'strategy',d:1,fig:FIG_PPM2,q:'図のPPMは事業単位の分類ですが、今度は自社の活動を購買・製造・出荷・販売・サービスに分解し、どこで価値が生まれているかを分析したいと考えています。適した手法はどれですか？',o:['バリューチェーン分析','SWOT分析','PPM','STP分析'],a:0,e:'バリューチェーン分析は企業の活動を主活動と支援活動に分解し、価値の源泉を明らかにする手法です。「SWOT分析」は内部・外部環境を整理する手法です。「PPM」は事業を市場成長率と占有率で分類する手法です。「STP分析」は市場を細分化して標的を定める手法で、いずれも活動の連鎖を分解するものではありません。'},
{id:'S034',c:'strategy',d:1,q:'業界で優れた成果を上げている他社の手法を調べ、自社との差を明らかにして改善につなげたいと考えています。適した手法はどれですか？',o:['ベンチマーキング','ブレーンストーミング','デルファイ法','回帰分析'],a:0,e:'ベンチマーキングは優れた事例と自社を比較し、その差を明らかにして改善につなげる手法です。「ブレーンストーミング」は批判を控えて自由にアイデアを出す発想法です。「デルファイ法」は専門家の意見を繰り返し集約して予測する手法です。「回帰分析」は数値の関係を式で表す統計手法で、いずれも他社との比較を主目的としません。'},
{id:'S035',c:'strategy',d:2,q:'長期間使用する設備の取得費用を、使用する各年度に配分して費用計上したいと考えています。必要な会計処理はどれですか？',o:['減価償却','引当金の計上','棚卸資産の評価','売上の計上'],a:0,e:'減価償却は、長期間使用する資産の取得費用を各年度に分けて費用として計上する処理です。「引当金の計上」は将来の支出に備えて費用を見積計上する処理です。「棚卸資産の評価」は在庫の価額を算定する処理です。「売上の計上」は収益の認識で、いずれも取得費用の期間配分とは異なります。'},
/* ── 2026-08-25 追加分（S036〜S047）──────────────────────────
   科目Aのマネジメント系（pm / sm）の在庫が14問しかなく、模試で必要な7問に対して
   余裕が乏しかったため増補した（→26問）。
   ルール5の分野バランスは QQ だけで判定されるため、QQ の比率を崩さないよう
   シナリオ問題側で増やしている。 */

{id:'S036',c:'pm',d:1,
 q:'プロジェクトの進行中に、利用者部門から仕様の追加要望が次々と持ち込まれるようになりました。納期と工数への影響を管理しながら対応したい場合、まず整えるべき仕組みはどれですか？',
 o:['変更要求を受け付け、影響を評価してから承認・却下を決める手続を定める','要望はすべて受け入れ、開発チームの残業で吸収する','要望はすべて断り、当初の仕様どおりに完成させる','要望の内容を一覧にまとめ、リリース後に検討する'],a:0,
 e:'変更を止めるのではなく、影響（工数・納期・コスト）を評価したうえで承認するか決める手続を定めるのがスコープ変更管理です。「要望はすべて受け入れ、開発チームの残業で吸収する」は影響が見えないままスコープが膨らみ、品質と納期の両方が崩れます。「要望はすべて断り、当初の仕様どおりに完成させる」は必要な変更まで拒むことになり、使われないシステムができます。「要望の内容を一覧にまとめ、リリース後に検討する」は記録は残りますが、いま必要な判断を先送りするだけで、進行中の影響を管理できません。'},

{id:'S037',c:'pm',d:2,fig:FIG_ARROW2,
 q:'図のアローダイアグラムで表される作業のうち、全体の所要日数を短縮したいと考えています。要員を追加して短縮する対象として最も効果があるのはどの作業ですか？',
 o:['クリティカルパス上にある作業','余裕日数（フロート）が最も大きい作業','作業日数が最も短い作業','最後に実施する作業'],a:0,
 e:'全体の所要日数はクリティカルパス（余裕のない経路）の長さで決まるため、短縮の効果があるのはその経路上の作業だけです。「余裕日数（フロート）が最も大きい作業」を短縮しても余裕が増えるだけで、全体の日数は変わりません。「作業日数が最も短い作業」は短縮できる幅がそもそも小さく、しかもクリティカルパス上とは限りません。「最後に実施する作業」も、クリティカルパス上になければ全体の日数には影響しません。'},

{id:'S038',c:'pm',d:2,
 q:'企画段階で、過去に実施した類似システムの実績をもとに、短時間で概算の工数を出したいと考えています。適した見積り手法はどれですか？',
 o:['類推見積り','ボトムアップ見積り','ファンクションポイント法','実績値による確定見積り'],a:0,
 e:'類推見積りは過去の類似案件の実績から全体を推定する手法で、詳細が固まっていない企画段階でも短時間で概算を出せます。「ボトムアップ見積り」は作業を細かく分解してから積み上げるため、WBSが固まっていない段階では使えず時間もかかります。「ファンクションポイント法」は機能の数と複雑さから規模を測る手法で、機能要件がある程度定まっている必要があります。「実績値による確定見積り」は作業が終わってから分かる値であり、企画段階では存在しません。'},

{id:'S039',c:'pm',d:1,
 q:'プロジェクトで発生しうる損害に備えて保険をかけることにしました。これはリスク対応のどれにあたりますか？',
 o:['リスクの転嫁','リスクの回避','リスクの軽減','リスクの受容'],a:0,
 e:'保険や外部委託によって、リスクが現実になったときの損失を第三者に引き受けてもらうことをリスクの転嫁といいます。「リスクの回避」はリスクのある作業や方式そのものをやめることで、保険をかけてもリスク自体は残るため該当しません。「リスクの軽減」は発生確率や影響の大きさを下げる対策で、保険は影響の負担先を変えるだけで大きさは変えません。「リスクの受容」は対策を取らずに受け入れることで、保険という対策を打っている時点で当てはまりません。'},

{id:'S040',c:'pm',d:3,
 q:'進捗が遅れているプロジェクトに、納期を守るため大量の要員を急遽追加することを検討しています。この判断について、プロジェクトマネジメントの観点から適切な説明はどれですか？',
 o:['教育や引継ぎの負荷が増え、かえって遅れが拡大することがある','要員数に比例して所要期間が短縮されるので確実に効果がある','要員を追加すれば、作業の依存関係にかかわらず並行して進められる','要員追加はコストだけの問題であり、品質には影響しない'],a:0,
 e:'既存メンバーが新規要員への説明や引継ぎに時間を取られるため、遅れているプロジェクトへの要員追加は逆効果になることがあります。「要員数に比例して所要期間が短縮されるので確実に効果がある」は、分割できない作業や依存関係を無視した前提です。「要員を追加すれば、作業の依存関係にかかわらず並行して進められる」は誤りで、前工程の完了を待つ作業は人を増やしても始められません。「要員追加はコストだけの問題であり、品質には影響しない」も誤りで、不慣れな要員の投入は欠陥の増加につながります。'},

{id:'S041',c:'pm',d:2,
 q:'設計書の誤りを早い段階で見つけるため、作成者が参加者に内容を説明しながら疑問点を出してもらう形式のレビューを行いたいと考えています。適した方式はどれですか？',
 o:['ウォークスルー','インスペクション','ラウンドロビンレビュー','机上デバッグ'],a:0,
 e:'ウォークスルーは作成者が主体となって説明し、参加者が疑問点を指摘していく非公式なレビュー方式で、早い段階で気軽に実施できます。「インスペクション」は第三者のモデレータが進行役となり、役割と手順を定めて行う公式なレビューで、作成者が説明役を務める形式ではありません。「ラウンドロビンレビュー」は参加者が順番に司会や指摘の役割を回す方式で、作成者が説明する形式ではありません。「机上デバッグ」はプログラムを実行せずに机上で追跡する作業であり、設計書のレビュー方式ではありません。'},

{id:'S042',c:'pm',d:3,fig:FIG_EVM,
 q:'図はプロジェクトの出来高管理（EVM）の状況を表しています。ある時点で PV が 480 万円、EV が 400 万円、AC が 450 万円でした。この時点の状況として正しい説明はどれですか？',
 o:['進捗は計画より遅れており、コストも予算を超過している','進捗は計画より進んでおり、コストも予算内に収まっている','進捗は計画どおりだが、コストだけが超過している','進捗は遅れているが、コストは予算内に収まっている'],a:0,
 e:'スケジュール差異 SV ＝ EV － PV ＝ 400 － 480 ＝ －80万円で計画より遅れ、コスト差異 CV ＝ EV － AC ＝ 400 － 450 ＝ －50万円で予算を超過しています。どちらも負なので遅れと超過が同時に起きている状態です。「進捗は計画より進んでおり、コストも予算内に収まっている」は SV・CV がともに正の場合の説明です。「進捗は計画どおりだが、コストだけが超過している」は SV ＝ 0 の場合であり、ここでは EV が PV を下回っています。「進捗は遅れているが、コストは予算内に収まっている」は CV が正の場合の説明で、AC が EV を上回っている本問には当てはまりません。'},

{id:'S043',c:'sm',d:1,
 q:'ITサービスの提供者と利用者の間で、提供するサービスの品質を数値で合意しておきたいと考えています。取り交わす文書として適切なものはどれですか？',
 o:['SLA（サービスレベル合意書）','RFP（提案依頼書）','SLM（サービスレベル管理）の実施報告書','BCP（事業継続計画）'],a:0,
 e:'SLAは稼働率や障害復旧までの時間などのサービス品質を、提供者と利用者が数値で合意する文書です。「RFP（提案依頼書）」は調達の段階でベンダに提案を求める文書で、運用中の品質を約束するものではありません。「SLM（サービスレベル管理）の実施報告書」はSLAで決めた水準を維持できているかを継続的に測って報告するもので、合意そのものではありません。「BCP（事業継続計画）」は災害時などに事業を継続・復旧させるための計画で、平常時のサービス品質を定める文書ではありません。'},

{id:'S044',c:'sm',d:2,fig:FIG_ITSM2,
 q:'図の時系列で、障害から復旧した後に「同じ障害を二度と起こさないよう根本原因を特定して除去する」活動にあたるのはどれですか？',
 o:['問題管理','インシデント管理','変更管理','構成管理'],a:0,
 e:'問題管理は、インシデントの根本原因を突き止めて恒久的に取り除き、再発を防ぐ活動です。「インシデント管理」は図の復旧の段階にあたり、原因追及より先にサービスを早く回復させることを目的とします。「変更管理」は本番環境へ変更を加える際に影響を評価して承認する活動で、原因の特定そのものではありません。「構成管理」はサービスを構成する機器やソフトウェアの情報を正確に把握・維持する活動です。'},

{id:'S045',c:'sm',d:2,
 q:'利用者数の増加に伴い、半年後にはサーバの処理能力が不足すると予測されました。ITサービスマネジメントとして、この予測に基づいて資源を計画的に手当てする活動はどれですか？',
 o:['キャパシティ管理','可用性管理','インシデント管理','サービス継続性管理'],a:0,
 e:'キャパシティ管理は、将来の需要を予測して必要な処理能力や記憶容量を、過不足なく計画的に確保する活動です。「可用性管理」はサービスが必要なときに使える状態を維持する活動で、稼働率や冗長化が主な関心事です。「インシデント管理」はすでに起きた障害からの復旧を扱うもので、事前の資源計画ではありません。「サービス継続性管理」は災害などでサービスが停止した場合に備える活動であり、通常時の需要増への対応とは目的が異なります。'},

{id:'S046',c:'sm',d:3,
 q:'あるシステムは、平均故障間隔（MTBF）が 475 時間、平均修復時間（MTTR）が 25 時間でした。このシステムの稼働率はいくつになりますか？',
 o:['0.95','0.05','0.99','0.475'],a:0,
 e:'稼働率は MTBF ÷（MTBF ＋ MTTR）で求めるので、475 ÷（475 ＋ 25）＝ 475 ÷ 500 ＝ 0.95 です。「0.05」は MTTR ÷（MTBF ＋ MTTR）で求まる故障率にあたる値で、分子を取り違えています。「0.99」は稼働率としてよく見かける値ですが、この数値からは求まりません。「0.475」は MTBF を単純に 1000 で割ったような値で、計算式の分母を誤ったものです。'},

{id:'S047',c:'sm',d:1,
 q:'システム監査において、処理が正しく行われたことを後から追跡できるようにしておきたいと考えています。そのために確保すべきものはどれですか？',
 o:['監査証跡','監査計画書','監査報告書','内部統制報告書'],a:0,
 e:'監査証跡は、いつ誰がどの処理を行ったかを時系列でたどれる記録（ログや伝票など）で、事後の追跡を可能にします。「監査計画書」は監査の目的や範囲、日程をあらかじめ定める文書で、処理の追跡には使えません。「監査報告書」は監査の結果を経営者に伝える文書で、追跡の材料そのものではありません。「内部統制報告書」は内部統制の有効性を評価して開示する文書であり、個々の処理をたどる記録ではありません。'},
];

// ─── 科目B：擬似言語プログラム問題 ─────────────────────────
// IPA公式の記述形式に準拠（certs/fe/擬似言語仕様_IPA公式.md）
// {id, c, q, note, code, o, a, e, d, noShuffle}
const PSEUDO_Q = [
{id:'P001',c:'algo',d:1,
 q:'次のプログラムを実行すると、変数 a と変数 b の値をこの順にコンマ区切りで出力する。出力される内容はどれか。',
 code:'整数型: a ← 3\n整数型: b ← 7\n整数型: t\n\nt ← a\na ← b\nb ← t\n\naの値 と bの値 をこの順にコンマ区切りで出力する',
 o:['3,7','7,3','3,3','7,7'],a:1,noShuffle:true,
 e:'これは変数の値を入れ替える典型的な処理です。t に a の値 3 を退避し、a に b の値 7 を代入、最後に b に退避した 3 を戻すため、出力は「7,3」になります。「3,7」は入替えが行われなかった場合の値です。「3,3」は t を経由せず a ← b より先に b ← a としたときのように、一方の値が失われた場合の結果です。「7,7」も退避用の変数 t を使わずに代入した場合に起こる誤りです。'},

{id:'P002',c:'algo',d:2,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。関数 sumOdd は、1 から引数 n までの奇数の合計を返す。',
 code:'○整数型: sumOdd(整数型: n)\n  整数型: i\n  整数型: total ← 0\n\n  for (i を 1 から n まで 1 ずつ増やす)\n    if ([[a]])\n      total ← total ＋ i\n    endif\n  endfor\n\n  return total',
 o:['i mod 2 ＝ 1','i mod 2 ＝ 0','i ÷ 2 ＝ 1','n mod i ＝ 1'],a:0,
 e:'奇数は2で割った剰余が1になる数です。擬似言語では剰余算に mod を用いるため「i mod 2 ＝ 1」が正解です。「i mod 2 ＝ 0」は剰余が0、すなわち偶数を判定する条件になります。「i ÷ 2 ＝ 1」は i が2または3のときだけ成り立つ式で、奇数の判定にはなりません。「n mod i ＝ 1」は n を i で割った剰余を見ており、i 自体が奇数かどうかとは無関係です。'},

{id:'P003',c:'algo',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 countMatch は、配列 data の中に値 target と一致する要素がいくつあるかを返す。countMatch({4, 7, 4, 2, 4}, 4) として呼び出したとき、戻り値は [ a ] となる。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: countMatch(整数型の配列: data, 整数型: target)\n  整数型: i\n  整数型: cnt ← 0\n\n  for (i を 1 から dataの要素数 まで 1 ずつ増やす)\n    if (data[i] ＝ target)\n      cnt ← cnt ＋ 1\n    endif\n  endfor\n\n  return cnt',
 o:['1','2','3','5'],a:2,
 e:'配列 {4, 7, 4, 2, 4} のうち target と同じ 4 は要素番号1、3、5の3個あるため、戻り値は3です。「1」は最初に見つかった時点で処理を終える実装と取り違えたものです。「2」は数え漏らしによる誤りです。「5」は配列の要素数そのもので、一致判定を行わずに全要素を数えた場合の値です。'},

{id:'P004',c:'algo',d:3,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 makeArray は整数型の配列を受け取り、新しい配列を返す。makeArray({2, 5, 1, 4}) として呼び出したとき、戻り値の配列の要素番号 3 の値は [ a ] となる。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型の配列: makeArray(整数型の配列: in)\n  整数型の配列: out ← {}  // 要素数0の配列\n  整数型: i\n\n  outの末尾 に in[1]の値 を追加する\n\n  for (i を 2 から inの要素数 まで 1 ずつ増やす)\n    outの末尾 に (out[outの要素数] ＋ in[i]) の結果 を追加する\n  endfor\n\n  return out',
 o:['1','7','8','12'],a:2,
 e:'この関数は累積和を作ります。out は {2}、次に 2＋5＝7 を追加して {2, 7}、次に 7＋1＝8 を追加して {2, 7, 8}、最後に 8＋4＝12 を追加して {2, 7, 8, 12} となります。要素番号3の値は8です。「1」は入力配列 in の要素番号3の値をそのまま答えたものです。「7」は要素番号2の値です。「12」は最後の要素（要素番号4）の値で、要素番号の数え始めを取り違えると選んでしまいます。'},

{id:'P005',c:'algo',d:3,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。関数 gcd は、引数で与えられた二つの正の整数の最大公約数をユークリッドの互除法で求めて返す。',
 code:'○整数型: gcd(整数型: x, 整数型: y)\n  整数型: r\n\n  while (y ≠ 0)\n    r ← x mod y\n    x ← y\n    [[a]]\n  endwhile\n\n  return x',
 o:['y ← r','y ← x','r ← y','x ← r'],a:0,
 e:'ユークリッドの互除法では、剰余 r を求めたあと「x に元の y を、y に r を」入れて繰り返します。x ← y は既に書かれているため、空欄には y ← r が入ります。「y ← x」では直前に x ← y としているため x と y が同じ値になり、ループが正しく進みません。「r ← y」は剰余を上書きしてしまい、次の計算に使う値が失われます。「x ← r」は x を二重に書き換えることになり、y が更新されないため無限ループになります。'},

{id:'P006',c:'algo',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 reverse は、配列の要素を逆順に並べた新しい配列を返す。reverse({1, 2, 3, 4, 5}) として呼び出したとき、戻り値の配列の要素番号 2 の値は [ a ] となる。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型の配列: reverse(整数型の配列: in)\n  整数型の配列: out ← {}  // 要素数0の配列\n  整数型: i\n\n  for (i を inの要素数 から 1 まで 1 ずつ減らす)\n    outの末尾 に in[i]の値 を追加する\n  endfor\n\n  return out',
 o:['1','2','4','5'],a:2,
 e:'入力 {1, 2, 3, 4, 5} を逆順にすると {5, 4, 3, 2, 1} になります。その要素番号2の値は4です。「5」は要素番号1の値です。「2」は入力配列の要素番号2の値をそのまま答えたものです。「1」は逆順配列の最後の要素（要素番号5）の値で、for の制御記述が「1 ずつ減らす」である点を読み落とすと混乱しやすい箇所です。'},

{id:'P007',c:'security',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 checkPassword は、引数の文字列が「8文字以上であり、かつ英字と数字の両方を含む」ときに true を返す。',
 code:'○論理型: checkPassword(文字列型: pw)\n  論理型: hasAlpha ← false\n  論理型: hasDigit ← false\n\n  /* pw の各文字を調べ、英字があれば hasAlpha を、\n     数字があれば hasDigit を true にする処理 */\n\n  if ([[a]])\n    return true\n  else\n    return false\n  endif',
 o:['pwの文字数 ≧ 8 and hasAlpha and hasDigit','pwの文字数 ≧ 8 or hasAlpha or hasDigit','pwの文字数 ＞ 8 and hasAlpha and hasDigit','pwの文字数 ≧ 8 and (hasAlpha or hasDigit)'],a:0,
 e:'「8文字以上」かつ「英字を含む」かつ「数字を含む」の3条件をすべて満たす必要があるため、and で連結します。「or で連結」ではいずれか1つを満たすだけで true になり要件を満たしません。「＞ 8」は9文字以上となり、ちょうど8文字が弾かれてしまいます。「(hasAlpha or hasDigit)」は英字か数字のどちらか一方があればよいことになり、両方を含むという条件になりません。'},

{id:'P008',c:'security',d:3,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。手続 recordLogin は、ログイン失敗が連続 3 回に達したアカウントをロックする。ログインに成功した場合は失敗回数を 0 に戻す。',
 code:'○recordLogin(論理型: success)\n  if (success ＝ true)\n    failCount ← 0\n  else\n    failCount ← failCount ＋ 1\n    if ([[a]])\n      アカウントをロックする\n    endif\n  endif',
 o:['failCount ≧ 3','failCount ＞ 3','failCount ≦ 3','failCount ＝ 0'],a:0,
 e:'失敗回数を加算した直後に判定するため、3回目の失敗で failCount が3となった時点でロックする「failCount ≧ 3」が正解です。「＞ 3」では4回目の失敗までロックされず、要件より1回多く試行を許してしまいます。「≦ 3」は1回目の失敗で既に成立してしまい、即座にロックされます。「＝ 0」は成功時の状態を表す条件で、失敗時には成立しません。'},
// ── 追加分（2026-08-18）：本番の科目B（20問）規模へ拡充 ──
// 内訳は公式どおり アルゴリズムとプログラミング16問／情報セキュリティ4問。
{id:'P009',c:'algo',d:2,
 q:'次のプログラムを実行すると、変数 s の値を出力する。出力される値はどれか。',
 code:'整数型: i\n整数型: s ← 0\n\nfor (i を 1 から 5 まで 1 ずつ増やす)\n  if (i mod 2 ＝ 0)\n    s ← s ＋ i\n  else\n    s ← s － i\n  endif\nendfor\n\nsの値 を出力する',
 o:['−3','−1','3','15'],a:0,noShuffle:true,
 e:'iが偶数のとき加算、奇数のとき減算します。i＝1で −1、i＝2で ＋2（計1）、i＝3で −3（計−2）、i＝4で ＋4（計2）、i＝5で −5（計−3）となり、出力は −3 です。「−1」は途中の i＝1 の時点の値です。「3」は偶数と奇数の扱いを逆にした場合（2＋4−1−3−5 ではなく符号を取り違えた場合）の値です。「15」は1から5までを単純に合計した値で、条件分岐を無視しています。'},

{id:'P010',c:'algo',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 maxOf は、配列 data の中の最大値を返す。maxOf({3, 9, 2, 7}) として呼び出したとき、戻り値は [ a ] となる。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: maxOf(整数型の配列: data)\n  整数型: i\n  整数型: m ← data[1]\n\n  for (i を 2 から dataの要素数 まで 1 ずつ増やす)\n    if (data[i] ＞ m)\n      m ← data[i]\n    endif\n  endfor\n\n  return m',
 o:['2','3','7','9'],a:3,
 e:'mの初期値は data[1]＝3 です。i＝2で 9＞3 なので m は 9 に、i＝3で 2＞9 は偽、i＝4で 7＞9 も偽なので、戻り値は 9 です。「3」は初期値のままで、更新が一度も起きなかった場合の値です。「2」は配列内の最小値で、比較の向きを ＜ と取り違えた場合の結果です。「7」は最後の要素の値で、単に末尾を返した場合の誤りです。'},

{id:'P011',c:'algo',d:3,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。関数 factorial は、引数で与えられた正の整数 n の階乗を再帰的に求めて返す。',
 code:'○整数型: factorial(整数型: n)\n  if (n ≦ 1)\n    return 1\n  else\n    return [[a]]\n  endif',
 o:['n × factorial(n － 1)','n × factorial(n)','factorial(n － 1)','n ＋ factorial(n － 1)'],a:0,
 e:'階乗は n! ＝ n ×（n−1）! と定義されるため、n に factorial(n－1) を掛けた値を返します。「n × factorial(n)」は引数が減らないため終了条件に到達せず、無限に再帰します。「factorial(n － 1)」は n を掛けていないので、常に1が返るだけになります。「n ＋ factorial(n － 1)」は掛け算ではなく足し算になっており、これでは1からnまでの合計が求まってしまいます。'},

{id:'P012',c:'algo',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 countVowel は、文字列型の配列 s に含まれる "a" の個数を返す。countMatch({"a", "b", "a", "c"}) のように呼び出したとき、戻り値は [ a ] となる。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: countVowel(文字列型の配列: s)\n  整数型: i\n  整数型: cnt ← 0\n\n  for (i を 1 から sの要素数 まで 1 ずつ増やす)\n    if (s[i] ＝ "a")\n      cnt ← cnt ＋ 1\n    endif\n  endfor\n\n  return cnt',
 o:['1','2','3','4'],a:1,
 e:'配列 {"a", "b", "a", "c"} のうち "a" は要素番号1と3の2個なので、戻り値は2です。「1」は最初に見つかった時点で処理を終える実装と取り違えたものです。「3」は数え間違いで、"c" を誤って含めた場合の値です。「4」は配列の要素数そのもので、一致判定を行わずに全要素を数えた場合の値です。'},

{id:'P013',c:'algo',d:3,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。関数 bubbleSort は、整数型の配列 data を昇順に整列して返す。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型の配列: bubbleSort(整数型の配列: data)\n  整数型: i, j, tmp\n  整数型: n ← dataの要素数\n\n  for (i を 1 から n － 1 まで 1 ずつ増やす)\n    for (j を 1 から n － i まで 1 ずつ増やす)\n      if ([[a]])\n        tmp ← data[j]\n        data[j] ← data[j ＋ 1]\n        data[j ＋ 1] ← tmp\n      endif\n    endfor\n  endfor\n\n  return data',
 o:['data[j] ＞ data[j ＋ 1]','data[j] ＜ data[j ＋ 1]','data[j] ＝ data[j ＋ 1]','data[i] ＞ data[j]'],a:0,
 e:'昇順に整列するには、隣り合う要素を比べて前が後ろより大きいときに交換します。「data[j] ＜ data[j ＋ 1]」では前が小さいときに交換するため降順になります。「data[j] ＝ data[j ＋ 1]」は等しいときだけ交換することになり、並びは変わりません。「data[i] ＞ data[j]」は比較する添字が隣り合っておらず、交換処理と対象がずれてしまいます。'},

{id:'P014',c:'algo',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 sumArray は配列の合計を返す。sumArray({5, 10, 15}) として呼び出したとき、戻り値は [ a ] となる。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: sumArray(整数型の配列: data)\n  整数型: i\n  整数型: total ← 0\n\n  for (i を 1 から dataの要素数 まで 1 ずつ増やす)\n    total ← total ＋ data[i]\n  endfor\n\n  return total',
 o:['15','20','30','45'],a:2,
 e:'5 ＋ 10 ＋ 15 ＝ 30 が合計です。「15」は最後の要素の値で、加算せずに上書きしてしまった場合の結果です。「20」は要素の一部だけを足した値です。「45」は各要素を1.5倍したような値で、いずれも単純な総和とは一致しません。'},

{id:'P015',c:'algo',d:3,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。関数 binarySearch は、昇順に整列された配列 data から target を探し、見つかればその要素番号を、見つからなければ －1 を返す。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: binarySearch(整数型の配列: data, 整数型: target)\n  整数型: low ← 1\n  整数型: high ← dataの要素数\n  整数型: mid\n\n  while (low ≦ high)\n    mid ← (low ＋ high) ÷ 2 の商\n    if (data[mid] ＝ target)\n      return mid\n    elseif (data[mid] ＜ target)\n      [[a]]\n    else\n      high ← mid － 1\n    endif\n  endwhile\n\n  return －1',
 o:['low ← mid ＋ 1','low ← mid － 1','high ← mid ＋ 1','low ← high'],a:0,
 e:'中央の値が target より小さいときは、target は中央より右側にあります。したがって探索範囲の下限を mid の次へ移す「low ← mid ＋ 1」が正しくなります。「low ← mid － 1」は範囲が狭まらず無限ループの原因になります。「high ← mid ＋ 1」は上限を動かしており、左側を探すことになるため探索範囲が誤ります。「low ← high」は範囲を一気に潰してしまい、正しい位置を飛ばす可能性があります。'},

{id:'P016',c:'algo',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 reverseSum は、配列を逆順にたどりながら要素を連結した文字列を返す。reverseSum({1, 2, 3}) として呼び出したとき、戻り値は [ a ] となる。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○文字列型: reverseSum(整数型の配列: data)\n  整数型: i\n  文字列型: r ← ""\n\n  for (i を dataの要素数 から 1 まで 1 ずつ減らす)\n    r ← r ＋ data[i]の文字列表現\n  endfor\n\n  return r',
 o:['"123"','"321"','"6"','"111"'],a:1,
 e:'for の制御記述が「要素数 から 1 まで 1 ずつ減らす」なので、data[3]→data[2]→data[1] の順に連結され "321" になります。「"123"」は昇順にたどった場合の結果で、減らす指定を見落とすと選んでしまいます。「"6"」は数値として合計した場合の値ですが、ここでは文字列の連結です。「"111"」は同じ要素を繰り返し連結した場合の結果で、添字が変化していません。'},

{id:'P017',c:'algo',d:2,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。手続 printTriangle は、引数 n に対して「*」を1個から n 個まで1行ずつ増やしながら出力する。',
 code:'○printTriangle(整数型: n)\n  整数型: i, j\n  文字列型: line\n\n  for (i を 1 から n まで 1 ずつ増やす)\n    line ← ""\n    for ([[a]])\n      line ← line ＋ "*"\n    endfor\n    lineの値 を出力する\n  endfor',
 o:['j を 1 から i まで 1 ずつ増やす','j を 1 から n まで 1 ずつ増やす','j を i から n まで 1 ずつ増やす','j を n から 1 まで 1 ずつ減らす'],a:0,
 e:'i 行目には「*」を i 個出力する必要があるため、内側の繰返しは 1 から i までとします。「j を 1 から n まで 1 ずつ増やす」ではすべての行が n 個になり、三角形になりません。「j を i から n まで 1 ずつ増やす」では行が進むほど個数が減り、逆向きの三角形になります。「j を n から 1 まで 1 ずつ減らす」も常に n 個となり、行ごとの変化が生まれません。'},

{id:'P018',c:'algo',d:3,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 countUp は、配列 data のうち直前の要素より大きい要素の個数を返す。countUp({4, 7, 5, 9, 9}) として呼び出したとき、戻り値は [ a ] となる。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: countUp(整数型の配列: data)\n  整数型: i\n  整数型: cnt ← 0\n\n  for (i を 2 から dataの要素数 まで 1 ずつ増やす)\n    if (data[i] ＞ data[i － 1])\n      cnt ← cnt ＋ 1\n    endif\n  endfor\n\n  return cnt',
 o:['1','2','3','4'],a:1,
 e:'比較は i＝2 から始まります。7＞4 は真、5＞7 は偽、9＞5 は真、9＞9 は偽なので、該当は2個です。「1」は数え漏らしです。「3」は最後の 9＞9 を真と誤って数えた場合の値で、等しい場合は ＞ を満たしません。「4」は比較回数そのもの（要素数−1）で、条件判定を行わずに数えた場合の値です。'},

{id:'P019',c:'algo',d:2,
 q:'次のプログラムを実行すると、変数 x の値を出力する。出力される値はどれか。',
 code:'整数型: x ← 10\n整数型: y ← 3\n\nx ← x mod y\nx ← x × y\nx ← x ＋ y\n\nxの値 を出力する',
 o:['6','9','12','33'],a:0,noShuffle:true,
 e:'10 mod 3 は剰余なので 1 です。次に 1 × 3 ＝ 3、最後に 3 ＋ 3 ＝ 6 となり、出力は 6 です。「9」は mod を除算（商）と取り違え、10÷3＝3 として計算した場合の値です。「12」は最初の代入を飛ばした場合の値です。「33」は mod を無視して 10×3＋3 と計算した場合の値で、mod が剰余算である点が要点です。'},

{id:'P020',c:'algo',d:3,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。関数 isPrime は、2 以上の整数 n が素数のとき true を、そうでないとき false を返す。',
 code:'○論理型: isPrime(整数型: n)\n  整数型: i\n\n  if (n ＜ 2)\n    return false\n  endif\n\n  for (i を 2 から n － 1 まで 1 ずつ増やす)\n    if ([[a]])\n      return false\n    endif\n  endfor\n\n  return true',
 o:['n mod i ＝ 0','i mod n ＝ 0','n ÷ i ＝ 0','n mod i ≠ 0'],a:0,
 e:'素数は1と自分自身以外に約数を持たない数です。n を i で割った剰余が0であれば i は約数なので、素数ではないと判定できます。「i mod n ＝ 0」は割る向きが逆で、i＜n の範囲では成立しません。「n ÷ i ＝ 0」は商が0になる条件で、i＜n の範囲では起こりません。「n mod i ≠ 0」は割り切れないときに false を返すことになり、判定が正反対になります。'},

{id:'P021',c:'security',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。手続 checkAccess は、利用者が管理者であるか、または対象の所有者である場合にだけ操作を許可する。',
 code:'○checkAccess(論理型: isAdmin, 論理型: isOwner)\n  if ([[a]])\n    操作を許可する\n  else\n    操作を拒否する\n  endif',
 o:['isAdmin or isOwner','isAdmin and isOwner','not isAdmin and isOwner','not (isAdmin or isOwner)'],a:0,
 e:'「管理者である、または所有者である」という条件なので、論理和の or を使います。「isAdmin and isOwner」では両方を満たす利用者だけが許可され、管理者だけの場合が拒否されてしまいます。「not isAdmin and isOwner」は管理者を除外してしまいます。「not (isAdmin or isOwner)」は条件が反転しており、どちらでもない利用者だけを許可する誤った判定になります。'},

{id:'P022',c:'security',d:3,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。関数 verify は、受け取ったデータのハッシュ値と、送信者から届いたハッシュ値が一致する場合に true を返し、改ざんされていないことを確認する。',
 code:'○論理型: verify(文字列型: data, 文字列型: receivedHash)\n  文字列型: calcHash\n\n  calcHash ← hash(data)\n\n  if ([[a]])\n    return true\n  else\n    return false\n  endif',
 o:['calcHash ＝ receivedHash','calcHash ≠ receivedHash','data ＝ receivedHash','calcHash ＝ data'],a:0,
 e:'受け取ったデータから計算したハッシュ値と、送信者から届いたハッシュ値が一致すれば改ざんされていないと判断できます。「calcHash ≠ receivedHash」は判定が正反対で、改ざんされたときに true を返してしまいます。「data ＝ receivedHash」は元データとハッシュ値を直接比べており、長さも形式も異なるため一致しません。「calcHash ＝ data」も同様に、ハッシュ値と元データを比べている点が誤りです。'},

{id:'P023',c:'security',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。手続 lockAccount は、ログインの失敗が連続して 5 回に達した時点でアカウントをロックする。成功した場合は失敗回数を 0 に戻す。',
 code:'○lockAccount(論理型: success)\n  if (success ＝ true)\n    failCount ← 0\n  else\n    failCount ← failCount ＋ 1\n    if ([[a]])\n      アカウントをロックする\n    endif\n  endif',
 o:['failCount ≧ 5','failCount ＞ 5','failCount ≦ 5','failCount ＝ 1'],a:0,
 e:'失敗回数を加算した直後に判定するため、5回目の失敗で failCount が5になった時点でロックする「failCount ≧ 5」が正しくなります。「failCount ＞ 5」では6回目までロックされず、要件より1回多く試行を許してしまいます。「failCount ≦ 5」は1回目の失敗で既に成立し、即座にロックされます。「failCount ＝ 1」も1回の失敗でロックされるため要件を満たしません。'},

{id:'P024',c:'security',d:3,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。関数 isStrong は、パスワードが「10文字以上」かつ「英字・数字・記号のうち2種類以上を含む」場合に true を返す。',
 code:'○論理型: isStrong(文字列型: pw)\n  整数型: kinds ← 0\n\n  if (pw に英字が含まれる)\n    kinds ← kinds ＋ 1\n  endif\n  if (pw に数字が含まれる)\n    kinds ← kinds ＋ 1\n  endif\n  if (pw に記号が含まれる)\n    kinds ← kinds ＋ 1\n  endif\n\n  return [[a]]',
 o:['pwの文字数 ≧ 10 and kinds ≧ 2','pwの文字数 ≧ 10 or kinds ≧ 2','pwの文字数 ＞ 10 and kinds ≧ 2','pwの文字数 ≧ 10 and kinds ＝ 3'],a:0,
 e:'「10文字以上」と「2種類以上」の両方を満たす必要があるため and で連結し、種類数は ≧ 2 とします。「or で連結」ではどちらか一方だけで true になり要件を満たしません。「＞ 10」は11文字以上となり、ちょうど10文字が弾かれてしまいます。「kinds ＝ 3」は3種類すべてを必須にしており、2種類の場合が拒否されるため条件が厳しすぎます。'},
/* ── 2026-08-25 追加分（P025〜P042）──────────────────────────
   科目Bの在庫が本番の出題数ぎりぎり（アルゴリズム18問／セキュリティ6問）で、
   模試を回すたびにほぼ同じ問題が出る状態だったため増補した。
   アルゴリズム＋12問（→30問）／セキュリティ＋6問（→12問）。
   擬似言語の書式は fe/擬似言語仕様_IPA公式.md に従う。 */

{id:'P025',c:'algo',d:1,
 q:'次のプログラムを実行すると、変数 sum の値を出力する。出力される値はどれか。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: main()\n  整数型の配列: data ← {3, 8, 1, 6, 4, 9}\n  整数型: i\n  整数型: sum ← 0\n\n  for (i を 1 から dataの要素数 まで 2 ずつ増やす)\n    sum ← sum ＋ data[i]\n  endfor\n\n  return sum',
 o:['8','23','31','12'],a:0,
 e:'要素番号を1から2ずつ増やすので、参照されるのは data[1]＝3、data[3]＝1、data[5]＝4 の3個だけで、合計は8です。「23」は偶数番号の data[2]＝8、data[4]＝6、data[6]＝9 を合計した値で、開始値を2と取り違えた場合に得られます。「31」は全要素の合計で、増分を1と読み違えた場合の値です。「12」は先頭から3要素 3＋8＋1 を足した値で、要素番号ではなく繰返し回数の順に足した場合の誤りです。'},

{id:'P026',c:'algo',d:1,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。関数 countEven は、配列 data に含まれる偶数の個数を返す。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: countEven(整数型の配列: data)\n  整数型: i\n  整数型: cnt ← 0\n\n  for (i を 1 から dataの要素数 まで 1 ずつ増やす)\n    if ([[a]])\n      cnt ← cnt ＋ 1\n    endif\n  endfor\n\n  return cnt',
 o:['data[i] mod 2 ＝ 0','data[i] mod 2 ≠ 0','data[i] ÷ 2 ＝ 0','i mod 2 ＝ 0'],a:0,
 e:'偶数は2で割った余りが0になる数なので、剰余を求める mod を使って data[i] mod 2 ＝ 0 と書きます。「data[i] mod 2 ≠ 0」は余りが0でないもの、すなわち奇数を数えてしまいます。「data[i] ÷ 2 ＝ 0」は値を2で割った商が0になる条件で、data[i] が0か1のときしか成立しません。「i mod 2 ＝ 0」は要素の値ではなく要素番号が偶数かどうかを見ており、配列の中身と無関係に個数が決まってしまいます。'},

{id:'P027',c:'algo',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 findIndex は、配列 data の中で最初に値 key と一致した要素の要素番号を返す。一致する要素が一つもないときは 0 を返す。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: findIndex(整数型の配列: data, 整数型: key)\n  整数型: i\n\n  for (i を 1 から dataの要素数 まで 1 ずつ増やす)\n    if (data[i] ＝ key)\n      return i\n    endif\n  endfor\n\n  [[a]]',
 o:['return 0','return i','return dataの要素数','return data[1]'],a:0,
 e:'ここへ到達するのは、最後まで走査しても一致が見つからなかった場合だけなので、仕様どおり0を返します。「return i」は繰返しを抜けた後の制御変数を返すもので、「見つからなかった」ことを表す値にはなりません。「return dataの要素数」は最後の要素番号を返すため、末尾の要素が一致した場合と区別できなくなります。「return data[1]」は要素番号ではなく先頭要素の値を返しており、戻り値の意味が変わってしまいます。'},

{id:'P028',c:'algo',d:2,fig:FIG_MATRIX,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 rowSum は、図に示す2次元配列 tbl の r 行目の合計を返す。図のとおり tbl は3行4列で、rowSum(tbl, 2) の戻り値は 15 である。',
 note:'ここで、配列の要素番号は 1 から始まる。二次元配列の要素番号は、行番号、列番号の順に指定する。',
 code:'○整数型: rowSum(整数型の二次元配列: tbl, 整数型: r)\n  整数型: c\n  整数型: sum ← 0\n\n  for (c を 1 から 4 まで 1 ずつ増やす)\n    sum ← sum ＋ [[a]]\n  endfor\n\n  return sum',
 o:['tbl[r, c]','tbl[c, r]','tbl[r][c]','tbl[c]'],a:0,
 e:'二次元配列は行番号、列番号の順にコンマで区切って指定するため tbl[r, c] と書きます。図の2行目は 4、4、6、1 なので合計は15となり、仕様と一致します。「tbl[c, r]」は行と列が逆で、c は1から4まで動くのに行は3行しかないため存在しない要素を参照します。「tbl[r][c]」は角括弧を二つ重ねる一般的なプログラミング言語の書き方であり、擬似言語の表記ではありません。「tbl[c]」は一次元配列の指定なので、何行目かを選べません。'},

{id:'P029',c:'algo',d:3,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。手続 selectionSort は、整数型の配列 data を昇順に整列する。未整列部分の中から最小の要素を探し、その要素を未整列部分の先頭と入れ替える操作を繰り返す。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○selectionSort(整数型の配列: data)\n  整数型: i, j, min, tmp\n\n  for (i を 1 から dataの要素数 － 1 まで 1 ずつ増やす)\n    min ← i\n    for (j を i ＋ 1 から dataの要素数 まで 1 ずつ増やす)\n      if ([[a]])\n        min ← j\n      endif\n    endfor\n    tmp ← data[i]\n    data[i] ← data[min]\n    data[min] ← tmp\n  endfor',
 o:['data[j] ＜ data[min]','data[j] ＞ data[min]','data[j] ＜ data[i]','j ＜ min'],a:0,
 e:'未整列部分の最小値を探すので、走査中の data[j] が現在の最小候補 data[min] より小さいときに候補を更新します。「data[j] ＞ data[min]」は最大値を探すことになり、結果は降順に並びます。「data[j] ＜ data[i]」は比較相手が未整列部分の先頭に固定されるため、いったん min を更新した後にさらに小さい値が現れても追随できません。「j ＜ min」は値ではなく要素番号どうしの比較で、j は常に min 以上の位置を走査するため条件が成立せず、整列されません。'},

{id:'P030',c:'algo',d:2,fig:FIG_INSERT,
 q:'次のプログラムは、図のように昇順に整列済みの配列 data に対して、値 key を挿入すべき位置が先頭から何番目かを求める。図の data と key ＝ 15 のとき、戻り値はどれか。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: insertPos(整数型の配列: data, 整数型: key)\n  整数型: p ← 1\n\n  while (p ≦ dataの要素数 and data[p] ＜ key)\n    p ← p ＋ 1\n  endwhile\n\n  return p',
 o:['4','3','5','18'],a:0,
 e:'図の data は 4、9、12、18、25 で、15 より小さいのは 4、9、12 の3個です。while はその3回だけ p を増やして4になり、data[4]＝18 で条件が偽になって止まるため、15 は4番目に入ります。「3」は15より小さい要素の個数そのもので、初期値1を足し忘れた値です。「5」は末尾まで走査してしまった場合の値で、18 で条件が偽になる点を見落としています。「18」は挿入位置ではなく、その位置にある要素の値です。'},

{id:'P031',c:'algo',d:1,
 q:'次のプログラムを実行すると、変数 n の値を出力する。出力される値はどれか。',
 code:'○整数型: main()\n  整数型: n ← 1\n  整数型: k ← 0\n\n  while (n ＜ 50)\n    n ← n × 3\n    k ← k ＋ 1\n  endwhile\n\n  return n',
 o:['81','27','54','243'],a:0,
 e:'n は 1→3→9→27→81 と変化し、81 になった時点で条件 n ＜ 50 が偽になってループを抜けます。「27」は最後の1回を数え落とした値で、27 の時点ではまだ50未満なので繰返しは続きます。「54」は3を掛けるところを3ずつ足すなどと読み違えた場合の値です。「243」は条件が偽になった後にもう1回繰り返した場合の値で、前判定繰返しでは起こりません。'},

{id:'P032',c:'algo',d:2,
 q:'次のプログラムを実行すると、配列 out の内容を先頭から順に出力する。出力される内容はどれか。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型の配列: merge()\n  整数型の配列: a ← {1, 3, 5}\n  整数型の配列: b ← {2, 4, 6}\n  整数型の配列: out ← {}\n  整数型: i\n\n  for (i を 1 から aの要素数 まで 1 ずつ増やす)\n    outの末尾 に b[i]の値 を追加する\n    outの末尾 に a[i]の値 を追加する\n  endfor\n\n  return out',
 o:['2, 1, 4, 3, 6, 5','1, 2, 3, 4, 5, 6','1, 3, 5, 2, 4, 6','6, 5, 4, 3, 2, 1'],a:0,
 e:'繰返しのたびに b[i]、a[i] の順で追加するので、2、1、4、3、6、5 の順に並びます。「1, 2, 3, 4, 5, 6」は a[i]、b[i] の順に追加した場合の並びで、2行の順序が逆です。「1, 3, 5, 2, 4, 6」は配列 a を全部追加してから b を追加した場合の並びで、繰返しの中で交互に追加している点を見落としています。「6, 5, 4, 3, 2, 1」は要素番号を末尾から減らしながら走査した場合の並びです。'},

{id:'P033',c:'algo',d:3,
 q:'次のプログラム中の関数 f は再帰的に定義されている。f(5) の戻り値はどれか。',
 code:'○整数型: f(整数型: n)\n  if (n ≦ 2)\n    return 1\n  endif\n\n  return f(n － 1) ＋ f(n － 2)',
 o:['5','8','3','120'],a:0,
 e:'f(1)＝1、f(2)＝1 が基底で、f(3)＝2、f(4)＝3、f(5)＝f(4)＋f(3)＝5 となります。「8」は f(6) の値で、1段多く展開した場合の誤りです。「3」は f(4) の値で、1段少なく展開した場合の誤りです。「120」は 5 の階乗で、再帰の式を n × f(n － 1) と取り違えた場合の値です。'},

{id:'P034',c:'algo',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 isPalindrome は、文字型の配列 s が前から読んでも後ろから読んでも同じ並びであるときに true を返す。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○論理型: isPalindrome(文字型の配列: s)\n  整数型: i ← 1\n  整数型: j ← sの要素数\n\n  while ([[a]])\n    if (s[i] ≠ s[j])\n      return false\n    endif\n    i ← i ＋ 1\n    j ← j － 1\n  endwhile\n\n  return true',
 o:['i ＜ j','i ≦ sの要素数','i ≠ j','j ＞ 0'],a:0,
 e:'両端から中央へ向かって突き合わせるので、i が j より小さい間だけ比較すれば足ります。「i ≦ sの要素数」は i が末尾に達するまで回り続け、途中で j が0以下になって存在しない要素を参照します。「i ≠ j」は要素数が偶数のとき i と j がすれ違って一致しないため、繰返しが止まりません。「j ＞ 0」も同様に i と j が交差した後まで比較を続けてしまいます。'},

{id:'P035',c:'algo',d:1,
 q:'次のプログラムを実行すると、最大値と最小値の差を返す。戻り値はどれか。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: main()\n  整数型の配列: data ← {12, 5, 20, 8, 15}\n  整数型: i\n  整数型: mx ← data[1]\n  整数型: mn ← data[1]\n\n  for (i を 2 から dataの要素数 まで 1 ずつ増やす)\n    if (data[i] ＞ mx)\n      mx ← data[i]\n    endif\n    if (data[i] ＜ mn)\n      mn ← data[i]\n    endif\n  endfor\n\n  return mx － mn',
 o:['15','8','20','5'],a:0,
 e:'配列の最大値は20、最小値は5なので、差は15です。「8」は最大値20から先頭要素12を引いた値で、最小値の更新を見落とした場合の誤りです。「20」は最大値そのもので、引き算をしていません。「5」は最小値そのものです。'},

{id:'P036',c:'algo',d:3,
 q:'次のプログラムは、昇順に整列された配列 data から値 key を二分探索する。data が {2, 4, 6, 8, 10, 12, 14, 16}、key ＝ 11 のとき、while の中の処理が実行される回数と戻り値の組合せはどれか。',
 note:'ここで、配列の要素番号は 1 から始まる。',
 code:'○整数型: binarySearch(整数型の配列: data, 整数型: key)\n  整数型: lo ← 1\n  整数型: hi ← dataの要素数\n  整数型: mid\n\n  while (lo ≦ hi)\n    mid ← (lo ＋ hi) ÷ 2   /* 小数点以下は切り捨てる */\n    if (data[mid] ＝ key)\n      return mid\n    elseif (data[mid] ＜ key)\n      lo ← mid ＋ 1\n    else\n      hi ← mid － 1\n    endif\n  endwhile\n\n  return 0',
 o:['3回・戻り値0','4回・戻り値0','3回・戻り値5','8回・戻り値0'],a:0,
 e:'data は 2、4、6、8、10、12、14、16 です。1回目は lo＝1、hi＝8 で mid＝4、data[4]＝8 が11より小さいので lo を5にします。2回目は mid＝6、data[6]＝12 が11より大きいので hi を5にします。3回目は lo＝hi＝5 で mid＝5、data[5]＝10 が11より小さいので lo を6にし、lo ＞ hi となって繰返しを抜けます。11 は存在しないので戻り値は0です。「4回・戻り値0」は繰返しの回数を1回多く数えたものです。「3回・戻り値5」は最後に調べた要素番号を戻り値と取り違えたもので、一致していないため返されません。「8回・戻り値0」は先頭から順に調べる線形探索の回数で、二分探索では起こりません。'},

{id:'P037',c:'security',d:1,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 isValidId は、利用者が入力した文字列 id が「英数字だけからなり、長さが1文字以上12文字以下」であるときに true を返す。入力値の検証は、許可する文字だけを通す方式で行う。',
 code:'○論理型: isValidId(文字列型: id)\n  整数型: len ← idの文字数\n\n  if (len ＜ 1 or len ＞ 12)\n    return false\n  endif\n\n  if ([[a]])\n    return false\n  endif\n\n  return true',
 o:['id に英数字以外の文字が一つでも含まれる','id にセミコロンまたは引用符が含まれる','id が数字だけで構成されている','id の先頭が英字でない'],a:0,
 e:'許可する文字だけを通す方式では、あらかじめ決めた文字集合（ここでは英数字）から外れる文字が一つでもあれば拒否します。「id にセミコロンまたは引用符が含まれる」は危険と分かっている文字だけを拒否する方式で、想定しなかった文字を見落とします。「id が数字だけで構成されている」は仕様にない条件で、数字だけのIDも本来は有効です。「id の先頭が英字でない」も仕様にない制限を加えることになり、正しい入力まで拒否します。'},

{id:'P038',c:'security',d:2,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。手続 login は、利用者の認証に成功したときにセッションを開始する。攻撃者があらかじめ用意したセッションIDを利用者に使わせる攻撃を防ぐ必要がある。',
 code:'○login(文字列型: user, 文字列型: pw)\n  if (authenticate(user, pw) ＝ false)\n    showError("認証に失敗しました")\n    return\n  endif\n\n  /* [ a ] の処理をここで行う */\n\n  session.user ← user\n  showMyPage()',
 o:['新しいセッションIDを発行し、以後はそれを使う','認証前のセッションIDをそのまま使い続ける','セッションを破棄してログイン画面に戻す','セッションIDを利用者IDと同じ値にする'],a:0,
 e:'認証に成功した時点でセッションIDを作り直せば、攻撃者が事前に用意したIDは無効になります（セッションフィクセーション対策）。「認証前のセッションIDをそのまま使い続ける」は攻撃をそのまま成立させてしまいます。「セッションを破棄してログイン画面に戻す」ではログイン処理が完了せず、機能として成立しません。「セッションIDを利用者IDと同じ値にする」は推測できる値になり、なりすましを容易にします。'},

{id:'P039',c:'security',d:2,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 readUserFile は、公開用フォルダの中にあるファイルだけを読み込む。ファイル名 name は利用者が指定するため、上位フォルダを指す文字列が含まれることがある。',
 code:'○文字列型: readUserFile(文字列型: name)\n  if ([[a]])\n    return "アクセスできません"\n  endif\n\n  /* 公開用フォルダのパスと name をつないでファイルを読み込む */\n  return readPublicFile(name)',
 o:['name に上位フォルダを指す文字列が含まれる','name の文字数が0である','name の拡張子が txt でない','name に英大文字が含まれる'],a:0,
 e:'上位フォルダを指す指定を許すと、公開用フォルダの外にあるファイルまで読み出されます（ディレクトリトラバーサル）。これを拒否するのが対策です。「name の文字数が0である」は入力漏れの検査にすぎず、上位フォルダへの移動を防げません。「name の拡張子が txt でない」は読める種類を絞るだけで、別のフォルダにある txt ファイルは読めてしまいます。「name に英大文字が含まれる」は安全性と関係のない制限です。'},

{id:'P040',c:'security',d:3,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。手続 deleteArticle は記事を削除する。削除できるのは、ログイン済みの利用者のうち、その記事の投稿者本人または管理者に限る。',
 code:'○deleteArticle(整数型: articleId)\n  if (session.user が未定義)\n    showError("ログインしてください")\n    return\n  endif\n\n  if ([[a]])\n    showError("権限がありません")\n    return\n  endif\n\n  removeArticle(articleId)',
 o:['投稿者ではなく、かつ管理者でもない','投稿者ではない、または管理者ではない','管理者ではない','投稿者である'],a:0,
 e:'許可するのは「投稿者本人」または「管理者」なので、拒否すべきなのはそのどちらでもないときです。「投稿者ではない、または管理者ではない」は or で結んでいるため、管理者であっても投稿者でなければ拒否され、要件を満たしません。「管理者ではない」は投稿者本人による削除まで拒否します。「投稿者である」は条件が逆で、本人だけが削除できなくなります。'},

{id:'P041',c:'security',d:1,
 q:'次の記述中の [ a ] に入れる正しい答えはどれか。関数 authenticate は、利用者が入力したパスワード pw が正しいかどうかを判定する。データベースにはパスワードそのものではなく、ハッシュ関数 hash で変換した値が保存されている。',
 code:'○論理型: authenticate(文字列型: user, 文字列型: pw)\n  文字列型: saved ← getSavedHash(user)\n\n  if ([[a]])\n    return true\n  else\n    return false\n  endif',
 o:['hash(pw) ＝ saved','pw ＝ saved','hash(saved) ＝ pw','pwの文字数 ＝ savedの文字数'],a:0,
 e:'保存されているのはハッシュ値なので、入力値を同じハッシュ関数で変換してから突き合わせます。「pw ＝ saved」は平文とハッシュ値の比較になり、正しいパスワードでも一致しません。「hash(saved) ＝ pw」はハッシュ値をさらに変換して平文と比べており、二重に誤っています。「pwの文字数 ＝ savedの文字数」は長さしか見ておらず、まったく別のパスワードでも通ってしまいます。'},

{id:'P042',c:'security',d:2,
 q:'次のプログラム中の [ a ] に入れる正しい答えはどれか。手続 transfer は送金内容を確定する。あらかじめ画面に埋め込んでおいたトークンを照合し、第三者のサイトから送信された偽の要求を受け付けないようにする。',
 code:'○transfer(整数型: amount, 文字列型: token)\n  if ([[a]])\n    showError("不正な要求です")\n    return\n  endif\n\n  clearToken()\n  doTransfer(amount)',
 o:['token が session.token と一致しない','token が未定義である','amount が0以下である','token の文字数が32未満である'],a:0,
 e:'利用者のセッションに保存しておいたトークンと、送信されてきたトークンが一致することを確かめるのが対策の要点です（クロスサイトリクエストフォージェリ対策）。「token が未定義である」は空の要求しか弾けず、何か値が入っていれば内容を問わず通ってしまいます。「amount が0以下である」は金額の妥当性検査であり、要求の出どころとは無関係です。「token の文字数が32未満である」は長さしか見ておらず、長さだけ合わせた偽のトークンを防げません。'},
];

// ─── チートシート ──────────────────────────────────────────
const CHEATSHEETS = [
  { id:'raid', icon:'server', title:'RAIDレベル比較',
    headers:['レベル','方式','耐障害性','実効容量','特徴'],
    rows:[
      ['RAID0','ストライピング','なし','100%','速度重視。1台故障で全データ消失'],
      ['RAID1','ミラーリング','1台まで','50%','2台に同じ内容を書く。容量効率は低い'],
      ['RAID5','分散パリティ','1台まで','(n−1)/n','速度と容量のバランスが良い。最低3台必要'],
      ['RAID6','二重分散パリティ','2台まで','(n−2)/n','RAID5より安全だが書込みは遅い。最低4台必要'],
    ] },
  { id:'reliability', icon:'gear', title:'信頼性の計算式と設計思想',
    headers:['項目','式・意味','間違えやすい点'],
    rows:[
      ['稼働率','MTBF ÷（MTBF ＋ MTTR）','MTBFは故障間隔、MTTRは修復時間'],
      ['直列接続の稼働率','各稼働率の積','必ず個々の稼働率より低くなる'],
      ['並列接続の稼働率','1 −（1 − 稼働率）の積','必ず個々の稼働率より高くなる'],
      ['フェールセーフ','故障時に安全側へ倒す','信号機が赤で停止する'],
      ['フォールトトレラント','故障しても機能を維持する','冗長化して処理を継続'],
      ['フールプルーフ','誤操作しても危険にならない','蓋を閉めないと動かない電子レンジ'],
    ] },
  { id:'devmodel', icon:'doc-check', title:'開発モデルとテスト技法',
    headers:['項目','内容','対応・特徴'],
    rows:[
      ['ウォーターフォールモデル','工程を順に進め後戻りしない','要件が明確な大規模開発向け'],
      ['アジャイル開発','短い反復で開発とリリースを繰り返す','要件変更が多い開発向け'],
      ['V字モデル','設計工程とテスト工程を対応づける','要件定義↔受入、詳細設計↔単体'],
      ['ブラックボックステスト','入出力に着目（内部を見ない）','同値分割・限界値分析'],
      ['ホワイトボックステスト','内部構造に着目','命令網羅＜分岐網羅＜複合条件網羅'],
    ] },
  { id:'itsm', icon:'flag', title:'サービスマネジメント：似ている管理の役割分担',
    headers:['管理の名称','目的','いつ動くか','混同しやすい点'],
    rows:[
      ['インシデント管理','とにかく早くサービスを復旧させる','障害の発生直後','原因究明はしない。暫定回避策でよい'],
      ['問題管理','根本原因を突き止め再発を防ぐ','復旧後','インシデント管理と役割が逆'],
      ['変更管理','変更を評価・承認し統制する','変更を加える前','承認なしの変更を防ぐのが目的'],
      ['構成管理','機器や設定の情報を最新に保つ','常時','「何がどこにあるか」の台帳づくり'],
      ['リリース管理','変更を本番へ計画的に展開する','変更の適用時','切り戻しできる状態にしておく'],
    ] },
  { id:'pseudo', icon:'code', title:'擬似言語（科目B）の記号早見表',
    headers:['記号・書式','意味','注意'],
    rows:[
      ['○手続名(型名: 引数)','手続・関数の宣言','行頭の○を忘れない'],
      ['変数名 ← 式','代入','＝ ではなく ← を使う'],
      ['＝ ／ ≠ ／ ≦ ／ ≧','等しい／等しくない／以下／以上','== や != は使わない。全角'],
      ['mod ／ × ／ ÷','剰余／乗算／除算','% や * や / は使わない'],
      ['and ／ or ／ not','論理積／論理和／否定','&& や || は使わない'],
      ['for (i を 1 から n まで 1 ずつ増やす)','繰返し','日本語の制御記述で書く'],
      ['while (条件式) 〜 endwhile','前判定繰返し','do 〜 while (条件式) は後判定'],
      ['配列[要素番号]','配列要素へのアクセス','要素番号は 1 から始まる'],
      ['{ } ／ {n個の未定義の値}','配列の内容／未定義で初期化','空配列は { }'],
    ] },
  { id:'legal', icon:'scale', title:'知的財産権と契約形態',
    headers:['項目','内容','間違えやすい点'],
    rows:[
      ['著作権','創作物（プログラム含む）を保護','創作した時点で自動発生。登録不要'],
      ['特許権','高度な発明を保護','出願・登録が必要（著作権と逆）'],
      ['営業秘密の3要件','秘密管理性・有用性・非公知性','3つすべてを満たす必要がある'],
      ['労働者派遣契約','派遣先が労働者に指揮命令','指揮命令権が派遣先にある'],
      ['請負契約','仕事の完成が目的','発注者に指揮命令権なし。指示すると偽装請負'],
      ['準委任契約','業務の遂行が目的（完成責任なし）','請負との違いは成果物の完成義務'],
    ] },
  { id:'network', icon:'globe', title:'ネットワークの階層と機器・プロトコル',
    headers:['OSI階層','TCP/IP階層','主な機器','代表的なプロトコル'],
    rows:[
      ['アプリケーション層','アプリケーション層','—','HTTP / HTTPS / SMTP / POP3 / IMAP / DNS / FTP'],
      ['トランスポート層','トランスポート層','—','TCP（確実・再送あり） / UDP（高速・保証なし）'],
      ['ネットワーク層','インターネット層','ルータ','IP / ICMP'],
      ['データリンク層','ネットワークインタフェース層','ブリッジ・スイッチングハブ','イーサネット（MACアドレスで転送）'],
      ['物理層','ネットワークインタフェース層','リピータ・ハブ','—'],
    ] },
  { id:'security2', icon:'shield', title:'攻撃手法と有効な対策',
    headers:['攻撃','何をされるか','有効な対策'],
    rows:[
      ['SQLインジェクション','DBを不正に操作・情報を抜き取られる','プレースホルダ（バインド機構）を使う'],
      ['クロスサイトスクリプティング（XSS）','閲覧者のブラウザで悪意あるスクリプトが動く','出力時のエスケープ処理'],
      ['クロスサイトリクエストフォージェリ（CSRF）','ログイン中の利用者に意図しない操作をさせられる','使い捨てトークンの埋め込み'],
      ['ソーシャルエンジニアリング','人をだまして情報を聞き出される','本人確認の手順化・教育'],
      ['ランサムウェア','データを暗号化され金銭を要求される','ネットワークから切り離したバックアップ'],
      ['DoS攻撃','大量アクセスでサービスが停止する（可用性）','通信の遮断・分散配置'],
      ['ゼロデイ攻撃','修正前の脆弱性を突かれる','多層防御・振る舞い検知'],
    ] },
  { id:'calc', icon:'list-ol', title:'計算問題の公式まとめ（得点源）',
    headers:['求めるもの','公式','注意点'],
    rows:[
      ['稼働率','MTBF ÷（MTBF ＋ MTTR）','分母は1サイクル全体の時間'],
      ['直列接続の稼働率','各稼働率の積','必ず個々より低くなる'],
      ['並列接続の稼働率','1 −（1 − 稼働率）の積','必ず個々より高くなる'],
      ['実効アクセス時間','ヒット率×高速側 ＋（1−ヒット率）×低速側','ヒット率とミス率を逆にしない'],
      ['MIPS','クロック周波数 ÷ CPI ÷ 10⁶','CPIで割る（掛けない）'],
      ['伝送時間','データ量 ÷ 実効速度','バイト→ビットは8倍'],
      ['損益分岐点売上高','固定費 ÷（1 − 変動費率）','分母は（1 − 変動費率）'],
      ['画像のデータ量','幅 × 高さ × 色深度 ÷ 8','答えをバイトで問われたら8で割る'],
    ] },
];
