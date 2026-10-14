import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData, TooltipDataChunk} from '../../types';

interface Props {
    data: ChartData;
}

export const ClosestGeometryTestStory = ({data}: Props) => {
    const [clicked, setClicked] = React.useState('');
    const chartData = React.useMemo<ChartData>(() => {
        const summarize = (
            series: Pick<TooltipDataChunk['series'], 'name' | 'type'>,
            point: TooltipDataChunk['data'],
        ) => ({
            series: series.name,
            type: series.type,
            point,
            ...('cluster' in point && point.cluster
                ? {
                      originalMembers: point.cluster.points.map((member) =>
                          data.series.data.some((source) =>
                              source.data.some((item) => item === member),
                          ),
                      ),
                  }
                : {}),
        });

        return {
            ...data,
            chart: {
                ...data.chart,
                events: {
                    click: ({point, series}) =>
                        setClicked(JSON.stringify(summarize(series, point))),
                },
            },
            tooltip: {
                renderer: ({hovered}) => {
                    const active = hovered.find((item) => item.closest);
                    return active ? (
                        <output data-qa="hovered-geometry">
                            {JSON.stringify({
                                ...summarize(active.series, active.data),
                                distanceExposed: hovered.some((item) => 'distance' in item),
                                ...('displayPosition' in active
                                    ? {displayPosition: active.displayPosition}
                                    : {}),
                            })}
                        </output>
                    ) : null;
                },
            },
        };
    }, [data]);

    return (
        <React.Fragment>
            <ChartTestStory data={chartData} styles={{width: 400, height: 400}} />
            <output data-qa="clicked-geometry">{clicked}</output>
        </React.Fragment>
    );
};
