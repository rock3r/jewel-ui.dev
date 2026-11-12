# Components

This page covers `FilterableLazyColumn`, `SearchTextField`, `SearchArea` and
`GroupHeader`. These components use the current theme's styles. The same code works inside
`SwingBridgeTheme` in a plugin and inside `IntUiTheme` in a standalone app.

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
`textContent` function that returns the text to match. `item()` and `stickyHeader()` also
take a required `key`. An item with `null` text shows
only when the search field is empty. Sticky headers are not selectable by default.

`onSelectedIndexesChange` reports indexes in the full, unfiltered list. When the filter
changes, the list keeps the selection on items that are still visible. When nothing
matches, the search field shows its error state.

The list uses `SelectionMode.Single` by default. To change the selection mode, pass
`selectionMode`. To read or clear the search text, pass a `searchState` from
`rememberSearchAreaState()`. Read the text from `searchState.searchText`. To clear the
text and hide the field, call `searchState.clearAndHide()`.

`FilterableLazyColumn` and `rememberSearchAreaState()` are annotated experimental. For
type-to-find that highlights matches without hiding items, see
[Speed search](lists-and-trees.md#speed-search).

## Add a search field

`SearchTextField` is a text field with a search icon and a clear button. Create its state
with `rememberSearchTextFieldState()`. Read the current text from `state.searchText`.

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

The placeholder shows the text "Search". To change the placeholder, pass a composable to
`placeholder`. To hide the clear button, set `allowClear` to `false`.

The `history` list holds earlier searches that your app keeps. When the list is not empty,
the search icon changes to a history icon. Clicking the icon or pressing **Alt+Down**
(**Option+Down** on macOS) opens the history popup. Selecting an entry puts its text in
the field.

To show a search field above existing content only while the user searches, wrap the
content in `SearchArea`. The field appears when its text is not empty. **Escape** clears
the text and hides the field.

```kotlin
import androidx.compose.foundation.focusable
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.onPreviewKeyEvent
import org.jetbrains.jewel.foundation.ExperimentalJewelApi
import org.jetbrains.jewel.ui.component.SearchArea
import org.jetbrains.jewel.ui.component.Text
import org.jetbrains.jewel.ui.component.rememberSearchAreaState

@OptIn(ExperimentalJewelApi::class)
@Composable
fun SearchablePanel() {
    val searchState = rememberSearchAreaState()

    SearchArea(state = searchState) {
        Text(
            "Results for \"${searchState.searchText}\"",
            Modifier.onPreviewKeyEvent(searchState::processKeyEvent).focusable(),
        )
    }
}
```

`SearchArea` does not open the field by itself. To open the field when the user types,
forward key events from your focused content to `searchState.processKeyEvent()`, as the
sample does. You can also set the text through `searchState.textFieldState`.

`SearchTextField`, `SearchArea`, `SearchAreaState` and `rememberSearchAreaState()` are
annotated experimental.

## Show a toggle switch

`OnOffButton` is the IntelliJ Platform toggle switch. It draws the platform's toggle
images, so it follows the theme's toggle colours.

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import org.jetbrains.jewel.ui.component.OnOffButton

@Composable
fun AutoSaveToggle() {
    var autoSave by remember { mutableStateOf(true) }

    OnOffButton(checked = autoSave, onCheckedChange = { autoSave = it })
}
```

The button has a fixed size that includes room for the focus ring. Gaining focus does not
change the layout. A disabled button cannot take focus. Accessibility services see the
button as a switch.

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

To add content before the title or after the divider, pass `startComponent` or
`endComponent`. To draw the divider in its disabled colour, set `enabled` to `false`.

## See also

- [Lists, trees and speed search](lists-and-trees.md) — selection and type-to-find
- [Menus and popups](menus-and-popups.md) — menu combo boxes and popup menus
- [Theming](theming.md) — the styles these components read
