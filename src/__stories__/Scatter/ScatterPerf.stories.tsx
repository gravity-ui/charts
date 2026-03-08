import React from 'react';

import type {StoryObj} from '@storybook/react';
import {randomNormal} from 'd3';

import type {ChartData} from '../../types';
import {randomString} from '../../utils';
import {ChartStory} from '../ChartStory';

const randomFn = randomNormal(0, 10);
const randomStr = () => randomString(Math.random() * 10, 'absdEFGHIJklmnopqrsTUvWxyz');

const ChartStoryWithData = (args: {categoriesCount: number; seriesCount: number}) => {
    const widgetData: ChartData = React.useMemo(() => {
        const categories = [...new Set(Array.from({length: args.categoriesCount}).map(randomStr))];
        const series = Array.from({length: args.seriesCount}).map(randomStr);

        return {
            xAxis: {
                type: 'category',
                categories: categories,
            },
            series: {
                data: series.map((s) => ({
                    type: 'scatter',
                    name: s,
                    data: categories.map((_, i) => ({
                        x: i,
                        y: randomFn(),
                    })),
                })),
            },
        };
    }, [args]);

    return <ChartStory data={widgetData} />;
};

export const PerformanceIssueScatter: StoryObj<typeof ChartStoryWithData> = {
    name: 'Performance issue',
    args: {
        categoriesCount: 5000,
        seriesCount: 2,
    },
    argTypes: {
        categoriesCount: {
            control: 'number',
        },
    },
};

export default {
    title: 'Scatter',
    component: ChartStoryWithData,
};
