import type {ChartData} from '../../../types';

/**
 * Reproduces an invalid label placement where a connector crosses the pie
 * after resolving an overlap at the same iteration as the angle becomes invalid.
 */
export const pieIntersectingConnectorData: ChartData = {
    legend: {
        enabled: false,
    },
    series: {
        data: [
            {
                type: 'pie',
                borderWidth: 0,
                dataLabels: {
                    html: true,
                    connectorShape: 'straight-line',
                },
                data: [
                    {
                        name: 'Small 0',
                        value: 1,
                        label: '<div style="box-sizing: border-box; width: 28px; height: 52px; border: 1px solid currentColor">X00</div>',
                    },
                    {
                        name: 'Small 1',
                        value: 1,
                        label: '<div style="box-sizing: border-box; width: 28px; height: 52px; border: 1px solid currentColor">X01</div>',
                    },
                    {
                        name: 'Small 2',
                        value: 1,
                        label: '<div style="box-sizing: border-box; width: 28px; height: 52px; border: 1px solid currentColor">X02</div>',
                    },
                    {
                        name: 'Small 3',
                        value: 1,
                        label: '<div style="box-sizing: border-box; width: 28px; height: 52px; border: 1px solid currentColor">X03</div>',
                        color: '#D50000',
                    },
                    {
                        name: 'Remainder',
                        value: 356,
                        label: '<div style="box-sizing: border-box; width: 28px; height: 52px; border: 1px solid currentColor">X99</div>',
                    },
                ],
            },
        ],
    },
};
