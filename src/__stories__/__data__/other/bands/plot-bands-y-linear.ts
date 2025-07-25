import {groups} from 'd3';

import type {ChartData} from '../../../../types';
import nintendoGames from '../../nintendoGames';

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
        yAxis: [
            {
                plotBands: [
                    {
                        from: 10,
                        to: 130,
                    },
                ],
            },
        ],
        xAxis: {
            type: 'category',
            categories: gamesByPlatform.map(([key, _group]) => key),
            title: {
                text: 'Game Platforms',
            },
        },
    };
}

export const barXWithYLinearAxisPlotBandsData = prepareData();
