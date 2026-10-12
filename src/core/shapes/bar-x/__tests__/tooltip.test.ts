import type {PreparedBarXSeries, PreparedLineSeries} from '../../../series/types';
import {getClosestPoints} from '../../../utils/get-closest-data';
import type {PreparedLineData} from '../../line/types';
import type {PreparedBarXData} from '../types';

test('unequal grouped stacks keep bar and line rows in the same tooltip category', () => {
    const lineSeries = {type: 'line', id: 'line', name: 'Line'} as PreparedLineSeries;
    const bars = [78, 78, 102].map((x, index) => ({
        series: {
            type: 'bar-x',
            id: `bar-${index}`,
            name: `Bar ${index}`,
            stacking: 'normal',
            stackId: index < 2 ? 'left' : 'right',
        } as PreparedBarXSeries,
        data: {x: 'A', y: 50},
        x,
        y: index === 1 ? 100 : 150,
        width: 20,
        height: 50,
    })) as PreparedBarXData[];
    const line = {
        series: lineSeries,
        points: [{series: lineSeries, data: {x: 'A', y: 140}, x: 100, y: 60}],
    } as PreparedLineData;
    const chunks = getClosestPoints({
        shapesData: [...bars, line],
        position: [100, 60],
        boundsWidth: 400,
        boundsHeight: 400,
    });
    expect(new Set(chunks.map((chunk) => chunk.series.name))).toEqual(
        new Set(['Bar 0', 'Bar 1', 'Bar 2', 'Line']),
    );
    expect(chunks.filter((chunk) => chunk.closest).map((chunk) => chunk.series.name)).toEqual([
        'Line',
    ]);
});
