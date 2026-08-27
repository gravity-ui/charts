# Chart config tooling

The package publishes two versioned config artifacts:

- `@gravity-ui/charts/chart-config.d.ts` — standalone declarations for Monaco's TypeScript language service.
- `@gravity-ui/charts/chart-config.schema.json` — JSON Schema for generation and validation of JSON-only chart configs.

## Usage

### TypeScript autocomplete

The declaration is a text asset, not a runtime JavaScript module. It must be loaded as text before it can be registered in Monaco. For example, Vite supports raw-file imports with the `?raw` suffix:

```js
import declaration from '@gravity-ui/charts/chart-config.d.ts?raw';

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  declaration,
  'file:///node_modules/@gravity-ui/charts/chart-config.d.ts',
);
```

Other bundlers provide similar mechanisms for importing an asset as text.

The bundle ends with `export {}`, making it a module. To use `ChartConfig` in the editor buffer's global scope either import it explicitly in the buffer's initial content:

```ts
import type {ChartConfig} from '@gravity-ui/charts/chart-config';

const config: ChartConfig = {};
```

Or, if you need it globally, wrap the declaration in `declare global` before registering it:

```js
const globalDeclaration = declaration.replace(
  /export \{\}/,
  'declare global { type ChartConfig = import("./chart-config").ChartConfig; }',
);

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  globalDeclaration,
  'file:///node_modules/@gravity-ui/charts/chart-config.d.ts',
);
```

### JSON validation and autocomplete

To enable JSON validation and autocomplete in a Monaco JSON editor, register the schema with the JSON language service:

```js
import schema from '@gravity-ui/charts/chart-config.schema.json' with {type: 'json'};

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  schemas: [
    {
      uri: schema.$id,
      fileMatch: ['chart-config.json'],
      schema,
    },
  ],
});
```

Models whose URI matches `chart-config.json` will then be validated and autocompleted against the published schema.

JSON Schema validates each gradient stop offset independently, but cannot enforce their order. At runtime, gradient offsets must be in non-decreasing order from `0` to `1`; otherwise chart data validation fails.

### Optional: Node.js build tooling

Charts and Monaco run in the browser, but Node.js-based build tooling can resolve and read the declaration before including its contents in a browser application. In CommonJS:

```js
const fs = require('node:fs');

const declarationPath = require.resolve('@gravity-ui/charts/chart-config.d.ts');
const declaration = fs.readFileSync(declarationPath, 'utf8');

const schema = require('@gravity-ui/charts/chart-config.schema.json');
```

In ESM:

```js
import {readFile} from 'node:fs/promises';

const declarationUrl = import.meta.resolve('@gravity-ui/charts/chart-config.d.ts');
const declaration = await readFile(new URL(declarationUrl), 'utf8');
```

In ESM runtimes that support JSON modules, load the schema with an import attribute:

```js
import schema from '@gravity-ui/charts/chart-config.schema.json' with {type: 'json'};
```

## Versioning

Both artifacts are versioned with `@gravity-ui/charts`; the package version is also the schema version. Additive config changes may be released in a minor version, while removing, renaming, or narrowing published config fields requires a major version.
