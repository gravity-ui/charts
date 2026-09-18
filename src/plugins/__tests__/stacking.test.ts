/** @jest-environment jsdom */

import {scaleLinear, scaleOrdinal} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import type {PrepareShapeDataArgs, SeriesPlugin} from '~core/series/plugin';
import {getPreparedOptions} from '~core/series/prepare-options';
import type {PreparedLegend} from '~core/series/types';
import type {PreparedAreaData} from '~core/shapes/area/types';
import type {PreparedBarXData} from '~core/shapes/bar-x/types';
import type {BarYShapesArgs} from '~core/shapes/bar-y/types';
import * as textUtils from '~core/utils/text';

import type {AreaSeries, BarXSeries, ChartSeries} from '../../types';
import {areaPlugin} from '../area';
import {barXPlugin} from '../bar-x';
import {barYPlugin} from '../bar-y';

beforeEach(() => {
    jest.spyOn(textUtils, 'getTextSizeFn').mockReturnValue(async (text) => ({
        width: text.length * 7,
        height: 12,
        hangingOffset: 2,
    }));
});

afterEach(() => jest.restoreAllMocks());

async function prepare(plugin: SeriesPlugin, raw: ChartSeries[]) {
    const horizontal = plugin.type === 'bar-y';
    const series = await plugin.prepareSeries({
        series: raw,
        colorScale: scaleOrdinal([] as string[], ['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    });
    const categoryScale = scaleLinear().domain([0, 2]).range([0, 400]);
    const valueScale = scaleLinear()
        .domain([0, 100])
        .range(horizontal ? [0, 400] : [200, 0]);
    const args: PrepareShapeDataArgs = {
        series,
        seriesOptions: getPreparedOptions(),
        xAxis: {type: 'linear'} as PreparedXAxis,
        xScale: horizontal ? valueScale : categoryScale,
        yAxis: [0, 1].map(() => ({type: 'linear', plotIndex: 0}) as PreparedYAxis),
        yScale: horizontal
            ? [categoryScale]
            : [valueScale, scaleLinear().domain([0, 200]).range([200, 0])],
        boundsHeight: 200,
        boundsWidth: 400,
        split: {plots: [{top: 0, height: 200}]} as PreparedSplit,
    };
    return plugin.prepareShapeData(args);
}

describe.each([barXPlugin, areaPlugin])('$type stacks on different value axes', (plugin) => {
    test.each(['normal', 'percent'] as const)(
        'keeps %s geometry and point labels independent on the same plot',
        async (stacking) => {
            const raw: (BarXSeries | AreaSeries)[] = [0, 1].flatMap((yAxis) =>
                [10, 20].map((y) => ({
                    type: plugin.type as 'bar-x' | 'area',
                    name: `${yAxis}-${y}`,
                    yAxis,
                    stackId: 'shared',
                    stacking,
                    dataLabels: {enabled: true, allowOverlap: true},
                    data: [{x: 1, y}],
                })),
            );
            const geometry = (data: (PreparedBarXData | PreparedAreaData)[]) =>
                data.map((item) => ({
                    name: item.series.name,
                    values:
                        'points' in item
                            ? item.points.map(({y, y0}) => ({y, y0}))
                            : {y: item.y, height: item.height},
                    labels: item.svgLabels.map(({text, y}) => ({text, y})),
                }));
            const combined = await prepare(plugin, raw);
            for (const yAxis of [0, 1]) {
                const separate = await prepare(
                    plugin,
                    raw.filter((s) => s.yAxis === yAxis),
                );
                const combinedData = combined.renderData as PreparedBarXData[] | PreparedAreaData[];
                expect(
                    geometry(combinedData.filter((item) => item.series.yAxis === yAxis)),
                ).toEqual(geometry(separate.renderData as PreparedBarXData[] | PreparedAreaData[]));
            }
        },
    );
});

describe.each([barXPlugin, barYPlugin])('$type mixed stacking modes', (plugin) => {
    test.each([undefined, 'normal'] as const)(
        'a percent stack does not resize a separate stack with stacking=%s',
        async (stacking) => {
            const raw: ChartSeries[] = [stacking, 'percent' as const].flatMap((mode, index) =>
                [10, 20].map((value) => ({
                    type: plugin.type as 'bar-x' | 'bar-y',
                    name: `${index}-${value}`,
                    stackId: String(index),
                    stacking: mode,
                    dataLabels: {enabled: true, allowOverlap: true},
                    data: [plugin.type === 'bar-y' ? {x: value, y: 1} : {x: 1, y: value}],
                })),
            );
            const geometry = (result: Awaited<ReturnType<typeof prepare>>) =>
                plugin.type === 'bar-y'
                    ? (result.renderData[0] as BarYShapesArgs).shapes
                          .filter((item) => item.series.stacking !== 'percent')
                          .map(({x, width}) => ({x, width}))
                    : (result.renderData as PreparedBarXData[])
                          .filter((item) => item.series.stacking !== 'percent')
                          .map(({y, height, svgLabels}) => ({
                              y,
                              height,
                              labels: svgLabels.map(({text, y: labelY}) => ({text, y: labelY})),
                          }));
            const combined = await prepare(plugin, raw);
            const separate = await prepare(plugin, raw.slice(0, 2));
            expect(geometry(combined)).toEqual(geometry(separate));
        },
    );
});
