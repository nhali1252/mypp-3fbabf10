# Animation & Visual-Effect Guidelines

A small budget keeps the site fast, consistent, and forgiving on mobile. Use
the tokens — never hard-code milliseconds or blur radii in components.

## Sources of truth

| What | Where | Use it from |
|------|-------|-------------|
| CSS durations, easings, blur caps | `src/styles.css` (`--dur-*`, `--ease-*`, `--blur-*`, `--backdrop-blur-*`) | Tailwind classes, raw CSS, inline `style`. |
| JS twin (framer-motion, rAF) | `src/lib/motion-budget.ts` | React components, hooks. |

Both auto-scale at the `≤640px` breakpoint, so writing one component covers
phone, tablet, and desktop.

## Hard caps

| Effect | Desktop | Mobile |
|--------|---------|--------|
| One-shot transition (fade, slide, scale) | ≤ 1200 ms | ≤ 600 ms |
| Loop animation per cycle | ≥ 1000 ms | ≥ 1600 ms (no fast strobing) |
| `filter: blur()` radius | ≤ 140 px | ≤ 60 px |
| `backdrop-filter: blur()` | ≤ 24 px | ≤ 8 px |
| Concurrent `Infinity`-repeat motions in viewport | ≤ 6 | ≤ 2 |

Exceeding a cap on `import.meta.env.DEV` triggers a console warning via
`assertWithinBudget()` so regressions show up before review.

## Patterns

### CSS / Tailwind

```css
.card {
  transition: transform var(--dur-base) var(--ease-smooth);
}
.bloom {
  filter: blur(var(--blur-lg)); /* 60 px desktop, 48 px mobile */
}
```

### framer-motion

```tsx
import { useMotionBudget } from "@/lib/motion-budget";

const m = useMotionBudget();
return (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: m.duration.base / 1000, ease: m.ease.smooth }}
  />
);
```

### Reduced motion

`useMotionBudget()` collapses every duration to ~1 ms when the user has
`prefers-reduced-motion: reduce`. CSS automatically does the same via the
existing global rule in `styles.css`. **Do not** branch on reduced-motion in
component code — let the budget handle it.

## Don'ts

- ❌ `transition: all 1.2s ease-in-out` — pick a duration token and animate
  specific properties only.
- ❌ `backdrop-blur-3xl` on a fixed/sticky surface (kills scroll FPS on Android).
- ❌ Multiple infinite `framer-motion` loops sharing the same scroll viewport.
- ❌ Animating `filter`, `box-shadow`, or layout properties in a tight loop —
  prefer `transform` + `opacity`.

## Adding a new effect

1. Pick the closest existing token. If nothing fits, add it to the `@theme`
   block in `styles.css` **and** to `src/lib/motion-budget.ts`.
2. Verify mobile: open the preview at ≤640 px, confirm no jank, no stuck blur.
3. If it loops, double-check the cycle is ≥ 1.6 s on mobile and there are no
   more than 2 active loops on screen.
