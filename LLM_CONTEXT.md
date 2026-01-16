# LLM Context: @gravity-ui/charts

This document provides essential context for Large Language Models (LLMs) to understand and work with the `@gravity-ui/charts` codebase.

## Project Overview

`@gravity-ui/charts` is a flexible JavaScript library for data visualization and chart rendering using React and D3.js. It follows a modular architecture where D3 is primarily used for math, scales, and shape generation, while React handles the DOM/SVG rendering.

## Tech Stack

- **Framework**: React (Functional Components, Hooks)
- **Language**: TypeScript
- **Visualization engine**: D3.js
- **Styling**: SCSS (using BEM naming convention via `@bem-react/classname`)
- **Documentation/UI Playground**: Storybook
- **Testing**: Jest (Unit/Integration), Playwright (E2E/Visual Regression)
- **Build System**: Gulp, TypeScript

## Directory Structure

- `src/components/`: React components for chart parts.
  - `Chart` (main entry point in `index.tsx`)
  - `ChartInner` (internal layout manager)
  - `AxisX`, `AxisY`, `Legend`, `Tooltip`, `Title`, `PlotTitle`, `RangeSlider`.
- `src/hooks/`: Core logic hooks.
  - `useAxis`, `useAxisScales`: Axis data preparation and scaling.
  - `useSeries`: Series data processing.
  - `useShapes`: Shape generation (lines, bars, etc.).
  - `useZoom`, `useRangeSlider`: Interaction handling.
  - `useChartDimensions`, `useChartOptions`, `useTooltip`, `useSplit`, `useCrosshair`, `useBrush`.
- `src/libs/`: Internal libraries for specific tasks (no direct D3 dependency here).
  - `chart-error`: Specialized error handling for charts.
  - `format-number`: Robust number formatting with i18n support.
- `src/types/`: Centralized TypeScript definitions for chart configurations and data.
- `src/utils/`: Helper functions for math, formatting, and DOM manipulation.
- `src/validation/`: Logic for validating chart configurations and input data.
- `src/i18n/`: Localization files and factory.
- `src/__tests__/`: **Visual regression tests** using Playwright (`*.visual.test.tsx`).
- `**/__tests__/*.test.ts`: **Unit tests** using Jest, co-located with the code they test (e.g., in `libs`, `utils`, `hooks`, `validation`).
- `playwright/`: **Playwright setup**, configuration, and core testing components (shared utilities for tests).

## Key Development Commands

- `npm run start`: Runs Storybook at `http://localhost:7007`.
- `npm test`: Executes **Jest** unit tests.
- `npm run playwright`: Runs **Playwright** visual regression tests.
- `npm run typecheck`: Runs TypeScript compiler for type checking.
- `npm run lint`: Performs linting for JS/TS and styles.
- `npm run build`: Compiles the project using Gulp.

## Coding Patterns & Guidelines

1. **Separation of Concerns**: Keep visualization logic (math, scales) in hooks or libs, and rendering in components.
2. **Immutability**: Treat chart configurations and data as immutable.
3. **Type Safety**: Use strictly defined types from `src/types`.
4. **BEM Styling**: Use the `b` utility from `@bem-react/classname` for CSS classes.
5. **Localization**: Use `@gravity-ui/i18n` for user-facing strings (found in `src/i18n`).
