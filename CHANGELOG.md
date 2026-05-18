# Changelog

## 0.4.1 - 2026-05-18

* chore: Export types from types.ts through top-level package by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/210
* fix: Extends object = object instead of never by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/211


**Full Changelog**: https://github.com/geoarrow/deck.gl-geoarrow/compare/v0.4.0...v0.4.1

## 0.4.0 - 2026-05-18

### Breaking Changes

* refactor!: Refactor layers to take in Arrow `RecordBatch` input, not `Table` by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/148
    * **Important**: you must now iterate over the input RecordBatches of your `Table` object, passing in **one RecordBatch to each deck.gl-geoarrow layer**. This makes it explicit that one contiguous `RecordBatch` is associated to one physical deck.gl layer.
* chore!: Rename NPM package from `@geoarrow/deck.gl-layers` to `@geoarrow/deck.gl-geoarrow` by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/191

### New features

* feat: Support passing in earcut worker pool to SolidPolygonLayer by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/151
* Expose H3HexagonLayer publicly by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/160
* feat: Add vectorized props from polygon layer to h3 hexagon layer by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/157
* feat: Add a5 layer by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/162
* fix: Ensure separate layer ids by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/163
* fix: Define attributes object if not already defined by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/165
* feat: Add simple wrappings of geohash and s2 layers by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/168
* Freshen up `point` example by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/190
* ci: Set up trusted publishing by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/173
* Update README with build instructions for POINT example by @C-Loftus in https://github.com/geoarrow/deck.gl-geoarrow/pull/197

### Bug fixes

* fix scatterplot layer typing by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/154
* ci: Don't publish npm package with beta string as latest tag by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/156
* fix: H3HexagonLayer fixes by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/159
* chore: Ensure earcut worker props are passed down from PolygonLayer by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/161

### Other

* ci: add Dependabot for GitHub Actions version updates by @lhoupert in https://github.com/geoarrow/deck.gl-geoarrow/pull/177
* chore: Switch to pnpm by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/185
* chore: Switch to biome for linting and formatting by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/186
* chore: Update tsconfig by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/187
* chore: Update build process to match deck.gl-raster by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/188
* chore: Bump vitest and typescript versions by @kylebarron in https://github.com/geoarrow/deck.gl-geoarrow/pull/189


### New Contributors

* @lhoupert made their first contribution in https://github.com/geoarrow/deck.gl-geoarrow/pull/177
* @dependabot[bot] made their first contribution in https://github.com/geoarrow/deck.gl-geoarrow/pull/181
* @C-Loftus made their first contribution in https://github.com/geoarrow/deck.gl-geoarrow/pull/197

**Full Changelog**: https://github.com/geoarrow/deck.gl-geoarrow/compare/v0.3.1...v0.4.0

## [0.3.2] - 2026-04-15

- Deprecate the name `@geoarrow/deck.gl-layers` and prepare the package for renaming to `@geoarrow/deck.gl-geoarrow`.

## [0.3.1] - 2025-07-17

- fix: Only log metrics if desired, opt-in by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/146

**Full Changelog**: https://github.com/geoarrow/deck.gl-layers/compare/v0.3.0...v0.3.1

## [0.3.0] - 2025-02-11

This version includes major improvements over 0.2.

### New Features:

- Run `earcut` on a web worker to improve rendering performance of the `SolidPolygonLayer`  by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/85
  - Earcut main thread fallback by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/92
- New layer types:
  - Add Arc layer by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/63
  - Add heatmap layer by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/64
  - Add column layer and h3 hexagon layer by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/68
  - Add GeoArrowTextLayer by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/70
  - GeoArrow-based Trips Layer by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/34
  - polygon layer by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/79
  - Start implementation of point cloud layer by @naomatheus in https://github.com/geoarrow/deck.gl-layers/pull/96

### What's Changed

- Simplified accessor validation by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/69
- Text example & Fix text rendering by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/72
- compute table offsets by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/91
- Fix error when no geometry column found by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/94
- function accessors by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/100
- Wrap worker instantiation in try/catch; fix for non-served HTML files by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/108
- Export PointCloudLayer through top-level index.ts by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/110
- Fix picking in the polygon layer by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/113
- Publish beta with fixed PolygonLayer by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/115
- Fix bundling for loading from CDN by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/111
- Prefer user input over defaults by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/119
- fix arrow bundle by @atmorling in https://github.com/geoarrow/deck.gl-layers/pull/122
- Support deck.gl v9 by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/112
- Support separated (struct) coordinates for all applicable layers by @gmoney1729 in https://github.com/geoarrow/deck.gl-layers/pull/139

## New Contributors

- @naomatheus made their first contribution in https://github.com/geoarrow/deck.gl-layers/pull/96
- @gmoney1729 made their first contribution in https://github.com/geoarrow/deck.gl-layers/pull/139

**Full Changelog**: https://github.com/geoarrow/deck.gl-layers/compare/v0.2.0...v0.3.0

## [0.2.0] - 2023-10-21

### What's Changed

- Correctly forward props by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/46
- Cleaner data reproductions for examples by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/45
- Fix multipolygon rendering by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/48
- Fixed multi polygon attribute rendering by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/49
- Implement picking by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/47
- improved typing for picking info by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/50
- Triangulate ourselves w/ earcut (fix with holes) by @kylebarron in https://github.com/geoarrow/deck.gl-layers/pull/51

**Full Changelog**: https://github.com/geoarrow/deck.gl-layers/compare/v0.1.0...v0.2.0

## [0.1.0] - 2023-10-16

- Initial public release.
- Initial support for `GeoArrowScatterplotLayer`, `GeoArrowPathLayer`, and `GeoArrowSolidPolygonLayer`.
