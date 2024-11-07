import React from 'react';

import type {StoryObj} from '@storybook/react';
import {randomNormal} from 'd3';

import type {ChartKitWidgetData} from '../../types';
import {randomString} from '../../utils';
import {ChartStory} from '../ChartStory';

const randomFn = randomNormal(0, 10);
const randomStr = () => randomString(Math.random() * 10, 'absdEFGHIJklmnopqrsTUvWxyz');

const ChartStoryWithData = (args: {pointsCount: number; seriesCount: number}) => {
    const widgetData: ChartKitWidgetData = React.useMemo(() => {
        const points = Array.from({length: args.pointsCount}).map(() => Math.abs(randomFn()));
        const series = Array.from({length: args.seriesCount}).map(randomStr);

        return {
            series: {
                data: series.map((s) => ({
                    type: 'line',
                    name: s,
                    data: points.map((_, i) => ({
                        x: i,
                        y: randomFn(),
                    })),
                })),
            },
        };
    }, [args]);

    return <ChartStory data={widgetData} />;
};

export const LinePerformance: StoryObj<typeof ChartStoryWithData> = {
    name: 'Performance issue',
    args: {
        pointsCount: 5000,
        seriesCount: 2,
    },
    argTypes: {
        pointsCount: {
            control: 'number',
        },
    },
};

export default {
    title: 'Line',
    component: ChartStoryWithData,
};
