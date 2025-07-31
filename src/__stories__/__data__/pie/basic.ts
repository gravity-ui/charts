import {groups} from 'd3';

import type {ChartData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
    const data = gamesByPlatform.map(([platform, games]) => ({
        name: platform,
        value: games.length,
    }));

    return {
        series: {
            data: [
                {
                    type: 'pie',
                    data,
                    // dataLabels: {enabled: false},
                },
            ],
        },
        legend: {enabled: true},
        title: {
            text: 'Platforms',
            style: {fontSize: '12px', fontWeight: 'normal'},
        },
    };
}

export const pieBasicData = prepareData();
