import type {ChartData, ScatterSeries} from '../../../types';

function prepareData(): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'scatter',
                    name: 'Series 1',
                    data: [
                        {x: 1, y: 10, label: 'A (10)'},
                        {x: 2, y: 40, label: 'B (40)'},
                        {x: 3, y: 25, label: 'C (25)'},
                        {x: 4, y: 60, label: 'D (60)'},
                        {x: 5, y: 15, label: 'E (15)'},
                    ],
                    dataLabels: {
                        enabled: true,
                    },
                },
                {
                    type: 'scatter',
                    name: 'Series 2',
                    data: [
                        {x: 1, y: 50, label: 'F (50)'},
                        {x: 2, y: 20, label: 'G (20)'},
                        {x: 3, y: 70, label: 'H (70)'},
                        {x: 4, y: 35, label: 'I (35)'},
                        {x: 5, y: 55, label: 'J (55)'},
                    ],
                    dataLabels: {
                        enabled: true,
                    },
                },
            ] as ScatterSeries[],
        },
    };
}

export const scatterDataLabelsData = prepareData();
