import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {xRangeBasicData, xRangeContinuousLegendData, xRangeCustomizationData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'X-Range',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `An x-range chart displays data as horizontal bars that span a range on the x-axis, defined by a start value (x0) and an end value (x1), with categories on the y-axis. It is commonly used to visualize schedules, timelines, and Gantt-like data where each item occupies a specific interval.`,
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const XRangeBasic = {
    name: 'Basic',
    args: {
        data: xRangeBasicData,
    },
} satisfies Story;

export const XRangeCustomization = {
    name: 'Customization',
    args: {
        data: xRangeCustomizationData,
    },
} satisfies Story;

export const XRangeContinuousLegend = {
    name: 'Continuous legend',
    args: {
        data: xRangeContinuousLegendData,
    },
} satisfies Story;
