import type {ChartData} from '../../../../types';

function prepareData(): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Series',
                    data: Array.from({length: 12}, (_, i) => ({x: i, y: 50 + i * 5})),
                },
            ],
        },
        xAxis: {
            plotBands: [
                {
                    from: 0,
                    to: 4,
                    color: '#4DA2F1',
                    opacity: 0.4,
                    size: 40,
                    label: {text: '40px / start'},
                },
                {
                    from: 4,
                    to: 8,
                    color: '#FF3D64',
                    opacity: 0.4,
                    size: '25%',
                    align: 'end',
                    label: {text: '25% / end'},
                },
                {
                    from: 8,
                    to: 11,
                    color: '#8AD554',
                    opacity: 0.4,
                    size: '50%',
                    label: {text: '50% / start'},
                },
            ],
            title: {text: 'X axis sized plot bands'},
        },
    };
}

export const xAxisSizedPlotBandsData = prepareData();
