import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {
    barXAnnotationsData,
    barXBasicData,
    barXContinuousLegendData,
    barXDateTimeData,
    barXGroupedColumnsData,
    barXHtmlLabelsData,
    barXLinearData,
    barXPlaygroundData,
    barXStakingNormalData,
    barXStakingPercentData,
} from '../__data__';
import {barXSplitData} from '../__data__/bar-x/split';

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

export const BarXStakingNormalLogAxis = {
    name: 'Logarithmic Y-axis',
    args: {
        data: {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 10},
                            {x: 1, y: 100},
                            {x: 2, y: 1000},
                        ],
                    },
                    {
                        name: 'Series 2',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 5},
                            {x: 1, y: 50},
                            {x: 2, y: 500},
                        ],
                    },
                    {
                        name: 'Series 3',
                        type: 'bar-x',
                        stacking: 'normal',
                        data: [
                            {x: 0, y: 2},
                            {x: 1, y: 20},
                            {x: 2, y: 200},
                        ],
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['A', 'B', 'C'],
            },
            yAxis: [
                {
                    type: 'logarithmic',
                    startOnTick: true,
                    endOnTick: true,
                },
            ],
        },
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

export const BarXSplit = {
    name: 'Split',
    args: {
        data: barXSplitData,
        style: {height: 560},
    },
} satisfies Story;

export const BarXAnnotations = {
    name: 'Annotations',
    args: {
        data: barXAnnotationsData,
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
