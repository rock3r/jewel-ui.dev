# Swing interop

Compose and Swing can share a window. Getting them to composite cleanly rather than fight
over z-order takes one call, and in the common plugin cases Jewel makes it for you.

## In a plugin

For a tool window, use `addComposeTab`. It creates the panel, wraps your content in
`SwingBridgeTheme`, and switches on the newer Swing rendering pipeline.

```kotlin
import org.jetbrains.jewel.bridge.addComposeTab

toolWindow.addComposeTab("My tab") {
    MyPanel()
}
```

For anything else — a dialog, a settings page, an editor notification — build the component
with `JewelComposePanel`:

```kotlin
import org.jetbrains.jewel.bridge.JewelComposePanel

val component = JewelComposePanel {
    MyPanel()
}
```

It returns a `JComponent` you can drop wherever Swing expects one, and it applies
`SwingBridgeTheme` for you, so the content follows the IDE's theme without further work.

Both take `focusOnClickInside`, which defaults to `true` and controls whether clicking
inside the Compose area moves focus into it. Leave it alone unless you have a reason.

There is also `JewelComposeNoThemePanel`, which applies no theme at all. It exists for the
case where you supply a completely custom theme yourself, and it is not what you want
otherwise — a panel with no theme has no colours to draw with.

## In a standalone app

Nothing here is bridge-specific if you are embedding Compose into an existing Swing desktop
app. Call `enableNewSwingCompositing()` before you create any `ComposePanel`:

```kotlin
import org.jetbrains.jewel.foundation.enableNewSwingCompositing

fun main() {
    enableNewSwingCompositing()
    // … create your ComposePanel
}
```

It sets a system property that switches Compose to rendering through the Swing graphics
pipeline, which is what keeps the two toolkits in the same z-order. Because it is a system
property, set it before the first panel is created; setting it later has no effect on
panels that already exist.

`enableNewSwingCompositing()` is annotated experimental.

## The cost

The newer pipeline has a known performance caveat: infinitely repeating animations are more
expensive under it than they would otherwise be. That is a Compose Multiplatform issue
requiring changes in the Java runtime, not something Jewel can work around.

In practice this rarely bites, because IDE UI is not usually animating continuously. If you
have an always-running spinner in a panel that is always visible, this is where the cost
comes from.

## See also

- [In an IntelliJ plugin](../start/plugin.md) — the tool window path end to end
- [The Swing bridge](swing-bridge.md) — Swing compatibility mode, and what it affects
