import type {ChartData, LineSeries} from '../../../types';

function prepareData(): ChartData {
    const rising = [60, 64, 68, 72, 76, 80, 84, 88, 92, 96];
    const falling = [96, 92, 88, 84, 80, 76, 72, 68, 64, 60];
    const wave = [120, 128, 116, 130, 114, 132, 118, 128, 122, 126];

    const makeSeries = (name: string, values: number[]): LineSeries => ({
        type: 'line',
        name,
        data: values.map((y, x) => ({x, y})),
        dataLabels: {
            enabled: true,
            placement: 'auto',
        },
    });

    return {
        series: {
            data: [
                makeSeries('Rising', rising),
                makeSeries('Falling', falling),
                makeSeries('Wave', wave),
            ],
        },
        yAxis: [{min: 40, max: 160}],
        title: {text: 'Auto placement of data labels'},
    };
}

export const lineDataLabelsPlacementData = prepareData();
