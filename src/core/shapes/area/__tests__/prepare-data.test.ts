/** @jest-environment jsdom */

import {scaleLinear, scaleOrdinal} from 'd3-scale';

import {prepareAreaSeries} from '../../../../plugins/area/prepare-area-series';
import type {AreaSeries} from '../../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import type {PreparedSplit} from '../../../layout/split-types';
import type {PreparedLegend} from '../../../series/types';
import {prepareAreaData} from '../prepare-data';

const BOUNDS_WIDTH = 590;

function buildArgs(boundsHeight: number) {
    const series: AreaSeries[] = [
        {
            type: 'area',
            name: 'top',
            stacking: 'percent',
            data: [1631, 1587, 1652, 1610].map((y, index) => ({x: index, y})),
            dataLabels: {enabled: true},
        },
        {
            type: 'area',
            name: 'bottom',
            stacking: 'percent',
            data: [96, 79, 86, 75].map((y, index) => ({x: index, y})),
            dataLabels: {enabled: true},
        },
    ];

    return {
        series: prepareAreaSeries({
            colorScale: scaleOrdinal([] as string[], ['#000000']),
            colors: [],
            legend: {enabled: false} as PreparedLegend,
            series,
        }),
        xAxis: {type: 'linear'} as PreparedXAxis,
        xScale: scaleLinear().domain([0, 3]).range([0, BOUNDS_WIDTH]),
        yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
        yScale: [scaleLinear().domain([0, 100]).range([boundsHeight, 0])],
        split: {plots: [{top: 0, height: boundsHeight}]} as unknown as PreparedSplit,
        // Deliberately strict, without the sub-pixel tolerance of the real chart:
        // the point coordinates themselves must land inside the plot area.
        isOutsideBounds: (x: number, y: number) =>
            x < 0 || x > BOUNDS_WIDTH || y < 0 || y > boundsHeight,
    };
}

describe('prepareAreaData: percent stacking', () => {
    test.each([190, 200, 205, 210, 220, 240])(
        'the top series keeps every data label at height %ipx',
        async (boundsHeight) => {
            const data = await prepareAreaData(buildArgs(boundsHeight));

            const top = data.find((d) => d.series.name === 'top');
            const bottom = data.find((d) => d.series.name === 'bottom');

            expect(top?.points.map((p) => p.y)).toEqual([0, 0, 0, 0]);
            expect(top?.svgLabels.map((l) => l.text)).toEqual(['1631', '1587', '1652', '1610']);
            // The sections must still join without a gap: the lower one starts at the
            // baseline and ends exactly where the upper one begins.
            expect(bottom?.points.map((p) => p.y0)).toEqual(Array(4).fill(boundsHeight));
            expect(bottom?.points.map((p) => p.y)).toEqual(top?.points.map((p) => p.y0));
        },
    );
});
