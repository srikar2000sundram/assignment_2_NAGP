# Changelog

All notable changes to `recipe-ui-kit` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The bump policy for this package — what counts as major/minor/patch given that
a component's *props, events and slots* are its public API — is written out in
[`../docs/architecture.md#7-versioning`](../docs/architecture.md#7-versioning).

## [Unreleased]

_Nothing yet._

## [0.2.0] — 2026-09-04

### Added

- **`recipe-ui-meal-slot`: a "change" control on filled slots.** The recipe
  region of an assigned slot is now a button that emits the existing `assign`
  event, so a planned meal can be swapped in place instead of only being
  removed and re-added. Reuses `assign` rather than introducing a new event, so
  consumers already handling `assign` get the behaviour for free with no code
  change.

### Changed

- `recipe-ui-meal-slot`'s `assign` event documentation now covers both emit
  paths (empty-slot click and filled-slot change).
- Long recipe titles in a filled slot clamp to two lines instead of pushing the
  Change/remove controls out of the slot.

### Packaging

- Published as **`@srikar_sundram/recipe-ui-kit`**. The unscoped
  `recipe-ui-kit` name was claimed by an unrelated package on 2026-08-28,
  before this library was first published, so the scoped name is the one
  this package has always shipped under. Custom-element tag names are
  unaffected — they come from the components, not the package name.
- Compiled test files are no longer included in the published tarball
  (98 files → 72).

### Notes

Additive only — no prop, event or slot was renamed, removed, or changed shape,
so this is a **minor** bump and `^0.1.0` consumers can upgrade without edits.

## [0.1.0] — 2026-08-16

### Added

- Initial release with seven components: `recipe-ui-card`,
  `recipe-ui-search-bar`, `recipe-ui-filter-chip-group`,
  `recipe-ui-rating-badge`, `recipe-ui-form`, `recipe-ui-meal-slot`,
  `recipe-ui-modal-dialog`.
- Shared public types (`FilterOption`, `RecipeFormValue`, `RecipeFormErrors`,
  `MealSlotRecipe`, `RatingBadgeVariant`) exported from the package root.
- Theming through inherited `--ruik-*` CSS custom properties, so a host app
  themes every component (shadow DOM included) from one place, with per-component
  fallbacks that keep each component presentable standalone.
- `dist` + `dist-custom-elements` + lazy `loader/` output targets.
