/** @jest-environment jsdom */
import {scaleLinear, scaleOrdinal} from 'd3-scale';
import get from 'lodash/get';

import {getCurveFactory} from '../../../plugins/line/interpolation';
import {prepareLineSeries} from '../../../plugins/line/prepare-line-series';
import {prepareScatterSeries} from '../../../plugins/scatter/prepare-scatter-series';
import type {LineSeries, ScatterClusterData, ScatterSeries} from '../../../types';
import type {PreparedXAxis, PreparedYAxis} from '../../axes/types';
import type {PreparedSplit} from '../../layout/split-types';
import {getSeriesPlugin} from '../../series/seriesRegistry';
import type {PreparedLegend} from '../../series/types';
import type {PreparedAreaData} from '../../shapes/area/types';
import type {PreparedAreaRangeData} from '../../shapes/area-range/types';
import type {PreparedBarXData} from '../../shapes/bar-x/types';
import type {PreparedBarYData} from '../../shapes/bar-y/types';
import {prepareLineData} from '../../shapes/line/prepare-data';
import type {PreparedPieData} from '../../shapes/pie/types';
import {prepareScatterData} from '../../shapes/scatter/prepare-data';
import type {TooltipItemData} from '../../shapes/types';
import {getClosestPoints} from '../get-closest-data';

const getId = (item: {series: object}) => get(item.series, 'id');

const BOUNDS = {boundsWidth: 300, boundsHeight: 400};
const LINE_Y = 300;
const SCATTER_Y = 20;

// Pixel scales: data x is the pixel x, data y is counted from the bottom of the plot.
const xScale = scaleLinear().domain([0, BOUNDS.boundsWidth]).range([0, BOUNDS.boundsWidth]);
const yScale = scaleLinear().domain([0, BOUNDS.boundsHeight]).range([BOUNDS.boundsHeight, 0]);
const toDataY = (pixelY: number) => BOUNDS.boundsHeight - pixelY;

const prepareArgs = {
    xAxis: {type: 'linear'} as PreparedXAxis,
    xScale,
    yAxis: [{type: 'linear', plotIndex: 0}] as PreparedYAxis[],
    yScale: [yScale],
    split: {plots: [{top: 0, height: BOUNDS.boundsHeight}]} as PreparedSplit,
    isOutsideBounds: () => false,
    ...BOUNDS,
};
const seriesArgs = {
    colorScale: scaleOrdinal([] as string[], ['#000']),
    colors: [],
    legend: {enabled: false} as PreparedLegend,
};

type PixelPoint = [number, number];

async function prepareLine(
    points: PixelPoint[],
    options: Partial<Omit<LineSeries, 'type' | 'data'>> = {},
) {
    const series = prepareLineSeries({
        ...seriesArgs,
        series: [
            {
                type: 'line',
                name: 'line',
                lineWidth: 3,
                marker: {enabled: false},
                ...options,
                data: points.map(([x, y]) => ({x, y: toDataY(y)})),
            },
        ],
    });
    return prepareLineData({...prepareArgs, series, getCurveFactory});
}

async function prepareScatter(
    points: Array<{x: number; y: number; radius?: number; custom?: unknown}>,
    options: Partial<Omit<ScatterSeries, 'type' | 'data'>> = {},
) {
    const series = prepareScatterSeries({
        ...seriesArgs,
        series: [
            {
                type: 'scatter',
                name: 'scatter',
                ...options,
                data: points.map((p) => ({...p, y: toDataY(p.y)})),
            },
        ],
    });
    const {scatterData} = await prepareScatterData({...prepareArgs, series});
    return scatterData;
}

/** Only the fields read by the area tooltip plugin. */
function getArea(points: PixelPoint[], y0: number, width = 1) {
    const series = {type: 'area', id: 'area', name: 'area', color: '#8ad554'};
    const area: Pick<PreparedAreaData, 'markers' | 'width'> & {
        series: typeof series;
        points: Array<{x: number; y: number; y0: number; data: object; series: typeof series}>;
    } = {
        series,
        markers: [],
        width,
        points: points.map(([x, y]) => ({x, y, y0, data: {x, y}, series})),
    };
    return area;
}

