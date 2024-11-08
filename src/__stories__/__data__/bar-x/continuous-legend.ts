import {groups} from 'd3';

import type {BarXSeriesData, ChartData} from '../../../types';
import {getContinuesColorFn} from '../../../utils';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartData {
    const colors = ['rgb(255, 61, 100)', 'rgb(255, 198, 54)', 'rgb(84, 165, 32)'];
    const stops = [0, 0.5, 1];

    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
    const categories = gamesByPlatform.map(([platform, _games]) => platform);
    const data: BarXSeriesData[] = gamesByPlatform.map(([platform, games], index) => ({
        x: index,
        y: games.length,
        label: `${platform}(${games.length})`,
    }));
    const getColor = getContinuesColorFn({colors, stops, values: data.map((d) => Number(d.y))});
    data.forEach((d) => {
        d.color = getColor(Number(d.y));
    });

    return {
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'Series 1',
                    data,
                },
            ],
        },
        xAxis: {
            type: 'category',
            categories,
        },
        title: {text: 'Bar-x with continues color'},
        legend: {
            enabled: true,
            type: 'continuous',
            title: {text: 'Games by platform'},
            colorScale: {
                colors: colors,
                stops,
            },
        },
    };
}

export const barXContinuousLegendData = prepareData();
