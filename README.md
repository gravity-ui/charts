# Gravity UI Charts · [![npm package](https://img.shields.io/npm/v/@gravity-ui/charts)](https://www.npmjs.com/package/@gravity-ui/charts) [![License](https://img.shields.io/github/license/gravity-ui/charts)](LICENSE) [![CI](https://img.shields.io/github/actions/workflow/status/gravity-ui/charts/.github/workflows/ci.yml?label=CI&logo=github)](https://github.com/gravity-ui/charts/actions/workflows/ci.yml?query=branch:main) [![storybook](https://img.shields.io/badge/Storybook-deployed-ff4685)](https://preview.gravity-ui.com/charts/)

Declarative React charting library: line, area, bar, pie, scatter, treemap, sankey, heatmap, and more, rendered from a single data config.

## Install

```shell
npm install @gravity-ui/uikit @gravity-ui/charts
```

`@gravity-ui/uikit` is a required peer dependency — it provides the theming and styles the charts rely on.

## Usage

Import the `@gravity-ui/uikit` styles once in your entry point, wrap your app in `Provider`, and render a `Chart` inside a container with an explicit height:

```tsx
import {Provider} from '@gravity-ui/uikit';
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
    <Provider theme="light">
      <div style={{height: 300}}>
        <Chart data={data} />
      </div>
    </Provider>
  );
}
```

`Chart` adapts to its parent's size, so the wrapping element must have a height.

## Chart config tooling

The package provides TypeScript declarations and JSON Schema for chart config validation, generation, and Monaco integration. See the [chart config tooling documentation](https://gravity-ui.github.io/charts/pages/integrations/chart-config.html) for setup and usage details.

## Documentation

- [Overview](https://gravity-ui.github.io/charts/pages/overview.html)
- [Get started](https://gravity-ui.github.io/charts/pages/get-started.html)
- [Development](https://gravity-ui.github.io/charts/pages/development.html)
- [API](https://gravity-ui.github.io/charts/pages/api/overview.html)
- [Guides](https://gravity-ui.github.io/charts/pages/guides/series-types/index.html)

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

## For AI agents

A declarative React charting library — render line, area, bar, pie, scatter, treemap, sankey, heatmap, and other charts from a single `data` config, with built-in light and dark themes.

### When to use

- Supported series types: `line`, `area`, `area-range`, `bar-x`/`bar-y`, `pie`, `scatter`, `treemap`, `waterfall`, `sankey`, `radar`, `heatmap`, `funnel`, `x-range`.
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
- **Requires uikit setup.** Wrap in `Provider` and import `@gravity-ui/uikit/styles/styles.css`; `@gravity-ui/uikit` is a required peer dependency.

### Useful docs

- [Get started](./docs/diplodoc/pages/get-started.md)
- [Series types](./docs/diplodoc/pages/guides/series-types/index.md)
- [Theming](./docs/diplodoc/pages/guides/theming.md)
- [Tooltip](./docs/diplodoc/pages/guides/tooltip.md)
- [Legend](./docs/diplodoc/pages/guides/legend.md)
- [HTML Content](./docs/diplodoc/pages/guides/html.md)
- [Value Formatting](./docs/diplodoc/pages/guides/value-formatting.md)
- [Data Labels](./docs/diplodoc/pages/guides/data-labels.md)
- [Axis Types](./docs/diplodoc/pages/guides/axes/axis-types.md)
- [Axis Labels](./docs/diplodoc/pages/guides/axes/axis-labels.md)
- [Events and interactions](./docs/diplodoc/pages/guides/chart-interactions.md)
- [Chart config tooling](./docs/diplodoc/pages/integrations/chart-config.md)
- [Migrating from v1 to v2](./docs/diplodoc/pages/migration/v2.md)

## Documentation for AI agents

Agent-readable documentation for the installed version is located in `node_modules/@gravity-ui/charts/dist/docs/INDEX.md`.
