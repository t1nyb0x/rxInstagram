# rxInstagram — 設計書

## 概要

Discord に投稿された Instagram URL を検出し、対象コンテンツの情報を取得して同チャンネルに Discord Embed として返送するボットアプリケーション。

---

## 要件

### 機能要件

- Discord メッセージ内の Instagram URL を自動検出する
- 以下の URL タイプに対応する
  - 投稿（post）: `instagram.com/p/{shortcode}/`
  - リール（reel）: `instagram.com/reel/{shortcode}/`
  - 動画（video）: `instagram.com/tv/{shortcode}/`
  - アカウント（account）: `instagram.com/{username}/`
  - ストーリー（story）: `instagram.com/stories/{username}/{id}/`
- 1 メッセージ内に複数の Instagram URL が含まれる場合、全件 Embed を返送する
- Embed に含める情報
  - 画像
  - キャプション
  - アカウント名
  - 投稿日時（取得できない場合は省略）
- URL が投稿されたチャンネルと同チャンネルに Embed を返送する

### 非機能要件

- Docker コンテナで常時稼働する
- OGP スクレイピングが失敗した場合は「情報を取得できませんでした」Embed を返す
- ストーリーは OGP が取得できない場合があるため、同様にフォールバック Embed を返す

### 対象外

- いいね数の取得（OGP では取得不可のため除外）
- Instagram 公式 API の使用
- Facebook oEmbed API の使用（レート制限・トークン管理のリスクが高く、OGP で十分なため除外）

---

## 技術スタック

| 層 | 選択 |
|---|---|
| Runtime | Node.js 24.16.0 LTS |
| Language | TypeScript 6.0.3 |
| Module System | CommonJS |
| Path Alias | `@/` → `src/`（tsc-alias でビルド時解決） |
| Discord | discord.js v14 |
| HTTP | undici |
| HTML Parse | cheerio |
| Linter | Oxlint |
| Formatter | Oxfmt |
| Test | Vitest |
| Container | Docker + Docker Compose |

---

## アーキテクチャ

### データフロー

```
Discord Message (messageCreate)
        │
        ▼
[URL Detector]
  Instagram URL を正規表現で全件抽出
        │
        ▼
[URL Classifier]
  URL タイプを判別（post / reel / video / account / story / unknown）
        │
        ▼
[Instagram Fetcher]
  OGP Scraper (cheerio) でメタタグを抽出
        │
        ▼
[Embed Builder]
  URL タイプごとに Discord EmbedBuilder を組み立て
        │
        ▼
Discord Channel
  投稿されたチャンネルへ Embed を返送
```

### コンポーネント責務

| コンポーネント | 責務 |
|---|---|
| `bot/client.ts` | Discord クライアント初期化・ログイン |
| `bot/events/messageCreate.ts` | メッセージイベントのエントリーポイント |
| `instagram/detector.ts` | URL 検出・URL タイプ分類 |
| `instagram/fetcher.ts` | OGP スクレイピング・データ正規化 |
| `instagram/types.ts` | 型定義 |
| `embed/builder.ts` | URL タイプごとの Embed 組み立て |
| `config.ts` | 環境変数ロード |

---

## ディレクトリ構成

```
rxInstagram/
├── src/
│   ├── bot/
│   │   ├── client.ts
│   │   └── events/
│   │       └── messageCreate.ts
│   ├── instagram/
│   │   ├── detector.ts
│   │   ├── fetcher.ts
│   │   └── types.ts
│   ├── embed/
│   │   └── builder.ts
│   └── config.ts
├── tests/
│   ├── fixtures/
│   │   ├── post.html
│   │   ├── account.html
│   │   └── empty.html
│   ├── detector.test.ts
│   ├── fetcher.test.ts
│   └── builder.test.ts
├── Dockerfile
├── docker-compose.yml
├── oxlint.json
├── vitest.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 型定義

```typescript
type UrlType = 'post' | 'reel' | 'video' | 'account' | 'story' | 'unknown'

interface InstagramData {
  type: UrlType
  url: string
  title: string
  description: string
  imageUrl: string | null
  authorName: string
  publishedAt: string | null
}
```

---

## Embed フィールド

| フィールド | 取得元 | 備考 |
|---|---|---|
| 画像 | `og:image` | |
| キャプション | `og:description` | |
| アカウント名 | `og:title` / URL パース | |
| 投稿日時 | `article:published_time` | 取得できない場合は省略 |

---

## 情報取得戦略

### OGP スクレイピング

Instagram ページの HTML から `<meta>` タグを抽出する。

```
GET https://www.instagram.com/p/{shortcode}/
  → og:title, og:description, og:image, article:published_time を抽出
```

- `User-Agent` を一般ブラウザに偽装してリクエストする
- Instagram の Bot 対策によりブロックされる可能性がある

### フォールバック

OGP が取得できなかった場合は、以下の Embed を返送する。

```
タイトル: Instagram
説明:    情報を取得できませんでした
URL:     元の Instagram URL
```

---

## 環境変数

| 変数名 | 必須 | 説明 |
|---|---|---|
| `DISCORD_TOKEN` | 必須 | Discord Bot トークン |

---

## Docker

### Dockerfile 方針

- `node:24.16.0-alpine` をベースイメージとする
- マルチステージビルドで本番イメージを軽量化する
- 非 root ユーザーで実行する

### docker-compose.yml 方針

- `restart: unless-stopped` で常時稼働させる
- `.env` ファイルで環境変数を注入する

---

## テスト方針

| 対象 | テスト内容 |
|---|---|
| `detector.ts` | 各 URL タイプの検出・分類が正しいか |
| `fetcher.ts` | OGP パースが正しく動作するか（HTML フィクスチャを使用） |
| `builder.ts` | 各タイプで Embed フィールドが正しく組み立てられるか |

- 外部 HTTP リクエストはモックする
- カバレッジ目標: 80% 以上

---

## 懸念事項

| 事項 | 対応 |
|---|---|
| Stories の OGP 取得失敗 | フォールバック Embed を返す |
| Instagram の Bot 対策 | User-Agent 偽装。ブロックされた場合はフォールバックへ |
| 複数 URL | 全件処理して全件 Embed を返す |
