import {prepareTooltipShapes} from '../../../__tests__/utils/prepare-tooltip-shapes';
import type {ChartSeries, TooltipDataChunk} from '../../../types';
import {getSeriesPlugin} from '../../series/seriesRegistry';
import type {TooltipItemData} from '../../shapes/types';
import {getClosestPoints} from '../get-closest-data';
import * as textUtils from '../text';

const BOUNDS = {boundsWidth: 300, boundsHeight: 300};
const line: ChartSeries = {
    type: 'line',
    name: 'Line',
    marker: {enabled: false},
    data: [
        {x: 100, y: 250},
        {x: 200, y: 250},
    ],
};
const scatter: ChartSeries = {
    type: 'scatter',
    name: 'Scatter',
    symbolType: 'circle',
    data: [
        {x: 100, y: 20},
        {x: 200, y: 20},
    ],
};

function getActive(
    shapesData: TooltipItemData[],
    position: [number, number],
    layerIndexes = new Map<string, number>(),
) {
    const hovered = getClosestPoints({position, shapesData, layerIndexes, ...BOUNDS});
    const closest = hovered.filter((item) => item.closest);
    expect(closest).toHaveLength(1);
    expect(hovered.every((item) => !('distance' in item))).toBe(true);
    return closest[0];
}

async function prepareActive(series: ChartSeries[], position: [number, number]) {
    const {shapesData, layerIndexes} = await prepareTooltipShapes(series);
    return getActive(shapesData, position, layerIndexes);
}

beforeEach(() => {
    jest.spyOn(textUtils, 'wrapText').mockResolvedValue([]);
    jest.spyOn(textUtils, 'getTextSizeFn').mockReturnValue(async () => ({
        width: 10,
        height: 10,
        hangingOffset: 0,
        inkBounds: {x: 0, width: 10},
    }));
});

afterEach(() => jest.restoreAllMocks());

describe('getClosestPoints with mixed series types', () => {
    test('selects the line under the pointer instead of a distant scatter point', async () => {
        const active = await prepareActive([line, scatter], [200, 248]);
        expect(active.series.name).toBe('Line');
        expect(active.data).toEqual({x: 200, y: 250});
    });

    test('selects the scatter point under the pointer', async () => {
        const active = await prepareActive([line, scatter], [200, 22]);
        expect(active.series.name).toBe('Scatter');
        expect(active.data).toEqual({x: 200, y: 20});
    });

    test('measures the line between its points', async () => {
        const active = await prepareActive(
            [line, {type: 'scatter', name: 'Nearby', data: [{x: 150, y: 230}]}],
            [150, 250],
        );
        expect(active.series.name).toBe('Line');
        expect(active.data).toEqual({x: 200, y: 250});
    });

    test('keeps the selected line associated with its own geometry', async () => {
        const active = await prepareActive(
            [
                {
                    type: 'line',
                    name: 'A',
                    marker: {enabled: false},
                    data: [
                        {x: 0, y: 0},
                        {x: 200, y: 200},
                    ],
                },
                {
                    type: 'line',
                    name: 'B',
                    marker: {enabled: false},
                    data: [
                        {x: 0, y: 90},
                        {x: 200, y: 10},
                    ],
                },
                {type: 'scatter', name: 'Nearby', data: [{x: 90, y: 50}]},
            ],
            [90, 90],
        );
        expect(active.series.name).toBe('A');
        expect(active.data).toEqual({x: 0, y: 0});
    });

    test('selects the actual series across different X grids', async () => {
        const active = await prepareActive(
            [
                {
                    type: 'area',
                    name: 'Area',
                    data: [
                        {x: 100, y: 250},
                        {x: 150, y: 250},
                        {x: 200, y: 250},
                    ],
                },
                {type: 'scatter', name: 'Scatter', data: [{x: 150, y: 50, radius: 6}]},
                {
                    type: 'line',
                    name: 'Top line',
                    marker: {enabled: false},
                    data: [
                        {x: 0, y: 50},
                        {x: 300, y: 50},
                    ],
                },
            ],
            [150, 50],
        );
        expect(active.series.name).toBe('Top line');
        expect(active.data).toEqual({x: 300, y: 50});
    });

    test('ignores a nearer chunk with a disabled tooltip', async () => {
        const active = await prepareActive(
            [
                line,
                {
                    type: 'scatter',
                    name: 'Hidden',
                    tooltip: {enabled: false},
                    data: [{x: 200, y: 240}],
                },
            ],
            [200, 242],
        );
        expect(active.series.name).toBe('Line');
        expect(active.data).toEqual({x: 200, y: 250});
    });

    test('selects the filled area and keeps nearby scatter selectable outside it', async () => {
        const data: ChartSeries[] = [
            {
                type: 'area',
                name: 'Area',
                data: [
                    {x: 0, y: 200},
                    {x: 300, y: 200},
                ],
            },
            {type: 'scatter', name: 'Nearby', data: [{x: 150, y: 220}]},
        ];
        expect((await prepareActive(data, [150, 100])).series.name).toBe('Area');
        expect((await prepareActive(data, [150, 222])).series.name).toBe('Nearby');
    });

    test.each(['Area', 'Scatter', 'Line'])(
        'prefers upper layer %s when shapes overlap',
        async (name) => {
            const all = [
                {
                    type: 'area',
                    name: 'Area',
                    data: [
                        {x: 0, y: 200},
                        {x: 300, y: 200},
                    ],
                },
                {type: 'scatter', name: 'Scatter', data: [{x: 150, y: 150}]},
                {
                    type: 'line',
                    name: 'Line',
                    marker: {enabled: false},
                    data: [
                        {x: 0, y: 150},
                        {x: 300, y: 150},
                    ],
                },
            ] satisfies ChartSeries[];
            const data = [
                ...all.filter((item) => item.name !== name),
                ...all.filter((item) => item.name === name),
            ];
            expect((await prepareActive(data, [150, 150])).series.name).toBe(name);
        },
    );
});

describe('getClosestPoints with a single series type', () => {
    test('does not ask the plugin to measure distances', async () => {
        const spy = jest.spyOn(getSeriesPlugin('scatter').tooltip, 'prepareData');
        await prepareActive([scatter], [20, 20]);
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({measureDistance: false}));
    });

    test('keeps the first contender when distances are unmeasured', () => {
        const first: TooltipDataChunk = {
            series: {type: 'scatter', name: 'First', id: 'first'},
            data: {x: 10, y: 10},
            closest: true,
        };
        const second: TooltipDataChunk = {
            series: {type: 'scatter', name: 'Second', id: 'second'},
            data: {x: 20, y: 20},
            closest: true,
        };
        jest.spyOn(getSeriesPlugin('scatter').tooltip, 'prepareData').mockReturnValue({
            chunks: [first, second],
        });
        const active = getActive(
            [{point: {series: {type: 'scatter'}}}],
            [20, 20],
            new Map([
                ['first', 0],
                ['second', 1],
            ]),
        );
        expect(active.series.name).toBe('First');
        expect(active.data).toBe(first.data);
    });
});
