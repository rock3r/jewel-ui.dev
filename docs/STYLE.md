# Docs style guide

Maintainer note for whoever — human or agent — writes or revises the user-facing docs
published at <https://jewel-ui.dev/docs/>. This file is not published; it is a reference
for writers.

Adapted from the Spectre docs style guide, which these docs follow deliberately: same
voice, same standard of evidence.

## The rules that catch the most regressions

1. **Verify every API claim against source before writing.** Type signatures, default
   values, parameter names, visibility and behaviour drift the moment you stop checking.
   Read the `.kt` file before claiming what an API does. Jewel is pre-1.0 and moves.
2. **Code samples must compile mentally.** Imports at the top of the block, before any
   statement. No phantom APIs, no invented companion functions, no wrong packages. If a
   sample uses an extension function, import it explicitly.
3. **No milestone language in public prose.** No "coming in 0.41", no YouTrack issue
   numbers, no speculation about future APIs. The docs describe what ships now.
4. **Be honest about pre-release state where it affects the reader, neutral elsewhere.**
   Jewel is below 1.0 and APIs move. Say so where it changes what someone should do —
   choosing between a stable and an experimental API, or pinning a version. Do not
   apologise for it on every page, and do not sell.
5. **Do not leak implementation detail into user pages.** Readers care about the public
   contract: what they call, what they get, what behaviour to expect. They do not care
   about visibility modifiers or how the implementation achieves the contract. If you
   are about to write "the implementation does X", ask whether X is load-bearing for
   the reader or whether you are narrating source. If it is narration, cut it.
6. **Anything derived from the Jewel repo is generated, never hand-copied.** Version
   tables, release notes, the skills list and the API reference come from the source at
   build time. If you find yourself typing a version number into a guide, stop.

## Writing for the reader

- **Audience: someone adding Compose UI to an IntelliJ plugin, or building a desktop app,
  for the first time.** They know Kotlin and have a Gradle project. They have not used
  Jewel. They do not care about its internal history.
- **Lead with the task, not the architecture.** "Show a button that matches the IDE"
  comes before "what a theme owns". Mental-model pages are allowed, but the entry points
  are the two getting-started tracks.
- **Tone is precise, slightly dry, comfortable with technical detail.** Do not oversell.
  Do not apologise.
- **Show, do not enumerate.** A working sample beats a bullet list of signatures. If you
  must list APIs, link each one to a sample or to the API reference.
- **Cross-link liberally.** A reader on the icons guide should not have to guess where
  painter hints are explained.

## Jewel-specific invariants worth re-checking

Re-verify these whenever you touch the corresponding page; they are the claims most
likely to be wrong or to have drifted.

- **The JetBrains Runtime is required.** Not "recommended". Other JDKs are unsupported,
  and `DecoratedWindow` fails outright without it.
- **Two themes, one component set.** `SwingBridgeTheme` in a plugin, `IntUiTheme`
  standalone. Everything inside the theme content is the same API either way — that
  portability is the single most useful thing to tell a reader, so keep it accurate.
- **Stable versus experimental API.** Stable APIs guarantee binary compatibility;
  experimental ones are best-effort and annotated. Never document an experimental API
  without saying so.
- **Deprecated APIs are removed after roughly two IntelliJ Platform majors.** Do not
  document a deprecated API as if it were current.
- **A standalone release reaches Maven Central only when the IJP build containing it is
  built.** Release notes on master can describe changes that are in neither Central nor
  any IntelliJ build yet. Say this on the releases page; it is a real source of confusion.
