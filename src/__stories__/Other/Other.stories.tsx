import type {Meta, StoryObj} from '@storybook/react-webpack5';

import {ChartStory} from '../ChartStory';
import {otherLineAndBarData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const OtherLineAndBar = {
    name: 'Line and Bar',
    args: {
        data: otherLineAndBarData,
    },
} satisfies Story;
