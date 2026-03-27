import type {ChartData} from '../../../types';

export const xRangeBasicData: ChartData = {
    series: {
        data: [
            {
                type: 'x-range',
                name: 'Design',
                dataLabels: {enabled: true},
                data: [
                    {x0: Date.UTC(2024, 0, 1), x1: Date.UTC(2024, 0, 15), y: 0, label: 'Discovery'},
                    {x0: Date.UTC(2024, 2, 1), x1: Date.UTC(2024, 2, 20), y: 0, label: 'UI Polish'},
                ],
            },
            {
                type: 'x-range',
                name: 'Frontend',
                opacity: 0.75,
                dataLabels: {enabled: true},
                data: [
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
                ],
            },
            {
                type: 'x-range',
                name: 'Backend',
                dataLabels: {enabled: true},
                data: [
                    {x0: Date.UTC(2024, 0, 5), x1: Date.UTC(2024, 1, 1), y: 2, label: 'API Design'},
                    {
                        x0: Date.UTC(2024, 1, 15),
                        x1: Date.UTC(2024, 3, 1),
                        y: 2,
                        label: 'Implementation',
                    },
                ],
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
};
