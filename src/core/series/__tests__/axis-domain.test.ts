import {scaleOrdinal} from 'd3-scale';

import type * as LinePlugin from '../../../plugins/line';
import type * as LinePreparation from '../../../plugins/line/prepare-line-series';
import type * as XRangePlugin from '../../../plugins/x-range';
import type {PreparedAxis} from '../../axes/types';
import type * as XScale from '../../scales/x-scale';
import type {ChartSeries} from '../../types';
import {getDomainDataXBySeries, getDomainDataYBySeries} from '../../utils/common';
import type * as AxisDomain from '../axis-domain';
import {getAxisDomainValues} from '../axis-domain';
import type * as Registry from '../seriesRegistry';
import type {PreparedLegendOptions} from '../types';

it('groups contributions once per plugin, retaining series order, references and axis direction', () => {
    jest.isolateModules(() => {
        const registry = jest.requireActual<typeof Registry>('../seriesRegistry');
        const domain = jest.requireActual<typeof AxisDomain>('../axis-domain');
        const {linePlugin} = jest.requireActual<typeof LinePlugin>('../../../plugins/line');
        const {xRangePlugin} = jest.requireActual<typeof XRangePlugin>('../../../plugins/x-range');
        expect(registry.getRegisteredSeriesTypes()).toEqual([]);
        expect(domain.getAxisDomainValues([], 'x')).toEqual([]);

        const getValues = jest.fn(
            ({axis}: Parameters<NonNullable<typeof linePlugin.getAxisDomainValues>>[0]) =>
                axis === 'x' ? [8, 12] : [],
        );
        registry.registerSeriesPlugin({
            ...linePlugin,
            axisBaseline: 'x',
            getAxisDomainValues: getValues,
        });
        registry.registerSeriesPlugin(xRangePlugin);
        const series: ChartSeries[] = [
            {type: 'line', name: 'First', data: [{x: 100, y: 1}]},
            {type: 'x-range', name: 'Range', data: [{x0: -10, x1: 20, y: 1}]},
            {type: 'line', name: 'Last', data: [{x: 200, y: 2}]},
        ];
        expect(domain.getAxisDomainValues(series, 'x')).toEqual([8, 12, -10, 20]);
        expect(getValues).toHaveBeenCalledTimes(1);
        const args = getValues.mock.calls[0][0];
        expect(args.series[0]).toBe(series[0]);
        expect(args.series[1]).toBe(series[2]);
        expect(args.axis).toBe('x');
        expect(domain.hasAxisBaseline(series, 'x')).toBe(true);
        expect(domain.hasAxisBaseline(series, 'y')).toBe(false);
        expect(registry.getRegisteredSeriesTypes()).toEqual(['line', 'x-range']);
        expect(domain.getAxisDomainValues(series, 'y')).toEqual([1]);

        const {prepareLineSeries} = jest.requireActual<typeof LinePreparation>(
            '../../../plugins/line/prepare-line-series',
        );
        const {createXScale} = jest.requireActual<typeof XScale>('../../scales/x-scale');
        const prepared = prepareLineSeries({
            series: [
                {
                    type: 'line',
                    name: 'Line',
                    data: [
                        {x: 100, y: 1},
                        {x: 200, y: 2},
                    ],
                },
            ],
            colorScale: scaleOrdinal<string, string>().range(['black']),
            colors: [],
            legend: {enabled: false} as PreparedLegendOptions,
        });
        expect(
            createXScale({
                series: prepared,
                boundsWidth: 600,
                axis: {
                    type: 'linear',
                    maxPadding: 0,
                    startOnTick: false,
                    endOnTick: false,
                } as PreparedAxis,
            })?.domain(),
        ).toEqual([0, 12]);
    });
});

it('keeps scalar fallback, missing values and non-axis exclusion', () => {
    const series: ChartSeries[] = [
        {type: 'line', name: 'Line', data: [{x: 1, y: null}, {x: 2, y: 5}, {x: 2}]},
        {type: 'pie', data: [{name: 'Slice', value: 100}]},
    ];
    expect(getDomainDataXBySeries(series)).toEqual([1, 2]);
    expect(getDomainDataYBySeries(series)).toEqual([null, 5, undefined]);
});

it('accepts contributions exceeding the JavaScript function argument limit', () => {
    const data = Array.from({length: 150_000}, (_, x) => ({x0: x, x1: x + 1, y: 0}));
    const series: ChartSeries = {type: 'x-range', name: 'Intervals', data};
    const values = getAxisDomainValues([series], 'x');
    expect(values).toHaveLength(data.length + 1);
    expect(values[values.length - 1]).toBe(data.length);
});

it.each(['bar-x', 'area', 'bar-y'] as const)(
    '%s accepts stacked contributions exceeding the JavaScript function argument limit',
    (type) => {
        const data = Array.from({length: 150_000}, (_, index) => {
            const value = index % 2 === 0 ? index : -index;
            return type === 'bar-y' ? {x: value, y: index} : {x: index, y: value};
        });
        const series: ChartSeries = {type, name: 'Values', data};
        const values =
            type === 'bar-y' ? getDomainDataXBySeries([series]) : getDomainDataYBySeries([series]);
        expect(values).toHaveLength(data.length);
        expect(values).toEqual(expect.arrayContaining([-149_999, 0, 149_998]));
    },
);

it.each([
    {type: 'bar-x', axis: 'x', coordinate: 1},
    {type: 'area', axis: 'x', coordinate: 1},
    {type: 'waterfall', axis: 'x', coordinate: 1},
    {type: 'area-range', axis: 'x', coordinate: 1},
    {type: 'bar-y', axis: 'y', coordinate: 2},
    {type: 'x-range', axis: 'y', coordinate: 2},
] as const)(
    '$type delegates scalar $axis extraction to core for sparse point arrays',
    ({type, axis, coordinate}) => {
        const point = {x: 1, y: 2, x0: 0, x1: 3, y0: 4, y1: 5};
        const data = new Array<typeof point>(2);
        data[1] = point;
        const series: ChartSeries = {type, name: 'Scalar coordinates', data};
        expect(getAxisDomainValues([series], axis)).toEqual([undefined, coordinate]);
    },
);

it('preserves scalar extraction and stack accumulation for sparse point arrays', () => {
    const data = new Array<{x: number; y: number}>(2);
    data[1] = {x: 1, y: 2};
    const line: ChartSeries = {type: 'line', name: 'Line', data};
    const bars: ChartSeries = {type: 'bar-x', name: 'Bars', data};
    expect(getDomainDataXBySeries([line])).toEqual([undefined, 1]);
    expect(getDomainDataYBySeries([line])).toEqual([undefined, 2]);
    expect(getDomainDataYBySeries([bars])).toEqual([2]);
});
