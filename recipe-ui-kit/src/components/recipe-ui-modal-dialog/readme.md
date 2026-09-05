# recipe-ui-modal-dialog



<!-- Auto Generated Below -->


## Overview

A generic modal shell. Used as the meal-plan recipe picker: the host app
puts a `<recipe-ui-card>` grid in the default slot and, optionally, action
buttons in the `footer` slot.

## Properties

| Property  | Attribute | Description | Type      | Default     |
| --------- | --------- | ----------- | --------- | ----------- |
| `heading` | `heading` |             | `string`  | `undefined` |
| `open`    | `open`    |             | `boolean` | `false`     |


## Events

| Event   | Description                                                                                                                                   | Type                |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `close` | Fired when the backdrop, close button, or Escape key requests the modal be closed. Host app owns the `open` prop and should flip it to false. | `CustomEvent<void>` |


## Slots

| Slot       | Description                             |
| ---------- | --------------------------------------- |
|            | Modal body content.                     |
| `"footer"` | Modal footer, typically action buttons. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
