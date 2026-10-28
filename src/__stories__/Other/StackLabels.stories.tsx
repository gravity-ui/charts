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
    const data = getStackLabelsAggregationData(type);
    let aggregationSource = '';
    const source = JSON.stringify(
        data,
        (key, value) => {
            if (key === 'aggregation' && typeof value === 'function') {
                aggregationSource = value.toString();
                return '__AGGREGATION_CALLBACK__';
            }

            return value;
        },
        2,
    ).replace('"__AGGREGATION_CALLBACK__"', aggregationSource);

    return {
        args: {data},
        parameters: {
            docs: {
                codePanel: true,
                source: {
                    type: 'code',
                    language: 'tsx',
                    code: `import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';

const data: ChartData = ${source};

<Chart data={data} />`,
                },
            },
        },
    };
}

export const ColumnsCustomAggregation: Story = createCustomAggregationStory('bar-x');
export const BarsCustomAggregation: Story = createCustomAggregationStory('bar-y');
export const AreaCustomAggregation: Story = createCustomAggregationStory('area');
