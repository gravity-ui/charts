import React from 'react';

import {Button} from '@gravity-ui/uikit';
import type {StoryObj} from '@storybook/react-webpack5';

import {Chart} from '../../components';
import type {ChartData} from '../../types';

const ChartStory = () => {
    const data: ChartData = {
        xAxis: {
            type: 'category',
            categories: ['1'],
        },
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'Series 1',
                    data: [{x: 0, y: 10}],
                },
            ],
        },
    };

    const updates: ChartData = {
        xAxis: {
            type: 'category',
            categories: new Array(10).fill(null).map((_, index) => String(index + 1)),
        },
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'Series 1',
                    data: new Array(10).fill(null).map((_, index) => ({x: index, y: 10})),
                },
            ],
        },
    };

    const styles: React.CSSProperties = {
        height: 280,
    };

    const [chartData, setChartData] = React.useState(data);

    return (
        <div style={styles}>
            <Button style={{marginBottom: 12}} onClick={() => setChartData({...data, ...updates})}>
                update
            </Button>
            <Chart key="chart" data={chartData} />
        </div>
    );
};

export const UpdateChartStory: StoryObj<typeof ChartStory> = {
    name: 'Update chart',
};

export default {
    title: 'Other',
    component: ChartStory,
};
