import {groups, sort} from 'd3';

import type {ChartData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartData {
    const gamesWithScore = nintendoGames.filter((game) => Math.round(game.user_score ?? 0));
    const gamesByPlatform = groups(gamesWithScore, (item) => item.platform);
    const data = gamesByPlatform.map(([platform, games]) => {
        const links = sort(
            groups(games, (game) => Math.round(game.user_score ?? 0)).map(([score, items]) => ({
                name: String(score),
                value: items.length,
            })),
            (d) => d.name,
        );

        return {
            name: platform,
            links,
        };
    });

    const scores = sort(
        Array.from(new Set(gamesWithScore.map((game) => Math.round(game.user_score ?? 0)))),
        (d) => d,
    ).map((d) => ({name: String(d), links: []}));

    return {
        title: {
            text: 'Average user score by platform',
        },
        tooltip: {enabled: true},
        series: {
            data: [
                {
                    type: 'sankey',
                    data: [...data, ...scores],
                    name: 'Series 1',
                },
            ],
        },
    };
}

export const sankeyPlaygroundData = prepareData();
