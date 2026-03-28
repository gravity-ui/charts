import React from 'react';

import {Chart} from '../../components';
import type {AxisPlotShape, ChartAxis, ChartData} from '../../types';

function xShapeRenderer({
    plotHeight,
}: {
    x: number;
    y: number;
    plotWidth: number;
    plotHeight: number;
}) {
    return `<circle cx="0" cy="${plotHeight}" r="8" fill="green" stroke="#fff" stroke-width="2"/>`;
}

function yShapeRenderer() {
    return '<circle cx="0" cy="0" r="8" fill="green" stroke="#fff" stroke-width="2"/>';
}

type ShapeWithoutRenderer = Omit<AxisPlotShape, 'renderer'>;

type AxisWithShapes = Omit<ChartAxis, 'plotShapes'> & {
    plotShapes?: ShapeWithoutRenderer[];
};

type Props = {
    data: Omit<ChartData, 'xAxis' | 'yAxis'> & {
        xAxis?: AxisWithShapes;
        yAxis?: AxisWithShapes[];
    };
};

export const PlotShapesTestStory = ({data}: Props) => {
    const chartData = React.useMemo<ChartData>(() => {
        const addRenderer = (
            shapes: ShapeWithoutRenderer[] | undefined,
            renderer: AxisPlotShape['renderer'],
        ): AxisPlotShape[] => (shapes ?? []).map((s) => ({...s, renderer}));

        return {
            ...data,
            xAxis: data.xAxis
                ? {...data.xAxis, plotShapes: addRenderer(data.xAxis.plotShapes, xShapeRenderer)}
                : undefined,
            yAxis: data.yAxis?.map((axis) => ({
                ...axis,
                plotShapes: addRenderer(axis.plotShapes, yShapeRenderer),
            })),
        };
    }, [data]);

    return (
        <div style={{height: 280, width: 400, display: 'inline-block'}}>
            <Chart data={chartData} />
        </div>
    );
};
