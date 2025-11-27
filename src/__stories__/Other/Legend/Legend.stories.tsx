import type {Meta, StoryObj} from '@storybook/react-webpack5';

import {ChartStory} from '../../ChartStory';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Legend',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const SharedLegend = {
    name: 'Shared legend',
    args: {
        data: {
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Series 1.1',
                        data: [{x: 1.1, y: 1.1}],
                        legend: {groupId: 's1', itemText: 'Series 1'},
                    },
                    {
                        type: 'scatter',
                        name: 'Series 1.2',
                        data: [{x: 1.2, y: 1.2}],
                        legend: {groupId: 's1'},
                    },
                    {type: 'scatter', name: 'Series 2.1', data: [{x: 2.1, y: 2.1}]},
                    {type: 'scatter', name: 'Series 2.2', data: [{x: 2.2, y: 2.2}]},
                ],
            },
        },
    },
} satisfies Story;
