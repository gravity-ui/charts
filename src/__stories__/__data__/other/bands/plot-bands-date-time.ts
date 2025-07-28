import type {ChartData, LineSeries, LineSeriesData} from '../../../../types';
import nintendoGames from '../../nintendoGames';

function prepareData(): ChartData {
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
            plotBands: [
                {
                    from: 978307200000,
                    to: 1278307200000,
                    color: '#0fd17a',
                    opacity: 0.5,
                    layerPlacement: 'after',
                },
            ],
            type: 'datetime',
            title: {
                text: 'Release dates',
            },
            ticks: {pixelInterval: 200},
        },
    };
}
export const barXDatePlotBandsData = prepareData();
