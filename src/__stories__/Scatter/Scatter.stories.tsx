import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {scatterBasicData, scatterPlaygroundData, scatterTimestampData} from '../__data__';

const meta: Meta<typeof Chart> = {
    title: 'Scatter',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
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
