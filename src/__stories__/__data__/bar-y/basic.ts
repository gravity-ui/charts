import {groups} from 'd3';

import type {BarYSeries, BarYSeriesData, ChartData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(field: 'platform' | 'meta_score' | 'date' = 'platform'): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item[field]);
    const data = gamesByPlatform.map(([value, games]) => ({
        y: value,
        x: games.length,
    })) as BarYSeriesData[];
    const categories = gamesByPlatform.map(([key]) => key);
    const series = [{data, name: 'Games released'}] as BarYSeries[];

    return {
        series: {
            data: series.map<BarYSeries>((s) => ({
                type: 'bar-y',
                data: s.data as BarYSeriesData[],
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

export const barYBasicData = prepareData();
