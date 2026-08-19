# Lists, trees and speed search

The IDE's lists behave in ways people have internalised without noticing: what the arrow
keys do, how a range selects, where selection lands after a filter hides the selected row.
Jewel's list and tree components implement those behaviours, which is most of why they are
worth using over a plain `LazyColumn`.

## Selectable lists

Two entry points, one per selection model:

```kotlin
import org.jetbrains.jewel.foundation.lazy.SingleSelectionLazyColumn
import org.jetbrains.jewel.foundation.lazy.MultiSelectionLazyColumn
import org.jetbrains.jewel.foundation.lazy.rememberSingleSelectionLazyListState

@Composable
fun Files(paths: List<String>) {
    SingleSelectionLazyColumn(state = rememberSingleSelectionLazyListState()) {
        // items go here
    }
}
```

`SingleSelectionLazyColumn` and `MultiSelectionLazyColumn` live in
`org.jetbrains.jewel.foundation.lazy`, and each has a matching state factory:
`rememberSingleSelectionLazyListState()` and `rememberMultiSelectionLazyListState()`.

If you find `SelectableLazyColumn` in older code or examples, it is deprecated in favour of
these two. Choosing the component that matches your selection model, rather than
configuring one that does both, is the point of the split.

## Trees

Use `LazyTree` from `org.jetbrains.jewel.ui.component`. It takes its colours and metrics
from the ambient theme, which is almost always what you want.

`BasicLazyTree`, in the foundation module, is the unstyled version underneath. Use it only
if you are building your own styled tree and want to supply every colour and padding
yourself.

The same split runs through Jewel generally: `foundation` holds behaviour without strong
styling, `ui` holds the themed components built on top.

## Speed search

`SpeedSearchArea` gives a list or tree the IDE's type-to-find behaviour: start typing, a
small search field appears, and matches are highlighted in place.

```kotlin
import org.jetbrains.jewel.ui.component.SpeedSearchArea

SpeedSearchArea {
    // a list or tree here becomes type-to-find
}
```

`dismissOnLoseFocus` controls whether the search field hides when it loses focus, and
defaults to `true`. `SpeedSearchArea` is annotated experimental — the behaviour is solid,
but the signature can change.

### Where selection goes when the filter moves

This is the part that is difficult to get right, and Jewel does it for you.

When the filter changes and the selected item no longer matches, selection does not simply
vanish or jump to the top. If there is still a selection anchor, the closest visible match
to it is selected. Otherwise the rule is a forward scan: the topmost visible match, or
failing that the first match below the viewport, wrapping around to the first match
from the top of the list.

The effect is that filtering feels like it keeps your place, which is exactly what the IDE
does and what people expect without being able to say why.

## Scrollbars

Scrollable containers and scrollbars take an optional `ScrollbarAdapter`, which lets you
control thumb sizing and positioning when the scrollable content is not what the scrollbar
is nominally attached to.

```kotlin
import org.jetbrains.jewel.ui.component.VerticallyScrollableContainer

VerticallyScrollableContainer {
    // content
}
```

The overloads without an `adapter` parameter are deprecated; the current ones default it to
`null`, which behaves as before.

Scrollbar appearance is not a Jewel choice. `ScrollbarVisibility` has two shapes,
`AlwaysVisible` and `WhenScrolling`, and on macOS Jewel reads the user's
**System Settings → Appearance → Show scroll bars** preference and follows it — including
the layout consequence, since an always-visible scrollbar sits beside the content while a
when-scrolling one is overlaid on top of it. Track thickness, expand animation and linger
duration are all part of the style rather than hardcoded.

## See also

- [Theming](theming.md) — styling the components above
- [Components](../../components/) — every component, with screenshots
