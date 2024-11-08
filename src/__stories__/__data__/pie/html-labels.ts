import type {ChartData} from '../../../types';

function getPieSegmentData(name: string, color: string) {
    const labelStyle = `background: ${color};color: #fff;padding: 4px;border-radius: 4px;`;
    return {
        name: name,
        value: Math.random() * 10,
        label: `<span style="${labelStyle}">${name}</span>`,
        color: color,
    };
}

function prepareData(): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'pie',
                    dataLabels: {
                        enabled: true,
                        html: true,
                        connectorPadding: 8,
                    },
                    data: [
                        getPieSegmentData('One', '#4fc4b7'),
                        getPieSegmentData('Two', '#59abc9'),
                        getPieSegmentData('Three', '#8ccce3'),
                    ],
                },
            ],
        },
        title: {text: 'Pie with html labels'},
        legend: {enabled: true},
    };
}

export const pieHtmlLabelsData = prepareData();
