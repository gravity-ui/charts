import type {Meta, StoryObj} from '@storybook/react';

import {ChartStory} from '../ChartStory';
import {sankeyPlaygroundData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Sankey',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const WaterfallPlayground = {
    name: 'Playground',
    args: {
        data: sankeyPlaygroundData,
    },
    argTypes: {
        data: {
            control: 'object',
        },
    },
} satisfies Story;
