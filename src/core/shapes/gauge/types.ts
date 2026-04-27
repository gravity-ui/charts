import type {PreparedLegendSymbol} from '../../series/types';
import type {
    ArcConfig,
    GaugeCustomContent,
    OverflowBehavior,
    ThresholdStop,
} from '../../types/chart/gauge';
import type {ChartSeries} from '../../types/chart/series';

export type {ThresholdStop};

export type ThresholdArc = {
    startDeg: number;
    endDeg: number;
    color: string;
    label?: string;
    zoneMin: number;
    zoneMax: number;
};

export type PreparedGaugeSeries = {
    type: 'gauge';
    id: string;
    color: string;
    name: string;
    visible: boolean;
    legend: {
        groupId: string;
        itemText: string;
        enabled: boolean;
        symbol: PreparedLegendSymbol;
    };
    cursor: string | null;
    tooltip: ChartSeries['tooltip'];
    // gauge-specific:
    value: number;
    min: number;
    max: number;
    thresholds: ThresholdStop[];
    target?: number;
    unit?: string;
    customContent?: GaugeCustomContent;
    arc: Required<ArcConfig> & {trackStyle: 'discrete' | 'continuous'};
    pointer: {
        type: 'marker' | 'needle' | 'solid';
        color?: string;
        size: number;
    };
    overflow: OverflowBehavior;
};

export type PreparedGaugeData = {
    id: string;
    series: PreparedGaugeSeries;
    cx: number;
    cy: number;
    outerRadius: number;
    innerRadius: number;
    startAngleDeg: number;
    endAngleDeg: number;
    valueAngleDeg: number;
    targetAngleDeg?: number;
    thresholdArcs: ThresholdArc[];
    needleLength: number;
    textBox: {
        x: number;
        y: number;
        width: number;
        height: number;
        cx: number;
        cy: number;
    };
};
