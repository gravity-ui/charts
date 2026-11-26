/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {scaleLinear, scaleOrdinal} from 'd3-scale';

import type {PreparedXAxis, PreparedYAxis} from '~core/axes/types';
import type {PreparedSplit} from '~core/layout/split-types';
import {getPreparedOptions} from '~core/series/prepare-options';
import type {PreparedLegend} from '~core/series/types';
import * as textUtils from '~core/utils/text';

import {areaPlugin} from '..';
import type {PreparedAreaData} from '../types';

afterEach(() => jest.restoreAllMocks());

describe('area stack label priority', () => {
    test.each([false, true])(
        'totals take priority over overlapping segment labels, point allowOverlap=%s',
        async (allowOverlap) => {
            const measure = async (text: string) => ({
                width: text.length * 7,
                height: 12,
                hangingOffset: 2,
            });
            jest.spyOn(textUtils, 'getTextSizeFn').mockReturnValue(measure);

            const series = await areaPlugin.prepareSeries({
                series: [20, 1].map((y) => ({
                    type: 'area',
                    name: String(y),
                    stacking: 'normal',
                    data: [{x: 1, y}],
                    dataLabels: {enabled: true, allowOverlap, padding: 5},
                })),
                colorScale: scaleOrdinal([] as string[], ['#000']),
                colors: [],
                legend: {enabled: false} as PreparedLegend,
            });
            const result = await areaPlugin.prepareShapeData({
                series,
                seriesOptions: getPreparedOptions({area: {stackLabels: {enabled: true}}}),
                xAxis: {type: 'linear'} as PreparedXAxis,
                xScale: scaleLinear().domain([0, 4]).range([0, 400]),
                yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
                yScale: [scaleLinear().domain([-100, 100]).range([200, 0])],
                boundsHeight: 200,
                boundsWidth: 400,
                split: {plots: [{top: 0, height: 200}]} as PreparedSplit,
            });
            const pointLabels = (result.renderData as PreparedAreaData[]).flatMap(
                (item) => item.svgLabels,
            );

            expect(result.labels?.map((label) => label.text)).toEqual(['21']);
            expect(pointLabels.map((label) => label.text).sort()).toEqual(
                allowOverlap ? ['1', '20'] : ['1'],
            );
        },
    );
});
