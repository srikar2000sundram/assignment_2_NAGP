# recipe-ui-form



<!-- Auto Generated Below -->


## Overview

Collects a recipe (title, image, category, ingredients, instructions) and
emits it on submit. Deliberately has no built-in business validation
beyond marking fields as `required` for baseline UX — the host app
validates and feeds errors back in via the `errors` prop, per the
Recipe Management requirement ("validate recipe input before saving").

## Properties

| Property       | Attribute | Description                                                             | Type                                                   | Default     |
| -------------- | --------- | ----------------------------------------------------------------------- | ------------------------------------------------------ | ----------- |
| `errors`       | --        | Field-level errors from the host app's validation, keyed by field name. | `"ingredients" \| "instructions" \| "title" \| string` | `undefined` |
| `initialValue` | --        |                                                                         | `RecipeFormValue`                                      | `undefined` |
| `mode`         | `mode`    |                                                                         | `"create" \| "edit"`                                   | `'create'`  |


## Events

| Event        | Description                                                                                                                         | Type                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `cancel`     |                                                                                                                                     | `CustomEvent<void>`                         |
| `formSubmit` | Named `formSubmit`, not `submit`, so it can't be confused with the native <form> submit event that bubbles inside this shadow root. | `CustomEvent<{ recipe: RecipeFormValue; }>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
