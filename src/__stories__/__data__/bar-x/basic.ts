import {groups} from 'd3';

import type {BarXSeries, BarXSeriesData, ChartData} from '../../../types';
import nintendoGames from '../nintendoGames';

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

export const barXBasicData = (function (): ChartData {
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
            type: 'category',
            categories: categories.map(String),
            title: {
                text: 'Game Platforms',
            },
        },
        yAxis: [{title: {text: 'Number of games released'}}],
    };
})();

export const barXLinearData = (function (): ChartData {
    const {series} = prepareSeriesAndCategoriesData({field: 'meta_score'});

    return {
        series: {
            data: series.map<BarXSeries>((s) => ({
                type: 'bar-x',
                data: s.data as BarXSeriesData[],
                name: s.name,
            })),
        },
        xAxis: {
            title: {
                text: 'Meta scores',
            },
        },
    };
})();

export const barXDateTimeData = (function (): ChartData {
    const {series} = prepareSeriesAndCategoriesData({field: 'date', filterNulls: true});

    return {
        series: {
            data: series.map<BarXSeries>((s) => ({
                type: 'bar-x',
                data: s.data as BarXSeriesData[],
                name: s.name,
            })),
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Release date',
            },
        },
    };

    // return {
    //     series: {
    //         data: [
    //             {
    //                 type: 'bar-x',
    //                 name: 'Fruits',
    //                 data: [
    //                     {x: 1749254400000, y: 1},
    //                     {x: 1751846400000, y: 5},
    //                     {x: 1754524800000, y: 2},
    //                     {x: 1757203200000, y: 8},
    //                     {x: 1759795200000, y: 4},
    //                 ],
    //             },
    //         ],
    //     },
    //     xAxis: {
    //         type: 'datetime',
    //         min: 1749513600000,
    //     },
    // };
})();
