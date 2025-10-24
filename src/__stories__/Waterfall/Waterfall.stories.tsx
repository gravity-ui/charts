import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {waterfallBasicData, waterfallPlaygroundData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Waterfall',
    render: ChartStory,
    component: Chart,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const WaterfallBasic = {
    name: 'Basic',
    args: {
        data: waterfallBasicData,
    },
} satisfies Story;

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
