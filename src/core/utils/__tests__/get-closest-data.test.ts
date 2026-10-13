import {getSeriesPlugin} from '../../series/seriesRegistry';
import type {PreparedAreaData} from '../../shapes/area/types';
import type {PreparedBarYData} from '../../shapes/bar-y/types';
import type {PreparedLineData} from '../../shapes/line/types';
import type {PreparedScatterData} from '../../shapes/scatter/types';
import type {TooltipItemData} from '../../shapes/types';
import {getClosestPoints} from '../get-closest-data';

const BOUNDS = {boundsWidth: 300, boundsHeight: 400};
const LINE_Y = 300;
const SCATTER_Y = 20;

function getLine(points: [number, number][], id = 'line') {
    const series = {type: 'line', id, name: id, color: '#d890c9'};
    const segments = points.slice(1).map(([x2, y2], index) => {
        const [x1, y1] = points[index];
        return {
            halfWidth: 1.5,
            x1,
            y1,
            x2,
            y2,
            xMin: Math.min(x1, x2),
            xMax: Math.max(x1, x2),
            yMin: Math.min(y1, y2),
            yMax: Math.max(y1, y2),
        };
    });
    return {
        series,
        markers: [],
        segments,
        points: points.map(([x, y]) => ({x, y, data: {x, y}, series})),
    } as unknown as PreparedLineData;
}

function getArea(points: [number, number][], y0: number) {
    const series = {type: 'area', id: 'area', name: 'area', color: '#8ad554'};
    return {
        series,
        markers: [],
        width: 1,
        points: points.map(([x, y]) => ({x, y, y0, data: {x, y}, series})),
    } as unknown as PreparedAreaData;
}

function getBarY(rects: Array<{x: number; y: number; width: number; height: number}>) {
    const series = {type: 'bar-y', id: 'bar', name: 'bar', color: '#000'};
    return rects.map((rect, index) => ({
        ...rect,
        data: {x: rect.width, y: 0, index},
        series,
    })) as unknown as PreparedBarYData[];
}

function getScatter(
    points: Array<{x: number; y: number; data?: object}>,
    {radius = 6, tooltip}: {radius?: number; tooltip?: {enabled: boolean}} = {},
) {
    const series = {
        type: 'scatter',
        id: 'scatter',
        name: 'scatter',
        color: '#1f68a9',
        marker: {states: {normal: {radius, borderWidth: 0, symbol: 'circle'}}},
        tooltip,
    };
    return points.map(({x, y, data = {x, y}}) => ({
        point: {x, y, data, series, color: series.color},
    })) as unknown as PreparedScatterData[];
}

/** Layer indexes in render order, bottom to top. */
function getLayers(...ids: string[]) {
    return new Map(ids.map((id, index) => [id, index]));
}

function getActive(
    shapesData: unknown[],
    position: [number, number],
    layerIndexes = new Map<string, number>(),
) {
    const hovered = getClosestPoints({
        position,
        shapesData: shapesData as TooltipItemData[],
        layerIndexes,
        ...BOUNDS,
    });
    const closest = hovered.filter((item) => item.closest);
    expect(closest).toHaveLength(1);
    return closest[0];
}

describe('getClosestPoints with mixed series types', () => {
    const line = getLine([
        [100, LINE_Y],
        [200, LINE_Y],
    ]);
    const scatter = getScatter([
        {x: 100, y: SCATTER_Y},
        {x: 200, y: SCATTER_Y},
    ]);
    const shapesData = [line, ...scatter];

    test('selects the line under the pointer instead of a distant scatter point', () => {
        expect(getActive(shapesData, [200, LINE_Y - 2]).series.type).toBe('line');
    });

    test('selects the scatter point under the pointer', () => {
        const active = getActive(shapesData, [200, SCATTER_Y + 2]);
        expect(active.series.type).toBe('scatter');
        expect(active.data).toBe(scatter[1].point.data);
    });

    test('measures the distance to the line between its points', () => {
        const nearScatter = getScatter([{x: 150, y: LINE_Y - 20}]);
        expect(getActive([line, ...nearScatter], [150, LINE_Y]).series.type).toBe('line');
    });

    test('measures a lookup chunk by the nearest lookup shape, not by its own series', () => {
        // In the nearest X column the pointer is closer to B by Y, while it lies on A.
        const a = getLine(
            [
                [0, 0],
                [200, 200],
            ],
            'a',
        );
        const b = getLine(
            [
                [0, 90],
                [200, -200],
            ],
            'b',
        );
        const nearScatter = getScatter([{x: 90, y: 50}]);
        expect(getActive([a, b, ...nearScatter], [90, 90]).series.type).toBe('line');
    });

    test('ignores a nearer chunk with a disabled tooltip', () => {
        const hidden = getScatter([{x: 200, y: LINE_Y - 10}], {tooltip: {enabled: false}});
        expect(getActive([line, ...hidden], [200, LINE_Y - 8]).series.type).toBe('line');
    });

    test('selects the area containing the pointer instead of a distant scatter point', () => {
        const area = getArea(
            [
                [0, 200],
                [300, 200],
            ],
            LINE_Y,
        );
        const nearScatter = getScatter([{x: 150, y: 170}]);
        expect(getActive([area, ...nearScatter], [150, 250]).series.type).toBe('area');
        expect(getActive([area, ...nearScatter], [150, 172]).series.type).toBe('scatter');
    });

    test('prefers the upper layer when several shapes contain the pointer', () => {
        const area = getArea(
            [
                [0, 200],
                [300, 200],
            ],
            LINE_Y + 50,
        );
        const onArea = getScatter([{x: 150, y: LINE_Y}]);
        const bar = getBarY([{x: 100, y: LINE_Y - 10, width: 100, height: 20}]);
        const data = [...bar, ...onArea, area];
        const position: [number, number] = [150, LINE_Y];
        const getType = (...ids: string[]) =>
            getActive(data, position, getLayers(...ids)).series.type;
        expect(getType('bar', 'scatter', 'area')).toBe('area');
        expect(getType('area', 'bar', 'scatter')).toBe('scatter');
        expect(getType('scatter', 'area', 'bar')).toBe('bar-y');
    });

    test('preserves the cluster payload of a hovered cluster marker', () => {
        const cluster = {
            x: 1,
            y: 2,
            cluster: {
                size: 2,
                points: [
                    {x: 1, y: 2},
                    {x: 1, y: 2},
                ],
            },
        };
        const clustered = getScatter([{x: 150, y: SCATTER_Y, data: cluster}], {radius: 12});
        expect(getActive([line, ...clustered], [160, SCATTER_Y]).data).toBe(cluster);
    });

    test('does not expose the internal distance', () => {
        const hovered = getClosestPoints({
            position: [200, LINE_Y],
            shapesData: shapesData as TooltipItemData[],
            layerIndexes: new Map(),
            ...BOUNDS,
        });
        expect(hovered.every((item) => !('distance' in item))).toBe(true);
    });
});

describe('getClosestPoints with a single series type', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('does not ask the plugin to measure distances', () => {
        const spy = jest.spyOn(getSeriesPlugin('scatter').tooltip, 'prepareData');
        getActive(getScatter([{x: 10, y: 10}]), [20, 20]);
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
