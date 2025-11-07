import type {Meta, StoryObj} from '@storybook/react-webpack5';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {heatmapBasicData, heatmapPlaygroundData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Heatmap',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `A heatmap is a visual tool that uses colors to represent data values. Unlike bar charts or line graphs, heatmaps can display large amounts of multidimensional data in a compact space, making patterns immediately visible. They are commonly used in web analytics, business analysis, and scientific research.`,
            },
        },
    },
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
