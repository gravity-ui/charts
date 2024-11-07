import {groups} from 'd3';

import type {ChartKitWidgetData} from '../../../types';
import {CustomShapeRenderer} from '../../../utils';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartKitWidgetData {
    const gamesByPlatform = groups(nintendoGames, (d) => d.esrb_rating || 'unknown');
    const data = gamesByPlatform.map(([value, games]) => ({
        name: value,
        value: games.length,
    }));
    const totals = data.reduce((sum, d) => sum + d.value, 0);

    return {
        series: {
            data: [
                {
                    type: 'pie',
                    innerRadius: '50%',
                    data: data,
                    renderCustomShape: CustomShapeRenderer.pieCenterText(`${totals}`),
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

export const pieDonutTotalsData = prepareData();
