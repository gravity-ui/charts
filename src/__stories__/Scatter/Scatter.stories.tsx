import type {Meta, StoryObj} from '@storybook/react-webpack5';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {scatterBasicData, scatterPlaygroundData} from '../__data__';
import {scatterContinuousLegendData} from '../__data__/scatter/continuous-legend';

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

export const ScatterContinuousLegend = {
    name: 'Continuous legend',
    args: {
        data: scatterContinuousLegendData,
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
