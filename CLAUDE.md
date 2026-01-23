# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

@gravity-ui/charts is a React-based data visualization library built on D3.js. It supports 12 chart types (bar-x, bar-y, line, area, scatter, heatmap, waterfall, pie, radar, funnel, treemap, sankey) with a composable hook-based architecture.

## Key Dependencies

### Core Dependencies

- **d3** - Data visualization library

  - Used for scales (`scaleLinear`, `scaleBand`, `scaleUtc`, `scaleLog`, `scaleOrdinal`)
  - Shape generators (`d3.line()`, `d3.arc()`, `d3.area()`)
  - Data transformations (`d3.extent()`, `d3.group()`)
  - Event dispatcher (`d3.dispatch()`)
  - DOM selections for shape rendering

- **d3-sankey** - Sankey diagram layout algorithm

  - Used specifically for Sankey chart type
  - Computes node positions and link paths

- **@gravity-ui/uikit** - Peer dependency

  - UI components library from Gravity UI ecosystem
  - Provides theming and base component primitives
  - Required for proper styling and interactions

- **@gravity-ui/date-utils** - Date manipulation utilities
  - Date formatting and parsing
  - Timezone handling
  - Used for datetime axis labels and range slider
  - Integration with D3 `scaleUtc` for time-series charts

### Supporting Dependencies

- **@gravity-ui/i18n** - Internationalization
- **@gravity-ui/icons** - Icon components
- **@bem-react/classname** - BEM naming for CSS classes
- **lodash** - Utility functions
- **tslib** - TypeScript runtime helpers

### Development Requirements

- **React** - Peer dependency
- **react-dom** - Peer dependency
- **TypeScript** - Type system
- **Jest** - Unit testing
- **Playwright** - Visual regression testing
- **Storybook** - Component development and documentation

## Development Commands

### Build

```bash
npm run build          # Clean build of both ESM and CJS outputs to dist/
npm run clean          # Remove dist/ directory
```

Build process (via Gulp):

- Compiles TypeScript to both `dist/esm/` (ESNext modules) and `dist/cjs/` (CommonJS)
- Compiles SCSS to CSS in both output directories
- Copies i18n JSON files
- Excludes `__stories__/`, `__tests__/`, and demo files from output

### Testing

```bash
npm test               # Run Jest unit tests (*.test.ts(x))
npm run typecheck      # Run TypeScript compiler checks

# Playwright visual regression tests
npm run playwright                    # Run visual tests (*.visual.test.tsx)
npm run playwright:update             # Update snapshots
npm run playwright:docker             # Run in Docker for consistent snapshots
npm run playwright:docker:update      # Update snapshots in Docker
npm run playwright:clear-cache        # Clear Playwright cache
```

Visual tests configuration:

- Located in `src/**/__tests__/**/*.visual.test.tsx`
- Snapshots stored in `src/__snapshots__/{testFileName}-snapshots/`
- Always run in Docker when updating snapshots to ensure consistency
- Uses Chromium with 2x device scale factor

### Linting & Formatting

```bash
npm run lint           # Run all linters (JS, styles, other)
npm run lint:js        # ESLint for .js/.jsx/.ts/.tsx
npm run lint:styles    # Stylelint for SCSS files
npm run lint:other     # Prettier for .md/.yaml/.yml/.json
npm run prettier       # Check Prettier formatting
```

### Development Server

```bash
npm start              # Start Storybook dev server on port 7007
npm run build-storybook # Build static Storybook to storybook-static/
```

### Documentation

```bash
npm run docs:deps      # Install docs dependencies
npm run docs:dev       # Start docs dev server
npm run docs:build     # Build documentation site
```

## Architecture

### Hook-Based Rendering Pipeline

The library uses a composable hook architecture where data flows through a series of transformations:

**Master Orchestrator:** `src/hooks/useChartInnerProps.ts`

- Coordinates all preparation hooks
- Returns prepared data, scales, axes, and visual elements

**Key Hooks (in execution order):**

