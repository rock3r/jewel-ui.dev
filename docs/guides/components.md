# Components

This page covers Jewel components that the other guides do not. The components use the
current theme's styles. The same code works inside `SwingBridgeTheme` in a plugin and
inside `IntUiTheme` in a standalone app.

## Filter a list as the user types

`FilterableLazyColumn` combines a selectable list with a search field. Typing while the
list has focus opens the search field. The list then shows only the items whose text
contains the search text, ignoring case.

```kotlin
import androidx.compose.runtime.Composable
import org.jetbrains.jewel.foundation.ExperimentalJewelApi
import org.jetbrains.jewel.ui.component.FilterableLazyColumn
import org.jetbrains.jewel.ui.component.Text

@OptIn(ExperimentalJewelApi::class)
@Composable
fun Languages(languages: List<String>, onSelect: (String) -> Unit) {
    FilterableLazyColumn(
        onSelectedIndexesChange = { indexes -> indexes.firstOrNull()?.let { onSelect(languages[it]) } },
    ) {
        items(languages, textContent = { it }) { language -> Text(language) }
    }
}
```

The `items()`, `item()` and `stickyHeader()` functions in the content take a
`textContent` function that returns the text to match. An item with `null` text shows
only when the search field is empty. Sticky headers are not selectable by default.

`onSelectedIndexesChange` reports indexes in the full, unfiltered list. When the filter
changes, the list keeps the selection on items that are still visible. When nothing
matches, the search field shows its error state.

The list is single-selection by default. Pass `selectionMode` to change it. To read or
clear the search text, pass a `searchState` from `rememberSearchAreaState()`.

`FilterableLazyColumn` is annotated experimental. For type-to-find that highlights matches
without hiding items, see [Speed search](lists-and-trees.md#speed-search).

## Add a search field

`SearchTextField` is a text field with a search icon and a clear button. Create its state
with `rememberSearchTextFieldState()` and read the current text from `searchText`.

```kotlin
import androidx.compose.runtime.Composable
import org.jetbrains.jewel.foundation.ExperimentalJewelApi
import org.jetbrains.jewel.ui.component.SearchTextField
import org.jetbrains.jewel.ui.component.rememberSearchTextFieldState

@OptIn(ExperimentalJewelApi::class)
@Composable
fun FindField(recentSearches: List<String>) {
    val state = rememberSearchTextFieldState()

    SearchTextField(state = state, history = recentSearches)
}
```

The placeholder text is "Search" unless you pass a `placeholder`. Set `allowClear` to
`false` to hide the clear button.

The `history` list holds earlier searches that your app keeps. When the list is not empty,
the search icon changes to a history icon. Clicking it or pressing **Alt+Down**
(**Option+Down** on macOS) opens the history popup. Selecting an entry puts its text in
the field.

To show a search field above existing content only while the user searches, wrap the
content in `SearchArea`. The field appears when its text is not empty. **Escape** clears
the text and hides the field.

```kotlin
import androidx.compose.runtime.Composable
import org.jetbrains.jewel.foundation.ExperimentalJewelApi
import org.jetbrains.jewel.ui.component.SearchArea
import org.jetbrains.jewel.ui.component.Text
import org.jetbrains.jewel.ui.component.rememberSearchAreaState

@OptIn(ExperimentalJewelApi::class)
@Composable
fun SearchablePanel() {
    val searchState = rememberSearchAreaState()

    SearchArea(state = searchState) {
        Text("Results for \"${searchState.searchText}\"")
    }
}
```

`SearchArea` does not open the field by itself. Forward key events from your content to
`searchState.processKeyEvent()`. You can also set the text through
`searchState.textFieldState`. `FilterableLazyColumn` forwards key events this way.

`SearchTextField`, `SearchArea` and their state functions are annotated experimental.

## Label a group of controls

`GroupHeader` draws a title followed by a horizontal divider. IntelliJ Platform settings
pages use it to separate groups of options. Its Swing equivalent is `TitledSeparator`.

```kotlin
import androidx.compose.runtime.Composable
import org.jetbrains.jewel.ui.component.GroupHeader

@Composable
fun AppearanceHeader() {
    GroupHeader("Appearance")
}
```

Pass `startComponent` or `endComponent` to add content before the title or after the
divider. Set `enabled` to `false` to draw the divider in its disabled colour.

## See also

- [Lists, trees and speed search](lists-and-trees.md) — selection and type-to-find
- [Theming](theming.md) — the styles these components read
