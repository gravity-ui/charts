import React from 'react';

import type {Meta, StoryObj} from '@storybook/react-webpack5';

import {Chart} from '../../../components';
import {DefaultTooltipContent} from '../../../components/Tooltip/DefaultTooltipContent';
import type {ChartData, ChartTooltipRendererArgs} from '../../../types';
import {hoveredPlotsTooltipData} from '../../__data__';

const meta: Meta = {
    title: 'Other/Tooltip',
    component: Chart,
};

export default meta;

function TooltipRenderer(args: ChartTooltipRendererArgs) {
    const {hovered, xAxis, yAxis, hoveredPlots} = args;
    const bands = hoveredPlots?.bands ?? [];
    const lines = hoveredPlots?.lines ?? [];
    const hasPlots = bands.length > 0 || lines.length > 0;

    return (
        <div style={{display: 'flex'}}>
            <DefaultTooltipContent
                hovered={hovered}
                xAxis={xAxis}
                yAxis={yAxis}
                headerFormat={{type: 'date'}}
                valueFormat={{type: 'number', precision: 2}}
            />
            {hasPlots && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        width: 150,
                        minWidth: 0,
                        borderLeft: '1px solid var(--g-color-line-generic)',
                        paddingLeft: 8,
                        paddingTop: 5,
                        marginTop: 21,
                        marginRight: 14,
                    }}
                >
                    {bands.map((band, i) => (
                        <div
                            key={`band-${i}`}
                            style={{display: 'flex', flexDirection: 'column', gap: 2}}
                        >
                            <div
                                style={{
                                    height: 3,
                                    borderRadius: 2,
                                    backgroundColor: band.color ?? '#ffbe5c',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 12,
                                    lineHeight: '16px',
                                    overflowWrap: 'break-word',
                                    wordWrap: 'break-word',
                                    whiteSpace: 'normal',
                                }}
                            >
                                {band.custom}
                            </span>
                        </div>
                    ))}
                    {lines.map((line, i) => (
                        <div
                            key={`line-${i}`}
                            style={{display: 'flex', flexDirection: 'column', gap: 2}}
                        >
                            <div
                                style={{
                                    height: 2,
                                    borderTop: `2px ${line.dashStyle === 'Dash' ? 'dashed' : 'solid'} ${line.color ?? 'var(--g-color-base-brand)'}`,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 12,
                                    lineHeight: '16px',
                                    overflowWrap: 'break-word',
                                    wordWrap: 'break-word',
                                    whiteSpace: 'normal',
                                }}
                            >
                                {line.custom}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function prepareDataWithRenderer(): ChartData {
    return {
        ...hoveredPlotsTooltipData,
        tooltip: {
            ...hoveredPlotsTooltipData.tooltip,
            renderer: TooltipRenderer,
        },
    };
}

const HoveredPlotsTooltipStory = () => {
    const data = React.useMemo(() => prepareDataWithRenderer(), []);

    return (
        <div style={{height: 400}}>
            <Chart data={data} />
        </div>
    );
};

export const HoveredPlotsTooltip: StoryObj = {
    name: 'Hovered Plots Tooltip',
    render: HoveredPlotsTooltipStory,
};
