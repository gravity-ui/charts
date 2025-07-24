import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {
    barXBasicData,
    barXContinuousLegendData,
    barXDatePlotBandsData,
    barXDateTimeData,
    barXGroupedColumnsData,
    barXHtmlLabelsData,
    barXLinearData,
    barXPlaygroundData,
    barXStakingNormalData,
    barXStakingPercentData,
} from '../__data__';
import {barXWithYAxisPlotLinesData} from '../__data__/bar-x/y-axis-plot-lines';

const meta: Meta<typeof Chart> = {
    title: 'Bar-X',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const BarXBasic = {
    name: 'Basic',
    args: {
        data: barXBasicData,
    },
} satisfies Story;

export const BarXLinear = {
    name: 'Linear X axis',
    args: {
        data: barXLinearData,
    },
} satisfies Story;

export const BarXDateTime = {
    name: 'Datetime X axis',
    args: {
        data: barXDateTimeData,
    },
} satisfies Story;

export const BarXGroupedColumns = {
    name: 'Grouped columns',
    args: {
        data: barXGroupedColumnsData,
    },
} satisfies Story;

export const BarXStakingPercent = {
    name: 'Staking percent',
    args: {
        data: barXStakingPercentData,
    },
} satisfies Story;

export const BarXStakingNormal = {
    name: 'Staking normal',
    args: {
        data: barXStakingNormalData,
    },
} satisfies Story;

export const BarXContinuousLegend = {
    name: 'Continuous legend',
    args: {
        data: barXContinuousLegendData,
    },
} satisfies Story;

export const BarXHtmlLabels = {
    name: 'Html in labels',
    args: {
        data: barXHtmlLabelsData,
    },
} satisfies Story;

export const BarXPlotLines = {
    name: 'With Y-axis plot lines',
    args: {
        data: barXWithYAxisPlotLinesData,
    },
} satisfies Story;

export const BarXDateTimePlotBands = {
    name: 'Datetime X Plot Bands',
    args: {
        data: barXDatePlotBandsData,
    },
} satisfies Story;

export const BarXPlayground = {
    name: 'Playground',
    args: {
        data: barXPlaygroundData,
    },
    argTypes: {
        data: {
            control: 'object',
        },
    },
} satisfies Story;
