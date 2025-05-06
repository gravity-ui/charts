import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {radarBasicData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Radar',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `A radar chart (also known as spider chart or star chart) is a graphical method of displaying multivariate data in the form of a two-dimensional chart of three or more quantitative variables represented on axes starting from the same point.`,
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const RadarBasic = {
    name: 'Basic',
    args: {
        data: radarBasicData,
    },
} satisfies Story;
