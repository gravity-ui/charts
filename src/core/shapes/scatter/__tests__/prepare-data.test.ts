/** @jest-environment jsdom */

import {scaleLinear, scaleOrdinal} from 'd3-scale';

import {prepareScatterSeries} from '../../../../plugins/scatter/prepare-scatter-series';
import type {ScatterSeriesData} from '../../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../../axes/types';
import type {PreparedSplit} from '../../../layout/split-types';
import {DEFAULT_POINT_MARKER_OPTIONS} from '../../../series/constants';
import type {PreparedLegend, PreparedScatterSeries} from '../../../series/types';
import * as textUtils from '../../../utils/text';
import {prepareScatterData} from '../prepare-data';

async function getLabels(data: ScatterSeriesData[]) {
    const series = prepareScatterSeries({
        series: [{type: 'scatter', name: 'Scatter', data, dataLabels: {enabled: true}}],
        colorScale: scaleOrdinal([] as string[], ['#000']),
        colors: [],
        legend: {enabled: false} as PreparedLegend,
    }) as PreparedScatterSeries[];

    const result = await prepareScatterData({
        series,
        xAxis: {type: 'linear'} as PreparedXAxis,
        xScale: scaleLinear().domain([0, 10]).range([0, 400]),
        yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
        yScale: [scaleLinear().domain([0, 100]).range([200, 0])],
        split: {plots: [{top: 0, height: 200}]} as PreparedSplit,
        isOutsideBounds: () => false,
    });

    return result.svgLabels;
}

async function getLabelY(point: ScatterSeriesData) {
    const [label] = await getLabels([point]);

    return label.y;
}

describe('prepareScatterData: data labels', () => {
    beforeEach(() => {
        jest.spyOn(textUtils, 'getTextSizeFn').mockReturnValue(async () => ({
            width: 20,
            height: 10,
            hangingOffset: 0,
            inkBounds: {x: 0, width: 20},
        }));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test.each([
        {title: 'radius 4', radius: 4, expectedOffset: 4},
        {title: 'radius 20', radius: 20, expectedOffset: 20},
        {
            title: 'no point radius (series default)',
            radius: undefined,
            expectedOffset: DEFAULT_POINT_MARKER_OPTIONS.radius,
        },
    ])('shifts the label up by the marker radius for $title', async ({radius, expectedOffset}) => {
        const baseY = await getLabelY({x: 5, y: 50, radius: 0, label: '50'});
        const y = await getLabelY({x: 5, y: 50, radius, label: '50'});

        expect(baseY - y).toBe(expectedOffset);
    });

    test('offsets labels of points with different radii by the radius difference', async () => {
        const labels = await getLabels([
            {x: 3, y: 50, radius: 4, label: '50'},
            {x: 7, y: 50, radius: 20, label: '50'},
        ]);
        const [small, large] = [...labels].sort((a, b) => a.x - b.x);

        expect(small.y - large.y).toBe(16);
    });
});
