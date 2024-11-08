import React from 'react';

import {boolean, number, select, withKnobs} from '@storybook/addon-knobs';
import type {Meta, StoryObj} from '@storybook/react';
import random from 'lodash/random';
import range from 'lodash/range';

import type {ChartData, ScatterSeries} from '../../types';
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

const shapeData = (): ChartData => {
    return {
        legend: {
            align: select('Align', ['left', 'right', 'center'], 'left', 'legend'),
            margin: number('Margin', 15, undefined, 'legend'),
            itemDistance: number('Item distance', 20, undefined, 'legend'),
        },
        series: {
            data: generateSeriesData(number('Amount of series', 1000, undefined, 'legend')),
        },
        xAxis: {
            labels: {
                enabled: boolean('Show labels', true, 'xAxis'),
            },
        },
        yAxis: [
            {
                labels: {
                    enabled: boolean('Show labels', true, 'yAxis'),
                },
            },
        ],
    };
};

function ChartStoryWithData() {
    return <ChartStory data={shapeData()} />;
}

const meta: Meta = {
    title: 'Scatter',
    decorators: [withKnobs],
    component: ChartStoryWithData,
};

type Story = StoryObj<typeof ChartStoryWithData>;

export const ScatterBigLegend = {
    name: 'Big legend',
} satisfies Story;

export default meta;
