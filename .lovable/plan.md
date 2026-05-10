
# Spec audit — what exists vs what's missing

I went through the entire 586-line spec and checked each requirement against your current codebase + database. Below is the status. We will then fix missing items **one by one**, in the order listed.

Legend: ✅ done · ⚠️ partial · ❌ missing

## Admin panel
| # | Requirement | Status |
|---|---|---|
| A1 | Welcome animation duration setting (default 2000ms) | ⚠️ field exists (`welcome_animation_ms`) but default is **600**, not 2000 |
| A2 | Homepage motion on/off toggle | ✅ `default_motion_pref` |
| A3 | Section visibility on/off | ✅ `section_visibility` jsonb (need admin UI to confirm wired) |
| A4 | Favicon upload/change | ✅ `favicon_url` |
| C  | Reviews CRUD + publish/hide + rating | ✅ `testimonials` table + `/admin/reviews` |
| D  | Portfolio folders / nested subfolders / CRUD | ✅ `portfolio_folders.parent_id` |
| D  | Draft state for portfolio items | ❌ no `status`/`draft` column — only `active` boolean |
| E  | Drag-and-drop reorder (folders, subfolders, items) | ⚠️ `sort_order` exists; need to confirm DnD UI |
| F  | Multi-file upload inside a folder | ❌ MediaPicker is single-file; no bulk uploader in `/admin/portfolio` |
| G  | Watermark text (admin-saved, applied to public samples) | ⚠️ per-item `watermark_text` exists; **no global** watermark text setting; public watermark overlay component exists for feed only |
| H  | Reactions enable/disable + show count toggle | ⚠️ `reactions_enabled` exists; **no "show count" toggle** |
| I/M | Sidebar + top bar + breadcrumbs, visual separation | ⚠️ sidebar exists; no top bar with breadcrumbs |

## Public website
| # | Requirement | Status |
|---|---|---|
| A | Welcome animation uses admin duration | ⚠️ uses `welcome_animation_ms` but default 600 |
| B | About "Discover More" CTA disabled | ✅ already removed in `Hero.tsx` |
| C | Smooth hover for About / Contact nav | ⚠️ verify in `Nav.tsx` |
| D | Lora font for all numeric text | ✅ `.font-numeric` utility exists; need to **apply it** to counters/stats sitewide |
| E | Service "Start a Project" preselects that service in form | ❌ `openHireMe()` takes no argument; no preselect |
| F | Reviews homepage section | ✅ exists |
| G | Entire portfolio folder/card clickable | ⚠️ verify on `portfolio.tsx` |
| H | Image lightbox/modal preview | ⚠️ verify |
| I | Public reactions follow admin toggle | ⚠️ verify wiring |
| J | Watermark on published public samples | ❌ portfolio public images don't render watermark overlay (only feed does) |
| K | Homepage reflects admin section visibility / motion | ⚠️ verify wiring |
| L | Contact section colors match site theme | ⚠️ visual review |

## Implementation order (1-by-1)

I'll tackle them in the order below, asking for your "next" before moving on so nothing gets bundled. Each step = one focused change + verification.

1. **A1**: Change welcome animation default to 2000ms (DB + admin UI default)
2. **G (global watermark)**: Add `watermark_text` to `site_settings`; admin field in Settings
3. **J**: Apply that watermark to public portfolio sample images (lightbox + cards)
4. **F**: Multi-file upload in `/admin/portfolio` (folder view) with previews + draft state
5. **D (draft)**: Add `status` (draft/published) column to `portfolio_items` + admin publish/unpublish action
6. **E (DnD)**: Drag-and-drop reorder for folders, subfolders, items
7. **E (CTA)**: Services "Start a Project" → HireMe modal opens with that service preselected
8. **H**: Reaction "show count" toggle in admin + public respect
9. **I/M**: Admin top bar + breadcrumbs with visual separation from sidebar
10. **D (Lora apply)**: Apply `.font-numeric` to all numeric UI (stats, counters, percentages, ratings)
11. **K/G public visibility**: Verify homepage section visibility + motion + reaction toggles all read live admin state
12. **L**: Contact section color polish to match theme
13. **C (Nav hover)**: Polish About/Contact nav hover micro-interaction

If you want a different order or want to skip any, tell me. Otherwise on approval I'll start with **#1 (welcome animation default = 2000ms)** and stop after each step for you to confirm before moving to the next.
