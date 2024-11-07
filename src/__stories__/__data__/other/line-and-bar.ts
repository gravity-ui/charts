import {groups, max, median, min} from 'd3';

import type {ChartKitWidgetData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartKitWidgetData {
    const gamesByPlatform = groups(nintendoGames, (item) => item.platform || 'unknown');

    return {
        series: {
            options: {
                line: {
                    lineWidth: 2,
                },
            },
            data: [
                {
                    type: 'bar-x',
                    data: gamesByPlatform.map(([value, games]) => ({
                        x: value,
                        y: median(games, (g) => g.user_score || 0),
                    })),
                    name: 'Median user score',
                },
                {
                    type: 'line',
                    data: gamesByPlatform.map(([value, games]) => ({
                        x: value,
                        y: max(games, (g) => g.user_score || 0),
                    })),
                    name: 'Max user score',
                },
                {
                    type: 'line',
                    data: gamesByPlatform.map(([value, games]) => ({
                        x: value,
                        y: min(games, (g) => g.user_score || 10),
                    })),
                    name: 'Min user score',
                },
            ],
        },
        xAxis: {
            categories: gamesByPlatform.map<string>(([key]) => key),
            type: 'category',
            title: {
                text: 'Game Platforms',
            },
        },
        yAxis: [
            {
                title: {text: 'User score'},
                labels: {
                    enabled: true,
                },
                ticks: {
                    pixelInterval: 120,
                },
            },
        ],
    };
}

export const otherLineAndBarData = prepareData();
