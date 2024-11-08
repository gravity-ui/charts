import type {ChartData, LineSeries} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartData {
    const dataset = nintendoGames.filter(
        (d) => d.date && d.user_score && new Date(d.date) > new Date(2022, 0, 1),
    );
    const data = dataset.map((d) => ({
        x: d.date || undefined,
        y: d.user_score || undefined,
        custom: d,
    }));
    const series = [{data, name: 'Nintendo games'}];

    return {
        series: {
            data: series.map<LineSeries>((s) => ({
                type: 'line',
                data: s.data.filter((d) => d.x),
                name: s.name,
                marker: {enabled: true, symbol: 'square'},
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
        },
    };
}

export const lineMarkersData = prepareData();
