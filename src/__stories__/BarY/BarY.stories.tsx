import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {
    barYBasicData,
    barYContinuousLegendData,
    barYDatetimeYData,
    barYGroupedColumnsData,
    barYHtmlLabelsData,
    barYPlaygroundData,
    barYStakingNormalData,
    barYStakingPercentData,
} from '../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Bar-Y',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const BarYBasic = {
    name: 'Basic',
    args: {
        data: barYBasicData,
    },
} satisfies Story;

export const BarYGroupedColumns = {
    name: 'Grouped columns',
    args: {
        data: barYGroupedColumnsData,
    },
} satisfies Story;

export const BarYStakingPercent = {
    name: 'Staking percent',
    args: {
        data: barYStakingPercentData,
    },
} satisfies Story;

export const BarYStakingNormal = {
    name: 'Staking normal',
    args: {
        data: barYStakingNormalData,
    },
} satisfies Story;

export const BarYHtmlLabels = {
    name: 'Html in labels',
    args: {
        data: barYHtmlLabelsData,
    },
} satisfies Story;

export const BarYContinuousLegend = {
    name: 'Continuous legend',
    args: {
        data: barYContinuousLegendData,
    },
} satisfies Story;

export const BarYPlayground = {
    name: 'Playground',
    args: {
        data: barYPlaygroundData,
    },
    argTypes: {
        data: {
            control: 'object',
        },
    },
} satisfies Story;

export const BarYDatetimeY = {
    name: 'Datetime Y',
    args: {
        data: barYDatetimeYData,
    },
} satisfies Story;
