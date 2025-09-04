import {groups} from 'd3';

import type {BarYSeries, ChartData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartData {
    const displayedYears = [2015, 2016, 2017, 2018, 2019];
    const games = nintendoGames.filter((ng) =>
        displayedYears.includes(new Date(ng.date as number).getFullYear()),
    );
    const grouped = groups(
        games,
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
                    y: strYear,
                    x: list.length,
                };
            }),
        };
    });
    const seriesData = series.map((s) => {
        return {
            type: 'bar-y',
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

export const barYGroupedColumnsData = prepareData();
