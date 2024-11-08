import type {ChartData, ScatterSeries} from '../../../types';
import nintendoGames from '../nintendoGames';

function prepareData(): ChartData {
    const dataset = nintendoGames.filter((d) => d.date && d.user_score);
    const data = dataset.map((d) => ({
        x: d.date || undefined,
        y: d.user_score || undefined,
        custom: d,
    }));
    const series = [{data, name: 'Nintendo games'}];

    return {
        series: {
            data: series.map<ScatterSeries>((s) => ({
                type: 'scatter',
                data: s.data.filter((d) => d.x),
                name: s.name,
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

export const scatterBasicData = prepareData();
