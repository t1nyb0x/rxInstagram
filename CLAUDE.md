# CLAUDE.md

## 概要

Discord に投稿された Instagram URL を検出し、OGP スクレイピングで情報を取得して同チャンネルに Embed 投稿する Discord Bot。

詳細設計: @docs/DESIGN.md

---

## コマンド

```bash
npm test                  # テスト実行
npm run test:coverage     # カバレッジ付きテスト（目標 80%）
npm run build             # tsc + tsc-alias でビルド
npm run lint              # Oxlint
npm run fmt               # Oxfmt
docker compose up -d --build  # 本番起動
```

---

## アーキテクチャ

```
messageCreate
  → extractInstagramUrls()   # URL 抽出（重複除去）
  → classifyUrl()            # タイプ判別
  → fetchInstagramData()     # OGP スクレイピング
  → buildEmbed()             # Embed 組み立て
  → channel.send()
```

### コンポーネント

| ファイル | 責務 |
|---|---|
| `src/instagram/detector.ts` | URL 検出・タイプ分類 |
| `src/instagram/fetcher.ts` | OGP スクレイピング・データ正規化 |
| `src/instagram/types.ts` | `InstagramData`, `UrlType` の型定義 |
| `src/embed/builder.ts` | Discord EmbedBuilder 組み立て |
| `src/bot/events/messageCreate.ts` | Discord イベントハンドラ |
| `src/bot/client.ts` | Discord クライアント起動 |
| `src/config.ts` | 環境変数ロード |

---

## 重要な実装メモ

### Instagram のスクレイピング

- **モバイル UA 必須**: デスクトップ UA だと Instagram が CSR ページを返し OGP タグが含まれない
- **取得先**:
  - `og:title` → アカウント名
  - `og:description` → キャプション（自動生成プレフィックスを `extractCaption()` で除去）
  - `og:image` → 単一画像のフォールバック
  - `display_uri` (JSON) → 複数画像（カルーセル対応）
  - `like_count`, `comment_count` (JSON) → いいね数・コメント数
  - `taken_at` (Unix 秒 JSON) → 投稿日時

### Embed の仕様

- 画像は最大4枚（Discord の同一 URL グルーピング上限）
- 5枚以上の場合はメイン Embed のフッターに「他 n 枚 • 日時」を表示
- 日時は JST フォーマット（`Asia/Tokyo`）
- いいね数は1万以上で「1.2万」形式

### パスエイリアス

`@/` → `src/` にマップ。ビルド時に `tsc-alias` が解決する。Vitest は `vitest.config.ts` の `resolve.alias` で解決。

### テスト

- 外部 HTTP リクエストは `vi.stubGlobal('fetch', ...)` でモック
- `tests/fixtures/*.html` に実際の Instagram HTML を模したフィクスチャを配置
- `tests/fixtures/post.html` には `like_count`, `comment_count`, `taken_at` の JSON も含む

---

## 環境変数

| 変数名 | 必須 | 説明 |
|---|---|---|
| `DISCORD_TOKEN` | 必須 | Discord Bot トークン |

Discord Developer Portal で **Message Content Intent** を有効化すること。

---

## 注意事項

- Instagram CDN URL は署名されているため `stp` パラメータを書き換えると画像が取得できなくなる（試行済み、リバート済み）
- Facebook oEmbed API は除外（レート制限・トークン管理のコストに対して得られる情報が少ない）
