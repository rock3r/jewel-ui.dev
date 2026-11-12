# Menus and popups

To choose an option from a menu, use `MenuComboBox`. To open a menu from any control,
use `PopupMenu`. For other floating content, use `Popup`.

## Choose an option from a menu

`MenuComboBox` shows a label and opens a menu when the user clicks the combo box.
`MenuComboBox` replaces the deprecated `Dropdown`.

```kotlin
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.jetbrains.jewel.foundation.ExperimentalJewelApi
import org.jetbrains.jewel.ui.component.MenuComboBox
import org.jetbrains.jewel.ui.component.Text
import org.jetbrains.jewel.ui.component.separator

@OptIn(ExperimentalJewelApi::class)
@Composable
fun SortOrder() {
    var order by remember { mutableStateOf("Name") }

    MenuComboBox(
        labelContent = { Text(order) },
        modifier = Modifier.width(160.dp),
    ) {
        selectableItem(selected = order == "Name", onClick = { order = "Name" }) {
            Text("Name")
        }
        selectableItem(selected = order == "Date", onClick = { order = "Date" }) {
            Text("Date")
        }
        separator()
        passiveItem { Text("Sorting applies to this view only") }
    }
}
```

Give the combo box a fixed width, for example with `width()` or `fillMaxWidth()`. Without
one, the combo box sizes itself to its label content. The popup matches the combo box
width unless you set `maxPopupWidth`.

`MenuComboBox` is annotated experimental. For a long list of options, use `ListComboBox`.
The `ListComboBox` overload for `String` items is stable. The generic overload for other
item types is annotated experimental. For a field that also accepts typed text, use
`EditableListComboBox`.

## Add items to a menu

The menu content block is a `MenuScope`. It supports these items:

- `selectableItem()` draws a clickable item with an optional icon and keybinding. The
  item with `selected = true` draws in its selected state and takes focus when the menu
  opens.
- `submenu()` adds an item that opens a nested menu. Pass the nested menu as the
  `submenu` argument. The trailing lambda draws the item itself, for example
  `submenu(submenu = { … }) { Text("Sort by") }`.
- `passiveItem()` draws content that the user cannot select.
- `separator()` draws a divider.
- `items()` adds one selectable item for each entry in a list, or for a count.

`separator()` and `items()` are extension functions. Import them from
`org.jetbrains.jewel.ui.component`.

Menus support keyboard navigation:

- **Up** and **Down** move between items.
- **Right** opens a submenu, and **Left** closes it.
- **Escape** closes the menu and all its submenus.

## Open a menu from any control

`PopupMenu` shows the same menu items as `MenuComboBox`. The menu opens next to its
parent layout, so put `PopupMenu` in a `Box` with the control that opens the menu. Show
`PopupMenu` while a state is `true`. Set the state to `false` in `onDismissRequest`:

```kotlin
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import org.jetbrains.jewel.ui.component.DefaultButton
import org.jetbrains.jewel.ui.component.PopupMenu
import org.jetbrains.jewel.ui.component.Text

@Composable
fun MoreActions(onRename: () -> Unit, onDelete: () -> Unit) {
    var showMenu by remember { mutableStateOf(false) }

    Box {
        DefaultButton(onClick = { showMenu = true }) { Text("More") }

        if (showMenu) {
            PopupMenu(
                onDismissRequest = {
                    showMenu = false
                    true
                },
                horizontalAlignment = Alignment.Start,
            ) {
                selectableItem(selected = false, onClick = onRename) { Text("Rename") }
                selectableItem(selected = false, onClick = onDelete) { Text("Delete") }
            }
        }
    }
}
```

Return `true` from `onDismissRequest` when the callback handled the dismissal.

The menu closes after the user selects an item. To make a long menu scroll, set
`maxHeight`. To place the menu yourself, use the `PopupMenu` overload that takes a
`popupPositionProvider`.

## Show your own content in a popup

`Popup` shows any content at the position its `PopupPositionProvider` returns.
`PopupContainer` is a `Popup` with the themed popup background, border, rounded corners
and shadow. Use `PopupContainer` in place of `Popup`, not inside it. By default,
`PopupContainer` opens next to its parent layout, aligned by `horizontalAlignment`.

`onDismissRequest` on `Popup` and `PopupContainer` receives an `InputMode` that tells you
what caused the dismissal:

- `InputMode.Keyboard` means a key press, such as **Escape**.
- `InputMode.Touch` means a pointer press outside the popup, or the window losing focus.
  Compose uses this name for mouse input too.

A submenu reads the `InputMode` and ignores a pointer dismissal while the pointer is over
the item that opened it. To close your own popup for any cause, ignore the parameter, for
example `onDismissRequest = { showPopup = false }`.

## Draw popups in separate windows

By default, Jewel popups, menus and tooltips use the Compose popup implementation. To draw
them in separate windows instead, set `JewelFlags.useCustomPopupRenderer` to `true`. The
flag is annotated experimental. You can also set the JVM system property
`jewel.customPopupRender` to `true`.

```kotlin
import org.jetbrains.jewel.foundation.ExperimentalJewelApi
import org.jetbrains.jewel.foundation.JewelFlags

@OptIn(ExperimentalJewelApi::class)
fun enableSeparatePopupWindows() {
    JewelFlags.useCustomPopupRenderer = true
}
```

With the flag set, Jewel popups ignore the Compose `compose.layers.type` setting. In a
plugin, Jewel popups use the IntelliJ Platform popup implementation, so a popup can be
larger than the Compose component that shows it. The flag does not change dialogs.

## See also

- [Components](components.md) — search fields, filterable lists and group headers
- [Decorated windows](decorated-windows.md) — a menu combo box in the title bar
