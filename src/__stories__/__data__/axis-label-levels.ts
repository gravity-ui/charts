import type {ChartData} from '../../types';

export const groupedWaterfallData: ChartData = {
    legend: {enabled: false},
    xAxis: {
        type: 'category',
        categories: [
            'Opening',
            'Sales',
            'Payroll',
            'Jan close',
            'Refunds',
            'Tax',
            'Feb close',
            'Closing',
        ],
        labels: {
            autoRotation: false,
            additionalLevels: [
                {
                    format: {type: 'date', format: 'MMMM'},
                    ranges: [
                        {from: 1, to: 3, value: Date.UTC(2026, 0, 1)},
                        {from: 4, to: 6, value: Date.UTC(2026, 1, 1)},
                    ],
                },
                {ranges: [{from: 1, to: 6, value: 2026}]},
                {ranges: [{from: 1, to: 6, value: 'Operating cash flow'}]},
            ],
        },
        title: {text: 'Cash flow steps'},
    },
    series: {
        data: [
            {
                type: 'waterfall',
                name: 'Cash flow',
                data: [
                    {x: 0, y: 60},
                    {x: 1, y: 35},
                    {x: 2, y: -20},
                    {x: 3, total: true},
                    {x: 4, y: -40},
                    {x: 5, y: -35},
                    {x: 6, total: true},
                    {x: 7, total: true},
                ],
            },
        ],
    },
};

export const temporalLabelLevelsData: ChartData = {
    legend: {enabled: false},
    xAxis: {
        type: 'datetime',
        min: Date.UTC(2026, 0, 1),
        max: Date.UTC(2026, 2, 1),
        startOnTick: false,
        endOnTick: false,
        maxPadding: 0,
        labels: {
            dateFormat: 'DD',
            additionalLevels: [
                {
                    format: {type: 'date', format: 'MMMM'},
                    ranges: [0, 1].map((month) => ({
                        from: Date.UTC(2026, month, 1),
                        to: Date.UTC(2026, month + 1, 1),
                        value: Date.UTC(2026, month, 1),
                    })),
                },
                {ranges: [{from: Date.UTC(2026, 0, 1), to: Date.UTC(2027, 0, 1), value: 2026}]},
            ],
        },
        title: {text: 'Date'},
    },
    series: {
        data: [
            {
                type: 'line',
                name: 'Orders',
                data: [12, 16, 11, 20, 18, 24, 28, 23, 31].map((y, index) => ({
                    x: Date.UTC(2026, 0, 1 + index * 7),
                    y,
                })),
            },
        ],
    },
};
