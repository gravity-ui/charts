# Get started

## Requirements

- React 17 or later
- [@gravity-ui/uikit](https://github.com/gravity-ui/uikit) — required peer dependency (provides theming and UI primitives)

## Install

```shell
npm install @gravity-ui/uikit @gravity-ui/charts
```

## Styles

Import the styles from `@gravity-ui/uikit` in your entry point:

```tsx
import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
```

For full setup details see the [uikit styles guide](https://github.com/gravity-ui/uikit?tab=readme-ov-file#styles).

## Basic usage

Wrap your app with `ThemeProvider` from `@gravity-ui/uikit`, then render a `Chart` inside a sized container:

```tsx
import {ThemeProvider} from '@gravity-ui/uikit';
import {Chart} from '@gravity-ui/charts';

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

`Chart` adapts to its parent's size — make sure the container has an explicit height.
