import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {radarBasicData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Radar',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const RadarBasic = {
    name: 'Basic',
    args: {
        data: radarBasicData,
    },
} satisfies Story;
