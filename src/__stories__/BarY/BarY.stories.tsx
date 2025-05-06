import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {
    barYBasicData,
    barYGroupedColumnsData,
    barYHtmlLabelsData,
    barYPlaygroundData,
    barYPlotLinesData,
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

export const BarYPlotLines = {
    name: 'With X-axis plot lines',
    args: {
        data: barYPlotLinesData,
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
