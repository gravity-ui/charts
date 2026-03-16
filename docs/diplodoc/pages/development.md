# Development

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

If you need to update the reference screenshots (e.g. after intentional UI changes):

```shell
npm run playwright:docker:update
```

## Contributing

Please refer to the [contributing document](https://github.com/gravity-ui/charts/blob/main/CONTRIBUTING.md) before submitting a pull request.
