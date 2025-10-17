import {groups} from 'd3';

import type {ChartData, HeatmapSeries, HeatmapSeriesData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(field: 'platform' | 'meta_score' | 'date' = 'platform'): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item[field]);
    const data = gamesByPlatform.map(([_, games], index) => ({
        y: index,
        x: games.length,
    })) as HeatmapSeriesData[];
    const categories = gamesByPlatform.map(([key]) => key);
    const series = [{data, name: 'Games released'}] as HeatmapSeries[];

    return {
        series: {
            data: series.map<HeatmapSeries>((s) => ({
                type: 'heatmap',
                data: s.data as HeatmapSeriesData[],
                name: s.name,
            })),
        },
        xAxis: {title: {text: 'Number of games released'}},
        yAxis: [
            {
                type: 'category',
                categories: categories.map(String),
                title: {
                    text: 'Game Platforms',
                },
            },
        ],
    };
}

export const heatmapBasicData = prepareData();