/** Only the fields read by the bar-y tooltip plugin. */
function getBarY(
    rects: Array<Pick<PreparedBarYData, 'x' | 'y' | 'width' | 'height'>>,
    options: {borderRadius?: number; borderWidth?: number} = {},
) {
    const series = {
        type: 'bar-y',
        id: 'bar',
        name: 'bar',
        color: '#000',
        borderRadius: options.borderRadius ?? 0,
    };
    return rects.map((rect, index) => ({
        ...rect,
        borderWidth: options.borderWidth ?? 0,
        isLastStackItem: true,
        data: {x: rect.width, y: 0, index},
        series,
    }));
}

/** Only the fields read by the bar-x tooltip plugin. */
function getBarX(
    rects: Array<Pick<PreparedBarXData, 'x' | 'y' | 'width' | 'height'>>,
    options: {borderRadius?: number; valueEndPadding?: number} = {},
) {
    const series = {
        type: 'bar-x',
        id: 'bar-x',
        name: 'bar-x',
        color: '#000',
        borderRadius: options.borderRadius ?? 0,
    };
    return rects.map((rect, index) => ({
        ...rect,
        valueEndPadding: options.valueEndPadding ?? 0,
        borderWidth: 0,
        isStackEnd: true,
        extendsUp: true,
        data: {x: index, y: rect.height},
        series,
    }));
}

/** Only the fields read by the area-range tooltip plugin. */
function getAreaRange(columns: Array<[number, number, number]>, width: number) {
    const series = {type: 'area-range', id: 'area-range', name: 'area-range', color: '#000'};
    const item: Pick<PreparedAreaRangeData, 'width'> & {
        series: typeof series;
        points: Array<{x: number; y0: number; y1: number; data: object; series: typeof series}>;
    } = {
        series,
        width,
        points: columns.map(([x, y0, y1]) => ({x, y0, y1, data: {x, low: y0, high: y1}, series})),
    };
    return item;
}

/** A single-slice pie; only the fields read by the pie tooltip plugin. */
function getPie(args: {center: [number, number]; radius: number; innerRadius: number}) {
    const series = {type: 'pie', id: 'pie', name: 'pie', data: [{value: 1}]};
    const pie = {center: args.center, innerRadius: args.innerRadius, series};
    const segment = {
        startAngle: 0,
        endAngle: 2 * Math.PI,
        data: {radius: args.radius, pie, series, percentage: 100},
    };
    return {...pie, segments: [segment]} as unknown as PreparedPieData;
}

/** Layer indexes in render order, bottom to top. */
function getLayers(...ids: string[]) {
    return new Map(ids.map((id, index) => [id, index]));
}

function getActive(
    shapesData: TooltipItemData[],
    position: [number, number],
    layerIndexes = new Map<string, number>(),
) {
    const hovered = getClosestPoints({position, shapesData, layerIndexes, ...BOUNDS});
    const closest = hovered.filter((item) => item.closest);
    expect(closest).toHaveLength(1);
    return closest[0];
}

