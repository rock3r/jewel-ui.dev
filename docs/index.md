# Jewel

Jewel provides IntelliJ-style components for Compose Multiplatform desktop UI.
Use them in an IntelliJ plugin to match the IDE, or in a standalone desktop app.

These docs use three names for related parts of the IDE's design:

- **[Int UI](https://www.figma.com/community/file/1227732692272811382/int-ui-kit)** is
  the design system. It is the colours, metrics and component specs, published as a
  Figma kit.
- **[New UI](https://www.jetbrains.com/help/idea/new-ui.html)** is the IntelliJ
  Platform's implementation of Int UI. It is the interface you see in a recent IntelliJ
  IDE.
- **[Islands](https://plugins.jetbrains.com/docs/intellij/supporting-islands-theme.html)**
  is a theme variant with its own palette format. Jewel reads it. See [Islands
  themes](guides/theming.md#islands-themes).

In standalone apps, Jewel implements Int UI directly. In plugins, the Swing bridge reads
the running IDE's theme. Plugin UI therefore follows the user's selected theme.

Run Jewel on the JetBrains Runtime. Other JDKs have no support.

## Start here

Choose the setup guide for your application:

- **[In an IntelliJ plugin](start/plugin.md).** Declare the Jewel modules bundled with
  the IntelliJ Platform. Your UI follows the IDE's current theme.
- **[In a standalone app](start/standalone.md).** Add the standalone dependency and a
  theme wrapper. Use the default Int UI appearance or supply custom theme values.

## Jewel Tooling

[Jewel Tooling](tooling/index.md) helps Compose UI authors inspect code in IntelliJ IDEA.
It estimates each `@Composable` parameter's stability. It also records composition
activity during local development runs.

## Both environments share the component API

Use the same component API inside either theme wrapper. The wrapper selects the source
of theme values for the environment:

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

Both wrappers call the same `YourScreen`. Keep IntelliJ Platform types outside
composables and pass data through your own interfaces. The UI can then run in plugins,
standalone apps, and tests without a running IDE. See [Portable
UI](best-practices/portable-ui.md) for the boundaries and rendering differences.

## Guides

Use these guides for specific tasks:

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

- Components — gallery with real screenshots (coming soon)
- [Versions and compatibility](versioning.md) — how versions are numbered, and which
  Jewel goes with which IntelliJ Platform
- [Releases](https://github.com/JetBrains/intellij-community/blob/master/platform/jewel/RELEASE%20NOTES.md)
- [API reference](../api/)

## Getting help

Google and JetBrains develop Jewel in the [IntelliJ Community
repository](https://github.com/JetBrains/intellij-community/tree/master/platform/jewel).
Report bugs and request features in [YouTrack's JEWEL
project](https://youtrack.jetbrains.com/issues/JEWEL). Ask questions in [#jewel on the
Kotlin Slack](https://kotlinlang.org/community/).
