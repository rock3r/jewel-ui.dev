# Jewel

Jewel brings the IntelliJ IDEs' look to Compose Multiplatform for desktop. It gives you
the same components the IDE uses, so a Compose UI can sit inside an IntelliJ plugin
without looking out of place, or run as a standalone desktop app that borrows the IDE's
design.

Three names appear throughout these docs, and they are not interchangeable:

- **[Int UI](https://www.figma.com/community/file/1227732692272811382/int-ui-kit)** is
  the design system. It is the colours, metrics and component specs, published as a
  Figma kit.
- **[New UI](https://www.jetbrains.com/help/idea/new-ui.html)** is the IntelliJ
  Platform's implementation of Int UI. It is the interface you see in a recent IntelliJ
  IDE.
- **[Islands](https://plugins.jetbrains.com/docs/intellij/supporting-islands-theme.html)**
  is a theme variant with its own palette format. Jewel reads it. See [Islands
  themes](guides/theming.md#islands-themes).

Standalone, Jewel implements Int UI directly. In a plugin it does not: the Swing bridge
reads whatever theme the running IDE has, so your UI follows the user's choice rather
than a fixed copy of the specs.

Jewel requires the JetBrains Runtime. Other JDKs are not supported.

## Start here

There are two ways to use Jewel, and the setup differs enough that they get their own
pages:

- **[In an IntelliJ plugin](start/plugin.md).** Jewel ships inside the IntelliJ
  Platform, so there is no external dependency to add. Your UI reads the IDE's current
  theme and changes with it.
- **[In a standalone app](start/standalone.md).** One dependency and a theme wrapper.
  You get the Int UI look, and full control over how far you take it.

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

`YourScreen` does not change between the two. Design around that: keep IntelliJ
Platform types out of your composables and pass what they need in behind your own
interfaces, and the same UI code runs in a plugin and in a standalone app. You can
test it against the standalone theme without starting the platform. See [Portable
UI](best-practices/portable-ui.md).

## Guides

Task-first pages:

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

- [Components](../components/) — every component, with real screenshots
- [Versions and compatibility](versioning.md) — how versions are numbered, and which
  Jewel goes with which IntelliJ Platform
- [Releases](releases/)
- [API reference](../api/)

## Getting help

Jewel is developed in the open, in the [IntelliJ Community
repository](https://github.com/JetBrains/intellij-community/tree/master/platform/jewel).
Bugs and feature requests go to [YouTrack, project
JEWEL](https://youtrack.jetbrains.com/issues/JEWEL). Questions are welcome in [#jewel on
the Kotlin Slack](https://app.slack.com/client/T09229ZC6/C05T8U2C31T).
