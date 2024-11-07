import type {Meta, StoryObj} from '@storybook/react';

import {ChartStory} from '../ChartStory';
import {lineBasicData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Line',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const LineBasic = {
    name: 'Basic',
    args: {
        data: lineBasicData,
    },
} satisfies Story;
