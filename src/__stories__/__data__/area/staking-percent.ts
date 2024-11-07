import {groups} from 'd3';

import type {AreaSeries, AreaSeriesData, ChartKitWidgetData} from '../../../types';
import nintendoGames from '../nintendoGames';

const years = Array.from(
    new Set(
        nintendoGames.map((d) =>
            d.date ? String(new Date(d.date as number).getFullYear()) : 'unknown',
        ),
    ),
).sort();

function prepareData(): ChartKitWidgetData {
    const grouped = groups(
        nintendoGames,
        (d) => d.platform,
        (d) => (d.date ? String(new Date(d.date as number).getFullYear()) : 'unknown'),
    );
    const series = grouped.map(([platform, gamesByYear]) => {
        const platformGames = Object.fromEntries(gamesByYear) || {};
        return {
            name: platform,
            data: years.reduce<AreaSeriesData[]>((acc, year) => {
                if (year in platformGames) {
                    acc.push({
                        x: year,
                        y: platformGames[year].length,
                    });
                }

                return acc;
            }, []),
        };
    });
    const seriesData = series.map((s) => {
        return {
            type: 'area',
            stacking: 'percent',
            name: s.name,
            data: s.data,
        } as AreaSeries;
    });

    return {
        series: {
            data: seriesData,
        },
        xAxis: {
            type: 'category',
            categories: years,
        },
    };
}

export const areaStakingPercentData = prepareData();
