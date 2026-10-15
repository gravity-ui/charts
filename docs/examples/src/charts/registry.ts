import type React from 'react';

import {getGalleryGroups} from './gallery';
import type {ExampleMeta} from './gallery';

interface ExampleModule {
    code: string;
    Component: () => React.ReactElement;
    meta: ExampleMeta;
}

const components = import.meta.glob<ExampleModule['Component']>('./**/*.tsx', {
    eager: true,
    import: 'default',
});
const metadata = import.meta.glob<ExampleMeta>('./**/*.tsx', {
    eager: true,
    import: 'meta',
});
const sources = import.meta.glob<string>('./**/*.tsx', {
    eager: true,
    query: '?example-source',
    import: 'default',
});

export const registry: Record<string, ExampleModule> = Object.fromEntries(
    Object.entries(components).map(([path, Component]) => [
        path.slice(2, -4),
        {Component, code: sources[path], meta: metadata[path]},
    ]),
);

export const galleryGroups = getGalleryGroups(
    Object.fromEntries(Object.entries(registry).map(([id, example]) => [id, example.meta])),
);
