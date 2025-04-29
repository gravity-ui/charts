import {groups, median} from 'd3';

import type {ChartData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartData {
    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
    const platforms: string[] = [];
    const data: {value: number}[] = [];
    gamesByPlatform.forEach(([platform, games]) => {
        platforms.push(platform);
        const medianUserScore =
            median(
                games.filter((g) => g.user_score),
                (g) => g.user_score,
            ) ?? 0;
        data.push({value: medianUserScore});
    });

    return {
        series: {
            data: [
                {
                    type: 'radar',
                    data: data,
                    categories: platforms,
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

export const radarBasicData = prepareData();
