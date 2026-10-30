import {scaleOrdinal} from 'd3-scale';
import get from 'es-toolkit/compat/get';

import type {ChartInteractionItem, ChartSeries} from '../../../types';
import {getSeriesPlugin} from '../../series/seriesRegistry';
import type {PreparedLegend} from '../../series/types';
import {getShapePoint, toPublicInteractionItem} from '../chart-interaction';
import {getSourcePoint} from '../source-point';

const cases: {series: ChartSeries; field: string}[] = [
    {series: {type: 'line', name: 'Line', nullMode: 'zero', data: [{x: 1, y: null}]}, field: 'y'},
    {series: {type: 'area', name: 'Area', nullMode: 'zero', data: [{x: 1, y: null}]}, field: 'y'},
    {
        series: {type: 'scatter', name: 'Scatter', nullMode: 'zero', data: [{x: 1, y: null}]},
        field: 'y',
    },
    {series: {type: 'bar-x', name: 'Bar', nullMode: 'zero', data: [{x: 1, y: null}]}, field: 'y'},
    {series: {type: 'bar-y', name: 'Bar', nullMode: 'zero', data: [{x: null, y: 1}]}, field: 'x'},
    {
        series: {
            type: 'heatmap',
            name: 'Heatmap',
            nullMode: 'zero',
            data: [{x: 1, y: 1, value: null}],
        },
        field: 'value',
    },
    {series: {type: 'pie', nullMode: 'zero', data: [{name: 'Slice', value: null}]}, field: 'value'},
    {
        series: {type: 'waterfall', name: 'Waterfall', nullMode: 'zero', data: [{x: 1, y: null}]},
        field: 'y',
    },
];

test.each(cases)(
    '$series.type exposes original points while retaining resolved legacy data',
    async ({series, field}) => {
        const source = series.data[0];
        const prepared = await getSeriesPlugin(series.type).prepareSeries({
            series: [series],
            seriesOptions: {},
            colors: ['red', 'green', 'blue'],
            colorScale: scaleOrdinal<string, string>(['red']),
            legend: {enabled: false} as PreparedLegend,
        });
        const points = prepared.flatMap((item) => {
            const data = Array.isArray(item.data) ? item.data : [item.data];
            return data.map((point) => ({point, series: item}) as ChartInteractionItem);
        });
        expect(points).toHaveLength(1);
        const item = points[0];
        expect(get(item.point, field)).toBe(0);
        expect(get(source, field)).toBeNull();
        expect(getSourcePoint(item.point)).toBe(source);
        expect(toPublicInteractionItem(item).point).toBe(source);
        expect(getShapePoint({}, [{data: item.point}]).points[0]).toBe(source);
    },
);
