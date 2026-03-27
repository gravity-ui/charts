import {DAY} from '~core/constants';
import {getContinuesColorFn} from '~core/utils';

import type {ChartData, XRangeSeriesData} from '../../../types';

function prepareData(): ChartData {
    const colors = ['#00cc88', '#ffcc00', '#ff4400'];
    const stops = [0, 0.5, 1];

    const tasks: XRangeSeriesData[] = [
        {
            x0: Date.UTC(2024, 0, 1),
            x1: Date.UTC(2024, 0, 15),
            y: 0,
            label: 'Discovery',
        },
        {
            x0: Date.UTC(2024, 2, 1),
            x1: Date.UTC(2024, 2, 20),
            y: 0,
            label: 'UI Polish',
        },
        {
            x0: Date.UTC(2024, 0, 10),
            x1: Date.UTC(2024, 1, 10),
            y: 1,
            label: 'Prototype',
        },
        {
            x0: Date.UTC(2024, 0, 25),
            x1: Date.UTC(2024, 2, 10),
            y: 1,
            label: 'Components',
        },
        {
            x0: Date.UTC(2024, 2, 15),
            x1: Date.UTC(2024, 3, 1),
            y: 1,
            label: 'Integration',
        },
        {
            x0: Date.UTC(2024, 0, 5),
            x1: Date.UTC(2024, 1, 1),
            y: 2,
            label: 'API Design',
        },
        {
            x0: Date.UTC(2024, 1, 15),
            x1: Date.UTC(2024, 3, 1),
            y: 2,
            label: 'Implementation',
        },
    ];

    const durations = tasks.map((t) => (Number(t.x1) - Number(t.x0)) / DAY);
    const getColor = getContinuesColorFn({colors, stops, values: durations});

    tasks.forEach((t) => {
        t.color = getColor((Number(t.x1) - Number(t.x0)) / DAY);
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
                categories: ['SpongeBob', 'Patrick', 'Squidward'],
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
                domain: [Math.min(...durations), Math.max(...durations)],
            },
        },
    };
}

export const xRangeContinuousLegendData = prepareData();
