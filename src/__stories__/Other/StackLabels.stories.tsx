import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {
    getAllSignsStackLabelsData,
    getStackLabelsAggregationData,
    getStackLabelsData,
} from '../__data__/stack-labels';

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
export const ColumnsAllSigns: Story = {
    args: {
        data: getAllSignsStackLabelsData({
            type: 'bar-x',
            categories: ['January'],
            valueAxis: {min: -40, max: 120},
            entries: [
                {name: 'Sales', values: [100]},
                {name: 'Refunds', values: [-30]},
            ],
        }),
    },
};

export const AreaAllSigns: Story = {
    args: {
        data: getAllSignsStackLabelsData({
            type: 'area',
            categories: ['January', 'February', 'March', 'April', 'May'],
            valueAxis: {min: -60, max: 120},
            entries: [
                {name: 'Sales', values: [100, 90, null, 80, null], markerIndex: 3},
                {name: 'Refunds', values: [-30, -40, -20, -30, -25]},
            ],
        }),
    },
};

export const AreaAllSignsClippedEdge: Story = {
    args: {
        data: getAllSignsStackLabelsData({
            type: 'area',
            categories: ['A', 'B', 'C', 'D'],
            valueAxis: {min: -100, max: 100},
            entries: [
                {name: 'Sales', values: [130, 130, 130, 50]},
                {name: 'Refunds', values: [-60, -60, -60, -60]},
            ],
        }),
    },
};

export const AreaAllSignsZeroMarker: Story = {
    args: {
        data: getAllSignsStackLabelsData({
            type: 'area',
            categories: ['A', 'B', 'C'],
            valueAxis: {min: -1, max: 1},
            entries: [{name: 'Sales', values: [null, 0, null], markerIndex: 1}],
        }),
    },
};

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
