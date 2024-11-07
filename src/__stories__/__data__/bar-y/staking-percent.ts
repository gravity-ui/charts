import {groups} from 'd3';

import type {BarYSeries, ChartKitWidgetData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartKitWidgetData {
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
                categories.push(String(year));

                return {
                    y: String(year),
                    x: list.length,
                };
            }),
        };
    });
    const seriesData = series.map((s) => {
        return {
            type: 'bar-y',
            stacking: 'percent',
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

export const barYStakingPercentData = prepareData();
