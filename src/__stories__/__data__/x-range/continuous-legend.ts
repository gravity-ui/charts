import {getContinuesColorFn} from '~core/utils';

import type {ChartData, XRangeSeriesData} from '../../../types';

function prepareData(): ChartData {
    const colors = ['#00cc88', '#ffcc00', '#ff4400'];
    const stops = [0, 0.5, 1];

    const tasks: (XRangeSeriesData & {duration: number})[] = [
        {
            x0: Date.UTC(2024, 0, 1),
            x1: Date.UTC(2024, 0, 15),
            y: 0,
            label: 'Discovery',
            duration: 14,
        },
        {
            x0: Date.UTC(2024, 2, 1),
            x1: Date.UTC(2024, 2, 20),
            y: 0,
            label: 'UI Polish',
            duration: 19,
        },
        {
            x0: Date.UTC(2024, 0, 10),
            x1: Date.UTC(2024, 1, 10),
            y: 1,
            label: 'Prototype',
            duration: 31,
        },
        {
            x0: Date.UTC(2024, 0, 25),
            x1: Date.UTC(2024, 2, 10),
            y: 1,
            label: 'Components',
            duration: 45,
        },
        {
            x0: Date.UTC(2024, 2, 15),
            x1: Date.UTC(2024, 3, 1),
            y: 1,
            label: 'Integration',
            duration: 17,
        },
        {
            x0: Date.UTC(2024, 0, 5),
            x1: Date.UTC(2024, 1, 1),
            y: 2,
            label: 'API Design',
            duration: 27,
        },
        {
            x0: Date.UTC(2024, 1, 15),
            x1: Date.UTC(2024, 3, 1),
            y: 2,
            label: 'Implementation',
            duration: 46,
        },
    ];

    const durations = tasks.map((t) => t.duration);
    const getColor = getContinuesColorFn({colors, stops, values: durations});

    tasks.forEach((t) => {
        t.color = getColor(t.duration);
    });

    return {
        series: {
            data: [
                {
                    type: 'x-range',
                    name: 'Design',
                    dataLabels: {enabled: true},
                    data: tasks.filter((t) => t.y === 0),
                },
                {
                    type: 'x-range',
                    name: 'Frontend',
                    dataLabels: {enabled: true},
                    data: tasks.filter((t) => t.y === 1),
                },
                {
                    type: 'x-range',
                    name: 'Backend',
                    dataLabels: {enabled: true},
                    data: tasks.filter((t) => t.y === 2),
                },
            ],
        },
        xAxis: {
            type: 'datetime',
            title: {text: 'Timeline'},
            maxPadding: 0,
        },
        yAxis: [
            {
                type: 'category',
                categories: ['Design', 'Frontend', 'Backend'],
                title: {text: 'Team'},
            },
        ],
        legend: {
            enabled: true,
            type: 'continuous',
            title: {text: 'Duration (days)'},
            colorScale: {
                colors,
                stops,
                domain: [14, 20, 30, 40, 46],
            },
        },
    };
}

export const xRangeContinuousLegendData = prepareData();
