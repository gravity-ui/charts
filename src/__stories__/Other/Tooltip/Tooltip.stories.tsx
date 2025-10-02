import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../../components';
import {ChartStory} from '../../ChartStory';
import {tooltipTotalsSumData} from '../../__data__';

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
