import {groups} from 'd3';

import type {ChartData} from '../../../../types';
import nintendoGames from '../../nintendoGames';

function prepareData(): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
    const data = gamesByPlatform.map(([value, games]) => ({
        y: value,
        x: games.length,
    }));
    const categories = gamesByPlatform.map(([key]) => key);

    return {
        series: {
            data: [
                {
                    type: 'bar-y',
                    data,
                    name: 'Games released',
                },
            ],
        },
        xAxis: {title: {text: 'Number of games released'}},
        yAxis: [
            {
                type: 'category',
                categories: categories.map(String),
                title: {text: 'Game Platforms'},
                plotBands: [
                    {
                        from: -Infinity,
                        to: 3,
                        color: 'rgba(255, 0, 0, 0.2)',
                        label: {text: 'From -Infinity'},
                        layerPlacement: 'after',
                    },
                    {
                        from: 5,
                        to: Infinity,
                        color: 'rgba(0, 0, 255, 0.2)',
                        label: {text: 'To Infinity'},
                        layerPlacement: 'after',
                    },
                ],
            },
        ],
    };
}

export const barYWithYAxisPlotBandsInfinityData = prepareData();
