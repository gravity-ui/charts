import type {ChartData, LineSeries} from '../../../types';
import {lineBasicData} from '../line/basic';

function prepareData(): ChartData {
    const baseSeries = lineBasicData.series.data[0] as LineSeries;
    const seriesNames = [
        'Series 1',
        'Very looooooooooooooooooooooooooooooooooooooooong series name',
    ];

    const series: LineSeries[] = Array.from({length: 20}, (_, i) => ({
        ...baseSeries,
        name: seriesNames[i % seriesNames.length],
        data: baseSeries.data.slice(0, 20).map((point) => ({
            ...point,
            y: typeof point.y === 'number' ? point.y + Math.random() * 10 - 5 : point.y,
        })),
    }));

    return {
        series: {
            data: series,
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

export const legendPositionData = prepareData();
