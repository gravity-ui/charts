# Gravity UI Charts · [![npm package](https://img.shields.io/npm/v/@gravity-ui/charts)](https://www.npmjs.com/package/@gravity-ui/charts) [![License](https://img.shields.io/github/license/gravity-ui/charts)](LICENSE) [![CI](https://img.shields.io/github/actions/workflow/status/gravity-ui/charts/.github/workflows/ci.yml?label=CI&logo=github)](https://github.com/gravity-ui/charts/actions/workflows/ci.yml?query=branch:main) [![storybook](https://img.shields.io/badge/Storybook-deployed-ff4685)](https://preview.gravity-ui.com/charts/)

React charting library with 10+ chart types: area, bar, line, pie, scatter, treemap, and more.

## Install

```shell
npm install @gravity-ui/uikit @gravity-ui/charts
```

`@gravity-ui/uikit` is a required peer dependency — it provides the theming and styles the charts rely on.

## Usage

Import the `@gravity-ui/uikit` styles once in your entry point, wrap your app in `ThemeProvider`, and render a `Chart` inside a container with an explicit height:

```tsx
import {ThemeProvider} from '@gravity-ui/uikit';
import {Chart} from '@gravity-ui/charts';

import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';

const data = {
  series: {
    data: [
      {
        type: 'line',
        name: 'Temperature',
        data: [
          {x: 0, y: 10},
          {x: 1, y: 25},
          {x: 2, y: 18},
          {x: 3, y: 30},
        ],
      },
    ],
  },
};

export default function App() {
  return (
    <ThemeProvider theme="light">
      <div style={{height: 300}}>
        <Chart data={data} />
      </div>
    </ThemeProvider>
  );
}
```

`Chart` adapts to its parent's size, so the wrapping element must have a height.

## Documentation

- [Overview](https://gravity-ui.github.io/charts/pages/overview.html)
- [Get started](https://gravity-ui.github.io/charts/pages/get-started.html)
- [Development](https://gravity-ui.github.io/charts/pages/development.html)
- [API](https://gravity-ui.github.io/charts/pages/api/overview.html)
- [Guides](https://gravity-ui.github.io/charts/pages/guides/tooltip.html)

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

## For AI agents

A declarative React charting library for Gravity UI apps — render line, area, bar, pie, scatter, treemap, and other charts from a single `data` config, themed to match the rest of the app.

### When to use

- Standard business charts: `line`, `area`, `bar-x`/`bar-y`, `pie`, `scatter`, `treemap`, `waterfall`, `sankey`, `radar`, `heatmap`, `funnel`, `x-range`.
- Visualizations that must follow Gravity UI theming (light/dark) and share tokens with a `@gravity-ui/uikit` app.
- Rendering a chart from declarative data rather than drawing imperatively.

### When not to use

- Projects still on `@gravity-ui/chartkit` — that is the older adapter-based wrapper (YAGR/Highcharts/D3); this package is the modern standalone renderer and is not a drop-in replacement.
- Plain tabular data — use [`@gravity-ui/table`](https://github.com/gravity-ui/table).
- Non-React or server-only rendering — `Chart` renders React SVG and needs the DOM.

### Common pitfalls

- **The component is `Chart`, not `ChartKit`.** Import `{Chart}` from `@gravity-ui/charts`; `ChartKit` belongs to the separate legacy `@gravity-ui/chartkit` package.
- **The data prop is `data`, shaped `{series: {data: [...]}}`.** Each entry in `series.data` is one series with its own `type` and `data` array — there is no top-level array of series.
- **Nothing renders without a sized container.** `Chart` fills its parent, so give the wrapper an explicit height.
- **Requires uikit setup.** Wrap in `ThemeProvider` and import `@gravity-ui/uikit/styles/styles.css`; `@gravity-ui/uikit` is a required peer dependency.
