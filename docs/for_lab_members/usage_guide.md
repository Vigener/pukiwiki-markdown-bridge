# PukiWiki Markdown Bridge 🚀

![アプリアイコン](icon.jpg)

PukiWikiの編集画面を、モダンで快適な **Markdownエディタ** に置き換えるChrome拡張機能です。
研究室のPukiWiki（HPCS等）でのドキュメント執筆や議事録作成のストレスをなくし、GitHubライクな快適な執筆体験を提供します。

## 💡 主な機能
- **Markdownでの記述・リアルタイムプレビュー:** PukiWiki特有の難解な記法（`+` や `-` のネスト制限など）を意識せず、使い慣れたMarkdownで執筆できます。
- **ドラフト自動保存:** 編集中に誤ってタブを閉じても、次回開いた際に自動で復元されます。
- **安全なDiff（差分）確認:** 独自のPukiWiki記法への自動変換時や、意図しない行の削除が発生した場合に、**反映前に差分（Diff）を可視化**してデータ消失を防ぐフェイルセーフ機能が備わっています。

## 🛠 インストール方法（開発者モード）

現在、本拡張機能はChromeウェブストア公開準備中のため、GitHubからクローンしてローカルでビルド・導入します。

1. **リポジトリのクローンとビルド**
ターミナルを開き、以下のコマンドを実行します（Node.js環境が必要です）。
```bash
git clone git@github.com:Vigener/pukiwiki-markdown-bridge.git
cd pukiwiki-markdown-bridge
npm install
npm run build
```

2. **Chromeへの読み込み**
   1. Chromeブラウザで `chrome://extensions/` を開きます。
   2. 右上の **「デベロッパーモード」** をオンにします。
   3. 左上の **「パッケージ化されていない拡張機能を読み込む」** をクリックし、先ほどビルドで生成された `dist` ディレクトリを選択します。

## ⚙️ 初期設定（Options）

拡張機能をインストールすると、自動的に設定画面が開きます。
意図しないページでの誤作動を防ぐため、拡張機能を有効にしたいURLを登録します。

研究室のPukiWikiで動かす場合、以下のように **ご自身のディレクトリのURLの末尾にワイルドカード（`*`）** を付けて入力し、保存してください。

```text
https://hpcs.cs.tsukuba.ac.jp/pukiwiki/?Your_Team/Your_Name*
```

## ⌨️ ショートカットキー一覧

エディタ画面では以下のショートカットキーが使用可能です。マウスを使わずに爆速で編集・保存が可能です。

| 機能 | Windows / Linux | Mac |
|---|---|---|
| **PukiWikiへ反映して保存** | `Ctrl + Enter` | `Cmd + Enter` |
| **太字 (Bold)** | `Ctrl + B` | `Cmd + B` |
| **斜体 (Italic)** | `Ctrl + I` | `Cmd + I` |
| **リンク挿入** | `Ctrl + K` | `Cmd + K` |

## 💻 技術スタックと内部アーキテクチャ (For Geeks)

本プロジェクトは、HPCやシステムを専攻する情報系の皆さんにもハックしやすいモダンな構成で開発されています。

- **Frontend Build Tool:** [Vite](https://vitejs.dev/) (高速なHMRとビルド)
- **Language:** TypeScript
- **Markdown Editor:** [EasyMDE](https://github.com/Ionaru/easy-markdown-editor)
- **DOM Manipulation & Conversion:** 
  - PukiWikiの標準的な `name="msg"` テキストエリアを検知し、エディタUIを被せる（オーバーレイ）形で動作します。
  - **正規表現ベースのASTレス変換:** `src/converter.ts` にて、PukiWiki記法とMarkdown記法の双方向変換（Roundtrip）を正規表現で行っています。
  - PukiWiki固有のプラグイン（`#contents` や `&ref`）などは一切破壊せず、パススルー（そのまま維持）する仕様になっています。

ぜひ研究室のWikiライフを快適にするためにご活用ください！プルリクエストもお待ちしています。
