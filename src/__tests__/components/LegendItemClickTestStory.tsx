import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData, ChartLegend, ChartLegendItemClickData} from '../../types';

interface Props {
    html?: boolean;
    itemClickAction?: ChartLegend['itemClickAction'];
    onItemClick?: (item: ChartLegendItemClickData) => void;
    preventDefault?: boolean;
    seriesData?: ChartData['series']['data'];
}

export const LegendItemClickTestStory = ({
    html = false,
    itemClickAction,
    onItemClick,
    preventDefault = false,
    seriesData,
}: Props) => {
    const data = React.useMemo<ChartData>(
        () => ({
            legend: {
                enabled: true,
                html,
                itemClickAction,
                events: {
                    itemClick: (item, event) => {
                        onItemClick?.(item);

                        if (preventDefault) {
                            event.preventDefault();
                        }
                    },
                },
            },
            series: {
                data: seriesData ?? [
                    {
                        type: 'line',
                        name: 'First series',
                        legend: {groupId: 'first-series'},
                        data: [
                            {x: 0, y: 1},
                            {x: 1, y: 2},
                        ],
                    },
                    {
                        type: 'line',
                        name: 'Second series',
                        legend: {groupId: 'second-series'},
                        data: [
                            {x: 0, y: 2},
                            {x: 1, y: 1},
                        ],
                    },
                ],
            },
        }),
        [html, itemClickAction, onItemClick, preventDefault, seriesData],
    );

    return <ChartTestStory data={data} />;
};
