import {groups} from 'd3';

import type {BarXSeries, ChartKitWidgetData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartKitWidgetData {
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
                categories.push(String(year));

                return {
                    x: String(year),
                    y: list.length,
                };
            }),
        };
    });
    const seriesData = series.map((s) => {
        return {
            type: 'bar-x',
            name: s.name,
            data: s.data,
        } as BarXSeries;
    });

    return {
        series: {
            data: seriesData,
        },
        xAxis: {
            type: 'category',
            categories: categories.sort(),
            title: {
                text: 'Release year',
            },
        },
    };
}

export const barXGroupedColumnsData = prepareData();
