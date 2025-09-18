import type {ChartData, ScatterSeriesData} from '../../../types';
import {getContinuesColorFn} from '../../../utils';

function prepareData(): ChartData {
    const colors = ['rgb(255, 61, 100)', 'rgb(255, 198, 54)', 'rgb(84, 165, 32)'];
    const stops = [0, 0.5, 1];

    const data: ScatterSeriesData[] = [
        {x: 10, y: 1200000},
        {x: 15, y: 900000},
        {x: 20, y: 1310000},
    ];
    const getColor = getContinuesColorFn({colors, stops, values: data.map((d) => Number(d.y))});
    data.forEach((d) => {
        d.color = getColor(Number(d.y));
    });

    return {
        series: {
            data: [
                {
                    type: 'scatter',
                    name: 'Series 1',
                    data,
                    dataLabels: {
                        format: {type: 'number', unit: 'auto'},
                    },
                },
            ],
        },
        title: {text: 'Scatter with continues color'},
        legend: {
            enabled: true,
            type: 'continuous',
            title: {text: 'Legend for continues color'},
            colorScale: {
                colors: colors,
                stops,
            },
        },
        tooltip: {
            valueFormat: {
                type: 'number',
                unit: 'k',
            },
        },
    };
}

export const scatterContinuousLegendData = prepareData();
