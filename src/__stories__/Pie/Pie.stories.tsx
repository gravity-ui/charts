import type {Meta, StoryObj} from '@storybook/react';

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

const meta: Meta<typeof ChartStory> = {
    title: 'Pie',
    component: ChartStory,
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
