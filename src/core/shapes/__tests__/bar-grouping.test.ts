/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';

import {prepareBarXSeries} from '../../../plugins/bar-x/prepare-bar-x-series';
import {prepareBarYSeries} from '../../../plugins/bar-y/prepare-bar-y-series';
import type {BarXSeries, BarYSeries} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import {seriesOptionsDefaults} from '../../constants';
import type {PreparedSplit} from '../../layout/split-types';
import type {PreparedBarXSeries, PreparedLegend} from '../../series/types';
import {getDomainDataXBySeries, getDomainDataYBySeries} from '../../utils/common';
import {getClosestPoints} from '../../utils/get-closest-data';
import {prepareBarXData} from '../bar-x/prepare-data';
import {getBarXPaths} from '../bar-x/utils';
import {prepareBarYData} from '../bar-y/prepare-data';

interface SeriesInput {
    value: number | null;
    visible?: boolean;
    category?: string;
    barPadding?: number;
    barMaxWidth?: number;
    grouping?: boolean;
    stacking?: 'normal' | 'percent';
    stackId?: string;
}

interface PrepareOptions {
    borderWidth?: number;
    barMaxWidth?: number;
    barPadding?: number;
    groupPadding?: number;
    valueSize?: number;
    categoryDomain?: string[];
    stackGap?: number;
}

const legend = {enabled: false} as PreparedLegend;

