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
    parameters: {
        docs: {
            description: {
                component: `Radar chart (also known as spider chart or star chart) is a type of data visualization in the form of a diagram with two dimensions, on the radial axes of which one or more groups of values are displayed, for which several variables are used.  
2 sources

Radar chart is often used to compare multiple items by multiple parameters at the same time.`,
            },
        },
    },
} satisfies Story;
