# Writing style guide

For whoever writes or revises the user-facing docs published at
<https://jewel-ui.dev/docs/>, human or agent. This file is not published.

Voice and standard of evidence are adapted from the Spectre docs style guide. The prose
rules below come from four sources, listed in [Sources](#sources).

Readers are developers using Jewel to build a plugin or a desktop app. Many do not speak
English natively. Aim for simple and concise, but never at the cost of precision or
completeness. Be economical and straightforward.

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
6. **Anything derived from the Jewel repo is generated, never hand-copied.** Release notes,
   the skills list and the API reference come from the source at build time. If you find
   yourself typing a version number into a guide, stop. A hand-maintained version table is
   what `VERSIONS.md` was, and it drifted six releases behind before anyone noticed. Do not
   recreate it here.

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

## Prose rules

### Above all else

1. **Cut every word that does no work.** If the sentence survives without a word, the word
   goes. "In order to" is "to". "It is important to note that" is nothing.
2. **Use the short, everyday word.** "Use", not "utilize". "Help", not "facilitate". A long
   word has to buy its length with precision.
3. **When a rule makes a sentence worse, fix it another way or leave it alone.** A sentence
   that follows every rule and sounds machine-written has failed.

### Sentences

- One instruction per sentence. One thought per sentence everywhere else.
- Split instructions over ~20 words, and other sentences over ~25.
- Active voice. Catch "is/are/was/were + past participle" and name the actor. Passive is
  fine only when the actor is unknown or does not matter.
- Put the condition before the instruction: "To delete the document, click Delete."
- Put the common case first, exceptions after.
- Write instructions as commands, never as narration.
- Cut adverbs, or use a stronger verb.
- Never "simply", "easy", "just" or "quickly" in a procedure. If it were simple, the reader
  would not be here.
- Mix sentence lengths on purpose. One thought per sentence does not mean one length per
  sentence.

### Ambiguity

This section matters most, because most readers are not native English speakers.

- Keep "only" and "not" next to the word they change.
- Break up long noun strings. "The proto import budget check script" becomes "the script
  that checks the proto-import budget".
- Every "it", "they" and "this" must point at one obvious thing. Never use "this" or "which"
  to point at a whole clause. Repeat the noun when in doubt.
- Do not drop verbs from parallel clauses.
- Keep "the", "a" and "that" where they make a sentence parse one way.
- Use periods, not semicolons. Replace an em dash with a new sentence.
- No slashes. Write "a, b, or both", not "a/b".
- **No idioms, colloquialisms, Latin abbreviations or metaphors.** This is the single
  biggest trap. Not "reaches for", "catches people out", "fiddly", "out of the box",
  "under the hood", "i.e.", "e.g.".
- Call each thing by one name, everywhere.

### Second person

Second person is allowed but rationed. Follow Google: address the reader as "you", in the
present tense. Do not drift into a conversational register.

Keep "you" where it carries an instruction or a condition. Cut it where it is doing rapport,
reassurance or editorialising: "If you have ever wanted…", "You do not have to…", "you can
always…", "which is almost always what you want", "worth knowing", "this catches people out".

### Structure

- Headings carry the point, not just the topic. Sentence case. One h1 per page.
- Numbered lists for sequences, bullets for everything else.
- Introduce a list with a complete sentence. Keep items parallel.
- Link text says where the link goes. Never "click here", never a bare URL.
- Code in code font. Every fence carries a language tag.
- Method names take empty parens: `bar()`. Refer to `Foo`, not "the `Foo` interface".

### Words that read as machine-written

Replace: "carries" as a general-purpose verb, "honest" for an API or a test,
"load-bearing", "genuinely", "surface" in the abstract sense, "serves as", "boasts",
"delve", "crucial", "pivotal", "showcase", "underscore", "testament", "seamless", "robust".

Say what it does, not how it feels. If a sentence could appear unchanged in another
project's docs, it says nothing about this one. Cut it.

## Settled questions

Do not re-open these. Each one gets flagged by a reviewer every time, and each time the
answer is the same.

- **British spelling is deliberate** and used consistently: colour, behaviour, customising.
  The only American spellings are Kotlin parameter names such as `color`, which mirror the
  real API and must not change.
- **"annotated experimental"**, never "marked experimental". It names the mechanism.
- **Em dashes split by kind.** The `[Link] — one-line description` convention in "See also"
  and index lists is intentional. Only split dashes that separate a sentence's subject from
  its verb.
- **Keep `deliberately`** where it marks design intent rather than accident. Keep "test
  harness", a term of art. Keep the `It proves` / `It does not prove` pair in
  `best-practices/testing.md`, a deliberate parallel.
- The definition-list sentence fragments in `versioning.md` are a deliberate repeated
  device. Do not rewrite them into full sentences.
- **"Compose Multiplatform"**, never "Compose for Desktop" or "CfD". The old name is
  retired; the official docs use "Compose Multiplatform" and plain "desktop".

## Naming

- **Int UI** is the design system, published as a Figma kit.
- **New UI** is the IntelliJ Platform's implementation of Int UI.
- **Islands** is a theme variant with its own palette format.
- **IntelliJ Platform** in full on first use per page.

## Review checklist

1. Is each page one Diataxis mode, with links where modes meet?
2. Is every instruction a command, with its condition in front?
3. Does any sentence carry two instructions or two thoughts? Split it.
4. Can any word be cut without losing meaning? Cut it.
5. Is "only" next to the word it changes? Does every "it" point at one thing?
6. Does each thing have exactly one name across the docs?
7. Would a developer say these words out loud?
8. Are all symbols, paths and versions real at this commit?

## Sources

- [`technical-writing`](https://github.com/cursor/plugins/blob/main/pstack/skills/technical-writing/SKILL.md)
  — Diataxis, Google developer style, Simplified Technical English, Global English.
- [`unslop`](https://github.com/cursor/plugins/blob/main/pstack/skills/unslop/SKILL.md)
  — the slop-pattern catalog.
- [JetBrains SDK style guide](https://plugins.jetbrains.com/docs/intellij/sdk-style.html)
  — **but** it targets their Writerside site. Its rules about `<control>`, `<ui-path>`,
  `<path>`, `{style="note"}` and `%gh-ic%` do not apply here. This site is Markdown with
  `!!! warning` admonitions.
- [claudeisms](https://github.com/archiewood/claudeisms) — a word-frequency list. A prompt
  to look, not a ban list. "ships", "published", "renders" and "resolves" are correct
  software English and stay.
