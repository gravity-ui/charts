# Chart config tooling

The package publishes two versioned config artifacts:

- `@gravity-ui/charts/chart-config.d.ts` — standalone declarations for Monaco's TypeScript language service.
- `@gravity-ui/charts/chart-config.schema.json` — JSON Schema for generation and validation of JSON-only chart configs.

## Usage

The declaration is a text asset, not a runtime JavaScript module. In Node.js, resolve and read it before registering it in Monaco:

```js
const fs = require('node:fs');

const declarationPath = require.resolve('@gravity-ui/charts/chart-config.d.ts');
const declaration = fs.readFileSync(declarationPath, 'utf8');

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  declaration,
  'file:///node_modules/@gravity-ui/charts/chart-config.d.ts',
);

const schema = require('@gravity-ui/charts/chart-config.schema.json');
```

In Node.js ESM, resolve the declaration to a file URL before reading it:

```js
import {readFile} from 'node:fs/promises';

const declarationUrl = import.meta.resolve('@gravity-ui/charts/chart-config.d.ts');
const declaration = await readFile(new URL(declarationUrl), 'utf8');

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  declaration,
  'file:///node_modules/@gravity-ui/charts/chart-config.d.ts',
);
```

In ESM runtimes that support JSON modules, load the schema with an import attribute:

```js
import schema from '@gravity-ui/charts/chart-config.schema.json' with {type: 'json'};
```

Bundlers with raw-file imports can load the declaration through their corresponding raw asset mechanism, such as `?raw` in Vite.

## Versioning

Both artifacts are versioned with `@gravity-ui/charts`; the package version is also the schema version. Additive config changes may be released in a minor version, while removing, renaming, or narrowing published config fields requires a major version.
