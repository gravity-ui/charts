import React from 'react';

import type {StoryObj} from '@storybook/react-webpack5';
import {randomNormal} from 'd3';

import type {ChartData} from '../../types';
import {randomString} from '../../utils';
import {ChartStory} from '../ChartStory';

const randomFn = randomNormal(0, 10);
const randomStr = () => randomString(Math.random() * 10, 'absdEFGHIJklmnopqrsTUvWxyz');

const ChartStoryWithData = (args: {pointsCount: number; seriesCount: number}) => {
    const widgetData: ChartData = React.useMemo(() => {
        const points = Array.from({length: args.pointsCount}).map(() =>
            Math.ceil(Math.abs(randomFn())),
        );
        const series = Array.from({length: args.seriesCount}).map(randomStr);

        return {
            series: {
                data: series.map((s) => ({
                    type: 'bar-x',
                    stacking: 'normal',
                    name: s,
                    data: points.map((p, i) => ({
                        x: i,
                        y: p,
                    })),
                })),
            },
        };
    }, [args]);

    return <ChartStory data={widgetData} />;
};

export const BarXPerformance: StoryObj<typeof ChartStoryWithData> = {
    name: 'Performance issue',
    args: {
        pointsCount: 1000,
        seriesCount: 5,
    },
    argTypes: {
        pointsCount: {
            control: 'number',
        },
    },
};

export default {
    title: 'Bar-X',
    component: ChartStoryWithData,
};