1. `useNormalizedOriginalData` - Normalizes raw input data
2. `useSeries` - Routes to type-specific preparers, assigns colors
3. `useAxis` - Configures X/Y axes, extracts categories/timestamps
4. `useAxisScales` - Creates D3 scales (scaleBand, scaleLinear, scaleUtc, etc.)
5. `useShapes` - Renders chart-type-specific SVG shapes
6. `useChartDimensions` - Calculates layout bounds and margins
7. `useZoom`, `useBrush`, `useRangeSlider` - Interaction state management
8. `useTooltip`, `useCrosshair` - Tooltip rendering and positioning

### Chart Type System

**Type Definitions:** `src/types/chart/`

- Each chart type has its own file: `pie.ts`, `bar-x.ts`, `line.ts`, etc.
- `series.ts` defines `ChartSeries<T>` as a discriminated union of all types
- Type-safe routing via discriminant field (e.g., `type: 'line'`)

**Series Preparation:** `src/hooks/useSeries/`

- `prepareSeries.ts` - Routes by series type to specific preparers
- Type-specific preparers: `prepare-pie.ts`, `prepare-bar-x.ts`, `prepare-line.ts`, etc.
- Output: `PreparedSeries[]` with normalized data, colors, legend metadata

**Shape Rendering:** `src/hooks/useShapes/`

- Type-specific subdirectories: `pie/`, `bar-x/`, `line/`, `area/`, etc.
- Each type has: `index.tsx` (component), `prepare-data.ts` (calculations), `types.ts`
- Shapes render asynchronously using `Promise.all()`

### D3.js Integration

**Scale Creation:** `src/hooks/useAxisScales/`

- Functions: `createXScale()`, `createYScale()`, `useAxisScales()`
- Supported scale types: linear, logarithmic, category (scaleBand), datetime (scaleUtc)
- Automatically extracts domain from prepared series data
- Integrates with zoom/range slider state to modify domains

**D3 Usage Patterns:**

- Scales: `scaleBand`, `scaleLinear`, `scaleLog`, `scaleUtc`, `scaleOrdinal`
- Shape generators: `d3.line()`, `d3.arc()`, `d3.area()`
- Selections: Used for DOM manipulation in shape components
- External: `d3-sankey` for Sankey diagrams
- Data: `d3.extent()`, `d3.group()` for data transformations

### Event System

**Dispatcher Pattern:** `src/utils/dispatcher.ts`

- Centralized event bus using `d3.dispatch`
- Events: `CLICK_CHART`, `HOVER_SHAPE`, `POINTERMOVE_CHART`, etc.
- Chart components emit events, handlers consume them
- User callbacks defined in `chart.events` prop

**Interaction Flow:**

1. SVG pointer events captured by `ChartInner`
2. `useChartInnerHandlers` processes events
3. Dispatcher emits typed events
4. Tooltip, legend, and user handlers respond
5. State updates trigger re-renders

### Component Structure

**Main Components:** `src/components/`

- `Chart` (index.tsx) - Wrapper with resize observer, provides dimensions
- `ChartInner` - Main orchestrator, renders axes, legend, shapes, tooltips
- `AxisX`, `AxisY` - Axis rendering with D3 scales
- `Legend` - Series legend with click/hover interactions
- `Title`, `PlotTitle` - Text elements
- `Tooltip` - Positioned tooltip with custom renderers
- `RangeSlider` - Range selection for time-series data

**HTML Overlay:** `src/hooks/useShapes/HtmlLayer.tsx`

- Used for data labels and other HTML content that can't be rendered in SVG
- Positioned absolutely relative to chart bounds

### Data Types

**Core Type:** `ChartData<T>`

- Defined in `src/types/index.ts`
- Contains: `series`, `chart`, `title`, `legend`, `tooltip`, `xAxis`, `yAxis`, `split`, `colors`
- Generic `T` represents the data point type

**Series Options:** `ChartSeriesOptions` in `src/types/chart/series.ts`

- Per-type configuration: `barPadding`, `dataLabels`, `marker`, `lineJoin`, etc.
- Shared properties: `color`, `visible`, `name`, `legend`, `tooltip`
- Hover and inactive state styling

**Split Plots:** `src/types/chart/split.ts`

