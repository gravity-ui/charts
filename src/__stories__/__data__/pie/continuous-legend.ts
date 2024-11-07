import {groups} from 'd3';

import type {ChartKitWidgetData, PieSeriesData} from '../../../types';
import {getContinuesColorFn} from '../../../utils';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartKitWidgetData {
    const colors = ['rgb(255, 61, 100)', 'rgb(255, 198, 54)', 'rgb(84, 165, 32)'];
    const stops = [0, 0.5, 1];

    const gamesByPlatform = groups(nintendoGames, (item) => item.platform);
    const data: PieSeriesData[] = gamesByPlatform.map(([platform, games]) => ({
        name: platform,
        value: games.length,
        label: `${platform}(${games.length})`,
    }));
    const getColor = getContinuesColorFn({colors, stops, values: data.map((d) => d.value)});
    data.forEach((d) => {
        d.color = getColor(d.value);
    });

    return {
        series: {
            data: [
                {
                    type: 'pie',
                    data,
                },
            ],
        },
        title: {text: 'Pie with continues color'},
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

export const pieContinuousLegendData = prepareData();
