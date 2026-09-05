# recipe-ui-filter-chip-group



<!-- Auto Generated Below -->


## Overview

A row of toggleable filter chips (e.g. recipe categories or cuisines).
Multi-select: clicking a chip emits the full next `selected` array and
waits for the host app to feed it back via the `selected` prop — the
component does not keep its own copy of selection state.

## Properties

| Property   | Attribute | Description | Type             | Default |
| ---------- | --------- | ----------- | ---------------- | ------- |
| `options`  | --        |             | `FilterOption[]` | `[]`    |
| `selected` | --        |             | `string[]`       | `[]`    |


## Events

| Event          | Description                                                                                                  | Type                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `filterChange` | Named `filterChange`, not `selectionChange`, to avoid colliding with the native `selectionchange` DOM event. | `CustomEvent<{ selected: string[]; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
