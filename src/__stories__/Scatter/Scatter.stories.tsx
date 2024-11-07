import type {Meta, StoryObj} from '@storybook/react';

import {ChartStory} from '../ChartStory';
import {scatterBasicData, scatterPlaygroundData, scatterTimestampData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Scatter',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const ScatterBasic = {
    name: 'Basic',
    args: {
        data: scatterBasicData,
    },
} satisfies Story;

export const ScatterTimestamp = {
    name: 'Timestamp',
    args: {
        data: scatterTimestampData,
    },
} satisfies Story;

export const ScatterPlayground = {
    name: 'Playground',
    args: {
        data: scatterPlaygroundData,
    },
    argTypes: {
        data: {
            control: 'object',
        },
    },
} satisfies Story;
