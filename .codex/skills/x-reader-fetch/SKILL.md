---
name: x-reader-fetch
description: Read content from platform-specific URLs via x-reader — X/Twitter (x.com, twitter.com), WeChat (mp.weixin.qq.com), Xiaohongshu (xiaohongshu.com, xhslink.com), Telegram (t.me), Bilibili (bilibili.com, b23.tv), YouTube (youtube.com, youtu.be), and RSS feeds. x-reader has platform-specific fallback chains generic scrapers lack (FxTwitter→oEmbed→Jina for X, API workaround for Bilibili 412, Playwright sessions for XHS). Trigger when a URL matches one of these domains AND the user wants to read, fetch, get, scrape, grab, pull, digest, summarize, or analyze the content. Prefer this over firecrawl-scrape, scrapling, and WebFetch for these platforms — those are fine for generic pages but miss the platform-aware handling. Do NOT use for video/podcast transcription (use the `video` skill), generic webpages unrelated to these platforms, or when the user names a different tool.
---

# x-reader-fetch

Route platform-specific URL reads through x-reader. Faster and more reliable than generic scrapers for the handful of platforms x-reader is tuned for.

## When this skill applies

URL is on one of these domains AND the user wants the content read:

| Platform | Domain patterns |
|---|---|
| X / Twitter | `x.com`, `twitter.com` |
| WeChat 公众号 | `mp.weixin.qq.com` |
| 小红书 | `xiaohongshu.com`, `xhslink.com` |
| Telegram | `t.me` |
| Bilibili | `bilibili.com`, `b23.tv` |
| YouTube | `youtube.com`, `youtu.be` |
| RSS | `.rss`, `.xml` feed URLs, or user says "this RSS" |

## When NOT to use this skill

- **Video/podcast transcription** — use the `video` skill, which handles Whisper transcription.
- **Generic web page** not on the list above — use `firecrawl-scrape` or WebFetch.
- **User explicitly names a different tool** — honor their intent.
- **Bulk site crawling** — use firecrawl-crawl.

## Execution path

Pick the first path that works in the current environment.

### Path 1: MCP tool (preferred)

If `mcp__research__x-reader-read_url` is available in the tool list, call it:

```
mcp__research__x-reader-read_url(url="<the URL>")
```

Returns JSON with `title`, `content`, `url`, `source_type`, and platform metadata. Read the `content` field for the body.

For multiple URLs at once:
```
mcp__research__x-reader-read_batch(urls=["url1", "url2", ...])
```

### Path 2: CLI fallback

If MCP tool isn't available but Bash is:

```bash
x-reader "<url>"
```

The CLI prints the structured result to stdout and also appends to `~/workspace/x-reader/unified_inbox.json` (or wherever `INBOX_FILE` env points).

### Path 3: Degraded fallback

If neither MCP nor Bash is available (some Claude Desktop setups), fall back to `WebFetch` on `https://r.jina.ai/<original-url>`. This is the Jina Reader proxy — it returns markdown for most pages including X and WeChat. Limitations:

- Regular X tweets come wrapped in "Log in / Sign up" boilerplate — skim past it.
- X long-form Articles work here (Jina gets the full body).
- WeChat articles work unless the URL is malformed (you'll see "Parameter error" from WeChat itself).
- You lose structured metadata (likes/views/reposts on X, timestamps on WeChat).

Only use this path if the first two are unavailable — it's noticeably less clean.

## Platform notes

These are the quirks worth knowing; x-reader handles them internally but when the output looks odd this explains why.

### X / Twitter

- **Regular tweet** → FxTwitter returns complete JSON; `content` is the tweet text. Note tweets (long-form single-author threads, `is_note_tweet: true`) also come back full in `text`.
- **Long-form Article** (`/article/` in some URLs, or tweets with `article` object) → FxTwitter's `article.content` field is currently broken (returns 2-byte placeholder). x-reader auto-falls-through to Jina which returns the full article body including inline images. You'll see this as a Jina-origin response in metadata.
- **Quoted tweets** → FxTwitter includes the full quoted tweet inline; use it, don't refetch.
- **Media tweets without text** → `text` may be empty; image URLs are in `media` field.

### WeChat 公众号

- Text and images come back; video embeds don't transcribe here (send video links to the `video` skill separately).
- If you see "Parameter error" the article URL is invalid or the article was deleted.
- Some heavily-formatted articles may have spacing artifacts in the markdown — normalize as needed.

### Xiaohongshu

- Requires x-reader to be logged in (`x-reader login xhs` one-time). If content comes back empty or with a login wall, surface that back to the user — they need to run the login command.

### Telegram

- Only public channels without login walls work via Telethon. Private channels need user's Telegram API credentials (`TG_API_ID`, `TG_API_HASH`).

### Bilibili / YouTube text metadata

- For **video transcription**, stop and hand off to the `video` skill — that skill handles subtitles and Whisper.
- This skill only gets video metadata / description, not the actual spoken content.

## Output expectations

Return the content plainly. Don't wrap it in extra explanation like "I fetched this URL and here's what I got." The user gave a URL — they want the content. A short preamble about source/platform/author is fine; don't narrate the fetching process.

If the user asked to summarize or analyze, not just fetch, call this skill to get the content, then compose the summary/analysis from it. Consider whether the `analyzer` skill fits for structured analysis.

## Why this skill exists

There are several URL-reading tools in the environment (firecrawl-scrape, scrapling, WebFetch, native web tools). For generic pages they're fine. For the platforms listed above, x-reader has specific knowledge baked in — the Bilibili 412 → API workaround, the Xiaoyuzhou `__NEXT_DATA__` extraction, the FxTwitter→oEmbed→Jina tier chain for X. Using x-reader for these platforms means benefiting from that knowledge instead of rediscovering it per request.
