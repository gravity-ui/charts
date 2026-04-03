import type React from 'react';

import {CategoryAxisExample} from './axis-types/category';
import categoryRaw from './axis-types/category.tsx?raw';
import {DatetimeAxisExample} from './axis-types/datetime';
import datetimeRaw from './axis-types/datetime.tsx?raw';
import {LinearAxisExample} from './axis-types/linear';
import linearRaw from './axis-types/linear.tsx?raw';
import {LogarithmicAxisExample} from './axis-types/logarithmic';
import logarithmicRaw from './axis-types/logarithmic.tsx?raw';

// Strip "import React from 'react';" — not needed in display code (JSX transform handles it)
function extractDisplayCode(raw: string): string {
    return raw.replace(/^import\s+React\s+from\s+['"]react['"];\n/m, '').trim();
}

type ExampleModule = {
    code: string;
    Component: () => React.ReactElement;
};

export const registry: Record<string, ExampleModule> = {
    'axis-types/linear': {code: extractDisplayCode(linearRaw), Component: LinearAxisExample},
    'axis-types/logarithmic': {
        code: extractDisplayCode(logarithmicRaw),
        Component: LogarithmicAxisExample,
    },
    'axis-types/datetime': {code: extractDisplayCode(datetimeRaw), Component: DatetimeAxisExample},
    'axis-types/category': {
        code: extractDisplayCode(categoryRaw),
        Component: CategoryAxisExample,
    },
};
