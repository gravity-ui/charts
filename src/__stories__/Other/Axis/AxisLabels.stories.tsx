import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../../components';
import type {ChartData} from '../../../types';
import {ChartStory} from '../../ChartStory';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Axis',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

const data: ChartData = {
    legend: {
        enabled: false,
    },
    series: {
        data: [
            {
                type: 'line',
                name: 'Sales',
                data: [
                    {x: 0, y: 42},
                    {x: 1, y: 78},
                    {x: 2, y: 55},
                    {x: 3, y: 91},
                ],
            },
        ],
    },
    xAxis: {
        type: 'category',
        categories: ['Q1', 'Q2', 'Q3', 'Q4'],
        labels: {
            style: {
                fontSize: '16px',
            },
        },
    },
    yAxis: [
        {
            labels: {
                style: {
                    fontSize: '18px',
                },
            },
        },
    ],
};

export const AxisLabelsFontSize = {
    name: 'Labels: font size',
    args: {data},
} satisfies Story;
