# Design language

The visual system for jewel-ui.dev. The landing page (`src/Main.dc.html`) is the reference
implementation; the docs site follows it so both read as one site.

The palette is not invented. Greys and blues are taken from Jewel's generated
`DefaultColorPalette`, and the button and link roles from the Int UI stylings. When a value
here looks arbitrary, it is a real Int UI token. Do not "improve" it.

## Theming

Themes are switched by a `data-theme` attribute on `.page`, not by media query alone, so the
toggle is instant. Dark is the default. The user's choice is stored in `localStorage` under
`jewel-theme`, falling back to `prefers-color-scheme`.

Define every colour as a token. Never put a colour's only definition inside a theme block.

## Colour tokens

| Token | Dark | Light | Role |
|---|---|---|---|
| `--bg` | `#1E1F22` | `#FFFFFF` | window background |
| `--panel` | `#2B2D30` | `#F7F8FA` | tool window, panel, code background |
| `--line` | `#393B40` | `#EBECF0` | dividers |
| `--line-strong` | `#4E5157` | `#C9CCD6` | Int UI outlined border |
| `--btn-border` | `#6F737A` | `#818594` | CTA border, 3:1 contrast |
| `--fg` | `#DFE1E5` | `#27282E` | primary text |
| `--fg-2` | `#B4B8BF` | `#494B57` | secondary text |
| `--fg-3` | `#9DA0A8` | `#6C707E` | tertiary text, 4.5:1 |
| `--accent` | `#3574F0` | `#3574F0` | default button background |
| `--accent-hover` | `#366ACE` | `#3369D6` | button hover |
| `--accent-press` | `#375FAD` | `#315FBD` | button pressed |
| `--link` | `#6B9BFA` | `#315FBD` | link text |
| `--on-accent` | `#FFFFFF` | `#FFFFFF` | text on accent |

Syntax highlighting uses `--kw`, `--str`, `--fn`, `--com` and `--num`, matching the IntelliJ
editor colour schemes.

## Type

Three families, loaded from Google Fonts. Always give a real fallback stack.

- **Archivo** (500/600/700) for display and headings. Class `.display`.
- **Inter** (400/500/600) for body text. The default on `.page`.
- **JetBrains Mono** (400/500/700) for code and figures. Class `.mono`, with
  `font-variant-numeric: tabular-nums`.

Sizes cluster at 12.5, 13.5, 14.5, 15, 17 and 19px. Headings are Archivo 600 with
`letter-spacing: -0.01em`. Running text sits near 65 characters; the landing page caps prose
at `56ch`.

## Layout

- Content maximum is `1200px`. Docs prose columns should be narrower.
- `.page` sets `container-type: inline-size`, so use container queries rather than viewport
  queries for component-level responsiveness.
- Radii: `4px` for small controls, `6px` for buttons and inputs, `8px` for cards and panels.
- Scrollbars are thin and themed: `scrollbar-color: var(--line-strong) transparent`.

## Rules

- **Never recolour the Jewel logo.** It ships as-is, and the favicon is the logo unmodified.
- Wide content (tables, code, diagrams) scrolls inside its own `overflow-x: auto` container.
  The page body must never scroll sideways.
- Give keyboard focus a visible state, and respect `prefers-reduced-motion`.
- No external requests beyond Google Fonts. Inline CSS and JS; embed assets.
