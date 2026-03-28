import React from 'react';

import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../../components';
import {DefaultTooltipContent} from '../../../components/Tooltip/DefaultTooltipContent';
import type {ChartData, ChartTooltipRendererArgs} from '../../../types';
import {lineWithXDatetimePlotShapesData, lineWithYLinearPlotShapesData} from '../../__data__';

const meta: Meta = {
    title: 'Other/Plot Shapes',
    component: Chart,
};

export default meta;

function TooltipRenderer(args: ChartTooltipRendererArgs) {
    const {hovered, xAxis, yAxis, hoveredPlotShapes, headerFormat} = args;
    const shapes = hoveredPlotShapes ?? [];

    return (
        <div style={{display: 'flex'}}>
            <DefaultTooltipContent
                hovered={hovered}
                xAxis={xAxis}
                yAxis={yAxis}
                headerFormat={headerFormat}
                valueFormat={{type: 'number', precision: 1}}
            />
            {shapes.length > 0 && (
                <div
                    style={{
                        alignSelf: 'center',
                        borderLeft: '1px solid var(--g-color-line-generic)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        marginTop: 26,
                        paddingLeft: 8,
                        paddingRight: 8,
                    }}
                >
                    {shapes.map((shape, i) => (
                        <span
                            key={i}
                            style={{
                                fontSize: 12,
                                lineHeight: '16px',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            📍{' '}
                            {(shape.custom as {title?: string; label?: string})?.title ??
                                (shape.custom as {label?: string})?.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

function withTooltipRenderer(data: ChartData): ChartData {
    return {
        ...data,
        tooltip: {
            ...data.tooltip,
            renderer: TooltipRenderer,
        },
    };
}

const XAxisStory = () => {
    const data = React.useMemo(() => withTooltipRenderer(lineWithXDatetimePlotShapesData), []);
    return (
        <div style={{height: 280}}>
            <Chart data={data} />
        </div>
    );
};

const YAxisStory = () => {
    const data = React.useMemo(() => withTooltipRenderer(lineWithYLinearPlotShapesData), []);
    return (
        <div style={{height: 280}}>
            <Chart data={data} />
        </div>
    );
};

export const DatetimeXPlotShapes: StoryObj = {
    name: 'Datetime X Plot Shapes',
    render: XAxisStory,
};

export const LinearYPlotShapes: StoryObj = {
    name: 'Linear Y Plot Shapes',
    render: YAxisStory,
};
