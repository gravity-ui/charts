import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {
    pieBasicData,
    pieContinuousLegendData,
    pieDonutData,
    pieDonutTotalsData,
    pieHtmlLabelsData,
    piePlaygroundData,
    pieUserStylesData,
} from '../__data__';

const meta: Meta<typeof Chart> = {
    title: 'Pie',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: `Pie chart is a circular chart divided into segments, each of which represents a part of the whole (100%). 
                    The size of each segment corresponds to its percentage of the total.`,
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const PieBasic = {
    name: 'Basic',
    args: {
        data: pieBasicData,
    },
} satisfies Story;

export const PieDonut = {
    name: 'Donut',
    args: {
        data: pieDonutData,
    },
} satisfies Story;

export const PieDonutTotals = {
    name: 'Donut with totals',
    args: {
        data: pieDonutTotalsData,
    },
} satisfies Story;

export const PieHtmlLabels = {
    name: 'Html in labels',
    args: {
        data: pieHtmlLabelsData,
    },
} satisfies Story;

export const PieContinuousLegend = {
    name: 'Continuous legend',
    args: {
        data: pieContinuousLegendData,
    },
} satisfies Story;

export const PieUserStyles = {
    name: 'User styles',
    args: {
        data: pieUserStylesData,
    },
} satisfies Story;

export const PiePlayground = {
    name: 'Playground',
    args: {
        data: piePlaygroundData,
    },
    argTypes: {
        data: {
            control: 'object',
        },
    },
} satisfies Story;
