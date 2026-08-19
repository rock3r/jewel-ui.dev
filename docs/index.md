# Jewel

Jewel implements the IntelliJ Platform's New UI in Compose for Desktop. It gives you the
same components the IDE uses, built to the Int UI specs, so a Compose surface can sit
inside an IntelliJ plugin without looking like a guest — or run as a standalone desktop
app that borrows the IDE's design.

Jewel requires the JetBrains Runtime. Other JDKs are not supported.

## Start here

There are two ways to use Jewel, and the setup differs enough that they get their own
pages:

- **[In an IntelliJ plugin](start/plugin.md).** Jewel ships inside the IntelliJ Platform,
  so there is no external dependency to add. Your UI reads the IDE's current theme and
  changes with it.
- **[In a standalone app](start/standalone.md).** One dependency and a theme wrapper. You
  get the Int UI look, and full control over how far you take it.

## Past the theme, it is one codebase

The two tracks differ in exactly one place: which theme composable wraps your UI.
Everything inside that wrapper is the same API either way.

```kotlin
// In a plugin
SwingBridgeTheme {
    YourScreen(state, onAction)
}

// In a standalone app
IntUiTheme(isDark = true) {
    YourScreen(state, onAction)
}
```

`YourScreen` does not change between the two. That is worth designing around: if you keep
IntelliJ Platform types out of your composables and pass what they need in behind your own
interfaces, the same UI code runs in a plugin and in a standalone app — and can be tested
against the standalone theme without starting the platform. See
[Portable UI](best-practices/portable-ui.md).

## Guides

Task-first pages for the things people actually do:

- [Theming](guides/theming.md) — the Int UI theme, and how to change it
- [The Swing bridge](guides/swing-bridge.md) — how a plugin follows the IDE's theme
- [Icons](guides/icons.md) — icon keys, platform icons, and painter hints
- [Typography and fonts](guides/typography.md) — text styles, including the editor font
- [Lists, trees and speed search](guides/lists-and-trees.md)
- [Rendering Markdown](guides/markdown.md)
- [Decorated windows](guides/decorated-windows.md) — the IDE's title bar, in your app
- [Swing interop](guides/swing-interop.md) — mixing Compose and Swing in one window
- [Code highlighting](guides/code-highlighting.md)

## Reference

- [Components](../components/) — every component, with screenshots from the real thing
- [Versions and compatibility](versioning.md) — how versions are numbered, and which
  Jewel goes with which IntelliJ Platform
- [Releases](releases/)
- [API reference](../api/)

## Getting help

Jewel is developed in the open, in the
[IntelliJ Community repository](https://github.com/JetBrains/intellij-community/tree/master/platform/jewel).
Bugs and feature requests go to [YouTrack, project JEWEL](https://youtrack.jetbrains.com/issues/JEWEL).
Questions are welcome in
[#jewel on the Kotlin Slack](https://app.slack.com/client/T09229ZC6/C05T8U2C31T).
