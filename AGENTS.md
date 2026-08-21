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
| `build-docs.mjs` | Renders `docs/` to `public/docs/`, no dependencies |
| `public/` | Build output, deployed to Cloudflare Workers |
| `check-links.mjs` | Verifies internal doc links and anchors |
| `update-version.mjs` | Reads the published Jewel version from Maven Central into the page |
| `.github/workflows/` | The daily job that runs it and commits the result |
| `.rumdl.toml` | Markdown formatting config for `docs/` |
| `wrangler.jsonc` | Cloudflare Workers config |

## Before you commit

- Run `rumdl fmt docs` (install with `cargo install rumdl` if missing). It must report
  nothing to fix; `rumdl check docs` must pass. `.rumdl.toml` holds the settings.
- Rebuild what you changed: `node build-site.mjs src/Main.dc.html public` for the landing
  page, `node build-docs.mjs docs public/docs` for the documentation. `public/` is committed.
- Run `node check-links.mjs`. It must report no broken links.
- Adding a documentation page means adding it to `NAV` in `build-docs.mjs`. The build fails
  if a page is on disk but not in the nav, or in the nav but not on disk.
- Keep Markdown lines under 90 characters; rumdl enforces and reflows this. The landing
  page HTML wraps looser.
- Verify every API claim against the Jewel source. Type signatures, default values and
  parameter names drift; Jewel is pre-1.0.
- The Jewel version on the landing page is generated. `update-version.mjs` reads it from
  Maven Central, and a daily workflow commits the bump. Do not hand-edit the `version` and
  `artifact` fields in `src/Main.dc.html`; run `node update-version.mjs` instead.
- Do not hand-copy anything derived from the Jewel repo. Version numbers, release notes and
  the API reference are generated. A hand-maintained version table is what `VERSIONS.md`
  was, and it drifted six releases behind before anyone noticed.

## Docs review loop

Human review happens in a standing pull request,
[#1](https://github.com/rock3r/jewel-ui.dev/pull/1), titled "DO NOT MERGE". Its base branch,
`docs-review-base`, is parked at the commit before the docs landed, so every page shows as an
addition and every line can be commented on. It is a review surface, not a proposed change.
Merging it would write into the throwaway base branch and could not touch `master`.

To act on a round of review:

```bash
gh api repos/rock3r/jewel-ui.dev/pulls/1/comments --jq '.[] | "\(.path):\(.line) \(.user.login): \(.body)"'
```

Apply the comments to the Markdown in `docs/`, rebuild, redeploy, then resolve the threads that
are done. To reset the diff after the docs have moved on, fast-forward `docs-review-base` to the
commit the previous round reviewed and push it; open threads survive.

`public/**` is marked `linguist-generated` in `.gitattributes` so the built site collapses in
that diff rather than burying the pages.

## Automated review

Automated reviews run one page at a time:

```bash
pioneer review --source . --model openrouter/z-ai/glm-5.2 \
  --prompt "Review docs/<page>.md against STYLE.md" --report review.md
```

The JetBrains SDK style guide is one of STYLE.md's sources, but it targets a Writerside
site. Do not apply its markup rules here.
