import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import type {ChartData} from '../../types';
import {randomString} from '../../utils';
import {ChartStory} from '../ChartStory';
import {
    pieBasicData,
    pieContinuousLegendData,
    pieDonutData,
    pieDonutTotalsData,
    pieHtmlLabelsData,
    pieHtmlLegendData,
    piePlaygroundData,
    pieUserStylesData,
} from '../__data__';

const meta: Meta<typeof Chart> = {
    title: 'Pie',
    render: ChartStory,
    component: Chart,
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

export const PieHtmlLegend = {
    name: 'Html in legend',
    args: {
        data: pieHtmlLegendData,
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

export const PiePerformance = {
    name: 'Performance',
    args: {
        data: (() => {
            const items = new Array(1000).fill(null).map(() => ({
                name: randomString(5, '0123456789abcdefghijklmnopqrstuvwxyz'),
                value: 10,
            }));
            const data: ChartData = {
                series: {
                    data: [
                        {
                            type: 'pie',
                            data: items,
                            dataLabels: {enabled: true},
                        },
                    ],
                },
            };

            return data;
        })(),
        style: {width: 1000, height: 1000},
    },
    argTypes: {
        data: {
            control: 'object',
        },
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
