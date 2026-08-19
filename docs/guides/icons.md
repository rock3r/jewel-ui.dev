# Icons

Ask Jewel for an icon by key and it does what the IDE does: picks the New UI path,
patches the SVG's key colours for the current theme, selects the dark variant, and uses
the `@2x` bitmap when the display warrants it. You call one composable. The pipeline is
the same one the platform uses.

## Loading an icon

```kotlin
import org.jetbrains.jewel.ui.component.Icon
import org.jetbrains.jewel.ui.icons.AllIconsKeys

Icon(key = AllIconsKeys.General.Add, contentDescription = "Add")
```

`AllIconsKeys` is generated from the platform's `AllIcons`, so anything the IDE ships is
available by the name you already know. In a plugin, it needs no setup. The icons are on
the classpath. Standalone, add the icons artifact. See [Platform icons in a standalone
app](../start/standalone.md#platform-icons).

Because icon paths shift between platform versions, use a Jewel version that matches the
platform you target. Icons move between majors, and occasionally between minors.

## Your own icons

An icon key is anything implementing `IconKey`, from `org.jetbrains.jewel.ui.icon`. Two
implementations cover almost everything:

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

`IntelliJIconKey` takes both paths *and* the class used to resolve the resource. If you
have more than a few dozen icons, generate the holder rather than writing it out. Jewel
generates its own the same way.

## Painter hints

A `PainterHint` influences the loading pipeline. A hint can change the path, patch the
image, decorate it, or do nothing at all. `PainterHint.None` exists precisely so you can
pass a hint unconditionally and let it opt out.

The most useful ones live in `org.jetbrains.jewel.ui.painter.hints` and are functions,
not types you construct:

- `Size(size)` or `Size(width, height)` — select a specific icon size
- `Selected(state)` or `Selected(selected)` — the selected variant
- `Stateful(state)` — hover, pressed, disabled and friends, from a component state
- `Badge(color)` — a dot badge over the icon
- `Stroke(color)`, `Dark(isDark)`, `HiDpi()` — the lower-level pieces the defaults use

Both themes install a default set of hints, so runtime patching happens without you
asking for it.

### Stateful icons

When the icon depends on component state, pass the hints and let Jewel resolve the path.
Note the named `hints` argument: it is a `vararg`, and the positional slot after
`contentDescription` is `modifier`, so hints must be named.

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

Given a base path of `components/myIcon.svg`, that resolves to the right file for the
state — `myIconIndeterminate.svg`, `myIconSelected.svg` and so on — without you naming
any of them.

### Writing your own hint

`PainterHint` is sealed, so you extend one of its sub-hierarchies rather than
implementing it directly. `PainterSuffixHint` and `PainterPrefixHint` handle path
manipulation, which covers most cases. There are also hooks for patching SVG and XML
content, and for wrapping the resulting painter.

The one thing to watch: `suffix()` is declared on `PainterProviderScope`, so your
override needs the receiver, as in the sample above. Writing `override fun suffix()`
without it does not compile.

## What the defaults do for you

Four behaviours run automatically, and knowing they exist saves you reimplementing them:

- **New UI path swapping.** With the New UI active, `IntelliJIconKey` resolves its
  new-UI path. Both themes also support overriding paths outright.
- **Palette replacement.** SVG key colours are swapped for the current theme's palette,
  the same mechanism the IDE uses to recolour its icons.
- **Dark variants.** A `_dark` suffix is appended when the theme is dark.
- **`@2x` bitmaps.** For bitmap icons, the `@2x` variant is chosen when the density
  warrants it. SVGs need no equivalent.

## See also

- [The Swing bridge](swing-bridge.md) — where icon palettes come from in a plugin
- [Theming](theming.md)
