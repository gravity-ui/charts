import type * as SeriesRegistry from '~core/series/seriesRegistry';
import {getSeriesPlugin} from '~core/series/seriesRegistry';

import type * as LinePlugin from '../../../../plugins/line';
import type {
    ChartXAxis,
    ChartYAxis,
    TooltipDataChunk,
    TooltipDataChunkArea,
    TooltipDataChunkAreaRange,
    TooltipDataChunkBarX,
    TooltipDataChunkBarY,
    TooltipDataChunkFunnel,
    TooltipDataChunkHeatmap,
    TooltipDataChunkLine,
    TooltipDataChunkPie,
    TooltipDataChunkRadar,
    TooltipDataChunkSankey,
    TooltipDataChunkScatter,
    TooltipDataChunkTreemap,
    TooltipDataChunkWaterfall,
    TooltipDataChunkXRange,
} from '../../../../types';
import {getBuiltInAggregatedValue, getHoveredValues, getSortedHovered} from '../utils';
import type * as TooltipUtils from '../utils';

const createLineChunk = (
    name: string,
    value: TooltipDataChunkLine['data']['y'],
): TooltipDataChunkLine => ({
    data: {x: 1, y: value},
    series: {type: 'line', id: name, name},
});
const createBarYChunk = (
    name: string,
    value: TooltipDataChunkBarY['data']['x'],
): TooltipDataChunkBarY => ({
    data: {x: value, y: 1},
    series: {type: 'bar-y', name, data: []},
});
const createAreaRangeChunk = (name: string, y0: number, y1: number): TooltipDataChunkAreaRange => ({
    data: {x: 1, y0, y1},
    series: {type: 'area-range', id: name, name},
});

const ASC = {key: 'value' as const, direction: 'asc' as const};
const DESC = {key: 'value' as const, direction: 'desc' as const};

const chunkFactories = {
    area: (y: TooltipDataChunkArea['data']['y']): TooltipDataChunkArea => ({
        series: {type: 'area', id: 'area', name: 'Area'},
        data: {x: 100, y},
    }),
    line: (y: TooltipDataChunkLine['data']['y']) => createLineChunk('Line', y),
    'bar-x': (y: TooltipDataChunkBarX['data']['y']): TooltipDataChunkBarX => ({
        series: {type: 'bar-x', name: 'Bar X', data: []},
        data: {x: 100, y},
    }),
    scatter: (y: TooltipDataChunkScatter['data']['y']): TooltipDataChunkScatter => ({
        series: {type: 'scatter', id: 'scatter', name: 'Scatter'},
        data: {x: 100, y},
    }),
    waterfall: (y: TooltipDataChunkWaterfall['data']['y']): TooltipDataChunkWaterfall => ({
        series: {type: 'waterfall', name: 'Waterfall', data: []},
        data: {x: 100, y},
    }),
    'x-range': (y: TooltipDataChunkXRange['data']['y']): TooltipDataChunkXRange => ({
        series: {type: 'x-range', name: 'X Range', data: []},
        data: {x0: 100, x1: 200, y},
    }),
    pie: (value: TooltipDataChunkPie['data']['value']): TooltipDataChunkPie => ({
        series: {type: 'pie', id: 'pie', name: 'Pie'},
        data: {name: 'Slice', value},
    }),
    radar: (value: TooltipDataChunkRadar['data']['value']): TooltipDataChunkRadar => ({
        series: {type: 'radar', name: 'Radar', data: []},
        data: {value},
        closest: true,
    }),
    heatmap: (value: TooltipDataChunkHeatmap['data']['value']): TooltipDataChunkHeatmap => ({
        series: {type: 'heatmap', name: 'Heatmap', data: []},
        data: {x: 0, y: 0, value},
    }),
    treemap: (value: TooltipDataChunkTreemap['data']['value']): TooltipDataChunkTreemap => ({
        series: {type: 'treemap', name: 'Treemap', data: []},
        data: {name: 'Leaf', value},
    }),
    funnel: (value: TooltipDataChunkFunnel['data']['value']): TooltipDataChunkFunnel => ({
        series: {type: 'funnel', id: 'funnel', name: 'Funnel'},
        data: {name: 'Stage', value},
    }),
};

