# The Swing bridge

`SwingBridgeTheme` creates a Jewel theme from the running IntelliJ Platform's Swing look
and feel. It supplies colours, typography, metrics, and icon palettes to Compose.
Plugin UI follows dark mode, Marketplace themes, and IDE font changes without a separate
mapping table.

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

`SwingBridgeTheme` is annotated experimental because its signature can change. It is the
only plugin theme entry point, and every Jewel-based plugin uses it. The annotation
does not describe feature completeness.

## Theme values

The bridge reads these theme values:

- Colours come from named platform keys through `JBColor`. The bridge reads keys that
  themes define through the standard theming mechanism.
- Metrics, including sizes and insets, come from `UIManager`. Platform scaling makes
  them match the IDE's density.
- UI typography comes from `JBFont`, including label size variants and heading styles.
  Editor and console styles follow the editor colour scheme and the user's font choice.
- Icon palettes come from the active `UITheme`. Icons use the IDE's recolouring mechanism.

The bridge listens for look-and-feel, UI settings, and editor colour scheme changes.
These changes update an open Compose panel without a restart.

## What it cannot do

The bridge cannot mirror themes that implement custom Swing painting instead of standard
theme values. Painting code exposes no values for Compose to read. Those themes have
no support.

Most Marketplace themes use the standard mechanism and fall within the bridge's support
boundary.

## Swing compatibility mode

Jewel's Swing compatibility mode adjusts text rendering to align Compose and Swing text
within the same window. The bridge enables this mode for plugin panels.

`SwingBridgeTheme` needs no manual compatibility setting. This mode can make the same
composable look slightly different in standalone apps and the IDE. See [Portable
UI](../best-practices/portable-ui.md) for testing limits.

## The relationship to the standalone theme

Both `SwingBridgeTheme` and `IntUiTheme` wrap the shared Jewel component API.
The bridge reads values from the running IDE. `IntUiTheme` uses Int UI specifications
stored as data.

Keep IntelliJ Platform types outside composables to render the same screen standalone.
This separation also supports tests without starting the platform. Follow [Portable
UI](../best-practices/portable-ui.md) to structure that boundary.

## See also

- [In an IntelliJ plugin](../start/plugin.md) — setup and the tool window entry point
- [Theming](theming.md) — the standalone side, and customising either
- [Swing interop](swing-interop.md) — mixing Compose and Swing in one window
