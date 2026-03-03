import {DAY} from '../../../../constants/datetime';
import type {ChartData, LineSeries, LineSeriesData} from '../../../../types';

function prepareData(): ChartData {
    const startDate = Date.UTC(2025, 10, 1);

    const values1 = [
        185, 191, 188, 195, 200, 193, 198, 205, 210, 203, 208, 215, 212, 218, 222, 217, 220, 225,
        219, 223, 228, 232, 226, 230, 235, 238, 233, 237, 240, 236,
    ];
    const lineData: LineSeriesData[] = values1.map((y, i) => ({
        x: startDate + i * DAY,
        y,
    }));

    const values2 = [
        175, 180, 177, 183, 186, 181, 188, 192, 189, 195, 198, 193, 200, 204, 199, 203, 207, 202,
        206, 210, 205, 209, 213, 208, 212, 216, 211, 215, 219, 214,
    ];
    const lineData2: LineSeriesData[] = values2.map((y, i) => ({
        x: startDate + i * DAY,
        y,
    }));

    const series: LineSeries[] = [
        {type: 'line', name: 'Series 1', data: lineData},
        {type: 'line', name: 'Series 2', data: lineData2, color: '#ff4040'},
    ];

    return {
        series: {data: series},
        xAxis: {
            type: 'datetime',
            plotBands: [
                {
                    from: startDate + 3 * DAY,
                    to: startDate + 10 * DAY,
                    color: '#ffbe5c',
                    opacity: 0.3,
                    custom: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
                },
                {
                    from: startDate + 7 * DAY,
                    to: startDate + 18 * DAY,
                    color: '#ffbe5c',
                    opacity: 0.3,
                    custom: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
                },
            ],
            plotLines: [
                {
                    value: startDate + 22 * DAY,
                    color: '#ff4040',
                    width: 2,
                    dashStyle: 'Dash',
                    custom: 'Duis aute irure dolor in reprehenderit',
                },
            ],
        },
        yAxis: [
            {
                title: {text: 'Value'},
                plotLines: [
                    {
                        value: 200,
                        color: '#4040ff',
                        width: 2,
                        custom: 'Excepteur sint occaecat cupidatat',
                    },
                ],
            },
        ],
    };
}

export const hoveredPlotsTooltipData = prepareData();
