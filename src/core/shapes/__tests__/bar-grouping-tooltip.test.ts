import type {
    PreparedAreaSeries,
    PreparedBarXSeries,
    PreparedBarYSeries,
    PreparedLineSeries,
} from '../../series/types';
import {getClosestPoints} from '../../utils/get-closest-data';
import type {PreparedAreaData} from '../area/types';
import type {PreparedBarXData} from '../bar-x/types';
import type {PreparedBarYData} from '../bar-y/types';
import type {PreparedLineData} from '../line/types';

describe.each(['bar-x', 'bar-y'] as const)('%s overlay tooltip', (type) => {
    test.each([
        {values: [100, 75], pointer: 50, expected: 'Actual'},
        {values: [100, 75], pointer: 90, expected: 'Plan'},
        {values: [-100, -75], pointer: -50, expected: 'Actual'},
        {values: [-100, -75], pointer: -90, expected: 'Plan'},
    ])('selects the visible bar at $pointer for $values', ({values, pointer, expected}) => {
        const shapes = values.map((value, index) => {
            const series = {
                type,
                id: String(index),
                name: index === 0 ? 'Plan' : 'Actual',
                grouping: false,
            };
            return type === 'bar-x'
                ? ({
                      series: series as PreparedBarXSeries,
                      data: {x: 'A', y: value},
                      x: 90,
                      y: 200 - Math.max(0, value),
                      width: 20,
                      height: Math.abs(value),
                  } as PreparedBarXData)
                : ({
                      series: series as PreparedBarYSeries,
                      data: {y: 'A', x: value},
                      x: 200 + Math.min(0, value),
                      y: 90,
                      width: Math.abs(value),
                      height: 20,
                  } as PreparedBarYData);
        });
        const chunks = getClosestPoints({
            shapesData: shapes,
            position: type === 'bar-x' ? [100, 200 - pointer] : [200 + pointer, 100],
            boundsWidth: 400,
            boundsHeight: 400,
        });
        expect(chunks.map((chunk) => chunk.series.name)).toEqual(['Plan', 'Actual']);
        expect(chunks.filter((chunk) => chunk.closest).map((chunk) => chunk.series.name)).toEqual([
            expected,
        ]);
        chunks.forEach((chunk, index) => expect(chunk.data).toBe(shapes[index].data));
    });

    test('hit testing respects the overlay width beside a grouped bar', () => {
        const shapes = [
            {
                series: {type, id: 'plan', name: 'Plan', grouping: true},
                data: type === 'bar-x' ? {x: 'A', y: 100} : {y: 'A', x: 100},
                x: type === 'bar-x' ? 78 : 200,
                y: type === 'bar-x' ? 100 : 78,
                width: type === 'bar-x' ? 20 : 100,
                height: type === 'bar-x' ? 100 : 20,
            },
            {
                series: {type, id: 'actual', name: 'Actual', grouping: false},
                data: type === 'bar-x' ? {x: 'A', y: 75} : {y: 'A', x: 75},
                x: type === 'bar-x' ? 90 : 200,
                y: type === 'bar-x' ? 125 : 90,
                width: type === 'bar-x' ? 20 : 75,
                height: type === 'bar-x' ? 75 : 20,
            },
        ] as (PreparedBarXData | PreparedBarYData)[];
        const chunks = getClosestPoints({
            shapesData: shapes,
            position: type === 'bar-x' ? [92, 150] : [250, 92],
            boundsWidth: 400,
            boundsHeight: 400,
        });
        expect(chunks.filter((chunk) => chunk.closest).map((chunk) => chunk.series.name)).toEqual([
            'Actual',
        ]);
    });

    test.each([
        {pointer: 20, expected: 'Actual 1'},
        {pointer: 65, expected: 'Actual 2'},
        {pointer: 90, expected: 'Plan 2'},
    ])('selects the visible stack segment at $pointer', ({pointer, expected}) => {
        const shapes = [
            {name: 'Plan 1', stackId: 'plan', start: 0, value: 60},
            {name: 'Plan 2', stackId: 'plan', start: 60, value: 40},
            {name: 'Actual 1', stackId: 'actual', start: 0, value: 50},
            {name: 'Actual 2', stackId: 'actual', start: 50, value: 25},
        ].map(({name, stackId, start, value}) => ({
            series: {type, id: name, name, stackId, stacking: 'normal', grouping: false},
            data: type === 'bar-x' ? {x: 'A', y: value} : {y: 'A', x: value},
            x: type === 'bar-x' ? 90 : 200 + start,
            y: type === 'bar-x' ? 200 - start - value : 90,
            width: type === 'bar-x' ? 20 : value,
            height: type === 'bar-x' ? value : 20,
        })) as (PreparedBarXData | PreparedBarYData)[];
        const chunks = getClosestPoints({
            shapesData: shapes,
            position: type === 'bar-x' ? [100, 200 - pointer] : [200 + pointer, 100],
            boundsWidth: 400,
            boundsHeight: 400,
        });
        expect(chunks).toHaveLength(4);
        expect(chunks.filter((chunk) => chunk.closest).map((chunk) => chunk.series.name)).toEqual([
            expected,
        ]);
    });
});

