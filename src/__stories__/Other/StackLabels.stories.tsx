import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';
import {getCustomStackLabelsData, getStackLabelsData} from '../__data__/stack-labels';

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

export const CustomColumnTotals: Story = {args: {data: getCustomStackLabelsData('bar-x')}};
export const CustomBarTotals: Story = {args: {data: getCustomStackLabelsData('bar-y')}};

function getGroupedBarsData() {
    const data = getCustomStackLabelsData('bar-y');
    data.series.data.forEach((series) => Object.assign(series, {stacking: undefined}));
    return data;
}

function getTotalsWithoutOverlapData() {
    const data = getCustomStackLabelsData('bar-y');
    const options = data.series.options?.['bar-y'];
    data.series.options = {
        'bar-y': {...options, stackLabels: {...options?.stackLabels, allowOverlap: false}},
    };
    return data;
}

function getOppositeSignsData() {
    const data = getCustomStackLabelsData('bar-x');
    data.yAxis = [{min: -400, max: 400}];
    data.series.data.forEach((series) => {
        if (series.type !== 'bar-x') return;
        series.data.forEach((point, index) => {
            if (index === 1 && typeof point.y === 'number') point.y = -point.y;
            if (index === 0 && typeof point.stackLabelValue === 'number') {
                point.stackLabelValue = -point.stackLabelValue;
                point.label = point.stackLabelValue;
            }
        });
    });
    return data;
}

function getSplitTotalsData() {
    const data = getCustomStackLabelsData('bar-x');
    const columns = data.series.data.filter((series) => series.type === 'bar-x');
    data.series.data = [0, 1].flatMap((yAxis) =>
        columns.map((series) => ({
            ...series,
            name: `${series.name} (${yAxis + 1})`,
            yAxis,
        })),
    );
    data.split = {
        enable: true,
        gap: '40px',
        plots: [{title: {text: 'Panel 1'}}, {title: {text: 'Panel 2'}}],
    };
    data.yAxis = [
        {min: 0, max: 500, plotIndex: 0},
        {min: 0, max: 500, plotIndex: 1},
    ];
    return data;
}

function getLogarithmicTotalsData() {
    const data = getCustomStackLabelsData('bar-y');
    data.xAxis = {type: 'logarithmic', min: 1, max: 1000};
    return data;
}

export const CustomGroupedBars: Story = {args: {data: getGroupedBarsData()}};
export const CustomTotalsWithoutOverlap: Story = {args: {data: getTotalsWithoutOverlapData()}};
export const CustomTotalsWithOppositeSigns: Story = {args: {data: getOppositeSignsData()}};
export const CustomSplitTotals: Story = {args: {data: getSplitTotalsData(), style: {height: 500}}};
export const CustomLogarithmicTotals: Story = {args: {data: getLogarithmicTotalsData()}};
export const CustomNarrowPlotWithOverlap: Story = {
    args: {data: getCustomStackLabelsData('bar-y'), style: {width: 180}},
};
export const CustomNarrowPlotWithoutOverlap: Story = {
    args: {data: getTotalsWithoutOverlapData(), style: {width: 180}},
};
