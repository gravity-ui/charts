import {groups} from 'd3';

import type {BarXSeries, BarXSeriesData, ChartData} from '../../../../types';
import nintendoGames from '../../nintendoGames';

function prepareSeriesAndCategoriesData(
    {field, filterNulls}: {field: 'platform' | 'meta_score' | 'date'; filterNulls?: boolean} = {
        field: 'platform',
    },
) {
    const gamesByPlatform = groups(nintendoGames, (item) => item[field]);
    let resultData = gamesByPlatform;

    if (filterNulls) {
        resultData = gamesByPlatform.filter(([value]) => typeof value === 'number');
    }

    const data = resultData.map(([value, games]) => ({
        x: value,
        y: games.length,
    }));

    return {
        categories: resultData.map(([key]) => key),
        series: [
            {
                data,
                name: 'Games released',
            },
        ],
    };
}

export const barXBasicCrosshairData = (function (): ChartData {
    const {categories, series} = prepareSeriesAndCategoriesData();

    return {
        series: {
            data: series.map<BarXSeries>((s) => ({
                type: 'bar-x',
                data: s.data as BarXSeriesData[],
                name: s.name,
            })),
        },
        xAxis: {
            crosshair: {enabled: true},
            type: 'category',
            categories: categories.map(String),
            title: {
                text: 'Game Platforms',
            },
        },
        yAxis: [
            {
                title: {text: 'Number of games released'},
            },
        ],
    };
})();
