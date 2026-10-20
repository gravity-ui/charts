import type {PreparedScatterSeries} from '~core/series/types';
import type {ChartMargin} from '~core/types';
import {getSymbolBounds} from '~core/utils/symbol';

/** Scatter paints its hover halo as well as its symbol, including on clusters. */
export function getScatterMarkerBounds(
    series: PreparedScatterSeries,
    radius?: number,
    hoverEnabled = true,
): ChartMargin {
    const {normal, hover} = series.marker.states;
    const result = {left: 0, right: 0, top: 0, bottom: 0};
    const add = (r: number, borderWidth: number) => {
        const bounds = getSymbolBounds({
            symbolType: normal.symbol,
            radius: r,
            strokeWidth: borderWidth,
        });
        for (const side of ['left', 'right', 'top', 'bottom'] as const)
            result[side] = Math.max(result[side], bounds[side]);
    };
    if (normal.enabled) add((radius ?? normal.radius) + normal.borderWidth, normal.borderWidth);
    if (hoverEnabled && hover.enabled) {
        add((radius ?? hover.radius) + hover.borderWidth, hover.borderWidth);
        if (hover.halo.enabled && hover.halo.opacity > 0)
            add((radius ?? hover.radius) + hover.halo.size, 0);
    }
    return result;
}
