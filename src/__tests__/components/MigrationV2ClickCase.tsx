import React from 'react';

import {Chart} from '../../components';
import type {ChartData} from '../../types';

/** Actual observations of legacy and modern click payloads for the same point. */
export function MigrationV2ClickCase() {
    const [eventInfo, setEventInfo] = React.useState('Click the first point to compare payloads.');
    const data: ChartData = {
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
            <h2 style={{fontSize: 22, margin: '0 0 24px'}}>
                click: normalized values and event objects differ
            </h2>
            <div style={{display: 'flex', gap: 16}}>
                <section style={{width: 480}}>
                    <h3 style={{fontSize: 17, margin: '0 0 16px'}}>
                        Click the leftmost zero-mode point
                    </h3>
                    <div style={{height: 280}}>
                        <Chart data={data} />
                    </div>
                </section>
                <section style={{width: 480}}>
                    <h3>Actual callback observations</h3>
                    <pre data-qa="migration-event">{eventInfo}</pre>
                </section>
            </div>
            <p style={{fontSize: 13, color: '#555'}}>
                Compatibility evidence · release/v2 baseline 06d0703e · proposed replacements
                require a decision
            </p>
        </div>
    );
}
