import type {PreparedAxis, PreparedSeries} from '../../../../hooks';
import {hasAtLeastOneSeriesDataPerPlot} from '../common';

const axes = [{plotIndex: 0}, {plotIndex: 1}, {plotIndex: 0}] as PreparedAxis[];

test.each([
    {
        title: 'a plot with no visible series does not block zoom',
        selections: [[0, 1]],
        expected: true,
    },
    {
        title: 'an empty selection in another visible plot blocks zoom',
        selections: [
            [0, 1],
            [1, 0],
        ],
        expected: false,
    },
    {
        title: 'axes in one plot share their geometry',
        selections: [
            [0, 0],
            [2, 1],
        ],
        expected: true,
    },
    {title: 'no visible series cannot permit zoom', selections: [], expected: false},
])('$title', ({selections, expected}) => {
    const series = selections.map(([yAxis, count]) => ({
        type: 'line',
        yAxis,
        data: Array.from({length: count}, () => ({x: 0, y: 1})),
    })) as PreparedSeries[];
    expect(hasAtLeastOneSeriesDataPerPlot(series, axes)).toBe(expected);
});
