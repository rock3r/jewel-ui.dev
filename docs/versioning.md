# Versions and compatibility

Jewel is versioned twice over: once for its own API, and once for the IntelliJ Platform
build it was compiled against. Both numbers are in every standalone artifact, and they
answer different questions.

## Reading a version

```
0.39.1-262.9437.29
└─┬──┘ └────┬────┘
  │         └─ the IntelliJ Platform build it was compiled against
  └─────────── the Jewel version
```

**The Jewel version is the one that governs compatibility.** It determines binary
compatibility of the Jewel APIs, both across supported IntelliJ Platform versions and in
standalone use. If two artifacts share a Jewel version, they expose the same API.

**The suffix identifies the platform build.** It matters when you are writing a plugin,
because the artifact has to match the platform you target. It is largely noise when you
are writing a standalone app, where you just want a recent one.

Each entry in the [release notes](releases/) records the minimum supported platform version and
the Compose Multiplatform version that release was built against. For what is actually
published, [Maven Central](https://central.sonatype.com/namespace/org.jetbrains.jewel) is the
authoritative list.

In a plugin you never write either number. The modules come from the platform, so the
platform's version decides which Jewel you get.

## Branches, and what "supported" means

Jewel's main branch develops against the newest IntelliJ Platform. When a new major
platform version enters EAP, a `releases/xxx` branch is cut, where `xxx` is the platform
major it tracks. Main then moves on to the next platform, and fixes are cherry-picked back
into the release branches that need them.

Two consequences are worth knowing:

- **Only the latest build of each platform major is supported.** If the newest 253 build
  is 2025.3.3, that is the one Jewel is guaranteed to work on. Earlier 253 builds may work
  and are not tested.
- **The standalone Int UI theme is released only from main.** Release branches deliberately
  do not include the `int-ui` module, so the standalone theme always behaves like the
  newest platform major.

Releases are cut from a tag on main, and each release branch's head is then tagged for its
platform major.

## What is stable, and what is not

Jewel is below 1.0. That does not mean everything moves without warning — the policy is
explicit, and CI enforces it rather than relying on care.

**Stable APIs.** Binary compatibility is guaranteed. Code compiled against a stable API
keeps working across releases.

**Experimental APIs.** Kept binary-compatible wherever possible, but with no hard promise.
They are annotated, so you can always tell which side of the line you are on. Do not build
something load-bearing on one without expecting to revisit it.

**Deprecated APIs.** Typically removed after about two major IntelliJ Platform bumps. That
gives you roughly two platform releases of warning, and the release notes carry a migration
guide whenever something goes.

**Source compatibility.** Best effort, and mainly guaranteed for named-parameter usage.
Call sites written the idiomatic way are the ones most protected; positional calls into
functions that gain parameters are the ones most likely to break.

Both the stable and experimental API surfaces are tracked per release, and an unintended
change fails the build. A break has to be a decision.

## Why the release notes can be ahead of what you can use

This one catches people out, so it is worth stating plainly.

The release notes live on main and describe what has landed there. A standalone release is
published to Maven Central at the same time the IntelliJ Platform build containing it is
built — not when the note is written.

So at any given moment there can be three different answers to "what version is Jewel":

- what main is working towards,
- what the newest release note describes,
- what you can actually resolve from Maven Central.

Reading a note about a fix and concluding it is available is an easy mistake. If you need
to know whether something has shipped, check
[Maven Central](https://central.sonatype.com/namespace/org.jetbrains.jewel) — that is the
only answer that means you can depend on it today. For a plugin, the equivalent question is
which platform build contains it.

## Picking a version

**Standalone.** Take the newest artifact on Maven Central whose platform build suffix is
recent. You are not bound to any particular platform; the suffix only tells you what it was
compiled against.

**Plugin.** Do not pick. Target a platform version, declare the bundled modules, and take
whatever Jewel that platform ships. If you need a Jewel fix, you need the platform build
that contains it.

**Android Studio.** Studio ships its own, usually older, copy of Jewel and Compose for
Desktop on the classpath. Targeting Studio means shadowing your Jewel and Compose
dependencies until that stops being true.
