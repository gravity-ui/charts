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

## Contributing

Please refer to the [contributing document](https://github.com/gravity-ui/charts/blob/main/CONTRIBUTING.md) before submitting a pull request.
