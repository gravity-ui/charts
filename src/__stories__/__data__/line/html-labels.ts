import type {ChartKitWidgetData} from '../../../types';
function getLabelData(value: string, color: string) {
    const labelStyle = `background: ${color};color: #fff;padding: 4px;border-radius: 4px;`;
    return {
        label: `<span style="${labelStyle}">${value}</span>`,
    };
}

function prepareData(): ChartKitWidgetData {
    return {
        series: {
            data: [
                {
                    type: 'line',
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
        title: {text: 'Line with html labels'},
    };
}

export const lineHtmlLabelsData = prepareData();
