import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {getStackLabelsData} from '../__data__/stack-labels';

const meta: Meta<typeof Chart> = {
    title: 'Other/Stack labels',
    render: ChartStory,
    component: Chart,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChartStory>;

export const Columns: Story = {args: {data: getStackLabelsData('bar-x')}};
export const ColumnsPercent: Story = {args: {data: getStackLabelsData('bar-x', 'percent')}};
export const Bars: Story = {args: {data: getStackLabelsData('bar-y')}};
export const BarsPercent: Story = {args: {data: getStackLabelsData('bar-y', 'percent')}};
export const Area: Story = {args: {data: getStackLabelsData('area')}};
export const AreaPercent: Story = {args: {data: getStackLabelsData('area', 'percent')}};
