import {groups} from 'd3';

import type {ChartKitWidgetData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartKitWidgetData {
    const gamesByPlatform = groups(nintendoGames, (d) => d.esrb_rating || 'unknown');
    const data = gamesByPlatform.map(([value, games]) => ({
        name: value,
        value: games.length,
    }));

    return {
        series: {
            data: [
                {
                    type: 'pie',
                    innerRadius: '50%',
                    data: data,
                },
            ],
        },
        legend: {enabled: true},
        title: {
            text: 'ESRB ratings',
            style: {fontSize: '12px', fontWeight: 'normal'},
        },
    };
}

export const pieDonutData = prepareData();
