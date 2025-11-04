import React from 'react';

import {dateTime} from '@gravity-ui/date-utils';
import type {Meta, StoryObj} from '@storybook/react-webpack5';
import random from 'lodash/random';
import range from 'lodash/range';

import type {ChartData, ScatterSeries, ScatterSeriesData} from '../../types';
import {ChartStory} from '../ChartStory';

const rowData: ScatterSeriesData<string>[] = [
    {
        y: 86.71905594602345,
        custom: 'green',
    },
    {
        y: 86.73089353359981,
        custom: 'yellow',
    },
    {
        y: 86.53675705168267,
        custom: 'red',
    },
    {
        y: 86.47880981408552,
        custom: 'blue',
    },
    {
        y: 86.4108836764148,
        custom: 'gray',
    },
    {
        y: 86.73440096266042,
        custom: 'pink',
    },
    {
        y: 86.64935929597681,
        custom: 'purple',
    },
];

type DataDateProps = {
    startDate: Date;
    endDate: Date;
};

function prepareData({startDate, endDate}: DataDateProps): ChartData<string> {
    const startDateValue = startDate.valueOf();
    const endDateValue = endDate.valueOf();

    const step = (endDateValue - startDateValue) / rowData.length;
    const dates = range(rowData.length).map((d) => startDateValue + step * d);

    const scatterData: ScatterSeriesData[] = rowData.map((d, i) => ({
        x: dates[i],
        y: d.y,
        radius: random(3, 6),
        custom: d.custom,
    }));

    const scatterSeries: ScatterSeries = {
        type: 'scatter',
        data: scatterData,
        name: 'some-name',
    };

    return {
        series: {
            data: [scatterSeries],
        },
        xAxis: {
            type: 'datetime',
        },
        yAxis: [
            {
                lineColor: 'transparent',
            },
        ],
        tooltip: {
            renderer: ({hovered}) => {
                const d = hovered[0].data as ScatterSeriesData<string>;
                return <div style={{color: d.custom}}>{dateTime({input: d.x}).format('LL')}</div>;
            },
        },
    };
}

type ChartStoryArgs = DataDateProps;

function ChartStoryWithArgs({startDate, endDate}: ChartStoryArgs) {
    const data = React.useMemo(() => {
        return prepareData({
            startDate,
            endDate,
        });
    }, [startDate, endDate]);

    return <ChartStory data={data} />;
}

const meta: Meta<ChartStoryArgs> = {
    title: 'Scatter',
    component: ChartStoryWithArgs,
    argTypes: {
        startDate: {
            control: 'date',
            name: 'Start Date',
        },
        endDate: {
            control: 'date',
            name: 'End Date',
        },
    },

    args: {
        startDate: new Date(2023, 6, 28, 6),
        endDate: new Date(2023, 6, 30, 6),
    },
};

export default meta;

type Story = StoryObj<typeof ChartStoryWithArgs>;

export const SankeyPlayground = {
    name: 'Timestamp',
} satisfies Story;
