import React from 'react';

import type {Meta, StoryFn} from '@storybook/react';

import type {ChartProps} from '../../components';
import {Chart} from '../../components';
import {
    pieBasicData,
    pieContinuousLegendData,
    pieDonutData,
    pieDonutTotalsData,
    pieHtmlLabelsData,
    piePlaygroundData,
    pieUserStylesData,
} from '../__data__';

const ChartWrapper: StoryFn<ChartProps> = (args) => (
    <div style={{height: 280}}>
        <Chart {...args} />
    </div>
);

const meta: Meta<typeof ChartWrapper> = {
    title: 'Pie',
    component: ChartWrapper,
};

export default meta;

export const PieBasic = ChartWrapper.bind({});
PieBasic.storyName = 'Basic';
PieBasic.args = {
    data: pieBasicData,
};

export const PieDonut = ChartWrapper.bind({});
PieDonut.storyName = 'Donut';
PieDonut.args = {
    data: pieDonutData,
};

export const PieDonutTotals = ChartWrapper.bind({});
PieDonutTotals.storyName = 'Donut with totals';
PieDonutTotals.args = {
    data: pieDonutTotalsData,
};

export const PieHtmlLabels = ChartWrapper.bind({});
PieHtmlLabels.storyName = 'Html in labels';
PieHtmlLabels.args = {
    data: pieHtmlLabelsData,
};

export const PieContinuousLegend = ChartWrapper.bind({});
PieContinuousLegend.storyName = 'Continuous legend';
PieContinuousLegend.args = {
    data: pieContinuousLegendData,
};

export const PieUserStyles = ChartWrapper.bind({});
PieUserStyles.storyName = 'User styles';
PieUserStyles.args = {
    data: pieUserStylesData,
};

export const PiePlayground = ChartWrapper.bind({});
PiePlayground.storyName = 'Playground';
PiePlayground.args = {
    data: piePlaygroundData,
};
PiePlayground.argTypes = {
    data: {
        control: 'object',
    },
};
