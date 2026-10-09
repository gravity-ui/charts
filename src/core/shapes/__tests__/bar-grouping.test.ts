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
    value: number;
    grouping?: boolean;
    stacking?: 'normal' | 'percent';
    stackId?: string;
}

interface PrepareOptions {
    borderWidth?: number;
    barMaxWidth?: number;
    groupPadding?: number;
    valueSize?: number;
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
        const {valueSize = 400, ...layoutOptions} = options;
        const increases = type === 'bar-y' ? !reversed : reversed;
        const categoryScale = scaleBand().domain(['A']).range([0, size]);
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
            const raw: BarXSeries[] = inputs.map(({value, ...seriesInput}, index) => ({
                type,
                name: String(index),
                data: [{x: 'A', y: value}],
                ...seriesInput,
            }));
            const rawBefore = JSON.stringify(raw);
            const series = prepareBarXSeries({...common, series: raw}) as PreparedBarXSeries[];
            domainValues = getDomainDataYBySeries(series);
            const bars = await prepareBarXData({
                series,
                seriesOptions,
                xAxis: {type: 'category', categories: ['A']} as PreparedXAxis,
                xScale: categoryScale,
                yAxis: [{type: 'linear', plotIndex: 0, grid: {enabled: false}}] as PreparedYAxis[],
                yScale: [valueScale],
                boundsHeight: 400,
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
            const raw: BarYSeries[] = inputs.map(({value, ...seriesInput}, index) => ({
                type,
                name: String(index),
                data: [{y: 'A', x: value}],
                ...seriesInput,
            }));
            const rawBefore = JSON.stringify(raw);
            const series = await prepareBarYSeries({...common, series: raw});
            domainValues = getDomainDataXBySeries(series);
            const {shapes} = await prepareBarYData({
                series,
                seriesOptions,
                xAxis: {type: 'linear'} as PreparedXAxis,
                xScale: valueScale,
                yAxis: [{type: 'category', categories: ['A']}] as PreparedYAxis[],
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

    test.each([0, 1])(
        'grouping is resolved per series within a stack, overlay index=%s',
        async (overlayIndex) => {
            const inputs = [20, 40, 60].map((value, index) => ({
                value,
                stacking: 'normal' as const,
                stackId: index < 2 ? 'plan' : 'actual',
            }));
            const plain = await prepare(inputs);
            const mixed = await prepare(
                inputs.map((s, index) => ({
                    ...s,
                    grouping: index === overlayIndex ? false : undefined,
                })),
            );
            expect(mixed.bars[overlayIndex].center).toBe(100);
            expect(mixed.bars.filter((_, index) => index !== overlayIndex)).toEqual(
                plain.bars.filter((_, index) => index !== overlayIndex),
            );
            expect(mixed.bars.map((bar) => [bar.start, bar.end])).toEqual(
                plain.bars.map((bar) => [bar.start, bar.end]),
            );
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
