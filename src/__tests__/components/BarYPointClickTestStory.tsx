import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {BarYSeries, ChartData} from '../../types';

interface Props {
    data: ChartData;
    callbackLabel?: string;
    eventAction?: 'preventDefault' | 'stopPropagation';
}

interface PointClickSnapshot {
    label: string;
    name: string;
    x?: string | number | null;
    y?: string | number;
    custom: unknown;
    originalPoint: boolean;
    originalSeries: boolean;
    nativeEvent: boolean;
    eventType: string;
    target: string | null;
    defaultPrevented: boolean;
    clientX: number;
    clientY: number;
}

interface ChartClickSnapshot {
    name: string;
    y?: string | number;
    defaultPrevented: boolean;
}

export function BarYPointClickTestStory({data, callbackLabel = 'initial', eventAction}: Props) {
    const [pointClicks, setPointClicks] = React.useState<PointClickSnapshot[]>([]);
    const [chartClicks, setChartClicks] = React.useState<ChartClickSnapshot[]>([]);
    const chartData = React.useMemo<ChartData>(
        () => ({
            ...data,
            chart: {
                ...data.chart,
                events: {
                    ...data.chart?.events,
                    click: ({point, series}, event) => {
                        setChartClicks((previous) => [
                            ...previous,
                            {
                                name: series.name,
                                y: point.y,
                                defaultPrevented: event.defaultPrevented,
                            },
                        ]);
                    },
                },
            },
            series: {
                ...data.series,
                data: data.series.data.map((series) => {
                    if (series.type !== 'bar-y') {
                        return series;
                    }

                    const configuredSeries: BarYSeries = {...series};
                    configuredSeries.events = {
                        ...series.events,
                        pointClick: ({point, series: clickedSeries}, event) => {
                            if (eventAction === 'preventDefault') {
                                event.preventDefault();
                            } else if (eventAction === 'stopPropagation') {
                                event.stopPropagation();
                            }

                            setPointClicks((previous) => [
                                ...previous,
                                {
                                    label: callbackLabel,
                                    name: clickedSeries.name,
                                    x: point.x,
                                    y: point.y,
                                    custom: point.custom,
                                    originalPoint: configuredSeries.data.includes(point),
                                    originalSeries: clickedSeries === configuredSeries,
                                    nativeEvent: event instanceof MouseEvent,
                                    eventType: event.type,
                                    target:
                                        event.target instanceof Element
                                            ? event.target.getAttribute('class')
                                            : null,
                                    defaultPrevented: event.defaultPrevented,
                                    clientX: event.clientX,
                                    clientY: event.clientY,
                                },
                            ]);
                            return false;
                        },
                    };
                    return configuredSeries;
                }),
            },
        }),
        [callbackLabel, data, eventAction],
    );

    return (
        <React.Fragment>
            <ChartTestStory data={chartData} />
            <output data-qa="point-clicks">{JSON.stringify(pointClicks)}</output>
            <output data-qa="chart-clicks">{JSON.stringify(chartClicks)}</output>
        </React.Fragment>
    );
}
