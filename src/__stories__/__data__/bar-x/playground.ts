import {action} from '@storybook/addon-actions';
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
                    borderRadius: 8,
                },
            ],
        },
        xAxis: {
            type: 'category',
            categories: gamesByPlatform.map(([key, _group]) => key),
            title: {
                text: 'Game Platforms',
            },
            labels: {
                enabled: true,
                rotation: 30,
            },
        },
        yAxis: [
            {
                title: {text: 'Number of games released'},
                labels: {
                    enabled: true,
                    rotation: -90,
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

export const barXPlaygroundData = prepareData();