describe.each(['bar-x', 'bar-y'] as const)('%s grouping', (type) => {
    async function prepare(
        inputs: SeriesInput[],
        size = 200,
        reversed = false,
        options: PrepareOptions = {},
    ) {
        const {valueSize = 400, categoryDomain, ...layoutOptions} = options;
        const increases = type === 'bar-y' ? !reversed : reversed;
        const categories = Array.from(new Set(inputs.map((s) => s.category ?? 'A')));
        const categoryScale = scaleBand()
            .domain(categoryDomain ?? categories)
            .range([0, size]);
        const valueScale = scaleLinear()
            .domain(inputs.some((s) => s.stacking === 'percent') ? [0, 100] : [-100, 100])
            .range(increases ? [0, valueSize] : [valueSize, 0]);
        const seriesOptions = {
            ...seriesOptionsDefaults,
            [type]: {...seriesOptionsDefaults[type], ...layoutOptions},
        };
        const common = {
            legend,
            seriesOptions,
            colorScale: scaleOrdinal<string, string>().range(['#000']),
            colors: [],
        };
        let geometry;
        let shapesData;
        let domainValues;
        if (type === 'bar-x') {
            const raw: BarXSeries[] = inputs.map(
                ({value, category = 'A', ...seriesInput}, index) => ({
                    type,
                    name: String(index),
                    data: [{x: category, y: value}],
                    ...seriesInput,
                }),
            );
            const rawBefore = JSON.stringify(raw);
            const series = prepareBarXSeries({...common, series: raw}) as PreparedBarXSeries[];
            domainValues = getDomainDataYBySeries(series);
            const bars = await prepareBarXData({
                series: series.filter((s) => s.visible),
                seriesOptions,
                xAxis: {type: 'category', categories} as PreparedXAxis,
                xScale: categoryScale,
                yAxis: [{type: 'linear', plotIndex: 0, grid: {enabled: false}}] as PreparedYAxis[],
                yScale: [valueScale],
                boundsHeight: 400,
                boundsWidth: size,
                split: {plots: [{top: 0, height: 400}]} as PreparedSplit,
            });
            geometry = bars.map((d) => ({
                center: d.x + d.width / 2,
                thickness: d.width,
                start: d.y,
                end: d.y + d.height,
                value: d.data.y,
                name: d.series.name,
                hasBorder: Boolean(getBarXPaths(d).border),
                percentage: d.percentage,
                isStackEnd: d.isStackEnd,
            }));
            shapesData = bars;
            bars.forEach((d) => expect(d.data).toBe(raw[Number(d.series.name)].data[0]));
            expect(JSON.stringify(raw)).toBe(rawBefore);
        } else {
            const raw: BarYSeries[] = inputs.map(
                ({value, category = 'A', ...seriesInput}, index) => ({
                    type,
                    name: String(index),
                    data: [{y: category, x: value}],
                    ...seriesInput,
                }),
            );
            const rawBefore = JSON.stringify(raw);
            const series = await prepareBarYSeries({...common, series: raw});
            domainValues = getDomainDataXBySeries(series);
            const {shapes} = await prepareBarYData({
                series: series.filter((s) => s.visible),
                seriesOptions,
                xAxis: {type: 'linear'} as PreparedXAxis,
                xScale: valueScale,
                yAxis: [{type: 'category', categories}] as PreparedYAxis[],
                yScale: [categoryScale],
                boundsHeight: size,
                boundsWidth: 400,
            });
            geometry = shapes.map((d) => ({
                center: d.y + d.height / 2,
                thickness: d.height,
                start: d.x,
                end: d.x + d.width,
                value: d.data.x,
                name: d.series.name,
                hasBorder: d.borderWidth > 0,
                percentage: d.percentage,
                isStackEnd: d.isLastStackItem,
            }));
            shapesData = shapes;
            shapes.forEach((d) => expect(d.data).toBe(raw[Number(d.series.name)].data[0]));
            expect(JSON.stringify(raw)).toBe(rawBefore);
        }
        const chunks = getClosestPoints({
            shapesData,
            position: [100, 100],
            boundsWidth: 400,
            boundsHeight: 400,
        });
        chunks.forEach((chunk) => {
            const input = inputs[Number(chunk.series.name)];
            if (input.stackId !== undefined) {
                expect('stackId' in chunk.series && chunk.series.stackId).toBe(input.stackId);
            }
        });
        return {bars: geometry, domainValues};
    }

    test('inherits width limits and lets series override them in both directions', async () => {
        const inputs = [{value: 40}, {value: 60}, {value: 80}];
        const options = {barMaxWidth: 30};
        const {bars: reference} = await prepare(inputs, 600, false, options);
        const {bars: explicit} = await prepare(
            inputs.map((s) => ({...s, barMaxWidth: 30})),
            600,
            false,
            options,
        );
        expect(explicit).toEqual(reference);
        const {bars: narrower} = await prepare(
            inputs.map((s, i) => ({...s, barMaxWidth: i === 0 ? 15 : undefined})),
            600,
            false,
            options,
        );
        expect(narrower.map((bar) => bar.thickness)).toEqual([15, 30, 30]);
        expect(narrower.map((bar) => bar.center)).toEqual(reference.map((bar) => bar.center));
        const {bars: wider} = await prepare(
            inputs.map((s, i) => ({...s, barMaxWidth: i === 0 ? 100 : undefined})),
            600,
            false,
            options,
        );
        expect(wider.map((bar) => bar.thickness)).toEqual([100, 30, 30]);
        for (let i = 1; i < wider.length; i++) {
            expect(wider[i].center - wider[i].thickness / 2).toBeGreaterThan(
                wider[i - 1].center + wider[i - 1].thickness / 2,
            );
        }
        expect(await prepare(inputs)).toEqual(
            await prepare(inputs.map((s) => ({...s, barMaxWidth: 50}))),
        );
    });

    test('nonbinding width limits and overlays preserve neighboring slot centers', async () => {
        const inputs = [{value: 40, barPadding: 0.9}, {value: 60}];
        const {bars: before} = await prepare(inputs);
        const {bars: after} = await prepare([
            {...inputs[0], barMaxWidth: 1000},
            inputs[1],
            {value: 80, grouping: false, barMaxWidth: 1000},
        ]);
        expect(after.slice(0, 2)).toEqual(before);
        expect(after[2].center).toBe(100);
        expect(after[2].thickness).toBeGreaterThan(50);
    });

    test.each([undefined, 'normal', 'percent'] as const)(
        'uses the smallest resolved width limit in each stack, stacking=%s',
        async (stacking) => {
            for (const grouping of [true, false]) {
                const {bars} = await prepare(
                    [
                        {value: 20, stacking, grouping, stackId: 'a', barMaxWidth: 25},
                        {value: 30, stacking, grouping, stackId: 'a'},
                        {value: 40, stacking, grouping, stackId: 'b', barMaxWidth: 60},
                    ],
                    600,
                    false,
                    {barMaxWidth: 40},
                );
                expect(bars.map((bar) => bar.thickness)).toEqual(
                    grouping || stacking ? [25, 25, 60] : [25, 40, 60],
                );
            }
        },
    );

    test('includes hidden and sparse series when resolving stack width limits', async () => {
        const inputs: SeriesInput[] = [
            {value: 20, category: 'A', stacking: 'normal', stackId: 'a', barMaxWidth: 60},
            {value: 30, category: 'B', stacking: 'normal', stackId: 'a', barMaxWidth: 15},
            {value: 40, category: 'A', stacking: 'normal', stackId: 'b', barMaxWidth: 30},
        ];
        const {bars} = await prepare(inputs);
        expect(bars.map((bar) => bar.thickness)).toEqual([15, 30, 15]);
        const {bars: hidden} = await prepare(inputs.map((s, i) => ({...s, visible: i !== 1})));
        expect(hidden.map((bar) => bar.thickness)).toEqual([15, 30]);
    });

    test.each([
        {size: 200, barMaxWidth: 1, options: {}, expected: 1},
        {size: 200, barMaxWidth: undefined, options: {barMaxWidth: 0}, expected: 1},
        {size: 0, barMaxWidth: 100, options: {}, expected: 1},
        {size: 200, barMaxWidth: 100, options: {groupPadding: 2}, expected: 1},
        {size: 3, barMaxWidth: 10000, options: {}, expected: 1},
        {size: 200, barMaxWidth: 100, options: {}, expected: 72},
    ])('bounds per-series width for %j', async ({size, barMaxWidth, options, expected}) => {
        const {bars} = await prepare(
            [
                {value: 40, barMaxWidth},
                {value: 60, barMaxWidth},
            ],
            size,
            false,
            options,
        );
        bars.forEach((bar) => {
            expect(Number.isFinite(bar.center)).toBe(true);
            expect(bar.thickness).toBeCloseTo(expected);
        });
    });

    test('wide series with small padding stay inside the category band', async () => {
        const {bars} = await prepare(
            Array.from({length: 4}, () => ({value: 40, barPadding: 0, barMaxWidth: 1000})),
        );
        expect(bars).toHaveLength(4);
        for (const bar of bars) {
            expect(bar.center - bar.thickness / 2).toBeGreaterThanOrEqual(0);
            expect(bar.center + bar.thickness / 2).toBeLessThanOrEqual(200);
        }
        for (let i = 1; i < bars.length; i++) {
            expect(bars[i].center - bars[i].thickness / 2).toBeGreaterThan(
                bars[i - 1].center + bars[i - 1].thickness / 2,
            );
        }
    });

    test('a skipped null series does not expand neighboring grouped slots', async () => {
        const inputs = [{value: 40}, {value: 60}];
        const {bars: reference} = await prepare(inputs, 600);
        const {bars} = await prepare([...inputs, {value: null, barMaxWidth: 1000}], 600);
        expect(bars).toEqual(reference);
    });

    test('a series outside the visible category domain does not expand grouped slots', async () => {
        const inputs = [{value: 40}, {value: 60}, {value: 80, category: 'B'}];
        const options = {categoryDomain: ['A']};
        const {bars: reference} = await prepare(inputs, 600, false, options);
        const {bars} = await prepare(
            inputs.map((s, i) => ({
                ...s,
                barMaxWidth: i === 2 ? 1000 : undefined,
            })),
            600,
            false,
            options,
        );
        expect(bars).toEqual(reference);
    });

    test('inherits padding and preserves centers when series thickness changes', async () => {
        const inputs = [{value: 40}, {value: 60}, {value: 80}];
        const options = {barPadding: 0.4, barMaxWidth: 1000};
        const {bars: inherited} = await prepare(inputs, 200, false, options);
        const {bars: explicit} = await prepare(
            inputs.map((s) => ({...s, barPadding: 0.4})),
            200,
            false,
            options,
        );
        expect(explicit).toEqual(inherited);
        const {bars: mixed} = await prepare(
            inputs.map((s, i) => ({...s, barPadding: [0, 0.8, undefined][i]})),
            200,
            false,
            options,
        );
        expect(mixed.map((s) => s.center)).toEqual(inherited.map((s) => s.center));
        expect(mixed[0].thickness).toBeGreaterThan(inherited[0].thickness);
        expect(mixed[1].thickness).toBeLessThan(inherited[1].thickness);
        expect(mixed[2]).toEqual(inherited[2]);
    });

    test.each([undefined, 'normal', 'percent'] as const)(
        'uses the largest resolved padding in each stack, stacking=%s',
        async (stacking) => {
            for (const grouping of [true, false]) {
                // Non-stacked overlays remain independent even with a shared stackId.
                const {bars} = await prepare(
                    [
                        {value: 20, stacking, grouping, stackId: 'a', barPadding: 0.2},
                        {value: 30, stacking, grouping, stackId: 'a'},
                        {value: 40, stacking, grouping, stackId: 'b', barPadding: 0.1},
                    ],
                    200,
                    false,
                    {barPadding: 0.6, barMaxWidth: 1000},
                );
                if (grouping || stacking) {
                    expect(bars[0].thickness).toBe(bars[1].thickness);
                    expect(bars[0].center).toBe(bars[1].center);
                } else {
                    expect(bars[0].thickness).toBeGreaterThan(bars[1].thickness);
                }
                expect(bars[2].thickness).toBeGreaterThan(bars[0].thickness);
            }
        },
    );

    test('includes initially hidden series when resolving stack padding', async () => {
        const inputs: SeriesInput[] = [
            {value: 80, grouping: false, stackId: 'plan'},
            {value: 40, grouping: false, stacking: 'normal', stackId: 'actual'},
            {
                value: 20,
                grouping: false,
                stacking: 'normal',
                stackId: 'actual',
                barPadding: 0.6,
            },
        ];
        const options = {barMaxWidth: 1000};
        const {bars: visible} = await prepare(inputs, 200, false, options);
        const {bars: hidden} = await prepare(
            inputs.map((s, index) => ({...s, visible: index !== 2})),
            200,
            false,
            options,
        );
        expect(hidden).toHaveLength(2);
        expect(hidden[1].thickness).toBe(visible[1].thickness);
        expect(hidden[1].thickness).toBeLessThan(hidden[0].thickness);
    });

    test('keeps stack thickness consistent across sparse categories', async () => {
        const {bars} = await prepare(
            [
                {value: 20, category: 'A', stacking: 'normal', stackId: 'a', barPadding: 0.2},
                {value: 30, category: 'B', stacking: 'normal', stackId: 'a', barPadding: 0.8},
                {value: 40, category: 'A', stacking: 'normal', stackId: 'b', barPadding: 0.2},
                {value: 50, category: 'B', stacking: 'normal', stackId: 'b', barPadding: 0.2},
            ],
            200,
            false,
            {barMaxWidth: 1000},
        );
        const firstStack = bars.filter((bar) => ['0', '1'].includes(bar.name));
        const secondStack = bars.filter((bar) => ['2', '3'].includes(bar.name));
        expect(firstStack[0].thickness).toBe(firstStack[1].thickness);
        expect(secondStack[0].thickness).toBe(secondStack[1].thickness);
        expect(firstStack[0].thickness).toBeLessThan(secondStack[0].thickness);
    });

    test('omitted padding matches an explicit default', async () => {
        const inputs = [{value: 40}, {value: 60}];
        expect(await prepare(inputs, 80)).toEqual(
            await prepare(
                inputs.map((s) => ({...s, barPadding: 0.2})),
                80,
            ),
        );
    });

    test('overlays change thickness without moving neighboring grouped slots', async () => {
        const grouped = [{value: 40}, {value: 60}];
        const {bars: before} = await prepare(grouped);
        const {bars} = await prepare([
            ...grouped,
            {value: 80, grouping: false, barPadding: 0.2},
            {value: 60, grouping: false, barPadding: 0.8},
        ]);
        expect(bars.slice(0, 2)).toEqual(before);
        expect(bars.slice(2).map((bar) => bar.center)).toEqual([100, 100]);
        expect(bars[2].thickness).toBe(50);
        expect(bars[3].thickness).toBeCloseTo(36);
    });

    test.each([
        {size: 200, options: {}, paddings: [0, 0.2], thickness: 50},
        {size: 200, options: {barMaxWidth: 1000}, paddings: [1, 1], thickness: 1},
        {size: 0, options: {}, paddings: [0, 0.8], thickness: 1},
        {size: 1, options: {}, paddings: [0, 0.8], thickness: 1},
        {size: 200, options: {groupPadding: 2}, paddings: [0, 0.8], thickness: 1},
        {size: 3, options: {barMaxWidth: 1000}, paddings: [0, 0.8], thickness: undefined},
    ])('applies padding before width limits: %j', async ({size, options, paddings, thickness}) => {
        for (const grouping of [true, false]) {
            const {bars: reference} = await prepare(
                [
                    {value: 40, grouping},
                    {value: 60, grouping},
                ],
                size,
                false,
                options,
            );
            const {bars} = await prepare(
                paddings.map((barPadding, i) => ({value: 40 + i * 20, grouping, barPadding})),
                size,
                false,
                options,
            );
            bars.forEach((bar, i) => {
                expect(bar.center).toBe(reference[i].center);
                expect(Number.isFinite(bar.thickness)).toBe(true);
                expect(bar.thickness).toBeGreaterThanOrEqual(1);
                if (thickness !== undefined) expect(bar.thickness).toBe(thickness);
                if (size === 3) expect(bar.thickness).toBeLessThanOrEqual(size);
            });
        }
    });

    test.each([false, true])(
        'overlays share the center and baseline, reversed=%s',
        async (reversed) => {
            const {bars, domainValues} = await prepare(
                [80, 40, -60, -20].map((value) => ({value, grouping: false, stackId: 'shared'})),
                200,
                reversed,
            );
            expect(new Set(domainValues)).toEqual(new Set([80, 40, -60, -20]));
            expect(bars.map((d) => d.center)).toEqual([100, 100, 100, 100]);
            for (const bar of bars) {
                const increases = type === 'bar-y' ? !reversed : reversed;
                const end = 200 + Number(bar.value) * 2 * (increases ? 1 : -1);
                expect(bar.start).toBeCloseTo(Math.min(200, end));
                expect(bar.end).toBeCloseTo(Math.max(200, end));
            }
        },
    );

    test.each([undefined, 'normal', 'percent'] as const)(
        'overlays do not consume grouped slots, stacking=%s',
        async (stacking) => {
            const grouped = [{value: 20}, {value: 40, grouping: true}];
            const {bars: plain} = await prepare(grouped);
            const {bars: mixed} = await prepare([
                {value: 80, grouping: false, stacking, stackId: 'overlay'},
                ...grouped,
                {value: 60, grouping: false, stacking, stackId: 'overlay'},
            ]);
            expect(mixed.slice(1, 3).map(({center, thickness}) => ({center, thickness}))).toEqual(
                plain.map(({center, thickness}) => ({center, thickness})),
            );
            expect(mixed[0].center).toBe(100);
            expect(mixed[3].center).toBe(100);
            expect(mixed.map((d) => d.name)).toEqual(['0', '1', '2', '3']);
        },
    );

    test.each(['normal', 'percent'] as const)(
        'overlays %s stacks without changing their values, gaps or ends',
        async (stacking) => {
            const inputs = [20, 40, 10, 30].map((value, index) => ({
                value,
                stacking,
                stackId: index < 2 ? 'plan' : 'actual',
            }));
            const plain = await prepare(inputs, 200, false, {stackGap: 3});
            expect(
                await prepare(
                    inputs.map((s) => ({...s, grouping: true})),
                    200,
                    false,
                    {stackGap: 3},
                ),
            ).toEqual(plain);
            const overlaid = await prepare(
                inputs.map((s) => ({...s, grouping: false})),
                200,
                false,
                {stackGap: 3},
            );
            expect(overlaid.domainValues).toEqual(plain.domainValues);
            expect(new Set(overlaid.domainValues)).toEqual(new Set([60, 40]));
            expect(overlaid.bars.map((bar) => bar.center)).toEqual([100, 100, 100, 100]);
            expect(
                overlaid.bars.map(({center: _center, thickness: _thickness, ...bar}) => bar),
            ).toEqual(plain.bars.map(({center: _center, thickness: _thickness, ...bar}) => bar));
            expect(overlaid.bars.map((bar) => bar.isStackEnd)).toEqual([false, true, false, true]);
            if (stacking === 'percent') {
                expect(overlaid.bars.map((bar) => bar.percentage)).toEqual([
                    1 / 3,
                    2 / 3,
                    1 / 4,
                    3 / 4,
                ]);
                for (const index of [1, 3]) {
                    expect(
                        type === 'bar-x' ? overlaid.bars[index].start : overlaid.bars[index].end,
                    ).toBeCloseTo(type === 'bar-x' ? 0 : 400);
                }
            }
        },
    );

    test.each([false, true])(
        'overlaid stacks preserve positive and negative segments, reversed=%s',
        async (reversed) => {
            const inputs = [20, -10, 40, -30, 10, -20, 30, -40].map((value, index) => ({
                value,
                stacking: 'normal' as const,
                stackId: index < 4 ? 'plan' : 'actual',
            }));
            const plain = await prepare(inputs, 200, reversed);
            const overlaid = await prepare(
                inputs.map((s) => ({...s, grouping: false})),
                200,
                reversed,
            );
            expect(new Set(overlaid.domainValues)).toEqual(new Set([60, -40, 40, -60]));
            expect(overlaid.bars.every((bar) => bar.center === 100)).toBe(true);
            expect(
                overlaid.bars.map(({center: _center, thickness: _thickness, ...bar}) => bar),
            ).toEqual(plain.bars.map(({center: _center, thickness: _thickness, ...bar}) => bar));
        },
    );

    test.each([0, 10, 400])(
        'renders borders only when both dimensions fit (%s)',
        async (valueSize) => {
            const {bars} = await prepare(
                [
                    {value: 0, grouping: false},
                    {value: 50, grouping: false},
                ],
                200,
                false,
                {borderWidth: 3, valueSize},
            );
            expect(bars.map((bar) => bar.hasBorder)).toEqual([false, valueSize === 400]);
            expect(bars.every((bar) => bar.end >= bar.start)).toBe(true);
        },
    );

    test.each([{barMaxWidth: 10000}, {groupPadding: 2}])(
        'keeps oversized layout options finite: %s',
        async (options) => {
            const {
                bars: [bar],
            } = await prepare([{value: 40, grouping: false}], 3, false, options);
            expect(bar.center).toBe(1.5);
            expect(bar.thickness).toBeGreaterThanOrEqual(0);
            expect(bar.thickness).toBeLessThanOrEqual(3);
        },
    );

    test.each([0, 1, 3])(
        'keeps finite nonnegative sizes with available category space %s',
        async (size) => {
            const {bars} = await prepare(
                [
                    {value: 80, grouping: false},
                    {value: 20},
                    {value: 40},
                    {value: 20, grouping: false, stacking: 'normal', stackId: 'overlay'},
                    {value: 40, grouping: false, stacking: 'normal', stackId: 'overlay'},
                ],
                size,
            );
            for (const bar of bars) {
                expect(Number.isFinite(bar.center)).toBe(true);
                expect(Number.isFinite(bar.thickness)).toBe(true);
                expect(bar.thickness).toBeGreaterThanOrEqual(0);
            }
            expect(bars[0].center).toBe(size / 2);
        },
    );
});
