import type React from 'react';

import {AxisLabelFontSizeExample} from './axis-labels/font-size';
import axisLabelFontSizeRaw from './axis-labels/font-size.tsx?raw';
import {CategoryAxisExample} from './axis-types/category';
import categoryRaw from './axis-types/category.tsx?raw';
import {DatetimeAxisExample} from './axis-types/datetime';
import datetimeRaw from './axis-types/datetime.tsx?raw';
import {LinearAxisExample} from './axis-types/linear';
import linearRaw from './axis-types/linear.tsx?raw';
import {LogarithmicAxisExample} from './axis-types/logarithmic';
import logarithmicRaw from './axis-types/logarithmic.tsx?raw';
import {LineInterpolationCardinalExample} from './line-interpolation/cardinal';
import lineInterpolationCardinalRaw from './line-interpolation/cardinal.tsx?raw';
import {LineInterpolationMonotoneExample} from './line-interpolation/monotone';
import lineInterpolationMonotoneRaw from './line-interpolation/monotone.tsx?raw';
import {AreaSeriesExample} from './series-types/area';
import areaSeriesRaw from './series-types/area.tsx?raw';
import {LineSeriesExample} from './series-types/line';
import lineSeriesRaw from './series-types/line.tsx?raw';
import {QuarterlyXAxisExample} from './value-formatting/quarterly-x-axis';
import quarterlyXAxisRaw from './value-formatting/quarterly-x-axis.tsx?raw';

// Strip "import React from 'react';" — not needed in display code (JSX transform handles it)
function extractDisplayCode(raw: string): string {
    return raw.replace(/^import\s+React\s+from\s+['"]react['"];\n/m, '').trim();
}

type ExampleModule = {
    code: string;
    Component: () => React.ReactElement;
};

export const registry: Record<string, ExampleModule> = {
    'axis-labels/font-size': {
        code: extractDisplayCode(axisLabelFontSizeRaw),
        Component: AxisLabelFontSizeExample,
    },
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
    'series-types/line': {
        code: extractDisplayCode(lineSeriesRaw),
        Component: LineSeriesExample,
    },
    'series-types/area': {
        code: extractDisplayCode(areaSeriesRaw),
        Component: AreaSeriesExample,
    },
    'value-formatting/quarterly-x-axis': {
        code: extractDisplayCode(quarterlyXAxisRaw),
        Component: QuarterlyXAxisExample,
    },
    'line-interpolation/monotone': {
        code: extractDisplayCode(lineInterpolationMonotoneRaw),
        Component: LineInterpolationMonotoneExample,
    },
    'line-interpolation/cardinal': {
        code: extractDisplayCode(lineInterpolationCardinalRaw),
        Component: LineInterpolationCardinalExample,
    },
};
