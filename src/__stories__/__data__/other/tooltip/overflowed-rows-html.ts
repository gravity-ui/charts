import type {ChartData} from '../../../../types';

const htmlLabels = [
    '<b>Bold label</b>',
    '<i>Italic label</i>',
    '<span style="font-size:16px">Large text</span>',
    '<span style="color:red">Colored</span>',
    '<b>Multi<br/>line</b>',
    '<span style="font-size:10px">Small text</span>',
    '<b style="font-size:18px">Big bold</b>',
    '<i style="font-size:14px">Medium italic</i>',
];

function prepareData(): ChartData {
    return {
        legend: {
            enabled: false,
        },
        series: {
            data: new Array(50).fill(null).map((_, index) => {
                const label = htmlLabels[index % htmlLabels.length];
                return {
                    name: `${label} #${index + 1}`,
                    type: 'bar-y',
                    stacking: 'normal',
                    data: [
                        {
                            y: 0,
                            x: 1 * (index + 1),
                        },
                    ],
                };
            }),
        },
        tooltip: {
            pin: {
                enabled: true,
            },
        },
        yAxis: [
            {
                type: 'category',
                categories: ['Category'],
            },
        ],
    };
}

export const tooltipOverflowedRowsHtmlData = prepareData();
