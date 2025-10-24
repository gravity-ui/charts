import {groups} from 'd3';

import type {BarYSeries, ChartData} from '../../../types';
import nintendoGames from '../nintendoGames';

export function prepareBarYStakingNormalData(): ChartData {
    const grouped = groups(
        nintendoGames,
        (d) => d.platform,
        (d) => (d.date ? new Date(d.date as number).getFullYear() : 'unknown'),
    );
    const categories: string[] = [];
    const series = grouped.map(([platform, years]) => {
        return {
            name: platform,
            data: years.map(([year, list]) => {
                const strYear = String(year);

                if (!categories.includes(strYear)) {
                    categories.push(strYear);
                }

                return {
                    x: list.length,
                    y: strYear,
                };
            }),
        };
    });
    const seriesData = series.map((s) => {
        return {
            type: 'bar-y',
            stacking: 'normal',
            name: s.name,
            data: s.data,
        } as BarYSeries;
    });

    return {
        series: {
            data: seriesData,
        },
        yAxis: [
            {
                type: 'category',
                categories: categories.sort(),
                title: {
                    text: 'Release year',
                },
            },
        ],
    };
}

export const barYStakingNormalData = prepareBarYStakingNormalData();
