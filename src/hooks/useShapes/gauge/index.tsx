import React from 'react';

import type {Dispatch} from 'd3-dispatch';

import {renderGauge} from '~core/shapes/gauge/renderer';
import type {PreparedGaugeData} from '~core/shapes/gauge/types';

import {block} from '../../../utils';

const b = block('gauge');

interface GaugeSeriesShapesProps {
    preparedData: PreparedGaugeData[];
    dispatcher?: Dispatch<object>;
}

export function GaugeSeriesShapes({preparedData, dispatcher}: GaugeSeriesShapesProps) {
    const ref = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
        if (!ref.current) {
            return () => {};
        }

        return renderGauge({plot: ref.current}, preparedData, dispatcher);
    }, [dispatcher, preparedData]);

    return (
        <React.Fragment>
            <g ref={ref} className={b()} />
            {preparedData.map((d) => {
                const {textBox, series} = d;
                if (!series.customContent?.inner) {
                    return null;
                }
                const seriesArg = {
                    value: series.value,
                    min: series.min,
                    max: series.max,
                    unit: series.unit,
                    name: series.name,
                    color: series.color,
                    id: series.id,
                };
                return (
                    <foreignObject
                        key={d.id}
                        x={textBox.x}
                        y={textBox.y}
                        width={textBox.width}
                        height={textBox.height}
                    >
                        {series.customContent.inner(seriesArg)}
                    </foreignObject>
                );
            })}
        </React.Fragment>
    );
}

interface GaugeBelowContentProps {
    preparedData: PreparedGaugeData[];
}

export function GaugeBelowContent({preparedData}: GaugeBelowContentProps) {
    const items = preparedData.filter((d) => d.series.customContent?.below);
    if (!items.length) {
        return null;
    }

    return (
        <React.Fragment>
            {items.map((d) => {
                const seriesArg = {
                    value: d.series.value,
                    min: d.series.min,
                    max: d.series.max,
                    unit: d.series.unit,
                    name: d.series.name,
                    color: d.series.color,
                    id: d.series.id,
                };
                return (
                    <div key={d.id} className={b('below')}>
                        {d.series.customContent!.below!(seriesArg)}
                    </div>
                );
            })}
        </React.Fragment>
    );
}
