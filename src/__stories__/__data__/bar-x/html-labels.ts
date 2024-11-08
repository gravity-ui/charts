import type {ChartData} from '../../../types';

function prepareData(): ChartData {
    const getLabelData = (value: string, color: string) => {
        const labelStyle = `background: ${color};color: #fff;padding: 4px;border-radius: 4px;border: 1px solid #fff;`;
        return {
            label: `<span style="${labelStyle}">${value}</span>`,
            color,
        };
    };

    return {
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'Series 1',
                    dataLabels: {
                        enabled: true,
                        html: true,
                    },
                    data: [
                        {
                            x: 0,
                            y: Math.random() * 1000,
                            ...getLabelData('First', '#4fc4b7'),
                        },
                        {
                            x: 1,
                            y: Math.random() * 1000,
                            ...getLabelData('Last', '#8ccce3'),
                        },
                    ],
                },
            ],
        },
        xAxis: {type: 'category', categories: ['First', 'Second']},
        title: {text: 'Bar-x with html labels'},
    };
}

export const barXHtmlLabelsData = prepareData();