- Enables multi-plot visualizations (small multiples)
- Each plot can have its own data subset and axes

## Code Patterns and Conventions

### Import Style

- Use separate type imports: `import type {Foo} from './types'`
- Enforced by ESLint rule `@typescript-eslint/consistent-type-imports`
- Use `import React from 'react'` (not namespace or named imports)
- Don't use `React.FC` (enforced by ESLint)

### Type Safety

- All series types use discriminated unions via `type` field
- Type guards check series type before accessing type-specific properties
- Prepared data types mirror input types with computed fields added

### File Organization

- Tests: `__tests__/*.test.ts(x)` for unit tests, `*.visual.test.tsx` for Playwright
- Stories: `__stories__/**/*.ts(x)` for Storybook examples
- Each chart type has parallel structure in `hooks/useSeries/`, `hooks/useShapes/`, `types/chart/`

### Styling

- SCSS modules in component directories
- Imports rewritten to `.css` during build (see `gulpfile.js`)
- Uses BEM naming via `@bem-react/classname`

### Constants

- `src/constants/` - Shared constants
  - `chart-types.ts` - Chart type enum
  - `defaults/` - Default values for options
  - `palette.ts` - Default color scheme
  - `symbol-types.ts` - Marker shapes

## Adding a New Chart Type

To add a new chart type `foo`:

1. **Define Types:** `src/types/chart/foo.ts`

   - Define `FooSeries<T>` interface with `type: 'foo'`
   - Add to `ChartSeries` union in `series.ts`
   - Add `FooSeriesOptions` to `ChartSeriesOptions`

2. **Series Preparation:** `src/hooks/useSeries/prepare-foo.ts`

   - Implement `prepareFooSeries()` function
   - Add `PreparedFoo` type to `types.ts`
   - Add case to `prepareSeries()` in `prepareSeries.ts`

3. **Shape Rendering:** `src/hooks/useShapes/foo/`

   - Create `index.tsx` with component
   - Create `prepare-data.ts` for calculations
   - Create `types.ts` for shape-specific types
   - Add case to `useShapes()` in `useShapes/index.tsx`

4. **Add to Chart Types:** Update `src/constants/chart-types.ts`

5. **Tests and Stories:**
   - Add `__tests__/foo.visual.test.tsx`
   - Add `__stories__/foo.stories.tsx`

## Testing Patterns

### Unit Tests (Jest)

- Test preparation functions in `hooks/useSeries/__tests__/`
- Test utility functions in component/utility `__tests__/` directories
- Use `@testing-library/react` for component testing
- Mock D3 selections when needed

### Visual Tests (Playwright)

- Always use Docker for snapshot updates: `npm run playwright:docker:update`
- Test files: `src/**/__tests__/**/*.visual.test.tsx`
- Import `@playwright/experimental-ct-react` for component testing
- Snapshots saved in `src/__snapshots__/`

## Key Files Reference

| File                                   | Purpose                                           |
| -------------------------------------- | ------------------------------------------------- |
| `src/index.ts`                         | Main library entry point, exports all public APIs |
| `src/components/index.tsx`             | Main `Chart` component                            |
| `src/components/ChartInner/index.tsx`  | Core chart orchestrator                           |
| `src/hooks/useChartInnerProps.ts`      | Master hook coordinating all preparation          |
| `src/hooks/useSeries/prepareSeries.ts` | Series preparation router                         |
| `src/hooks/useShapes/index.tsx`        | Shape rendering coordinator                       |
| `src/hooks/useAxisScales/index.ts`     | D3 scale creation                                 |
| `src/types/index.ts`                   | Main `ChartData<T>` type definition               |
| `src/types/chart/series.ts`            | Series type union and options                     |
| `src/utils/dispatcher.ts`              | Event dispatcher                                  |
| `gulpfile.js`                          | Build configuration                               |
| `jest.config.js`                       | Jest test configuration                           |
| `playwright/playwright.config.ts`      | Playwright visual test configuration              |

## Contributing

External contributors must adopt the Yandex Contributor License Agreement (CLA). See CONTRIBUTING.md for details.
