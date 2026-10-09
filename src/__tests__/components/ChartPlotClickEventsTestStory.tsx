import React from 'react';

import {ChartTestStory} from '../../../playwright/components/ChartTestStory';
import type {ChartData, ChartPlotClickData} from '../../types';

interface Props {
    data: ChartData;
    width?: number;
}

interface PlotClick extends ChartPlotClickData {
    eventType: string;
    nativeMouseEvent: boolean;
}

export function ChartPlotClickEventsTestStory({data, width = 400}: Props) {
    const [plotClicks, setPlotClicks] = React.useState<PlotClick[]>([]);
    const [pointClicks, setPointClicks] = React.useState<unknown[]>([]);
    const chartData = React.useMemo<ChartData>(
        () => ({
            ...data,
            chart: {
                ...data.chart,
                events: {
                    ...data.chart?.events,
                    plotclick: (clickData, event) =>
                        setPlotClicks((previous) => [
                            ...previous,
                            {
                                ...clickData,
                                eventType: event.type,
                                nativeMouseEvent: event instanceof MouseEvent,
                            },
                        ]),
                    click: ({point}) => setPointClicks((previous) => [...previous, point]),
                },
            },
        }),
        [data],
    );

    return (
        <React.Fragment>
            <ChartTestStory data={chartData} styles={{width}} />
            <output data-qa="plot-clicks">{JSON.stringify(plotClicks)}</output>
            <output data-qa="point-clicks">{JSON.stringify(pointClicks)}</output>
        </React.Fragment>
    );
}
