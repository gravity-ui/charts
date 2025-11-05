import type {Meta, StoryObj} from '@storybook/react-webpack5';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {funnelBasicData, funnelContinuousLegendData} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Funnel',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `A funnel chart is a data visualization that displays values as progressively decreasing proportions through stages, typically shown as a tapering cone or pyramid. It's primarily used to track conversion rates and identify drop-off points in sequential processes like sales pipelines or website user journeys. Unlike bar or pie charts that show static comparisons, funnel charts specifically emphasize the flow and attrition between consecutive stages of a process.`,
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const FunnelBasic = {
    name: 'Basic',
    args: {
        data: funnelBasicData,
    },
} satisfies Story;

export const FunnelWithContinuousLegend = {
    name: 'Continuous legend',
    args: {
        data: funnelContinuousLegendData,
    },
} satisfies Story;
