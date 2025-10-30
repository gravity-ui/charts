import React from 'react';

import {Button} from '@gravity-ui/uikit';

import {Chart} from '../../components';
import type {ChartData} from '../../types';

type ChartStoryProps = {
    data: ChartData;
    updates: Partial<ChartData>;
    style?: React.CSSProperties;
    onRender?: (renderTime?: number) => void;
};

export const ChartStory = ({data, updates, style}: ChartStoryProps) => {
    const styles: React.CSSProperties = {
        height: 280,
        ...style,
    };

    const [chartData, setChartData] = React.useState(data);

    return (
        <div style={styles}>
            <Button onClick={() => setChartData({...data, ...updates})}>update</Button>
            <Chart key="chart" data={chartData} />
        </div>
    );
};
