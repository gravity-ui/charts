import type {Meta, StoryObj} from '@storybook/react';

import {ChartStory} from '../ChartStory';
import {boxplotBasicData, boxplotMultipleData} from '../__data__/boxplot';

const meta: Meta<typeof ChartStory> = {
    title: 'Charts/Boxplot',
    component: ChartStory,
    parameters: {
        docs: {
            description: {
                component:
                    'Boxplot chart displays the distribution of data based on a five-number summary: minimum, first quartile (Q1), median, third quartile (Q3), and maximum.',
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const Basic = {
    name: 'Basic',
    args: {
        data: boxplotBasicData,
        wrapperProps: {
            styles: {
                height: 400,
            },
        },
    },
} satisfies Story;

export const MultipleBoxplots = {
    name: 'Multiple Boxplots',
    args: {
        data: boxplotMultipleData,
        wrapperProps: {
            styles: {
                height: 400,
            },
        },
    },
} satisfies Story;
