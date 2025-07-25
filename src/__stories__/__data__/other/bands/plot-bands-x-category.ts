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
        xAxis: {
            plotBands: [
                {
                    from: '3DS',
                    to: 'WII',
                    color: '#0fd17a',
                    opacity: 0.5,
                    layerPlacement: 'after',
                },
                {
                    from: -0.5,
                    to: 1,
                },
            ],
            type: 'category',
            categories: gamesByPlatform.map(([key, _group]) => key),
            title: {
                text: 'Game Platforms',
            },
        },
    };
}

export const barXWithXAxisPlotBandsData = prepareData();
