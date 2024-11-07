import type {ChartKitWidgetData} from '../../../types';

function getLabelData(value: string, color: string) {
    const labelStyle = `background: ${color};color: #fff;padding: 4px;border-radius: 4px;border: 1px solid #fff;`;
    return {
        label: `<span style="${labelStyle}">${value}</span>`,
        color,
    };
}

function prepareData(): ChartKitWidgetData {
    return {
        series: {
            data: [
                {
                    type: 'bar-y',
                    name: 'Series 1',
                    dataLabels: {
                        enabled: true,
                        html: true,
                    },
                    data: [
                        {
                            y: 0,
                            x: Math.random() * 1000,
                            ...getLabelData('First', '#4fc4b7'),
                        },
                        {
                            y: 1,
                            x: Math.random() * 1000,
                            ...getLabelData('Last', '#8ccce3'),
                        },
                    ],
                },
            ],
        },
        yAxis: [{type: 'category', categories: ['First', 'Second']}],
        title: {text: 'Bar-y with html labels'},
    };
}

export const barYHtmlLabelsData = prepareData();
