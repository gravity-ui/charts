import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData, ChartLegend, ChartLegendItemClickData} from '../../types';

interface Props {
    html?: boolean;
    itemClickAction?: ChartLegend['itemClickAction'];
    onItemClick?: (item: ChartLegendItemClickData) => void;
    preventDefault?: boolean;
    legend?: ChartLegend;
    onActivation?: (event: {
        mouseEvent: boolean;
        ctrlKey: boolean;
        metaKey: boolean;
        currentTargetLabel: string | null;
    }) => void;
    onBubbledClick?: () => void;
    seriesData?: ChartData['series']['data'];
}

export const LegendItemClickTestStory = ({
    html = false,
    itemClickAction,
    onItemClick,
    preventDefault = false,
    seriesData,
    legend,
    onActivation,
    onBubbledClick,
}: Props) => {
    const data = React.useMemo<ChartData>(
        () => ({
            legend: {
                enabled: true,
                html,
                itemClickAction,
                ...legend,
                events: {
                    itemClick: (item, event) => {
                        onItemClick?.(item);
                        onActivation?.({
                            mouseEvent: event instanceof MouseEvent,
                            ctrlKey: event.ctrlKey,
                            metaKey: event.metaKey,
                            currentTargetLabel: (event.currentTarget as Element).getAttribute(
                                'aria-label',
                            ),
                        });

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
        [html, itemClickAction, onItemClick, preventDefault, seriesData, legend, onActivation],
    );

    return (
        <div onClick={onBubbledClick}>
            <ChartTestStory data={data} />
        </div>
    );
};
