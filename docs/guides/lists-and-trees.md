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

`VerticallyScrollableContainer` and `HorizontallyScrollableContainer` add a themed
scrollbar to content. Each container has two overloads.

For content that does not scroll itself, use the overload that takes a `ScrollState`. The
container scrolls the content. The state defaults to `rememberScrollState()`.

```kotlin
import org.jetbrains.jewel.ui.component.VerticallyScrollableContainer

VerticallyScrollableContainer {
    // content
}
```

For content that scrolls itself, such as a `LazyColumn`, pass the content's state as the
first argument. The container draws the scrollbar and leaves scrolling to the content.

```kotlin
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import org.jetbrains.jewel.ui.component.VerticallyScrollableContainer

val listState = rememberLazyListState()

VerticallyScrollableContainer(listState) {
    LazyColumn(state = listState) {
        // items
    }
}
```

The default scrollbar supports `ScrollState`, `LazyListState` and `LazyGridState`. For any
other state, or when the scrollable content differs from the container's own content, pass
a `ScrollbarAdapter` as `adapter`. The adapter controls the thumb size and position.

`ScrollbarVisibility` supports `AlwaysVisible` and `WhenScrolling`. On macOS, Jewel
follows **System Settings → Appearance → Show scroll bars**. Always-visible scrollbars
occupy space beside content. When-scrolling scrollbars overlay the content. Styles control
track thickness, expansion animation, and linger duration.

## See also

- [Theming](theming.md) — styling the components above
- [Components](components.md) — filterable lists, search fields and group headers