const sankeyChunk: TooltipDataChunkSankey = {
    series: {type: 'sankey', name: 'Flow', data: []},
    data: {
        name: 'Source',
        links: [
            {name: 'Other', value: 100},
            {name: 'Target', value: 7},
        ],
    },
    target: {name: 'Target', links: []},
};

const delegationChunks = {
    area: chunkFactories.area(10),
    line: chunkFactories.line(10),
    'bar-x': chunkFactories['bar-x'](10),
    'bar-y': createBarYChunk('Bar Y', 10),
    scatter: chunkFactories.scatter(10),
    waterfall: chunkFactories.waterfall(10),
    'x-range': chunkFactories['x-range'](10),
    pie: chunkFactories.pie(10),
    radar: chunkFactories.radar(10),
    heatmap: chunkFactories.heatmap(10),
    treemap: chunkFactories.treemap(10),
    funnel: chunkFactories.funnel(10),
    sankey: sankeyChunk,
    'area-range': createAreaRangeChunk('Area Range', 5, 15),
} satisfies Record<TooltipDataChunk['series']['type'], TooltipDataChunk>;

describe('getHoveredValues', () => {
    it.each(['area', 'line', 'bar-x', 'waterfall', 'scatter', 'x-range'] as const)(
        'preserves numeric, date and missing Y values for %s',
        (type) => {
            const create = chunkFactories[type];
            const chunk = create(1);
            const originalData = {...chunk.data};
            expect(getHoveredValues({hovered: [chunk]})).toEqual([1]);
            expect(getHoveredValues({hovered: [create(0), create(undefined)]})).toEqual([
                0,
                undefined,
            ]);
            const timestamp = Date.UTC(2025, 0, 1);
            expect(
                getHoveredValues({hovered: [create(timestamp)], yAxis: {type: 'datetime'}}),
            ).toEqual([timestamp]);
            expect(chunk.data).toEqual(originalData);
        },
    );

    it.each(['area', 'line', 'bar-x', 'scatter', 'x-range'] as const)(
        'resolves indexed and named Y categories for %s',
        (type) => {
            const create = chunkFactories[type];
            const chunk = create(1);
            const originalData = {...chunk.data};
            expect(
                getHoveredValues({
                    hovered: [chunk],
                    yAxis: {type: 'category', categories: ['First', 'Second']},
                }),
            ).toEqual(['Second']);
            expect(
                getHoveredValues({hovered: [create('Named')], yAxis: {type: 'category'}}),
            ).toEqual(['Named']);
            expect(chunk.data).toEqual(originalData);
        },
    );

    it.each(['area', 'line', 'bar-x', 'scatter', 'waterfall'] as const)(
        'preserves null Y values for %s',
        (type) => {
            expect(getHoveredValues({hovered: [chunkFactories[type](null)]})).toEqual([null]);
        },
    );

    it('resolves bar-y values against X and preserves missing values', () => {
        const xAxis: ChartXAxis = {type: 'category', categories: ['First', 'Second']};
        expect(
            getHoveredValues({
                hovered: [createBarYChunk('Indexed', 1), createBarYChunk('Named', 'Named')],
                xAxis,
            }),
        ).toEqual(['Second', 'Named']);
        const timestamp = Date.UTC(2025, 0, 1);
        expect(
            getHoveredValues({
                hovered: [
                    createBarYChunk('Date', timestamp),
                    createBarYChunk('Zero', 0),
                    createBarYChunk('Null', null),
                    createBarYChunk('Missing', undefined),
                ],
                xAxis: {type: 'datetime'},
            }),
        ).toEqual([timestamp, 0, null, undefined]);
    });

    it.each(['pie', 'radar', 'heatmap', 'treemap', 'funnel'] as const)(
        'uses the scalar value for %s regardless of axes',
        (type) => {
            expect(
                getHoveredValues({
                    hovered: [chunkFactories[type](7), chunkFactories[type](0)],
                    xAxis: {type: 'category'},
                    yAxis: {type: 'category'},
                }),
            ).toEqual([7, 0]);
        },
    );

    it('preserves supported null and missing scalar values', () => {
        expect(
            getHoveredValues({
                hovered: [
                    chunkFactories.pie(null),
                    chunkFactories.heatmap(null),
                    chunkFactories.heatmap(undefined),
                    chunkFactories.treemap(undefined),
                ],
            }),
        ).toEqual([null, null, undefined, undefined]);
    });

    it('uses the Sankey link to the hovered target and preserves absent links', () => {
        const chunk = sankeyChunk;
        expect(
            getHoveredValues({
                hovered: [
                    chunk,
                    {...chunk, target: {name: 'Missing', links: []}},
                    {...chunk, target: undefined},
                ],
            }),
        ).toEqual([7, undefined, undefined]);
    });

    it.each(Object.values(delegationChunks))(
        'passes the original chunk and axes to the $series.type plugin',
        (item) => {
            const xAxis: ChartXAxis = {type: 'linear'};
            const yAxis: ChartYAxis = {type: 'linear'};
            const getValue = jest
                .spyOn(getSeriesPlugin(item.series.type).tooltip, 'getValue')
                .mockReturnValue(42);
            try {
                expect(getHoveredValues({hovered: [item], xAxis, yAxis})).toEqual([42]);
                expect(getValue).toHaveBeenCalledTimes(1);
                const [args] = getValue.mock.calls[0];
                expect(args.item).toBe(item);
                expect(args.xAxis).toBe(xAxis);
                expect(args.yAxis).toBe(yAxis);
            } finally {
                getValue.mockRestore();
            }
        },
    );

    it('uses an independently registered plugin without importing the built-in registration', () => {
        jest.isolateModules(() => {
            const registry = jest.requireActual<typeof SeriesRegistry>(
                '~core/series/seriesRegistry',
            );
            const utils = jest.requireActual<typeof TooltipUtils>('../utils');
            expect(registry.getRegisteredSeriesTypes()).toEqual([]);
            const {linePlugin} = jest.requireActual<typeof LinePlugin>('../../../../plugins/line');
            const getValue = jest.fn(() => 42);
            registry.registerSeriesPlugin({
                ...linePlugin,
                tooltip: {...linePlugin.tooltip, getValue},
            });
            const item = createLineChunk('Line', 10);
            expect(utils.getHoveredValues({hovered: [item]})).toEqual([42]);
            expect(getValue).toHaveBeenCalledWith({item, xAxis: undefined, yAxis: undefined});
            expect(registry.getRegisteredSeriesTypes()).toEqual(['line']);
        });
    });

    it('returns an empty list for no hovered chunks', () => {
        expect(getHoveredValues({hovered: []})).toEqual([]);
    });
});

