import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {getStackLabelsAggregationData, getStackLabelsData} from '../__data__/stack-labels';

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

function createCustomAggregationStory(type: 'bar-x' | 'bar-y' | 'area'): Story {
    return {
        args: {data: getStackLabelsAggregationData(type)},
        parameters: {
            docs: {
                codePanel: true,
                source: {
                    type: 'code',
                    language: 'tsx',
                    code: `import type {ChartSeriesOptions} from '@gravity-ui/charts';

const options: ChartSeriesOptions<{orders: number}> = {
    '${type}': {
        stackLabels: {
            enabled: true,
            aggregation: ({points}) =>
                points.reduce((sum, point) => sum + (point.custom?.orders ?? 0), 0),
            format: {type: 'number', postfix: ' orders'},
        },
    },
};

// Apply as data.series.options; each point supplies custom.orders.`,
                },
            },
        },
    };
}

export const ColumnsCustomAggregation: Story = createCustomAggregationStory('bar-x');
export const BarsCustomAggregation: Story = createCustomAggregationStory('bar-y');
export const AreaCustomAggregation: Story = createCustomAggregationStory('area');
