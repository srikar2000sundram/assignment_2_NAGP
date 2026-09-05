# recipe-ui-meal-slot



<!-- Auto Generated Below -->


## Overview

One day's cell in the weekly meal-plan grid: either an "add recipe" prompt or the assigned recipe with a remove control.

## Properties

| Property   | Attribute   | Description                                                        | Type             | Default     |
| ---------- | ----------- | ------------------------------------------------------------------ | ---------------- | ----------- |
| `day`      | `day`       | Weekday key, e.g. "mon" — passed back unchanged in emitted events. | `string`         | `''`        |
| `dayLabel` | `day-label` | Optional display label; falls back to `day` if omitted.            | `string`         | `undefined` |
| `recipe`   | --          |                                                                    | `MealSlotRecipe` | `null`      |


## Events

| Event    | Description                                                                                                                                                                                                                                                                                                                                                 | Type                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `assign` | Fired when the host app should open its recipe picker for this day — either because an empty slot was clicked, or because the "change" control on an already-filled slot was clicked. Assigning over a filled slot is how the "modify a planned meal" requirement is satisfied, so both paths emit the same event and the host app treats them identically. | `CustomEvent<{ day: string; }>` |
| `remove` | Fired when the remove control on a filled slot is clicked.                                                                                                                                                                                                                                                                                                  | `CustomEvent<{ day: string; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
