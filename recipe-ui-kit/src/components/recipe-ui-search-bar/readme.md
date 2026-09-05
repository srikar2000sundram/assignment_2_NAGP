# recipe-ui-search-bar



<!-- Auto Generated Below -->


## Overview

A debounced search input. Owns only keystroke-to-debounced-event plumbing;
it never calls an API itself — the host app listens for `searchChange` and
decides what to do with the value.

## Properties

| Property      | Attribute     | Description | Type     | Default             |
| ------------- | ------------- | ----------- | -------- | ------------------- |
| `debounceMs`  | `debounce-ms` |             | `number` | `300`               |
| `placeholder` | `placeholder` |             | `string` | `'Search recipes…'` |
| `value`       | `value`       |             | `string` | `''`                |


## Events

| Event          | Description                                                                   | Type                              |
| -------------- | ----------------------------------------------------------------------------- | --------------------------------- |
| `searchChange` | Fired `debounceMs` after the user stops typing, with the current input value. | `CustomEvent<{ value: string; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
