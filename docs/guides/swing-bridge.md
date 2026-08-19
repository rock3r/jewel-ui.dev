# The Swing bridge

Inside the IDE, Jewel does not approximate the current theme. It reads it.

`SwingBridgeTheme` pulls colours, typography, metrics and icon palettes out of the running
IntelliJ Platform's Swing look and feel, and supplies them to Compose as a Jewel theme. The
user switches to the dark theme, installs a theme from the Marketplace, or bumps the IDE
font size, and your Compose UI follows — with no mapping table on your side to maintain.

```kotlin
import androidx.compose.runtime.Composable
import org.jetbrains.jewel.bridge.theme.SwingBridgeTheme

@Composable
fun MyPanel() {
    SwingBridgeTheme {
        // Jewel components here look like the rest of the IDE
    }
}
```

`SwingBridgeTheme` is annotated experimental. It is nonetheless the only way to theme a
plugin, and what every Jewel-based plugin uses; treat the annotation as a warning that its
signature can change, not that it is unfinished.

## What it actually reads

Worth knowing, because it tells you what will and will not follow the theme.

**Colours** come from the platform's named colour keys, via `JBColor`. If a theme defines
a key through the standard theming mechanism, the bridge picks it up.

**Metrics** — sizes, insets, and the like — come from `UIManager`, scaled through the
platform's own scaling so your panel matches the IDE's density rather than guessing at it.

**Typography** comes from `JBFont`: the label font and its size variants, and the heading
scale. Editor and console styles come from the editor colour scheme, which is why a code
view in your plugin can use the font the user actually chose for the editor.

**Icon palettes** come from the active `UITheme`, so icons are recoloured for the theme the
same way the IDE recolours its own.

It also keeps listening. The bridge subscribes to look-and-feel changes, UI settings
changes and editor colour scheme changes, so a theme switch updates a live Compose panel
rather than requiring a restart.

## What it cannot do

A theme that works by supplying custom Swing component implementations, rather than by
declaring values through the standard theming mechanism, cannot be mirrored. There is
nothing to read: the appearance lives in painting code, not in values. Those themes are
not supported and cannot be.

This is rarely a problem in practice — themes on the Marketplace overwhelmingly use the
standard mechanism — but it is the honest boundary.

## Swing compatibility mode

The bridge enables Jewel's Swing compatibility mode. It affects text rendering so Compose
text lines up with Swing text in the same window, which matters when your Compose panel
sits next to Swing components.

You do not switch this on yourself in a plugin; `SwingBridgeTheme` does it. It is worth
knowing about because it is one of the reasons the same composable can look very slightly
different standalone and in the IDE — see the caveat in
[Portable UI](../best-practices/portable-ui.md).

## The relationship to the standalone theme

`SwingBridgeTheme` and `IntUiTheme` are interchangeable at the call site. Both establish a
Jewel theme; everything inside the content lambda is the same API. The difference is where
the values come from: the bridge reads them from the running IDE, while `IntUiTheme`
carries the Int UI specs as data.

That means a plugin's UI code is not bridge-specific. If you keep IntelliJ Platform types
out of your composables, the same screen renders standalone — which is the basis for
testing it without starting the platform. [Portable UI](../best-practices/portable-ui.md)
covers how to arrange that.

## See also

- [In an IntelliJ plugin](../start/plugin.md) — setup and the tool window entry point
- [Theming](theming.md) — the standalone side, and customising either
- [Swing interop](swing-interop.md) — mixing Compose and Swing in one window
