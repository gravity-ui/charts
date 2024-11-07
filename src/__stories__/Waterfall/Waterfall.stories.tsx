import type {Meta, StoryObj} from '@storybook/react';

import {ChartStory} from '../ChartStory';
import {waterfallPlaygroundData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Waterfall',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const WaterfallPlayground = {
    name: 'Playground',
    args: {
        data: waterfallPlaygroundData,
    },
    argTypes: {
        data: {
            control: 'object',
        },
    },
} satisfies Story;
