import {createScales} from '../../../hooks/useAxisScales';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import {getPreparedSeries} from '../../series/prepareSeries';
import type {PreparedLegendOptions} from '../../series/types';
import type {ChartSeries} from '../../types';
import {createXScale} from '../x-scale';
import {createYScale} from '../y-scale';

const axis = {
    type: 'linear',
    padding: {max: 0},
    startOnTick: false,
    endOnTick: false,
    plotIndex: 0,
    ticks: {},
    labels: {lineHeight: 12, padding: 4},
} as PreparedYAxis;

function prepare(seriesData: ChartSeries[]) {
    return getPreparedSeries({
        seriesData,
        seriesOptions: undefined,
        colors: ['black', 'gray', 'red'],
        preparedLegend: {enabled: true} as PreparedLegendOptions,
    });
}

test.each(['bar-x', 'bar-y', 'area'] as const)(
    '%s preserves positive/negative baselines, explicit limits and zoom',
    async (type) => {
        const isHorizontal = type === 'bar-y';
        for (const values of [
            [20, 40],
            [-20, -40],
        ]) {
            const series = await prepare([
                {
                    type,
                    name: 'Values',
                    data: values.map((value, index) =>
                        isHorizontal ? {x: value, y: index} : {x: index, y: value},
                    ),
                },
            ]);
            const makeScale = (options = axis, zoom?: [number, number]) =>
                isHorizontal
                    ? createXScale({
                          axis: options,
                          boundsWidth: 600,
                          series,
                          zoomStateX: zoom,
                      })
                    : createYScale({
                          axis: options,
                          boundsHeight: 300,
                          series,
                          zoomStateY: zoom,
                      });
            expect(makeScale()?.domain()).toEqual(values[0] > 0 ? [0, 40] : [-40, 0]);
            expect(makeScale({...axis, min: -50, max: 50})?.domain()).toEqual([-50, 50]);
            expect(makeScale(axis, [-10, 10])?.domain()).toEqual([-10, 10]);
        }
    },
);

test('merges the baseline with extrema from other plugins', async () => {
    const series = await prepare([
        {
            type: 'line',
            name: 'Line',
            data: [
                {x: 0, y: 100},
                {x: 1, y: 200},
            ],
        },
        {
            type: 'bar-x',
            name: 'Bars',
            data: [
                {x: 0, y: 20},
                {x: 1, y: 40},
            ],
        },
    ]);
    expect(createYScale({axis, boundsHeight: 300, series})?.domain()).toEqual([0, 200]);
});

test('keeps stack domains separate across axes and honors visibility and the all-hidden fallback', async () => {
    const series = await prepare([
        {
            type: 'bar-x',
            name: 'First',
            stacking: 'normal',
            stackId: 'shared',
            data: [{x: 0, y: 20}],
        },
        {
            type: 'bar-x',
            name: 'Second',
            stacking: 'normal',
            stackId: 'shared',
            data: [{x: 0, y: 30}],
        },
        {
            type: 'bar-x',
            name: 'Other axis',
            stacking: 'normal',
            stackId: 'shared',
            yAxis: 1,
            data: [{x: 0, y: -100}],
        },
    ]);
    const makeDomains = () =>
        createScales({
            boundsWidth: 600,
            boundsHeight: 300,
            series,
            xAxis: null,
            yAxis: [axis, {...axis, plotIndex: 1}],
            split: {plots: [], gap: 0},
        }).yScale.map((scale) => scale?.domain());
    expect(makeDomains()).toEqual([
        [0, 50],
        [-100, 0],
    ]);
    series[1].visible = false;
    expect(makeDomains()).toEqual([
        [0, 20],
        [-100, 0],
    ]);
    series[0].visible = false;
    expect(makeDomains()).toEqual([
        [0, 50],
        [-100, 0],
    ]);
});

test('keeps the range-slider X domain stable across visibility and range changes', async () => {
    const series = await prepare([
        {
            type: 'bar-y',
            name: 'Visible',
            data: [
                {x: 20, y: 0},
                {x: 30, y: 1},
            ],
        },
        {
            type: 'bar-y',
            name: 'Hidden',
            visible: false,
            data: [
                {x: 100, y: 0},
                {x: 200, y: 1},
            ],
        },
    ]);
    const options = {
        boundsWidth: 600,
        boundsHeight: 300,
        series,
        xAxis: axis as unknown as PreparedXAxis,
        yAxis: [],
        split: {plots: [], gap: 0},
    };
    expect(createScales(options).xScale?.domain()).toEqual([0, 30]);
    expect(
        createScales({...options, rangeSliderState: {min: 10, max: 20}}).xScale?.domain(),
    ).toEqual([10, 20]);
    expect(createScales({...options, isRangeSlider: true}).xScale?.domain()).toEqual([0, 200]);
});

test.each(['bar-x', 'area', 'waterfall'] as const)(
    '%s preserves positive logarithmic headroom without introducing zero',
    async (type) => {
        const series = await prepare([
            {
                type,
                name: 'Values',
                data: [
                    {x: 0, y: 10},
                    {x: 1, y: 100},
                ],
            },
        ]);
        const options = {...axis, type: 'logarithmic' as const};
        const domain = createYScale({axis: options, boundsHeight: 300, series})?.domain();
        expect(domain).toEqual([1, type === 'waterfall' ? 110 : 100]);
        expect(
            createYScale({axis: {...options, min: 5}, boundsHeight: 300, series})?.domain()[0],
        ).toBe(5);
    },
);
