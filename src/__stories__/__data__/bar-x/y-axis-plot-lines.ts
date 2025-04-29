import {groups} from 'd3';

import type {ChartData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item['platform']);
    const data = gamesByPlatform.map(([value, games]) => ({
        x: value,
        y: games.length,
    }));

    return {
        series: {
            data: [
                {
                    type: 'bar-x',
                    data,
                    name: 'Games released',
                },
            ],
        },
        xAxis: {
            type: 'category',
            categories: gamesByPlatform.map(([key, _group]) => key),
            title: {
                text: 'Game Platforms',
            },
        },
        yAxis: [
            {
                title: {text: 'Number of games released'},
                ticks: {
                    pixelInterval: 120,
                },
                plotLines: [
                    {
                        value: 100,
                        width: 2,
                        color: 'red',
                        dashStyle: 'Dash',
                        layerPlacement: 'after',
                    },
                    {
                        value: 200,
                        width: 1,
                        layerPlacement: 'before',
                    },
                ],
            },
        ],
    };
}

export const barXWithYAxisPlotLinesData = prepareData();
