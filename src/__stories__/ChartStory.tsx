import React from 'react';

import {GravityChart} from '../components';
import type {ChartKitWidgetData} from '../types';

type WrapperProps = {
    children?: React.ReactNode;
    styles?: React.CSSProperties;
};

type ChartStoryProps = {
    data: ChartKitWidgetData;
    wrapperProps?: WrapperProps;
};

export const ChartStory = ({data, wrapperProps}: ChartStoryProps) => {
    const styles: React.CSSProperties = {
        height: 280,
        ...wrapperProps?.styles,
    };

    return (
        <div style={styles}>
            <GravityChart data={data} />
        </div>
    );
};
