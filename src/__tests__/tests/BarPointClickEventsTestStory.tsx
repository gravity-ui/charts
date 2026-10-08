import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {BarXSeries, BarXSeriesData, BarYSeries, BarYSeriesData, ChartData} from '../../types';

interface CustomData {
    id: string;
}

type BarSeries = BarXSeries<CustomData> | BarYSeries<CustomData>;

interface PointClickData {
    point: BarXSeriesData<CustomData> | BarYSeriesData<CustomData>;
    series: BarSeries;
}

type PointClick = (data: PointClickData, event: MouseEvent) => void;

interface PointClickSnapshot {
    name: string;
    x?: string | number | null;
    y?: string | number | null;
    customId?: string;
    currentPoint: boolean;
    currentSeries: boolean;
    nativeEvent: boolean;
}

interface Props {
    seriesType: 'bar-x' | 'bar-y';
    generation?: number;
}

interface DataOptions extends Props {
    pointClick: PointClick;
}

function getData({seriesType, pointClick}: DataOptions): ChartData<CustomData> {
    const series = ['First', 'Second'].map<BarSeries>((name, index) => {
        const options = {
            name,
            color: index === 0 ? '#4da2f1' : '#8ad554',
            nullMode: 'zero' as const,
            events: {pointClick},
        };
        return seriesType === 'bar-x'
            ? {
                  ...options,
                  type: 'bar-x',
                  data: [
                      {x: 0, y: 4, custom: {id: `${name}-0`}},
                      {x: 1, y: 8, custom: {id: `${name}-1`}},
                  ],
              }
            : {
                  ...options,
                  type: 'bar-y',
                  data: [
                      {y: 0, x: 4, custom: {id: `${name}-0`}},
                      {y: 1, x: 8, custom: {id: `${name}-1`}},
                  ],
              };
    });
    const categories = {
        type: 'category' as const,
        categories: ['A', 'B'],
        order: 'reverse' as const,
        visible: false,
    };

    return {
        chart: {margin: {left: 40, right: 40, top: 40, bottom: 40}},
        tooltip: {pin: {enabled: true}},
        xAxis: seriesType === 'bar-x' ? categories : {min: 0, max: 12, visible: false},
        yAxis: [seriesType === 'bar-y' ? categories : {min: 0, max: 12, visible: false}],
        series: {
            data: series,
            options: {[seriesType]: {states: {hover: {enabled: false}}}},
        },
    };
}

export function BarPointClickEventsTestStory({seriesType, generation = 0}: Props) {
    const currentSeries = React.useRef<BarSeries[]>([]);
    const [pointClicks, setPointClicks] = React.useState<PointClickSnapshot[]>([]);
    const pointClick = React.useCallback<PointClick>(({point, series}, event) => {
        const configuredSeries = currentSeries.current.find((item) => item.name === series.name);
        setPointClicks((previous) => [
            ...previous,
            {
                name: series.name,
                x: point.x,
                y: point.y,
                customId: point.custom?.id,
                currentPoint: Boolean(configuredSeries?.data.some((item) => item === point)),
                currentSeries: configuredSeries === series,
                nativeEvent: event instanceof MouseEvent,
            },
        ]);
    }, []);
    const data = React.useMemo(
        () => getData({seriesType, pointClick, generation}),
        [generation, pointClick, seriesType],
    );
    currentSeries.current = data.series.data as BarSeries[];

    return (
        <React.Fragment>
            <ChartTestStory data={data} />
            <output data-qa="generation">{generation}</output>
            <output data-qa="point-clicks">{JSON.stringify(pointClicks)}</output>
        </React.Fragment>
    );
}
