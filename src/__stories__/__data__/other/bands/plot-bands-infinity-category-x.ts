import {groups} from 'd3';

import type {ChartData} from '../../../../types';
import nintendoGames from '../../nintendoGames';

function prepareData(): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
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
                    from: -Infinity,
                    to: 3,
                    color: 'rgba(0, 255, 0, 0.2)',
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
            type: 'category',
            categories: gamesByPlatform.map(([key]) => key),
            title: {
                text: 'Game Platforms',
            },
        },
    };
}

export const barXWithXAxisPlotBandsInfinityData = prepareData();
