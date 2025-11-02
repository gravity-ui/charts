import React from 'react';

import type {StoryObj} from '@storybook/react-webpack5';

import type {ChartData} from '../../types';
import {randomString} from '../../utils';
import {ChartStory} from '../ChartStory';

import {generateSeriesData} from './utils';

const randomStr = () => randomString(Math.random() * 10, 'absdEFGHIJklmnopqrsTUvWxyz');

const ChartStoryWithData = (args: {categoriesCount: number; seriesCount: number}) => {
    const widgetData: ChartData = React.useMemo(() => {
        const categories = Array.from({length: args.categoriesCount}).map(randomStr);

        return {
            xAxis: {
                type: 'category',
                categories: categories,
            },
            series: {
                data: generateSeriesData(args.seriesCount),
            },
        };
    }, [args]);

    return <ChartStory data={widgetData} />;
};

// TODO: the story isn't work. need fix
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
