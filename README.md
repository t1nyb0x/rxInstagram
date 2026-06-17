# rxInstagram

Discord に投稿された Instagram の URL を自動検出し、埋め込み（Embed）として展開する Discord Bot。

## 対応 URL

| タイプ | 例 |
|---|---|
| 投稿 | `instagram.com/p/{shortcode}/` |
| リール | `instagram.com/reel/{shortcode}/` |
| 動画 | `instagram.com/tv/{shortcode}/` |
| アカウント | `instagram.com/{username}/` |
| ストーリー | `instagram.com/stories/{username}/{id}/` |

## Embed の内容

- 画像
- キャプション
- アカウント名
- 投稿日時（取得できない場合は省略）

## 必要なもの

- Docker / Docker Compose
- Discord Bot トークン

## セットアップ

```bash
cp .env.example .env
```

`.env` を編集して `DISCORD_TOKEN` を設定する。

```env
DISCORD_TOKEN=your_discord_bot_token_here
```

## 起動

```bash
docker compose up -d
```

## 開発

```bash
npm install
npm run dev
```

### コマンド一覧

| コマンド | 内容 |
|---|---|
| `npm run build` | TypeScript をビルド |
| `npm run dev` | ウォッチモードで起動 |
| `npm test` | テストを実行 |
| `npm run test:coverage` | カバレッジ付きでテストを実行 |
| `npm run lint` | Oxlint でリント |
| `npm run fmt` | Oxfmt でフォーマット |

## ライセンス

MIT
