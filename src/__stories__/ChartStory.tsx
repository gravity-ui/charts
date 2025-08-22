import React from 'react';

import type {StoryFn} from '@storybook/react';

import type {ChartProps} from '../components';
import {Chart} from '../components';
import type {ChartData} from '../types';
import {measurePerformance} from '../utils';

type ChartStoryProps = {
    data: ChartData;
    style?: React.CSSProperties;
    onRender?: (renderTime?: number) => void;
};

export const ChartStory: StoryFn<ChartStoryProps> = ({data, style, onRender}: ChartStoryProps) => {
    const styles: React.CSSProperties = {
        height: 280,
        ...style,
    };

    const performanceMeasure = React.useRef<ReturnType<typeof measurePerformance> | null>(
        measurePerformance(),
    );

    const handleResize: NonNullable<ChartProps['onResize']> = React.useCallback(
        ({dimensions}) => {
            if (!dimensions) {
                return;
            }

            if (!performanceMeasure.current) {
                performanceMeasure.current = measurePerformance();
            }

            requestAnimationFrame(() => {
                const renderTime = performanceMeasure.current?.end();
                console.log('renderTime', renderTime);
                onRender?.(renderTime);
                performanceMeasure.current = null;
            });
        },
        [onRender],
    );

    return (
        <div style={styles}>
            <Chart key="chart" data={data} onResize={handleResize} />
        </div>
    );
};
