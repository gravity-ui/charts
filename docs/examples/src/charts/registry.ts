import type React from 'react';

import meta from './meta.json';

interface ExampleMeta {
    title: string;
    description: string;
    seriesType: string;
    docsUrl: string;
}

interface ExampleModule {
    code: string;
    Component: () => React.ReactElement;
    meta: ExampleMeta;
}

const components = import.meta.glob<ExampleModule['Component']>('./**/*.tsx', {
    eager: true,
    import: 'default',
});
const sources = import.meta.glob<string>('./**/*.tsx', {
    eager: true,
    query: '?raw',
    import: 'default',
});

export const registry: Record<string, ExampleModule> = Object.fromEntries(
    Object.entries(meta).map(([id, metadata]) => {
        const path = `./${id}.tsx`;
        return [
            id,
            {
                Component: components[path],
                // The automatic JSX transform does not need this import in displayed code.
                code: sources[path]
                    .replace(/^import\s+React\s+from\s+['"]react['"];\n/m, '')
                    .trim(),
                meta: metadata,
            },
        ];
    }),
);
