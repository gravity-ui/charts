import type {ChartKitWidgetData, LineSeries, LineSeriesData} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartKitWidgetData {
    const games = nintendoGames.filter((d) => {
        return d.date && d.user_score;
    });
    const byGenre = (genre: string) => {
        return games
            .filter((d) => d.genres.includes(genre))
            .map((d) => {
                return {
                    x: d.date,
                    y: d.user_score,
                    label: `${d.title} (${d.user_score})`,
                    custom: d,
                };
            }) as LineSeriesData[];
    };
    const series = [
        {
            name: 'Strategy',
            type: 'line',
            data: byGenre('Strategy'),
            dataLabels: {
                enabled: true,
            },
        },
        {
            name: 'Shooter',
            type: 'line',
            data: byGenre('Shooter'),
            dataLabels: {
                enabled: true,
            },
        },
    ];
    return {
        series: {
            data: series.map<LineSeries>((s) => ({
                type: 'line',
                data: s.data.filter((d) => d.x),
                name: s.name,
                dataLabels: {
                    enabled: true,
                },
            })),
        },
        yAxis: [
            {
                title: {
                    text: 'User score',
                },
            },
        ],
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Release dates',
            },
            ticks: {pixelInterval: 200},
        },
    };
}

export const lineDataLabelsData = prepareData();
