import type {AxisPaddingPoint, PrepareAxisPaddingArgs} from '~core/scales/axis-padding';
import type {ChartScale} from '~core/scales/types';
import type {PreparedLineSeries} from '~core/series/types';
import {getSymbolBounds} from '~core/utils/symbol';

interface MarkerPaddingPoint {
    x: number | null;
    y: number | null;
    hiddenInLine?: boolean;
    data: {marker?: {states?: {normal?: {enabled: boolean}}}};
}

interface ProjectedMarkerSeries {
    series: Pick<PreparedLineSeries, 'marker' | 'yAxis'>;
    points: MarkerPaddingPoint[];
}

/** Cache normal/hover symbol geometry once per series, outside point projection. */
function createMarkerPaddingGetter(marker: PreparedLineSeries['marker']) {
    const {normal, hover} = marker.states;
    const bounds = (state: typeof normal | typeof hover) =>
        getSymbolBounds({
            symbolType: normal.symbol,
            // The renderer adds borderWidth to radius before stroking the path.
            radius: state.radius + state.borderWidth,
            strokeWidth: state.borderWidth,
        });
    const normalBounds = bounds(normal);
    const hoverBounds = bounds(hover);
    return (pointNormal?: boolean) => {
        const hasNormal = normal.enabled || pointNormal;
        const hasHover = hover.enabled && (!hasNormal || hover.enabledForNormal !== false);
        if (!hasNormal && !hasHover) return undefined;
        return {
            left: Math.max(hasNormal ? normalBounds.left : 0, hasHover ? hoverBounds.left : 0),
            right: Math.max(hasNormal ? normalBounds.right : 0, hasHover ? hoverBounds.right : 0),
            top: Math.max(hasNormal ? normalBounds.top : 0, hasHover ? hoverBounds.top : 0),
            bottom: Math.max(
                hasNormal ? normalBounds.bottom : 0,
                hasHover ? hoverBounds.bottom : 0,
            ),
        };
    };
}

export function createPaddingPointFilter(xScale: ChartScale, yScale: ChartScale) {
    const xMin = Math.min(...xScale.range());
    const xMax = Math.max(...xScale.range());
    const yMin = Math.min(...yScale.range());
    const yMax = Math.max(...yScale.range());
    return (x: number | null, y: number | null): boolean =>
        x !== null &&
        y !== null &&
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        x >= xMin - 0.5 &&
        x <= xMax + 0.5 &&
        y >= yMin - 0.5 &&
        y <= yMax + 0.5;
}

function appendMarkerPadding(args: {
    points: MarkerPaddingPoint[];
    marker: PreparedLineSeries['marker'];
    xScale: ChartScale;
    yScale: ChartScale;
    top: number;
    yAxis: number;
    result: AxisPaddingPoint[];
}) {
    const getBounds = createMarkerPaddingGetter(args.marker);
    const inRange = createPaddingPointFilter(args.xScale, args.yScale);
    for (const p of args.points) {
        const y = p.y === null ? null : p.y - args.top;
        if (p.x === null || y === null || p.hiddenInLine || !inRange(p.x, y)) continue;
        const bounds = getBounds(p.data.marker?.states?.normal?.enabled);
        if (bounds) args.result.push({x: p.x, y, yAxis: args.yAxis, ...bounds});
    }
}

/** Collect shared marker geometry after each plugin has projected its own points. */
export function collectMarkerPadding(
    args: PrepareAxisPaddingArgs,
    projected: ProjectedMarkerSeries[],
): AxisPaddingPoint[] {
    const points: AxisPaddingPoint[] = [];
    for (const item of projected) {
        const yScale = args.yScale[item.series.yAxis];
        if (!yScale) continue;
        appendMarkerPadding({
            points: item.points,
            marker: item.series.marker,
            xScale: args.xScale,
            yScale,
            top: args.split.plots[args.yAxis[item.series.yAxis].plotIndex]?.top ?? 0,
            yAxis: item.series.yAxis,
            result: points,
        });
    }
    return points;
}
