import {groups} from 'd3';

import type {BarYSeries, BarYSeriesData, ChartData} from '../../../../types';
import nintendoGames from '../../nintendoGames';

function prepareData(): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
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
        xAxis: {
            plotBands: [
                {
                    from: 100,
                    to: 20,
                    color: '#0fd17a',
                    opacity: 0.5,
                    layerPlacement: 'after',
                    label: {
                        text: 'plot band label',
                    },
                },
                {
                    from: 150,
                    to: 210,
                },
            ],
            title: {text: 'Number of games released'},
        },
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

export const barXPlotBandsData = prepareData();
