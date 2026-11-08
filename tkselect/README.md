# TKselect ECサイト 試作版

日本のトラベルギアブランド「TKselect」のブランドトップページと、第1号商品「真空圧縮トラベルリュック」の商品LPの試作です。
HTML/CSS/JavaScript だけで作っています（ビルド不要・外部ライブラリなし）。

## プレビュー方法
```bash
cd tkselect
python3 -m http.server 8080
# ブラウザで http://localhost:8080/ を開く
```
| ページ | URL |
|---|---|
| ブランドトップ | `/index.html` |
| 商品LP（最重要） | `/products/vacuum-backpack.html` |
| 素材差し込みリスト（制作用） | `/media-guide.html` |

スクリーンショットは `docs/screenshots/` にあります（PC 1440px／スマホ iPhone 13相当）。

## ファイル構成
```
tkselect/
├─ index.html                     ブランドトップ
├─ products/vacuum-backpack.html  商品LP
├─ media-guide.html               画像・動画の差し込みリスト（site-configから自動生成）
├─ assets/
│  ├─ css/style.css               デザイントークン＋コンポーネント
│  ├─ js/site-config.js           ★ 価格・実測値・画像・購入URLの設定（ここを書き換える）
│  ├─ js/main.js                  描画・購入ボタン・固定バー・ギャラリー
│  ├─ img/  video/                実素材の置き場所
└─ docs/
   ├─ REFERENCE_ANALYSIS.md       参考サイトの分析
   ├─ BASE_INTEGRATION.md         BASE導入時の制約と実装方針
   └─ screenshots/
```

## 更新のしかた
- **画像・動画**：素材を `assets/img/` に置き、`site-config.js` の `media["IMG-01"].src` にパス（例：`"assets/img/img-01.webp"`）を書く。パスはサイトのルートからの相対パスで、どの階層のページでも正しく読み込まれる。全ページの該当枠が実画像に置き換わる。
- **実測値**：`product.measured` の `value` に値を入れると、「実測中」バッジが値に変わる（実測データ表・圧縮前後の比較に反映）。
- **購入ボタン**：`purchase.url` に BASE の商品URLを入れると、「購入する（デモ）」が通常の購入ボタンになる。`null` のあいだはデモ表示のままで、押すと未接続を知らせるダイアログが開く。
- **商品の追加**：`index.html` の `.product-grid` に `product-card` を追加する。

## 守っているルール
- 実測前の数値（圧縮率・容量・重量・外寸・泊数・保持時間・機内持ち込み・快適性）は断定せず、「実測中」と表示する
- レビュー・購入者の声・受賞歴は掲載しない（捏造しない）
- 商品写真の枠には、AI生成のバッグ画像を置かない
- 決済処理や購入完了画面は実装しない
- 公開前の試作のため `noindex` を設定している
