import type {ChartData} from '../../../types';

function getLabelData(value: string, color: string) {
    const labelStyle = `background: ${color};color: #fff;padding: 4px;border-radius: 4px;`;
    return {
        label: `<span style="${labelStyle}">${value}</span>`,
    };
}

function prepareData(): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'area',
                    name: 'Series 1',
                    dataLabels: {
                        enabled: true,
                        html: true,
                    },
                    data: [
                        {
                            x: 1,
                            y: Math.random() * 1000,
                            ...getLabelData('First', '#4fc4b7'),
                        },
                        {
                            x: 100,
                            y: Math.random() * 1000,
                            ...getLabelData('Last', '#8ccce3'),
                        },
                    ],
                },
            ],
        },
        title: {text: 'Area with html labels'},
    };
}

export const areaHtmlLabelsData = prepareData();
