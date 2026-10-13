import React from 'react';

import {Chart} from '../../components';
import type {ChartRef} from '../../components';
import type {
    ChartApi,
    ChartData,
    ChartInteractionItem,
    ChartSankeyLinkPoint,
    SankeySeriesData,
} from '../../types';

interface Props {
    data: ChartData;
    query?: 'all' | 'chart' | 'tooltip' | 'none';
    queryPosition?: [number, number];
    showChart?: boolean;
    chartSize?: {width: number; height: number};
}

function serializeItem(item: ChartInteractionItem | null) {
    if (!item) return null;
    let point = item.point;
    if (item.series.type === 'sankey') {
        // Sankey layout nodes contain graph references. Assert public data without serializing the graph.
        const data = point as SankeySeriesData | ChartSankeyLinkPoint;
        const node = (value: SankeySeriesData) => ({name: value.name, custom: value.custom});
        point =
            'kind' in data && data.kind === 'link'
                ? ({
                      kind: 'link',
                      source: node(data.source),
                      target: node(data.target),
                      value: data.value,
                  } as ChartSankeyLinkPoint)
                : (node(data as SankeySeriesData) as SankeySeriesData);
    }
    return {type: item.series.type, name: item.series.name, custom: item.series.custom, point};
}

export function ChartInteractionTestStory({
    data,
    query = 'all',
    queryPosition,
    showChart = true,
    chartSize = {height: 300, width: 500},
}: Props) {
    const chartRef = React.useRef<ChartRef>(null);
    const savedChart = React.useRef<ChartApi | null>(null);
    const lastPosition = React.useRef<[number, number]>([0, 0]);
    const [queryResult, setQueryResult] = React.useState('');
    const [result, setResult] = React.useState('');
    const [count, setCount] = React.useState(0);
    const chartData = React.useMemo<ChartData>(
        () => ({
            ...data,
            chart: {
                ...data.chart,
                events: {
                    ...data.chart?.events,
                    click: (payload) => {
                        const {targets, chart, event, position, point, series} = payload;
                        savedChart.current = chart;
                        lastPosition.current = position;
                        const closest =
                            query === 'all' || query === 'chart'
                                ? chart.getClosest(position)
                                : undefined;
                        const tooltip =
                            query === 'all' || query === 'tooltip'
                                ? chart.getClosest(position, {mode: 'tooltip'})
                                : undefined;
                        setResult(
                            JSON.stringify({
                                targets: targets.map(serializeItem),
                                chart: closest === undefined ? undefined : serializeItem(closest),
                                tooltip: tooltip === undefined ? undefined : serializeItem(tooltip),
                                legacy: point
                                    ? {
                                          point:
                                              series.type === 'sankey' ? {name: point.name} : point,
                                          name: series.name,
                                      }
                                    : null,
                                sameApi: chart === chartRef.current,
                                position,
                                native: event instanceof MouseEvent,
                            }),
                        );
                        setCount((previous) => previous + 1);
                    },
                },
            },
        }),
        [data, query],
    );
    return (
        <React.Fragment>
            <div style={chartSize}>{showChart && <Chart ref={chartRef} data={chartData} />}</div>
            <button
                onClick={() =>
                    setQueryResult(
                        JSON.stringify(
                            serializeItem(
                                chartRef.current?.getClosest(
                                    queryPosition ?? lastPosition.current,
                                ) ?? null,
                            ),
                        ),
                    )
                }
            >
                Query chart
            </button>
            <button
                onClick={() =>
                    setQueryResult(
                        JSON.stringify(
                            serializeItem(
                                savedChart.current?.getClosest(
                                    queryPosition ?? lastPosition.current,
                                ) ?? null,
                            ),
                        ),
                    )
                }
            >
                Query saved chart
            </button>
            <output data-qa="chart-query-result">{queryResult}</output>
            <output data-qa="interaction-result">{result}</output>
            <output data-qa="interaction-count">{count}</output>
        </React.Fragment>
    );
}
