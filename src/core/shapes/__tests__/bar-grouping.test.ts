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
        const categoryScale = scaleBand().domain(['A']).range([0, size]);
        const valueScale = scaleLinear()
            .domain([-100, 100])
            .range(reversed ? [0, valueSize] : [valueSize, 0]);
        const original = JSON.stringify(inputs);
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
        if (type === 'bar-x') {
            const raw: BarXSeries[] = inputs.map(({value, ...seriesInput}, index) => ({
                type,
                name: String(index),
                data: [{x: 'A', y: value}],
                ...seriesInput,
            }));
            const rawBefore = JSON.stringify(raw);
            const series = prepareBarXSeries({...common, series: raw}) as PreparedBarXSeries[];
            if (inputs.every((s) => s.grouping === false && !s.stacking)) {
                expect(getDomainDataYBySeries(series).sort()).toEqual(
                    [...new Set(inputs.map((s) => s.value))].sort(),
                );
            }
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
            }));
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
            if (inputs.every((s) => s.grouping === false && !s.stacking)) {
                expect(getDomainDataXBySeries(series).sort()).toEqual(
                    [...new Set(inputs.map((s) => s.value))].sort(),
                );
            }
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
            }));
            shapes.forEach((d) => expect(d.data).toBe(raw[Number(d.series.name)].data[0]));
            expect(JSON.stringify(raw)).toBe(rawBefore);
        }
        expect(JSON.stringify(inputs)).toBe(original);
        return geometry;
    }

    test.each([false, true])(
        'overlays share the center and baseline, reversed=%s',
        async (reversed) => {
            const bars = await prepare(
                [80, 40, -60, -20].map((value) => ({value, grouping: false, stackId: 'shared'})),
                200,
                reversed,
            );
            expect(bars.map((d) => d.center)).toEqual([100, 100, 100, 100]);
            for (const bar of bars) {
                const end = reversed ? 200 + Number(bar.value) * 2 : 200 - Number(bar.value) * 2;
                expect(bar.start).toBeCloseTo(Math.min(200, end));
                expect(bar.end).toBeCloseTo(Math.max(200, end));
            }
        },
    );

    test('overlays do not consume grouped slots or change their widths', async () => {
        const grouped = [{value: 20}, {value: 40, grouping: true}];
        const plain = await prepare(grouped);
        const mixed = await prepare([
            {value: 80, grouping: false},
            ...grouped,
            {value: 60, grouping: false},
        ]);
        expect(mixed.slice(1, 3).map(({center, thickness}) => ({center, thickness}))).toEqual(
            plain.map(({center, thickness}) => ({center, thickness})),
        );
        expect(mixed[0].center).toBe(100);
        expect(mixed[3].center).toBe(100);
        expect(mixed.map((d) => d.name)).toEqual(['0', '1', '2', '3']);
    });

    test.each(['normal', 'percent'] as const)(
        'preserves %s stacks when grouping is false',
        async (stacking) => {
            const inputs = [20, 40].map((value) => ({value, stacking}));
            expect(await prepare(inputs.map((s) => ({...s, grouping: false})))).toEqual(
                await prepare(inputs),
            );
        },
    );

    test.each([0, 1, 10, 400])(
        'renders borders only when both dimensions fit (%s)',
        async (valueSize) => {
            const bars = await prepare(
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
            const [bar] = await prepare([{value: 40, grouping: false}], 3, false, options);
            expect(bar.center).toBe(1.5);
            expect(bar.thickness).toBeGreaterThanOrEqual(0);
            expect(bar.thickness).toBeLessThanOrEqual(3);
        },
    );

    test.each([0, 1, 3])(
        'keeps finite nonnegative sizes with available category space %s',
        async (size) => {
            const bars = await prepare(
                [{value: 80, grouping: false}, {value: 20}, {value: 40}],
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
