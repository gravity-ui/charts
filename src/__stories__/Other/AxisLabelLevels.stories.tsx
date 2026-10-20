import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {groupedWaterfallData, temporalLabelLevelsData} from '../__data__/axis-label-levels';

const meta: Meta<typeof Chart> = {
    title: 'Other/Axis label levels',
    render: ChartStory,
    component: Chart,
};

export default meta;
type Story = StoryObj<typeof ChartStory>;

export const Waterfall: Story = {args: {data: groupedWaterfallData, style: {height: 400}}};
export const Datetime: Story = {args: {data: temporalLabelLevelsData, style: {height: 360}}};
export const Vertical: Story = {
    args: {
        data: {
            legend: {enabled: false},
            yAxis: [
                {
                    type: 'category',
                    categories: ['Web', 'Stores', 'Partners', 'Direct', 'Wholesale'],
                    labels: {
                        additionalLevels: [
                            {
                                ranges: [
                                    {from: 0, to: 2, value: 'North'},
                                    {from: 3, to: 4, value: 'South'},
                                ],
                            },
                            {ranges: [{from: 0, to: 4, value: 2026}]},
                        ],
                    },
                    title: {text: 'Channel'},
                },
            ],
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Sales',
                        data: [40, 60, 35, 75, 55].map((x, y) => ({x, y})),
                    },
                ],
            },
        },
        style: {height: 400},
    },
};
