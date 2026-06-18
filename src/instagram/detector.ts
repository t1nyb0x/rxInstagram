import type { UrlType } from "@/instagram/types";

const INSTAGRAM_URL_PATTERN = /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>)]+/g;

const CLASSIFIERS: Array<{ pattern: RegExp; type: UrlType }> = [
  { pattern: /\/p\/[^/]+/, type: "post" },
  { pattern: /\/reel\/[^/]+/, type: "reel" },
  { pattern: /\/tv\/[^/]+/, type: "video" },
  { pattern: /\/stories\/[^/]+\/[^/]+/, type: "story" },
  { pattern: /\/[A-Za-z0-9_.]+\/?$/, type: "account" },
];

export const extractInstagramUrls = (content: string): string[] => {
  const matches = content.match(INSTAGRAM_URL_PATTERN) ?? [];
  return [...new Set(matches)];
};

export const classifyUrl = (url: string): UrlType => {
  const { pathname } = new URL(url);
  for (const { pattern, type } of CLASSIFIERS) {
    if (pattern.test(pathname)) return type;
  }
  return "unknown";
};
