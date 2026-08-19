# Agent and contributor guide

This repository holds [jewel-ui.dev](https://jewel-ui.dev): the landing page for
[Jewel](https://github.com/JetBrains/intellij-community/tree/master/platform/jewel), and the
user documentation.

Read the guide that matches what you are about to change. Both are binding.

- **[STYLE.md](STYLE.md)** — the writing style guide. Read it before writing or revising
  anything under `docs/`. It carries the prose rules, the settled questions that reviewers
  raise repeatedly, and the naming conventions.
- **[DESIGN.md](DESIGN.md)** — the design language. Read it before touching markup or CSS.
  The colour tokens are real Int UI values, not choices to revisit.

## Layout

| Path | What it is |
|---|---|
| `src/Main.dc.html` | Landing page source, a Design Component |
| `build-site.mjs` | Renders `Main.dc.html` to static HTML |
| `docs/` | User documentation, Markdown |
| `public/` | Build output, deployed to Cloudflare Workers |
| `check-links.mjs` | Verifies internal doc links and anchors |
| `wrangler.jsonc` | Cloudflare Workers config |

## Before you commit

- Run `node check-links.mjs`. It must report no broken links.
- Keep Markdown lines under 90 characters. The landing page HTML wraps looser.
- Verify every API claim against the Jewel source. Type signatures, default values and
  parameter names drift; Jewel is pre-1.0.
- Do not hand-copy anything derived from the Jewel repo. Version numbers, release notes and
  the API reference are generated. A hand-maintained version table is what `VERSIONS.md`
  was, and it drifted six releases behind before anyone noticed.

## Reviewing docs

Reviews run one page at a time:

```bash
pioneer review --source . --model openrouter/z-ai/glm-5.2 \
  --prompt "Review docs/<page>.md against STYLE.md" --report review.md
```

The JetBrains SDK style guide is one of STYLE.md's sources, but it targets a Writerside
site. Do not apply its markup rules here.
