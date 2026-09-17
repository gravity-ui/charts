import {getNormalizedXAxis, getNormalizedYAxis} from '../normalized-original-data';

describe('normalized original axis data', () => {
    test('resolves category tick indices after ordering and before min/max slicing', () => {
        const xAxis = getNormalizedXAxis({
            xAxis: {
                categories: ['A', 'B', 'C'],
                min: 1,
                order: 'reverse',
                ticks: {values: [0, 1, 2]},
                type: 'category',
            },
        });

        expect(xAxis?.categories).toEqual(['B', 'A']);
        expect(xAxis?.ticks?.values).toEqual(['C', 'B', 'A']);
    });

    test('normalizes category tick indices for every Y axis', () => {
        const yAxis = getNormalizedYAxis({
            yAxis: [
                {
                    categories: ['B', 'A', 'C'],
                    max: 1,
                    order: 'sortAsc',
                    ticks: {values: [0, 2]},
                    type: 'category',
                },
            ],
        });

        expect(yAxis?.[0].categories).toEqual(['A', 'B']);
        expect(yAxis?.[0].ticks?.values).toEqual(['A', 'C']);
    });

    test('leaves numeric tick values unchanged', () => {
        const xAxis = getNormalizedXAxis({
            xAxis: {
                ticks: {values: [0, 40, 100]},
                type: 'linear',
            },
        });

        expect(xAxis?.ticks?.values).toEqual([0, 40, 100]);
    });
});
