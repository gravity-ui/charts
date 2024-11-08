import React from 'react';

import {Chart} from '../components';
import type {ChartData} from '../types';

type WrapperProps = {
    children?: React.ReactNode;
    styles?: React.CSSProperties;
};

type ChartStoryProps = {
    data: ChartData;
    wrapperProps?: WrapperProps;
};

export const ChartStory = ({data, wrapperProps}: ChartStoryProps) => {
    const styles: React.CSSProperties = {
        height: 280,
        ...wrapperProps?.styles,
    };

    return (
        <div style={styles}>
            <Chart data={data} />
        </div>
    );
};
