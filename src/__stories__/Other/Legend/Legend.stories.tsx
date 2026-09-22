import type {Meta, StoryObj} from '@storybook/react';

import {ChartStory} from '../../ChartStory';
import {groupedLegend} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Legend',
    component: ChartStory,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const SharedLegend = {
    name: 'Shared legend',
    args: {
        data: groupedLegend,
    },
} satisfies Story;

export const WrappedLabels = {
    name: 'Wrapped labels',
    args: {
        data: {
            legend: {
                enabled: true,
                position: 'left',
                width: 230,
                itemMaxRowCount: 3,
            },
            series: {
                data: [
                    {
                        type: 'pie',
                        dataLabels: {enabled: false},
                        data: [
                            {
                                name: 'Revenue from international enterprise customers and recurring subscriptions',
                                value: 40,
                            },
                            {name: 'Domestic small business customers', value: 30},
                            {name: 'First line\nSecond line', value: 20},
                            {
                                name: 'VeryLongUnbrokenIdentifierThatWillWrapWithinTheLegendWidth',
                                value: 10,
                            },
                        ],
                    },
                ],
            },
        },
    },
} satisfies Story;

export const WrappedHtmlLabels = {
    ...WrappedLabels,
    name: 'Wrapped HTML labels',
    args: {
        data: {
            ...WrappedLabels.args.data,
            legend: {...WrappedLabels.args.data.legend, html: true},
            series: {
                data: [
                    {
                        ...WrappedLabels.args.data.series.data[0],
                        data: WrappedLabels.args.data.series.data[0].data.map((point) => ({
                            ...point,
                            name: `<b>${point.name}</b>`,
                        })),
                    },
                ],
            },
        },
    },
} satisfies Story;
