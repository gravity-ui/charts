import React from 'react';

import {Chart} from '../../components';
import type {ChartData, ChartTooltipRowRendererArgs} from '../../types';

interface Props {
    kind: 'tooltip' | 'click';
}

function Panel({title, data}: {title: string; data: ChartData}) {
    return (
        <section style={{width: 480}}>
            <h3 style={{fontSize: 17, margin: '0 0 16px'}}>{title}</h3>
            <div style={{height: 280}}>
                <Chart data={data} />
            </div>
        </section>
    );
}

const rowRenderer = ({name, value, className}: ChartTooltipRowRendererArgs) => (
    <tr className={className}>
        <td>{String(name)}</td>
        <td>{String(value)}</td>
    </tr>
);

/** Reproducible evidence for migration decisions; the right side is a proposed replacement, not shipped v2 behavior. */
export function MigrationV2Cases({kind}: Props) {
    const [eventInfo, setEventInfo] = React.useState('Click the first point to compare payloads.');
    let title: string;
    let left: ChartData;
    let right: ChartData;
    let leftTitle: string;
    let rightTitle: string;
    if (kind === 'tooltip') {
        title = 'rowRenderer: plugin rows and values are lost';
        leftTitle = 'v1: tooltip.rowRenderer';
        rightTitle = 'Candidate: tooltip.rows: [{renderer}]';
        left = {
            legend: {enabled: false},
            tooltip: {rowRenderer},
            xAxis: {type: 'category', categories: ['Start', 'Growth', 'Total']},
            series: {
                data: [
                    {
                        type: 'waterfall',
                        name: 'Revenue',
                        data: [
                            {x: 0, y: 50},
                            {x: 1, y: 30},
                            {x: 2, total: true},
                        ],
                    },
                ],
            },
        };
        right = {...left, tooltip: {rows: [{renderer: rowRenderer}]}};
    } else {
        title = 'click: normalized values and event objects differ';
        leftTitle = 'Click the leftmost zero-mode point';
        rightTitle = 'Actual callback observations';
        left = {
            legend: {enabled: false},
            xAxis: {min: 0, max: 2},
            yAxis: [{min: -10, max: 60}],
            chart: {
                events: {
                    click: (payload, secondArgument) => {
                        if (!payload.chart || !payload.position || !payload.event) return;
                        const closest = payload.chart.getClosest(payload.position, {
                            mode: 'tooltip',
                        });
                        setEventInfo(
                            JSON.stringify(
                                {
                                    v1: {
                                        point: payload.point,
                                        eventHasNativeEvent: 'nativeEvent' in secondArgument,
                                    },
                                    modern: {
                                        point: closest?.point,
                                        eventHasNativeEvent: 'nativeEvent' in payload.event,
                                    },
                                },
                                null,
                                2,
                            ),
                        );
                    },
                },
            },
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Revenue',
                        nullMode: 'zero',
                        data: [
                            {x: 0.5, y: null},
                            {x: 1.5, y: 50},
                        ],
                    },
                ],
            },
        };
        right = left;
    }
    return (
        <div
            data-qa="migration-evidence"
            style={{
                width: 1024,
                padding: 24,
                background: '#fff',
                color: '#222',
                fontFamily: 'Arial, sans-serif',
                boxSizing: 'border-box',
            }}
        >
            <h2 style={{fontSize: 22, margin: '0 0 24px'}}>{title}</h2>
            <div style={{display: 'flex', gap: 16}}>
                <Panel title={leftTitle} data={left} />
                {kind === 'click' ? (
                    <section style={{width: 480}}>
                        <h3>{rightTitle}</h3>
                        <pre data-qa="migration-event">{eventInfo}</pre>
                    </section>
                ) : (
                    <Panel title={rightTitle} data={right} />
                )}
            </div>
            <p style={{fontSize: 13, color: '#555'}}>
                Compatibility evidence · release/v2 baseline 06d0703e · proposed replacements
                require a decision
            </p>
        </div>
    );
}
