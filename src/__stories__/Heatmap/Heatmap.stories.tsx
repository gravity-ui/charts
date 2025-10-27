import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {heatmapBasicData, heatmapPlaygroundData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Heatmap',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const HeatmapBasic = {
    name: 'Basic',
    args: {
        data: heatmapBasicData,
    },
} satisfies Story;

export const HeatmapPlayground = {
    name: 'Playground',
    args: {
        data: heatmapPlaygroundData,
    },
} satisfies Story;
