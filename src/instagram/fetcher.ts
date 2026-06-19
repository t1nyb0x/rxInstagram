import * as cheerio from "cheerio";
import type { InstagramData, UrlType } from "@/instagram/types";

const FALLBACK = (url: string, type: UrlType): InstagramData => ({
  type,
  url,
  title: "Instagram",
  description: "",
  imageUrls: [],
  authorName: parseAuthorFromUrl(url, type),
  publishedAt: null,
  likeCount: null,
  commentCount: null,
});

const parseAuthorFromUrl = (url: string, type: UrlType): string => {
  const { pathname } = new URL(url);
  if (type === "account") {
    return pathname.replace(/\//g, "");
  }
  if (type === "story") {
    return pathname.split("/")[2] ?? "";
  }
  return "";
};

const parseAuthorFromTitle = (title: string): string => {
  const patterns = [
    /\(@([A-Za-z0-9_.]+)\)/,
    /^([A-Za-z0-9_.]+)\s+on Instagram\b/,
    /\bby @?([A-Za-z0-9_.]+)\b/i,
    /@([A-Za-z0-9_.]+)/,
    /^(.+?)\s+-\s+Instagram\b/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return "";
};

const ogMeta = ($: ReturnType<typeof cheerio.load>, property: string): string =>
  $(`meta[property="${property}"]`).attr("content") ?? "";

const extractImageUrls = (html: string, ogImage: string): string[] => {
  const matches = html.match(/"display_uri":"(https:[^"]+)"/g) ?? [];
  const urls = [
    ...new Set(
      matches.map((m) =>
        m
          .replace(/"display_uri":"/, "")
          .replace(/"$/, "")
          .replace(/\\/g, ""),
      ),
    ),
  ];
  return urls.length > 0 ? urls : ogImage ? [ogImage] : [];
};

const extractNumber = (html: string, key: string): number | null => {
  const match = html.match(new RegExp(`"${key}":(\\d+)`));
  return match?.[1] !== undefined ? Number(match[1]) : null;
};

// og:description の形式: "{date}、{N} likes, {N} comments - {username}: "{caption}"
const extractCaption = (description: string): string => {
  const match = description.match(/- [^:]+:\s*"?([\s\S]+)$/);
  if (!match?.[1]) return description;
  return match[1].replace(/[".]$/, "").trim();
};

export const fetchInstagramData = async (url: string, type: UrlType): Promise<InstagramData> => {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.9",
      },
    });

    if (!response.ok) return FALLBACK(url, type);

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = ogMeta($, "og:title");
    const rawDescription = ogMeta($, "og:description");
    const description = extractCaption(rawDescription);
    const ogImage = ogMeta($, "og:image");
    const imageUrls = extractImageUrls(html, ogImage);
    const likeCount = extractNumber(html, "like_count");
    const commentCount = extractNumber(html, "comment_count");

    const takenAt = extractNumber(html, "taken_at");
    const publishedAt = takenAt ? new Date(takenAt * 1000).toISOString() : null;

    const authorName = title ? parseAuthorFromTitle(title) : parseAuthorFromUrl(url, type);

    return {
      type,
      url,
      title: title || "Instagram",
      description,
      imageUrls,
      authorName,
      publishedAt,
      likeCount,
      commentCount,
    };
  } catch {
    return FALLBACK(url, type);
  }
};
