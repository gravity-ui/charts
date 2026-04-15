import type {ChartData} from '../../../../types';

function prepareData(): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Series',
                    data: Array.from({length: 12}, (_, i) => ({x: i, y: 30 + i * 7})),
                },
            ],
        },
        yAxis: [
            {
                plotBands: [
                    {
                        from: 30,
                        to: 60,
                        color: '#4DA2F1',
                        opacity: 0.4,
                        size: 60,
                        label: {text: '60px / start (left)'},
                    },
                    {
                        from: 60,
                        to: 90,
                        color: '#FF3D64',
                        opacity: 0.4,
                        size: '30%',
                        align: 'end',
                        label: {text: '30% / end (right)'},
                    },
                ],
                title: {text: 'Y axis sized plot bands'},
            },
        ],
    };
}

export const yAxisSizedPlotBandsData = prepareData();
