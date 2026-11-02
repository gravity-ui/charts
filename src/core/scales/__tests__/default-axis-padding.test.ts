/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleOrdinal} from 'd3-scale';

import {createScales} from '../../../hooks/useAxisScales';
import {getPreparedXAxis} from '../../axes/x-axis';
import {getPreparedYAxis} from '../../axes/y-axis';
import type {PreparedSplit} from '../../layout/split-types';
import {getSeriesPlugin} from '../../series/seriesRegistry';
import type {PreparedLegend, PreparedSeries} from '../../series/types';
import type {ChartAxisPadding, ChartSeries, HeatmapSeries, LineSeries} from '../../types';

const data = [
    {x: 0, y: 0},
    {x: 2, y: 100},
];
const line: LineSeries = {type: 'line', name: 'Revenue', data};
const heatmap: HeatmapSeries = {
    type: 'heatmap',
    name: 'Intensity',
    data: data.map((point) => ({...point, value: 1})),
};

interface Scenario {
    name: string;
    raw: ChartSeries[];
    padding?: ChartAxisPadding;
    xDomain: number[];
    yDomain: number[];
}

const scenarios: Scenario[] = [
    {name: 'line defaults', raw: [line], xDomain: [0, 2.02], yDomain: [0, 105]},
    {name: 'heatmap defaults', raw: [heatmap], xDomain: [-1, 3], yDomain: [-50, 150]},
    {name: 'mixed series defaults', raw: [heatmap, line], xDomain: [-1, 3], yDomain: [-50, 150]},
    {
        name: 'explicit heatmap padding',
        raw: [heatmap],
        padding: {max: '10%'},
        xDomain: [-1, 3.2],
        yDomain: [-50, 160],
    },
    {
        name: 'explicit zero',
        raw: [line],
        padding: {max: 0},
        xDomain: [0, 2],
        yDomain: [0, 100],
    },
];

test.each(scenarios)('preserves $name after removing maxPadding', async (scenario) => {
    const original = JSON.stringify(scenario.raw);
    const series: PreparedSeries[] = [];
    for (const type of new Set(scenario.raw.map((item) => item.type))) {
        series.push(
            ...(await getSeriesPlugin(type).prepareSeries({
                series: scenario.raw.filter((item) => item.type === type),
                colors: [],
                colorScale: scaleOrdinal<string, string>().range(['black']),
                legend: {enabled: false} as PreparedLegend,
            })),
        );
    }
    const axis = {
        labels: {enabled: false},
        startOnTick: false,
        endOnTick: false,
        padding: scenario.padding,
    };
    const xAxis = await getPreparedXAxis({
        seriesData: series,
        width: 600,
        boundsWidth: 600,
        xAxis: axis,
    });
    const yAxis = await getPreparedYAxis({
        seriesData: series,
        width: 600,
        height: 300,
        boundsHeight: 300,
        yAxis: [axis],
    });
    const scales = createScales({
        series,
        xAxis,
        yAxis,
        boundsWidth: 600,
        boundsHeight: 300,
        split: {plots: [{top: 0, height: 300}], gap: 0} as PreparedSplit,
    });
    expect(scales.xScale?.domain()).toEqual(scenario.xDomain);
    expect(scales.yScale[0]?.domain()).toEqual(scenario.yDomain);
    expect(JSON.stringify(scenario.raw)).toBe(original);
});
