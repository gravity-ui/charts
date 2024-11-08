import {action} from '@storybook/addon-actions';
import {groups} from 'd3';

import type {ChartData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item['platform']);
    const data = gamesByPlatform.map(([value, games]) => ({
        x: games.length,
        y: value,
    }));

    return {
        series: {
            data: [
                {
                    type: 'bar-y',
                    data,
                    name: 'Games released',
                    dataLabels: {
                        enabled: true,
                    },
                },
            ],
        },
        xAxis: {
            title: {text: 'Number of games released'},
            labels: {
                enabled: true,
            },
            lineColor: 'transparent',
        },
        yAxis: [
            {
                type: 'category',
                categories: gamesByPlatform.map(([key]) => key),
                title: {
                    text: 'Game Platforms',
                },
                labels: {
                    enabled: true,
                },
                ticks: {
                    pixelInterval: 120,
                },
            },
        ],
        chart: {
            events: {
                click: action('chart.events.click'),
            },
        },
    };
}

export const barYPlaygroundData = prepareData();
