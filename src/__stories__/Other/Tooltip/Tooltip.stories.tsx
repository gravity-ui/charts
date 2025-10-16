import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../../components';
import {ChartStory} from '../../ChartStory';
import {tooltipOverflowedRowsData, tooltipTotalsSumData} from '../../__data__';

const meta: Meta<typeof ChartStory> = {
    title: 'Other/Tooltip',
    render: ChartStory,
    component: Chart,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const TotalsSum = {
    name: 'Totals Sum',
    args: {
        data: tooltipTotalsSumData,
    },
} satisfies Story;

export const SeriesWithDifferentFormats = {
    name: 'Series with different formats',
    args: {
        data: {
            series: {
                data: [
                    {
                        name: 'Series 1',
                        type: 'bar-y',
                        stacking: 'normal',
                        data: [{y: 1, x: 100}],
                        tooltip: {
                            valueFormat: {
                                type: 'number',
                                precision: 0,
                            },
                        },
                    },
                    {
                        name: 'Series 2',
                        type: 'bar-y',
                        stacking: 'normal',
                        data: [{y: 1, x: 100.5876}],
                        tooltip: {
                            valueFormat: {
                                type: 'number',
                                precision: 2,
                            },
                        },
                    },
                ],
            },
            tooltip: {
                headFormat: {
                    type: 'custom',
                    formatter: ({value}) => `Custom header format: ${value}`,
                },
                totals: {
                    enabled: true,
                    aggregation: 'sum',
                    valueFormat: {
                        type: 'number',
                        precision: 1,
                    },
                },
            },
        },
    },
} satisfies Story;

export const OverflowedRows = {
    name: 'Overflowed Rows',
    args: {
        data: tooltipOverflowedRowsData,
    },
} satisfies Story;