describe('getClosestPoints with mixed series types', () => {
    const linePoints: PixelPoint[] = [
        [100, LINE_Y],
        [200, LINE_Y],
    ];
    const scatterPoints = [
        {x: 100, y: SCATTER_Y},
        {x: 200, y: SCATTER_Y},
    ];

    test('selects the line under the pointer instead of a distant scatter point', async () => {
        const line = await prepareLine(linePoints);
        const scatter = await prepareScatter(scatterPoints);
        const active = getActive([...line, ...scatter], [200, LINE_Y - 2]);
        expect(getId(active)).toBe(line[0].series.id);
        expect(active.data).toBe(line[0].points[1].data);
    });

    test('selects the scatter point under the pointer', async () => {
        const line = await prepareLine(linePoints);
        const scatter = await prepareScatter(scatterPoints);
        const active = getActive([...line, ...scatter], [200, SCATTER_Y + 2]);
        expect(getId(active)).toBe(scatter[1].point.series.id);
        expect(active.data).toBe(scatter[1].point.data);
    });

    test('measures the distance to the line between its points', async () => {
        const line = await prepareLine(linePoints);
        const scatter = await prepareScatter([{x: 150, y: LINE_Y - 20}]);
        expect(getId(getActive([...line, ...scatter], [150, LINE_Y]))).toBe(line[0].series.id);
    });

    test('selects the lookup series under the pointer, not the one closest by Y in its column', async () => {
        // In the nearest X column the pointer is closer to B by Y, while it lies on A.
        const [a] = await prepareLine(
            [
                [0, 0],
                [200, 200],
            ],
            {name: 'a'},
        );
        const [b] = await prepareLine(
            [
                [0, 90],
                [200, 0],
            ],
            {name: 'b'},
        );
        const scatter = await prepareScatter([{x: 90, y: 50}]);
        const active = getActive([a, b, ...scatter], [90, 90]);
        expect(getId(active)).toBe(a.series.id);
        expect(active.data).toBe(a.points[0].data);
    });

    test('does not let a distant lookup series inherit the hit of another lookup series', async () => {
        // The area and the line have different X grids: the nearest column belongs to the area.
        const area = getArea(
            [
                [148, 100],
                [152, 100],
            ],
            50,
        );
        const [line] = await prepareLine([
            [0, 300],
            [300, 300],
        ]);
        const scatter = await prepareScatter([{x: 150, y: 290}]);
        const active = getActive([area, line, ...scatter], [150, 300]);
        expect(getId(active)).toBe(scatter[0].point.series.id);
        expect(active.data).toBe(scatter[0].point.data);
    });

    test('ignores a nearer chunk with a disabled tooltip', async () => {
        const line = await prepareLine(linePoints);
        const hidden = await prepareScatter([{x: 200, y: LINE_Y - 10}], {
            tooltip: {enabled: false},
        });
        expect(getId(getActive([...line, ...hidden], [200, LINE_Y - 8]))).toBe(line[0].series.id);
    });

    test('selects the area containing the pointer instead of a distant scatter point', async () => {
        const area = getArea(
            [
                [0, 200],
                [300, 200],
            ],
            LINE_Y,
        );
        const scatter = await prepareScatter([{x: 150, y: 170}]);
        expect(getId(getActive([area, ...scatter], [150, 250]))).toBe('area');
        expect(getId(getActive([area, ...scatter], [150, 172]))).toBe(scatter[0].point.series.id);
    });

    test('strokes only the upper line of the area', async () => {
        const area = getArea(
            [
                [100, 150],
                [200, 150],
            ],
            300,
            20,
        );
        const scatter = await prepareScatter([{x: 95, y: 250, radius: 1}]);
        // 5px left of the area side: the side is not stroked.
        expect(getId(getActive([area, ...scatter], [95, 250]))).toBe(scatter[0].point.series.id);
        // 5px above the upper line: inside its stroke.
        expect(getId(getActive([area, ...scatter], [150, 145]))).toBe('area');
    });

    test('strokes both boundaries of the area range', async () => {
        const areaRange = getAreaRange(
            [
                [100, 300, 150],
                [200, 300, 150],
            ],
            20,
        );
        const scatter = await prepareScatter([{x: 150, y: 305, radius: 1}]);
        const layers = getLayers(scatter[0].point.series.id, 'area-range');
        // 5px below the lower line: inside its stroke.
        expect(getId(getActive([areaRange, ...scatter], [150, 305], layers))).toBe('area-range');
        // 5px left of the side: not stroked.
        const beside = await prepareScatter([{x: 95, y: 200, radius: 1}]);
        expect(getId(getActive([areaRange, ...beside], [95, 200], layers))).toBe(
            beside[0].point.series.id,
        );
    });

    test('prefers the upper layer when several shapes contain the pointer', async () => {
        const area = getArea(
            [
                [0, 200],
                [300, 200],
            ],
            LINE_Y + 50,
        );
        const onArea = await prepareScatter([{x: 150, y: LINE_Y}]);
        const bar = getBarY([{x: 100, y: LINE_Y - 10, width: 100, height: 20}]);
        const data = [...bar, ...onArea, area];
        const position: [number, number] = [150, LINE_Y];
        const scatterId = onArea[0].point.series.id;
        const getWinner = (...ids: string[]) => getId(getActive(data, position, getLayers(...ids)));
        expect(getWinner('bar', scatterId, 'area')).toBe('area');
        expect(getWinner('area', 'bar', scatterId)).toBe(scatterId);
        expect(getWinner(scatterId, 'area', 'bar')).toBe('bar');
    });

    test('preserves the cluster payload of a hovered cluster marker', async () => {
        const [line] = await prepareLine(linePoints);
        const clustered = await prepareScatter(
            [
                {x: 150, y: SCATTER_Y, custom: 'a'},
                {x: 152, y: SCATTER_Y, custom: 'b'},
            ],
            {cluster: {enabled: true, minimumClusterSize: 2, marker: {radius: 12}}},
        );
        expect(clustered).toHaveLength(1);
        const active = getActive([line, ...clustered], [160, SCATTER_Y]);
        expect(active.data).toBe(clustered[0].point.data);
        expect((active.data as ScatterClusterData).cluster?.points.map((p) => p.custom)).toEqual([
            'a',
            'b',
        ]);
    });

    test('does not expose the internal distance', async () => {
        const line = await prepareLine(linePoints);
        const scatter = await prepareScatter(scatterPoints);
        const hovered = getClosestPoints({
            position: [200, LINE_Y],
            shapesData: [...line, ...scatter],
            layerIndexes: new Map(),
            ...BOUNDS,
        });
        expect(hovered.every((item) => !('distance' in item))).toBe(true);
    });
});

