# Lists, trees and speed search

Jewel lists and trees implement IDE keyboard navigation, range selection, and selection
changes after filtering. Use these components when you need those behaviours in place
of a plain `LazyColumn`.

## Selectable lists

Choose the list component for your selection model:

```kotlin
import androidx.compose.runtime.Composable
import org.jetbrains.jewel.foundation.lazy.MultiSelectionLazyColumn
import org.jetbrains.jewel.foundation.lazy.SingleSelectionLazyColumn
import org.jetbrains.jewel.foundation.lazy.rememberSingleSelectionLazyListState

@Composable
fun Files(paths: List<String>) {
    SingleSelectionLazyColumn(state = rememberSingleSelectionLazyListState()) {
        // items go here
    }
}
```

Import `SingleSelectionLazyColumn` or `MultiSelectionLazyColumn` from
`org.jetbrains.jewel.foundation.lazy`. Create state with the matching
`rememberSingleSelectionLazyListState()` or `rememberMultiSelectionLazyListState()`.

`SelectableLazyColumn` is deprecated. Replace it with the component matching the required
single-selection or multi-selection model.

## Trees

For themed trees, use `LazyTree` from `org.jetbrains.jewel.ui.component`. The ambient
theme supplies its colours and metrics.

To supply every colour and padding value, use `BasicLazyTree` from the foundation module.
This underlying component supplies behaviour without theme styling.

Across Jewel, `foundation` provides behaviour with little styling. The `ui` module builds
themed components on that behaviour.

## Speed search

Wrap a list or tree in `SpeedSearchArea` to add type-to-find. Typing opens a small search
field and highlights matching text in the content.

```kotlin
import org.jetbrains.jewel.ui.component.SpeedSearchArea

SpeedSearchArea {
    // a list or tree here becomes type-to-find
}
```

The search field hides on focus loss when `dismissOnLoseFocus` is `true`, its default.
`SpeedSearchArea` is annotated experimental, so its signature can change.

### Where selection goes when the filter moves

If filtering hides the selected item, an existing selection anchor selects its closest
visible match. Without an anchor, selection scans forward. It chooses the topmost visible
match, then the first match below the viewport. If neither exists, selection wraps to the
first match from the top of the list.

This selection rule preserves position during filtering, matching IDE behaviour.

## Scrollbars

Scrollable containers and scrollbars accept an optional `ScrollbarAdapter`.
Use it to control thumb size and position when scrollable content differs from the
scrollbar's attached container.

```kotlin
import org.jetbrains.jewel.ui.component.VerticallyScrollableContainer

VerticallyScrollableContainer {
    // content
}
```

Use current overloads with an `adapter` parameter. Older overloads without it are
deprecated. The default `null` adapter preserves the previous behaviour.

`ScrollbarVisibility` supports `AlwaysVisible` and `WhenScrolling`. On macOS, Jewel
follows **System Settings → Appearance → Show scroll bars**. Always-visible scrollbars
occupy space beside content. When-scrolling scrollbars overlay the content. Styles control
track thickness, expansion animation, and linger duration.

## See also

- [Theming](theming.md) — styling the components above
- Components — gallery with screenshots (coming soon)
