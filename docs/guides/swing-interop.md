# Swing interop

Compose and Swing can share a window with consistent z-order. Enable the newer Swing
rendering pipeline before creating panels. Jewel's tool window helper enables it
automatically.

## In a plugin

Call `addComposeTab` for tool windows. This helper creates a panel with `SwingBridgeTheme`
and enables the newer Swing rendering pipeline.

```kotlin
import org.jetbrains.jewel.bridge.addComposeTab

toolWindow.addComposeTab("My tab") {
    MyPanel()
}
```

Use `JewelComposePanel` for dialogs, settings pages, and editor notifications.
Enable the rendering pipeline before creating the panel:

```kotlin
import org.jetbrains.jewel.bridge.JewelComposePanel
import org.jetbrains.jewel.foundation.enableNewSwingCompositing

enableNewSwingCompositing()
val component = JewelComposePanel {
    MyPanel()
}
```

`JewelComposePanel` returns a `JComponent` for use in Swing containers.
It applies `SwingBridgeTheme` so content follows the IDE theme.

Both helpers accept `focusOnClickInside`, with default `true`. This setting moves focus
into the Compose area when the user clicks inside it. Change it only when needed.

If you supply a complete custom theme, use `JewelComposeNoThemePanel`.
It applies no theme itself. Content without any theme has no drawing colours.

## In a standalone app

When embedding Compose in a standalone Swing app, call `enableNewSwingCompositing()`
before creating the first `ComposePanel`:

```kotlin
import org.jetbrains.jewel.foundation.enableNewSwingCompositing

fun main() {
    enableNewSwingCompositing()
    // … create your ComposePanel
}
```

The function sets a system property to render Compose through Swing's graphics pipeline.
This pipeline keeps the toolkits in the same z-order. Existing panels ignore later
changes to the property.

`enableNewSwingCompositing()` is annotated experimental.

## The cost

Infinitely repeating animations cost more with the newer pipeline. Resolving this Compose
Multiplatform issue requires Java runtime changes. Jewel cannot work around it.

IDE UI usually has few continuous animations, so this cost rarely affects typical panels.
Always-visible, continuously running spinners can expose it.

## See also

- [In an IntelliJ plugin](../start/plugin.md) — the tool window path end to end
- [The Swing bridge](swing-bridge.md) — Swing compatibility mode, and what it affects
