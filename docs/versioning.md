# Versions and compatibility

Each standalone artifact version contains a Jewel API version and an IntelliJ Platform
build number. Use the API version to check compatibility. The build number identifies
the platform used to compile the artifact.

## Reading a version

```text
{{artifact}}
└─┬──┘ └────┬────┘
  │         └─ the IntelliJ Platform build it was compiled against
  └─────────── the Jewel version
```

The Jewel version determines binary compatibility across supported IntelliJ Platform
versions and standalone apps. Artifacts with the same Jewel version expose the same API.

The suffix identifies the platform build. Plugin artifacts must match their target
platform. Standalone apps can use an artifact with a recent platform suffix.

Each entry in the
[release notes](https://github.com/JetBrains/intellij-community/blob/master/platform/jewel/RELEASE%20NOTES.md)
lists the minimum supported platform version and the Compose Multiplatform version used
to build the release.
[Maven Central](https://central.sonatype.com/namespace/org.jetbrains.jewel) lists the
published artifacts.

Plugins declare bundled modules without either number. The selected platform supplies
its own Jewel version.

## Branches, and what "supported" means

Jewel's main branch targets the newest IntelliJ Platform. When a platform major enters
the Early Access Program (EAP), maintainers create `releases/xxx` for that major.
Main then targets the next platform. Maintainers cherry-pick fixes into release branches
as needed.

These branches have two support rules:

- **Only the latest build of each platform major is supported.** If the newest 253 build
  is 2025.3.3, that is the one Jewel is guaranteed to work on. Earlier 253 builds may
  work and are not tested.
- **The standalone Int UI theme is released only from main.** Release branches
  deliberately do not include the `int-ui` module, so the standalone theme always
  behaves like the newest platform major.

Maintainers release from a tag on main. They then tag each release branch's head for
its platform major.

## What is stable, and what is not

Jewel remains below 1.0. Continuous integration (CI) checks API changes against this
policy.

**Stable APIs.** Jewel guarantees binary compatibility. Code compiled against these APIs
continues to work across releases.

**Experimental APIs.** Maintainers preserve binary compatibility when possible without
guaranteeing it. Annotations identify these APIs. Plan for possible changes before using
them in critical code.

**Deprecated APIs.** Maintainers usually remove these after about two IntelliJ Platform
major releases. Release notes include a migration guide for each removal.

**Source compatibility.** Maintainers make a best effort, with guarantees mainly for
named-parameter calls. Positional calls are more likely to break when a function gains
parameters.

CI tracks stable and experimental APIs for each release. Unintended changes fail the
build.

## Why the release notes can be ahead of what you can use

Release notes describe changes on main. Publication to Maven Central happens when the
IntelliJ Platform build containing the standalone release is built. Writing release
notes does not publish artifacts.

The following versions can therefore differ:

- what main is working towards,
- what the newest release note describes,
- what you can actually resolve from Maven Central.

Before adding a dependency for a documented fix, confirm its publication on [Maven
Central](https://central.sonatype.com/namespace/org.jetbrains.jewel). For plugins, check
which platform build contains the fix.

## Picking a version

**Standalone.** Choose the newest Maven Central artifact with a recent platform suffix.
Standalone apps have no required platform version. The suffix records the compilation
platform.

**Plugin.** Select a target platform version and declare its bundled modules. Use the
Jewel version that platform supplies. To get a Jewel fix, target a platform build that
contains it.

**Android Studio.** Studio bundles Jewel and Compose Multiplatform on its classpath,
usually at older versions. Shadow your Jewel and Compose dependencies while targeting
Studio versions with these bundled libraries.
