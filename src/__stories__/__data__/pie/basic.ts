import {groups} from 'd3';

import type {ChartKitWidgetData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartKitWidgetData {
    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
    const data = gamesByPlatform.map(([platform, games]) => ({
        name: platform,
        value: games.length,
    }));

    return {
        series: {
            data: [{type: 'pie', data}],
        },
        legend: {enabled: true},
        title: {
            text: 'Platforms',
            style: {fontSize: '12px', fontWeight: 'normal'},
        },
    };
}

export const pieBasicData = prepareData();
