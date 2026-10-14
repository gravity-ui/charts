# Local development

## Prerequisites

- [Node.js](https://nodejs.org/) 22 (see [.nvmrc](https://github.com/gravity-ui/charts/blob/main/.nvmrc))
- [npm](https://www.npmjs.com/) 10 or later

## Setup

Clone the repository and install dependencies:

```shell
git clone https://github.com/gravity-ui/charts.git
cd charts
npm ci
```

## Running Storybook

To start the development server with Storybook:

```shell
npm run start
```

Storybook will be available at `http://localhost:7007`.

## Running tests

```shell
npm test
```

Visual regression tests run in Docker to ensure consistent screenshots across environments:

```shell
npm run playwright:docker
```

In pull requests, the main visual suite runs in two parallel GitHub Actions shards with four workers each. The `Visual Tests` check merges their reports and fails if either shard fails. Performance tests run in a separate job; the React 17 and 19 release checks keep their existing configuration.

To run one shard locally with the same browser selection as CI:

```shell
npm run playwright:docker -- --project=chromium --project=webkit --shard=1/2 --workers=4
```

Use `--shard=2/2` for the other half. Together, both shards run the complete visual suite.

If you need to update the reference screenshots (e.g. after intentional UI changes):

```shell
npm run playwright:docker:update
```

## Documentation examples

Add a live example as a `.tsx` file under `docs/examples/src/charts`, exporting its component as the default export and its metadata as `export const meta = {...} satisfies ExampleMeta`. Import `ExampleMeta` from `../gallery` for examples in a subdirectory. Use literal strings, numbers, and objects in metadata so the build can validate it without running the component.

Provide a title, short description, primary series type, and a `docsUrl` pointing to the built guide page and section anchor, such as `pages/guides/legend.html#item-layout`. The file path without `.tsx` becomes the example ID. Registration is automatic; there is no separate list to update. The displayed source code omits the metadata export and its type import.

Use card titles and descriptions to explain the demonstrated configuration (for example, a basic chart, label formatting, or stacking), rather than the business meaning of the sample data.

Embed it in a guide using `<div data-chart-example="your/example-id"></div>`. The [Examples catalog](./examples.md) automatically reuses the same component. An example combining series types belongs to one primary group.

Set `gallery.order: 0` for the basic example of each series; other examples default to `100`, with title as the tie-breaker. Set `gallery.group` to `axes`, `legend`, `tooltip`, or `data-labels` to place a cross-cutting example in a topic group instead of its series group. Each example appears once. Topic names and their display order are defined in `docs/examples/src/charts/gallery-groups.json`; series groups come first, in alphabetical order. Unknown topic IDs fail the documentation build. Gallery cards show the chart and description; source code remains available in guides.

Run `npm run docs:build` to check registration, documentation coverage, and guide links.

## Contributing

Please refer to the [contributing document](https://github.com/gravity-ui/charts/blob/main/CONTRIBUTING.md) before submitting a pull request.
