import type {Meta, StoryObj} from '@storybook/react';

import {ChartStory} from '../../ChartStory';
import {groupedLegend} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Legend',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const SharedLegend = {
    name: 'Shared legend',
    args: {
        data: groupedLegend,
    },
} satisfies Story;

export const VerticalLayout = {
    name: 'Vertical layout',
    args: {
        data: {
            ...groupedLegend,
            legend: {
                enabled: true,
                position: 'left',
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'top',
            },
        },
    },
} satisfies Story;
