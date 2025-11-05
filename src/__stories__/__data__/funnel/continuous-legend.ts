import type {ChartData, FunnelSeriesData} from '../../../types';
import {getContinuesColorFn, getFormattedValue} from '../../../utils';

function prepareData(): ChartData {
    const colors = ['rgb(255, 61, 100)', 'rgb(255, 198, 54)', 'rgb(84, 165, 32)'];
    const stops = [0, 0.5, 1];

    const data: FunnelSeriesData[] = [
        {value: 1200, name: 'Visit'},
        {value: 900, name: 'Sign-up'},
        {value: 505, name: 'Selection'},
        {value: 240, name: 'Purchase'},
        {value: 150, name: 'Review'},
    ];
    const maxValue = Math.max(...data.map((d) => d.value));
    const getColor = getContinuesColorFn({
        colors,
        stops,
        values: data.map((d) => d.value ?? 0),
    });
    data.forEach((d) => {
        d.color = getColor(d.value ?? 0);
        const percentage = getFormattedValue({
            value: d.value / maxValue,
            format: {type: 'number', format: 'percent', precision: 0},
        });
        const absolute = getFormattedValue({value: d.value, format: {type: 'number'}});
        d.label = `${d.name}: ${percentage} (${absolute})`;
    });

    const chartData: ChartData = {
        series: {
            data: [
                {
                    type: 'funnel',
                    name: 'Series 1',
                    data,
                    dataLabels: {
                        align: 'left',
                    },
                },
            ],
        },
        legend: {
            enabled: true,
            type: 'continuous',
            title: {text: 'Funnel steps'},
            colorScale: {
                colors: colors,
                stops,
            },
        },
    };

    return chartData;
}

export const funnelContinuousLegendData = prepareData();
