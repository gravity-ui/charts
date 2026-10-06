/* @jest-environment jsdom */

import {getPreparedLegend} from '~core/series/prepare-legend';
import {validateData} from '~core/validation';

import {CHART_ERROR_CODE} from '../../../libs';
import type {ChartData, RadarSeries, RadarSeriesCategory} from '../../../types';
import {prepareRadarSeries} from '../prepare-radar-series';

const categories: RadarSeriesCategory[] = [{key: 'A'}, {key: 'B'}, {key: 'C'}];

function createSeries(): RadarSeries[] {
    return [1, 2].map((value) => ({
        type: 'radar',
        data: categories.map(() => ({value})),
    }));
}

async function prepare(series: RadarSeries[]) {
    const legend = await getPreparedLegend({
        series,
        legend: {enabled: false},
        chartWidth: 400,
        chartMargin: {top: 0, right: 0, bottom: 0, left: 0},
    });
    return prepareRadarSeries({series, legend, colors: ['red', 'blue']});
}

test.each([undefined, []])('rejects missing radar categories: %j', (value) => {
    const series = createSeries();
    series[0].categories = value;
    const data: ChartData = {
        series: {data: series},
        xAxis: {categories: categories.map(({key}) => key)},
    };
    expect(() => validateData(data)).toThrow(
        expect.objectContaining({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: 'Radar categories must be specified in series.categories',
        }),
    );
});

test('rejects non-array categories even when another series provides valid categories', () => {
    const series = createSeries();
    Object.assign(series[0], {categories: 'A'});
    series[1].categories = categories;
    expect(() => validateData({series: {data: series}})).toThrow(
        expect.objectContaining({
            code: CHART_ERROR_CODE.INVALID_DATA,
            message: 'Radar series.categories must be an array',
        }),
    );
});

test.each([undefined, []])(
    'shares categories from a hidden series after missing or empty categories: %j',
    async (value) => {
        const series = createSeries();
        series[0].categories = value;
        series[1].categories = categories;
        series[1].visible = false;
        const original = JSON.stringify(series);

        expect(() => validateData({series: {data: series}})).not.toThrow();
        const prepared = await prepare(series);
        prepared.forEach((item, index) => {
            expect(item.categories).toBe(categories);
            expect(item.data).toBe(series[index].data);
        });
        expect(JSON.stringify(series)).toBe(original);
    },
);

test('uses the first nonempty categories when several series provide them', async () => {
    const series = createSeries();
    series[0].categories = categories;
    series[1].categories = [{key: 'Other'}];

    expect(() => validateData({series: {data: series}})).not.toThrow();
    const prepared = await prepare(series);
    prepared.forEach((item) => expect(item.categories).toBe(categories));
});
