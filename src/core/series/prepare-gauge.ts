import type {ScaleOrdinal} from 'd3-scale';

import type {GaugeSeries} from '../../types';
import type {PreparedGaugeSeries} from '../shapes/gauge/types';
import {GAUGE_DEFAULTS} from '../types/chart/gauge';
import {getUniqId} from '../utils';

import type {PreparedLegend, PreparedSeries} from './types';
import {prepareLegendSymbol} from './utils';

type PrepareGaugeSeriesArgs = {
    series: GaugeSeries;
    legend: PreparedLegend;
    colorScale: ScaleOrdinal<string, string>;
};

export function prepareGaugeSeries({series, colorScale}: PrepareGaugeSeriesArgs): PreparedSeries[] {
    const id = getUniqId();
    const name = series.name ?? 'Gauge';
    const color = series.color ?? colorScale(name);

    const arcConfig = {
        sweepAngle: GAUGE_DEFAULTS.arc.sweepAngle,
        trackStyle: GAUGE_DEFAULTS.arc.trackStyle,
        thickness: GAUGE_DEFAULTS.arc.thickness as number | string,
        cornerRadius: GAUGE_DEFAULTS.arc.cornerRadius,
        ...series.arc,
    } as Required<{
        sweepAngle: number;
        trackStyle: 'discrete' | 'continuous';
        thickness: number | string;
        cornerRadius: number;
    }>;

    const pointerConfig = {
        type: GAUGE_DEFAULTS.pointer.type,
        size: GAUGE_DEFAULTS.pointer.size,
        ...series.pointer,
    } as {
        type: 'marker' | 'needle' | 'solid';
        color?: string;
        size: number;
    };

    const result: PreparedGaugeSeries = {
        type: 'gauge',
        id,
        color,
        name,
        visible: series.visible !== false,
        legend: {
            enabled: series.legend?.enabled ?? false,
            symbol: prepareLegendSymbol({}),
            groupId: getUniqId(),
            itemText: name,
        },
        cursor: series.cursor ?? null,
        tooltip: series.tooltip,
        value: series.value,
        min: series.min ?? GAUGE_DEFAULTS.min,
        max: series.max ?? GAUGE_DEFAULTS.max,
        thresholds: series.thresholds ?? [],
        target: series.target,
        unit: series.unit,
        customContent: series.customContent,
        arc: arcConfig,
        pointer: pointerConfig,
        overflow: series.overflow ?? GAUGE_DEFAULTS.overflow,
    };

    return [result];
}
