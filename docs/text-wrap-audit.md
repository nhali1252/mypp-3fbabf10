# Text-wrap / overflow audit — `${date:2026-05-11}`

Cross-checked every Card, Hero, and section component against the global rules
in `src/styles.css`:

- `h1-h6 { text-wrap: balance; overflow-wrap: break-word; hyphens: auto }`
- `p, li, blockquote, dd { text-wrap: pretty; overflow-wrap: break-word }`
- `html, body, #root, main { overflow-x: clip }`
- `a[href], code, kbd, samp, var, .break-token { overflow-wrap: anywhere }`
- `input, textarea, select { min-width: 0; max-width: 100% }`

## Result: clean

No component overrides `text-wrap`, `word-break`, or `hyphens` inline (zero
matches for `textWrap`, `wordBreak` in `style={{}}`). The base-layer rules
inherit through every Card, Hero, and section.

## Intentional exceptions (do not touch)

These all use `truncate` or `whitespace-nowrap`, which by design bypass the
balance/pretty defaults — that is correct for single-line UI labels:

| Pattern | Where | Why |
|---|---|---|
| `truncate` on names/titles | Footer apps, Portfolio cards, Reviews/Services list rows, Feed badges, Admin tables (Media, PWA, Launcher, Comments, Audit, Users, Theme, Heading-shimmer) | Single-line ellipsis on user-supplied strings — must not wrap. |
| `whitespace-nowrap` on pills | EducationSection year pill, Feed filter pill, SocialIcons hover label, button/select/tab primitives | Pill chips would look broken if they wrapped. |
| `whitespace-nowrap` on tickers | `Ticker.tsx`, Hero/HeroF watermarks | Marquee animations require a single line. |
| `line-clamp-N` | `SeoPreview` | Constrained 2-line preview cards. |

## Pseudo-headings (`<div>` with display sizes)

Only one match site-wide: `AboutSection.tsx:103` — a numeric stat
(`<div className="text-2xl font-black font-numeric">`). Numeric stats are
short single tokens; balance/pretty are no-ops here. No change needed.

## Recommendation

System is healthy. No code changes required from this audit. Future PRs that
introduce new large-text `<div>`s for body/heading copy should use the
semantic `<h*>` tag instead so they inherit the rhythm + balance rules.