describe('getSortedHovered', () => {
    it('returns hovered as-is when sorting is undefined', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('C', 30),
            createLineChunk('A', 10),
            createLineChunk('B', 20),
        ];
        expect(getSortedHovered({hovered})).toBe(hovered);
    });

    it('sorts by value ascending', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('C', 30),
            createLineChunk('A', 10),
            createLineChunk('B', 20),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: ASC,
            yAxis: {type: 'linear'},
        });
        expect(getHoveredValues({hovered: result, yAxis: {type: 'linear'}})).toEqual([10, 20, 30]);
        expect(result.map((c) => c.series.name)).toEqual(['A', 'B', 'C']);
    });

    it('sorts by value descending', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('A', 10),
            createLineChunk('B', 20),
            createLineChunk('C', 30),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: DESC,
            yAxis: {type: 'linear'},
        });
        expect(getHoveredValues({hovered: result, yAxis: {type: 'linear'}})).toEqual([30, 20, 10]);
        expect(result.map((c) => c.series.name)).toEqual(['C', 'B', 'A']);
    });

    it('uses custom comparator when sorting is a function', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('Charlie', 10),
            createLineChunk('Alice', 30),
            createLineChunk('Bob', 20),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: (a, b) => (a.series.name ?? '').localeCompare(b.series.name ?? ''),
            yAxis: {type: 'linear'},
        });
        expect(result.map((c) => c.series.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('returns empty array when hovered is empty', () => {
        const result = getSortedHovered({
            hovered: [],
            sorting: ASC,
            yAxis: {type: 'linear'},
        });
        expect(result).toEqual([]);
    });

    it('returns single-element array unchanged', () => {
        const hovered: TooltipDataChunk[] = [createLineChunk('A', 10)];
        const result = getSortedHovered({
            hovered,
            sorting: DESC,
            yAxis: {type: 'linear'},
        });
        expect(result).toEqual(hovered);
    });

    it('does not mutate original hovered array', () => {
        const hovered: TooltipDataChunk[] = [createLineChunk('C', 30), createLineChunk('A', 10)];
        const originalOrder = hovered.map((c) => c.series.name);
        getSortedHovered({hovered, sorting: ASC, yAxis: {type: 'linear'}});
        expect(hovered.map((c) => c.series.name)).toEqual(originalOrder);
    });

    it('places null values last when sorting descending', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('A', 10),
            createLineChunk('Null', null),
            createLineChunk('B', 5),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: DESC,
            yAxis: {type: 'linear'},
        });
        expect(result.map((c) => c.series.name)).toEqual(['A', 'B', 'Null']);
    });

    it('places null values first when sorting ascending', () => {
        const hovered: TooltipDataChunk[] = [
            createLineChunk('A', 10),
            createLineChunk('Null', null),
            createLineChunk('B', 5),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: ASC,
            yAxis: {type: 'linear'},
        });
        expect(result.map((c) => c.series.name)).toEqual(['Null', 'B', 'A']);
    });

    it('handles bar-y series with xAxis for value extraction', () => {
        const hovered: TooltipDataChunk[] = [
            createBarYChunk('High', 100),
            createBarYChunk('Low', 10),
            createBarYChunk('Mid', 50),
        ];
        const result = getSortedHovered({
            hovered,
            sorting: ASC,
            xAxis: {type: 'linear'},
        });
        expect(getHoveredValues({hovered: result, xAxis: {type: 'linear'}})).toEqual([10, 50, 100]);
    });

    it('uses area-range width for sorting and totals', () => {
        const hovered: TooltipDataChunk[] = [
            createAreaRangeChunk('Wide', 10, 30),
            createAreaRangeChunk('Narrow', 10, 15),
            createAreaRangeChunk('Medium', 10, 20),
        ];
        const result = getSortedHovered({hovered, sorting: ASC, yAxis: {type: 'linear'}});
        const values = getHoveredValues({hovered: result, yAxis: {type: 'linear'}});

        expect(values).toEqual([5, 10, 20]);
        expect(result.map((chunk) => chunk.series.name)).toEqual(['Narrow', 'Medium', 'Wide']);
        expect(getBuiltInAggregatedValue({aggregation: 'sum', values})).toBe(35);
    });

    it('sorts mixed plugin values and totals only numbers without changing the chunks', () => {
        const hovered = [
            createLineChunk('Line', 10),
            createBarYChunk('Bar', 7),
            createAreaRangeChunk('Range', 5, 8),
            chunkFactories.pie(4),
            chunkFactories.scatter('Category'),
            createLineChunk('Missing', null),
        ];
        const original = [...hovered];
        const sorted = getSortedHovered({hovered, sorting: ASC});
        const values = getHoveredValues({hovered: sorted});

        expect(values).toEqual([null, 3, 4, 7, 10, 'Category']);
        expect(sorted).toEqual([
            hovered[5],
            hovered[2],
            hovered[3],
            hovered[1],
            hovered[0],
            hovered[4],
        ]);
        expect(getBuiltInAggregatedValue({aggregation: 'sum', values})).toBe(24);
        expect(hovered).toEqual(original);
    });
});
