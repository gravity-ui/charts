import type {ChartAxis, ChartSeries} from '../../../types';
import {getSortedSeriesData} from '../series/sorting';

const xAxis = {type: 'category', categories: ['a', 'b', 'c']} as ChartAxis;

function getSeries(xValues: (number | string)[]) {
    return {
        type: 'bar-x',
        name: 'Series',
        data: xValues.map((x, index) => ({x, y: index + 1})),
    } as ChartSeries;
}

describe('getSortedSeriesData', () => {
    test('handles numeric and string category indexes the same way', () => {
        const fromNumbers = getSortedSeriesData({seriesData: [getSeries([0, 1, 2])], xAxis});
        const fromStrings = getSortedSeriesData({seriesData: [getSeries(['a', 'b', 'c'])], xAxis});

        expect(fromStrings).toEqual(fromNumbers);
    });

    test('drops points with unknown categories the same way', () => {
        const fromNumbers = getSortedSeriesData({seriesData: [getSeries([0, 5])], xAxis});
        const fromStrings = getSortedSeriesData({seriesData: [getSeries(['a', 'z'])], xAxis});

        expect(fromStrings).toEqual(fromNumbers);
        expect(fromStrings[0].data).toHaveLength(1);
    });
});
