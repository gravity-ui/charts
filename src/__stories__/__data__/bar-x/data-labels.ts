import {groups, sort} from 'd3';

import type {BarXSeries, BarXSeriesData, ChartKitWidgetData, MeaningfulAny} from '../../../types';
import nintendoGames from '../nintendoGames';

const years = Array.from(
    new Set(
        nintendoGames.map((g) =>
            g.date ? new Date(g.date as number).getFullYear().toString() : 'unknown',
        ),
    ),
);

function prepareData(): ChartKitWidgetData {
    const games = sort(
        nintendoGames.filter((d) => {
            return d.date && d.user_score;
        }),
        (d) => d.date,
    );

    const groupByYear = (d: MeaningfulAny) =>
        d.date ? new Date(d.date as number).getFullYear() : 'unknown';

    const byGenre = (genre: string): BarXSeries => {
        const data = groups(
            games.filter((d) => d.genres.includes(genre)),
            groupByYear,
        ).map<BarXSeriesData>(([year, items]) => {
            return {
                x: years.indexOf(String(year)),
                y: items.length,
            };
        });

        return {
            type: 'bar-x',
            name: genre,
            dataLabels: {
                enabled: true,
            },
            stacking: 'normal',
            data,
        };
    };

    const series = [byGenre('Strategy'), byGenre('Shooter'), byGenre('Puzzle'), byGenre('Action')];

    return {
        series: {
            data: series,
        },
        xAxis: {
            categories: years,
            type: 'category',
            title: {
                text: 'Release year',
            },
            ticks: {pixelInterval: 200},
        },
    };
}

export const barXDataLabelsData = prepareData();