test('bar-y chooses the nearest category when overlay and grouped centers interleave', () => {
    const shapes = [
        {id: 'overlay', grouping: false, offsets: [25, 125], height: 50},
        {id: 'first', grouping: true, offsets: [25, 125], height: 25},
        {id: 'second', grouping: true, offsets: [50, 150], height: 25},
    ].flatMap(({id, grouping, offsets, height}) =>
        offsets.map((y, index) => ({
            series: {type: 'bar-y', id, grouping},
            data: {y: index === 0 ? 'A' : 'B', x: 100},
            x: 200,
            y,
            width: 100,
            height,
        })),
    ) as PreparedBarYData[];
    const chunks = getClosestPoints({
        shapesData: shapes,
        position: [250, 101],
        boundsWidth: 400,
        boundsHeight: 400,
    });
    expect(chunks).toHaveLength(3);
    chunks.forEach((chunk) => expect(chunk.data).toEqual({y: 'B', x: 100}));
});

test.each([
    {pointerY: 60, expected: 'Line'},
    {pointerY: 150, expected: 'Actual'},
])('keeps line candidates beside unequal stacks at $pointerY', ({pointerY, expected}) => {
    const lineSeries = {type: 'line', id: 'line', name: 'Line'} as PreparedLineSeries;
    const shapes = [
        {
            series: {type: 'bar-x', id: 'actual', name: 'Actual', grouping: false},
            data: {x: 'A', y: 100},
            x: 90,
            y: 100,
            width: 20,
            height: 100,
        } as PreparedBarXData,
        {
            series: lineSeries,
            points: [{series: lineSeries, data: {x: 'A', y: 140}, x: 100, y: 60}],
        } as PreparedLineData,
        ...[78, 78, 102].map(
            (x, index) =>
                ({
                    series: {
                        type: 'bar-x',
                        id: `grouped-${index}`,
                        stacking: 'normal',
                        stackId: index < 2 ? 'left' : 'right',
                    },
                    data: {x: 'A', y: 50},
                    x,
                    y: index === 1 ? 100 : 150,
                    width: 20,
                    height: 50,
                }) as PreparedBarXData,
        ),
    ];
    const chunks = getClosestPoints({
        shapesData: shapes,
        position: [100, pointerY],
        boundsWidth: 400,
        boundsHeight: 400,
    });
    expect(chunks).toHaveLength(5);
    expect(chunks.filter((chunk) => chunk.closest).map((chunk) => chunk.series.name)).toEqual([
        expected,
    ]);
});

test('overlay hit testing keeps area candidates above the bar', () => {
    const areaSeries = {type: 'area', id: 'area', name: 'Area'} as PreparedAreaSeries;
    const shapes = [
        {
            series: {type: 'bar-x', id: 'actual', name: 'Actual', grouping: false},
            data: {x: 'A', y: 100},
            x: 90,
            y: 100,
            width: 20,
            height: 100,
        } as PreparedBarXData,
        {
            series: areaSeries,
            points: [{series: areaSeries, data: {x: 'A', y: 150}, x: 100, y: 50, y0: 200}],
        } as PreparedAreaData,
    ];
    const chunks = getClosestPoints({
        shapesData: shapes,
        position: [100, 75],
        boundsWidth: 400,
        boundsHeight: 400,
    });
    expect(chunks.filter((chunk) => chunk.closest).map((chunk) => chunk.series.name)).toEqual([
        'Area',
    ]);
});
