import React from 'react';

import type {StoryFn} from '@storybook/react';

import {Chart} from '../components';
import type {ChartData} from '../types';

type ChartStoryProps = {
    data: ChartData;
    style?: React.CSSProperties;
};

export const ChartStory: StoryFn<ChartStoryProps> = ({data, style}: ChartStoryProps) => {
    const styles: React.CSSProperties = {
        height: 280,
        ...style,
    };

    return (
        <div style={styles}>
            <Chart data={data} />
        </div>
    );
};
