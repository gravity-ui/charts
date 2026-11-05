import {getContinuesColorFn} from '~core/utils';

import type {ChartData, PieSeriesData} from '../../../types';

function prepareData(): ChartData {
    const colors = ['rgb(255, 61, 100)', 'rgb(255, 198, 54)', 'rgb(84, 165, 32)'];
    const stops = [0, 0.5, 1];

    const data: PieSeriesData[] = [
        {name: 'A', value: 1200000},
        {name: 'B', value: 900000},
        {name: 'C', value: 1310000},
    ];
    const getColor = getContinuesColorFn({
        colors,
        stops,
        values: data.map((d) => d.value ?? 0),
    });
    data.forEach((d) => {
        d.color = getColor(d.value ?? 0);
    });

    return {
        series: {
            data: [
                {
                    type: 'pie',
                    data,
                    dataLabels: {
                        format: {
                            type: 'number',
                            units: {
                                scale: {base: 1000, postfixes: ['', 'K', 'M', 'B', 'T']},
                                delimiter: '',
                            },
                        },
                    },
                },
            ],
        },
        title: {text: 'Pie with continues color'},
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
                units: {scale: [{factor: 1000, postfix: 'K'}], delimiter: ''},
            },
        },
    };
}

export const pieContinuousLegendData = prepareData();
