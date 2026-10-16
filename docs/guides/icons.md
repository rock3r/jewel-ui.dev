# Icons

Load icons by key to use the platform's icon handling. Jewel selects New UI paths, patches
SVG key colours, and chooses dark variants for the current theme. It also selects `@2x`
bitmaps for high-density displays. One composable applies this pipeline.

## Loading an icon

```kotlin
import org.jetbrains.jewel.ui.component.Icon
import org.jetbrains.jewel.ui.icons.AllIconsKeys

Icon(key = AllIconsKeys.General.Add, contentDescription = "Add")
```

Jewel generates `AllIconsKeys` from the platform's `AllIcons`, preserving icon names.
Plugins already have these icons on the classpath. Standalone apps need the icons
artifact. See [Platform icons in a standalone
app](../start/standalone.md#platform-icons).

Match Jewel to the target platform version. Icon paths can change between platform
major versions and sometimes between minor versions.

## Your own icons

Icon keys implement `IconKey` from `org.jetbrains.jewel.ui.icon`. Use `PathIconKey` for a
shared path or `IntelliJIconKey` for separate old and New UI paths:

```kotlin
import org.jetbrains.jewel.ui.icon.IntelliJIconKey
import org.jetbrains.jewel.ui.icon.PathIconKey

object MyIcons {
    // Same icon regardless of UI mode
    val refresh = PathIconKey("icons/refresh.svg", MyIcons::class.java)

    // Different icons for old and new UI
    val run = IntelliJIconKey("icons/run.svg", "icons/expui/run.svg", MyIcons::class.java)
}
```

Supply both paths and a resource-resolving class to `IntelliJIconKey`.
For more than a few dozen icons, generate the holder. Jewel generates its own holders too.

## Painter hints

A `PainterHint` can change an icon path, patch or decorate the image, or leave it
unchanged. Use `PainterHint.None` when a conditional hint needs no effect.

The `org.jetbrains.jewel.ui.painter.hints` package provides these hint functions:

- `Size(size)` or `Size(width, height)` — select a specific icon size
- `Selected(state)` or `Selected(selected)` — the selected variant
- `Stateful(state)` — hover, pressed, disabled, and other component states
- `Badge(color)` — a dot badge over the icon
- `Stroke(color)`, `Dark(isDark)`, `HiDpi()` — the lower-level pieces the defaults use

Both themes install default hints that patch icons at runtime automatically.

### Stateful icons

For state-dependent icons, supply hints and let Jewel choose the resource path.
Use the named `hints` argument for this `vararg`. The positional argument after
`contentDescription` is `modifier`.

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.ui.state.ToggleableState
import org.jetbrains.jewel.foundation.state.SelectableComponentState
import org.jetbrains.jewel.foundation.state.ToggleableComponentState
import org.jetbrains.jewel.ui.component.Icon
import org.jetbrains.jewel.ui.icon.IconKey
import org.jetbrains.jewel.ui.painter.PainterHint
import org.jetbrains.jewel.ui.painter.PainterProviderScope
import org.jetbrains.jewel.ui.painter.PainterSuffixHint
import org.jetbrains.jewel.ui.painter.hints.Selected
import org.jetbrains.jewel.ui.painter.hints.Stateful

private object IndeterminateHint : PainterSuffixHint() {
    override fun PainterProviderScope.suffix(): String = "Indeterminate"
}

interface MyState : SelectableComponentState, ToggleableComponentState

@Composable
fun StatefulIcon(myKey: IconKey, myState: MyState) {
    val indeterminateHint =
        if (myState.toggleableState == ToggleableState.Indeterminate) IndeterminateHint else PainterHint.None

    Icon(
        key = myKey,
        contentDescription = "My icon",
        hints = arrayOf(indeterminateHint, Selected(myState), Stateful(myState)),
    )
}
```

With base path `components/myIcon.svg`, Jewel selects state-specific resources such as
`myIconIndeterminate.svg` or `myIconSelected.svg`. Callers need only the base key and
hints.

### Writing your own hint

Extend a subtype of the sealed `PainterHint` hierarchy. `PainterSuffixHint` and
`PainterPrefixHint` support common path changes. Other hooks patch SVG or XML content,
or wrap the resulting painter.

Include the `PainterProviderScope` receiver when overriding `suffix()`, as shown above.
An override without that receiver fails compilation.

## What the defaults do for you

The default hints apply four behaviours:

- With New UI active, `IntelliJIconKey` selects its New UI path. Both themes also support
  explicit path overrides.
- Jewel replaces SVG key colours with colours from the current theme's palette, using
  the IDE's recolouring mechanism.
- Dark themes add the `_dark` suffix.
- High-density displays select `@2x` bitmap variants. SVGs need no separate variant.

## See also

- [The Swing bridge](swing-bridge.md) — where icon palettes come from in a plugin
- [Theming](theming.md)
