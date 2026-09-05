# recipe-ui-card



<!-- Auto Generated Below -->


## Overview

A recipe summary card — used across the discovery grid, favorites list, and
the meal-plan recipe picker. Purely presentational: it never fetches data
or reads app state, only emits events for the host app to act on.

## Properties

| Property                   | Attribute      | Description                                                                                                       | Type      | Default     |
| -------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| `category`                 | `category`     |                                                                                                                   | `string`  | `undefined` |
| `image`                    | `image`        |                                                                                                                   | `string`  | `undefined` |
| `isFavorite`               | `is-favorite`  |                                                                                                                   | `boolean` | `false`     |
| `recipeId` _(required)_    | `recipe-id`    | Identifies the recipe in emitted events; not rendered.                                                            | `string`  | `undefined` |
| `recipeTitle` _(required)_ | `recipe-title` | Recipe name. Named `recipeTitle` (not `title`) to avoid colliding with the native HTML `title` tooltip attribute. | `string`  | `undefined` |


## Events

| Event            | Description                                                    | Type                                 |
| ---------------- | -------------------------------------------------------------- | ------------------------------------ |
| `cardClick`      | Fired when the card body (not the favorite button) is clicked. | `CustomEvent<{ recipeId: string; }>` |
| `favoriteToggle` | Fired when the favorite button is toggled.                     | `CustomEvent<{ recipeId: string; }>` |


## Slots

| Slot | Description                                                                    |
| ---- | ------------------------------------------------------------------------------ |
|      | Footer actions (e.g. edit/delete buttons shown only for user-created recipes). |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
