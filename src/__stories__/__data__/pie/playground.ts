import {action} from '@storybook/addon-actions';
import {descending, groups, sort} from 'd3';

import type {ChartData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
    const seriesData = gamesByPlatform.map(([platform, games]) => ({
        name: platform,
        value: games.length,
        label: `${platform} (${games.length})`,
    }));

    return {
        series: {
            data: [
                {
                    type: 'pie',
                    data: sort(seriesData, (d1, d2) => descending(d1.value, d2.value)),
                    dataLabels: {
                        enabled: true,
                        connectorCurve: 'basic',
                    },
                },
            ],
        },
        legend: {enabled: true},
        chart: {
            events: {
                click: action('chart.events.click'),
            },
        },
    };
}

export const piePlaygroundData = prepareData();
