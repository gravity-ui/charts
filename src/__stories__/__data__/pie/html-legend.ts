import type {ChartData} from '../../../types';

const DATA: number[] = [12, 14, 30, 20, 12, 40, 12, 18, 28, 14, 20, 40, 16, 12];

function getDataItem(value: number, i: number) {
    const style = `height: ${value}px; background-color: #4fc4b7; border-radius: 4px; color: #fff; padding: 4px; display: flex; align-items: center;`;
    const html = `<div style="${style}">Label ${i + 1}</div>`;
    return {
        name: html,
        value,
    };
}

function prepareData(): ChartData {
    return {
        legend: {
            enabled: true,
            html: true,
        },
        series: {
            data: [
                {
                    type: 'pie',
                    dataLabels: {enabled: false},
                    data: DATA.map(getDataItem),
                },
            ],
        },
    };
}

export const pieHtmlLegendData = prepareData();