describe('getClosestPoints geometry', () => {
    test('respects the line cap', async () => {
        const scatter = await prepareScatter([{x: 205, y: 300, radius: 1}]);
        const scatterId = scatter[0].point.series.id;
        const points: PixelPoint[] = [
            [100, 300],
            [200, 300],
        ];
        const butt = await prepareLine(points, {lineWidth: 20, linecap: 'butt'});
        expect(getId(getActive([...butt, ...scatter], [205, 300]))).toBe(scatterId);
        const round = await prepareLine(points, {lineWidth: 20, linecap: 'round'});
        expect(
            getId(
                getActive(
                    [...round, ...scatter],
                    [205, 300],
                    getLayers(scatterId, round[0].series.id),
                ),
            ),
        ).toBe(round[0].series.id);
    });

    test('measures the size of line markers as they are drawn', async () => {
        // The marker symbol is drawn with `radius + borderWidth` and stroked: 16px outer radius.
        const line = await prepareLine([[150, 300]], {
            marker: {enabled: true, radius: 10, borderWidth: 4},
        });
        const scatter = await prepareScatter([{x: 150, y: 270, radius: 1}]);
        expect(getId(getActive([...line, ...scatter], [150, 286]))).toBe(line[0].series.id);
    });

    test('measures the contour of a square scatter marker', async () => {
        const line = await prepareLine(
            [
                [0, 300],
                [300, 300],
            ],
            {lineWidth: 1},
        );
        const scatter = await prepareScatter([{x: 150, y: 300, radius: 10}], {
            symbolType: 'square',
        });
        // A square of radius 10 has a half width of about 8.86px.
        expect(getId(getActive([...line, ...scatter], [161, 300]))).toBe(line[0].series.id);
        expect(getId(getActive([...line, ...scatter], [158, 300]))).toBe(
            scatter[0].point.series.id,
        );
    });

    test('selects the scatter marker containing the pointer over a nearer center', async () => {
        const line = await prepareLine([
            [0, 150],
            [300, 150],
        ]);
        const scatter = await prepareScatter([
            {x: 150, y: 152, radius: 1},
            {x: 155, y: 150, radius: 10},
        ]);
        const active = getActive([...line, ...scatter], [150, 150]);
        expect(active.data).toBe(scatter[1].point.data);
    });

    test('cuts out the rounded corners of bars', async () => {
        const scatter = await prepareScatter([{x: 126, y: 151, radius: 1}]);
        const bar = getBarX([{x: 100, y: 150, width: 100, height: 100}], {borderRadius: 40});
        const layers = getLayers(scatter[0].point.series.id, 'bar-x');
        expect(getId(getActive([...bar, ...scatter], [126, 151], layers))).toBe(
            scatter[0].point.series.id,
        );
        const square = getBarX([{x: 100, y: 150, width: 100, height: 100}]);
        expect(getId(getActive([...square, ...scatter], [126, 151], layers))).toBe('bar-x');
    });

    test('includes the border of horizontal bars drawn outside the rect', async () => {
        const scatter = await prepareScatter([{x: 150, y: 148, radius: 1}]);
        const bar = getBarY([{x: 100, y: 150, width: 100, height: 50}], {borderWidth: 4});
        const layers = getLayers(scatter[0].point.series.id, 'bar');
        expect(getId(getActive([...bar, ...scatter], [150, 148.5], layers))).toBe('bar');
        const plain = getBarY([{x: 100, y: 150, width: 100, height: 50}]);
        expect(getId(getActive([...plain, ...scatter], [150, 148.5], layers))).toBe(
            scatter[0].point.series.id,
        );
    });

    test('includes the value end padding of bars', async () => {
        const scatter = await prepareScatter([{x: 150, y: 149, radius: 20}]);
        const bar = getBarX([{x: 100, y: 150, width: 100, height: 100}], {valueEndPadding: 1});
        const layers = getLayers(scatter[0].point.series.id, 'bar-x');
        expect(getId(getActive([...bar, ...scatter], [150, 149.5], layers))).toBe('bar-x');
    });

    test('does not treat the hole of a donut as a hit', async () => {
        const scatter = await prepareScatter([{x: 150, y: 200, radius: 5}]);
        const pie = getPie({center: [150, 200], radius: 100, innerRadius: 70});
        const layers = getLayers(scatter[0].point.series.id, 'pie');
        expect(getId(getActive([pie, ...scatter], [150, 200], layers))).toBe(
            scatter[0].point.series.id,
        );
        expect(getId(getActive([pie, ...scatter], [150, 120], layers))).toBe('pie');
    });

    test('measures large interpolated lines', async () => {
        const points = Array.from({length: 30000}, (_, i): PixelPoint => [i / 100, 300]);
        const line = await prepareLine(points, {interpolation: {type: 'monotone'}});
        const scatter = await prepareScatter([{x: 150, y: 200}]);
        expect(getId(getActive([...line, ...scatter], [150, 299]))).toBe(line[0].series.id);
    });
});

describe('getClosestPoints with a single series type', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('does not ask the plugin to measure distances', async () => {
        const spy = jest.spyOn(getSeriesPlugin('scatter').tooltip, 'prepareData');
        getActive(await prepareScatter([{x: 10, y: 10}]), [20, 20]);
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({measureDistance: false}));
    });

    test('keeps the first of several closest chunks', () => {
        const bars = getBarY([
            {x: 100, y: 50, width: 0, height: 20},
            {x: 100, y: 50, width: 0, height: 20},
        ]);
        expect(getActive(bars, [150, 60]).data).toBe(bars[0].data);
    });
});
