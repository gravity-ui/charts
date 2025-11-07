import React from 'react';

import type {Meta, StoryObj} from '@storybook/react-webpack5';
import random from 'lodash/random';
import range from 'lodash/range';

import type {ChartLegend, ScatterSeries} from '../../types';
import {randomString} from '../../utils';
import {ChartStory} from '../ChartStory';

const TEMPLATE_STRING = '0123456789abcdefghijklmnopqrstuvwxyz';

const generateSeriesData = (seriesCount = 5): ScatterSeries[] => {
    return range(0, seriesCount).map(() => {
        return {
            type: 'scatter',
            data: [
                {
                    x: random(0, 1000),
                    y: random(0, 1000),
                },
            ],
            name: `${randomString(random(3, 15), TEMPLATE_STRING)}`,
        };
    });
};

type ChartStoryArgs = {
    seriesAmount?: number;
    legendItemDistance?: number;
    legendMargin?: number;
    legendAlign?: ChartLegend['align'];
    showLabelsX?: boolean;
    showLabelsY?: boolean;
};

function ChartStoryWithArgs({
    seriesAmount,
    showLabelsX,
    showLabelsY,
    legendAlign,
    legendMargin,
    legendItemDistance,
}: ChartStoryArgs) {
    const seriesData = React.useMemo(() => {
        return {
            data: generateSeriesData(seriesAmount),
        };
    }, [seriesAmount]);

    return (
        <ChartStory
            data={{
                series: seriesData,
                legend: {
                    align: legendAlign,
                    margin: legendMargin,
                    itemDistance: legendItemDistance,
                },
                xAxis: {
                    labels: {
                        enabled: showLabelsX,
                    },
                },
                yAxis: [
                    {
                        labels: {
                            enabled: showLabelsY,
                        },
                    },
                ],
            }}
        />
    );
}

const meta: Meta<ChartStoryArgs> = {
    title: 'Scatter',
    component: ChartStoryWithArgs,
    argTypes: {
        legendAlign: {
            name: 'Legend align',
            control: {type: 'select'},
            options: ['left', 'right', 'center'],
        },
        showLabelsX: {
            name: 'Show X-axis labels',
        },
        showLabelsY: {
            name: 'Show Y-axis labels',
        },
        legendMargin: {
            name: 'Legend margin',
        },
        legendItemDistance: {
            name: 'Legend item distance',
        },
        seriesAmount: {
            name: 'Amount of series',
        },
    },

    args: {
        seriesAmount: 1000,
        showLabelsX: true,
        showLabelsY: true,

        legendAlign: 'left',
        legendMargin: 15,
        legendItemDistance: 20,
    },
};

type Story = StoryObj<typeof ChartStory>;

export const ScatterBigLegend = {
    name: 'Big legend',
} satisfies Story;

export default meta;
