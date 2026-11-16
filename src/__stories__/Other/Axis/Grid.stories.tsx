import React from 'react';

import type {Meta, StoryObj} from '@storybook/react';

import {DASH_STYLE} from '~core/constants';
import type {DashStyle} from '~core/constants';

import type {ChartData} from '../../../types';
import {ChartStory} from '../../ChartStory';

interface GridStoryArgs {
    xDashStyle: DashStyle;
    yDashStyle: DashStyle;
}

const data: ChartData = {
    legend: {enabled: false},
    series: {
        data: [
            {
                type: 'line',
                name: 'Revenue',
                data: [
                    {x: 1, y: 20},
                    {x: 2, y: 40},
                    {x: 3, y: 30},
                    {x: 4, y: 60},
                ],
            },
        ],
    },
};

const meta: Meta<GridStoryArgs> = {
    title: 'Other/Axis',
    args: {xDashStyle: 'Dot', yDashStyle: 'Dash'},
    argTypes: {
        xDashStyle: {control: 'select', options: Object.values(DASH_STYLE)},
        yDashStyle: {control: 'select', options: Object.values(DASH_STYLE)},
    },
    render: ({xDashStyle, yDashStyle}) => (
        <ChartStory
            data={{
                ...data,
                xAxis: {
                    grid: {dashStyle: xDashStyle},
                    tickMarks: {enabled: true},
                    title: {text: 'Quarter'},
                },
                yAxis: [
                    {
                        grid: {dashStyle: yDashStyle},
                        tickMarks: {enabled: true},
                        title: {text: 'Revenue'},
                    },
                ],
            }}
            style={{height: 400}}
        />
    ),
};

export default meta;

export const AxisGridDashStyle = {
    name: 'Grid dash style',
} satisfies StoryObj<GridStoryArgs>;
