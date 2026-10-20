import type {ChartInteractionItem, ChartLegacyClickData} from './interaction';
import type {ChartTooltipRendererArgs} from './tooltip';
import type {ChartZoom} from './zoom';

export interface ChartMargin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface ChartOptions<TItem extends ChartInteractionItem = ChartInteractionItem> {
    margin?: Partial<ChartMargin>;
    events?: {
        /**
         * Controls when click handlers run; their arguments are the same in both modes.
         * - `'tooltip'`: Deliver clicks only when the legacy tooltip selection finds a point.
         * - `'plot'`: Deliver every click inside the main plot, independently of tooltip eligibility.
         * @default 'tooltip'
         */
        clickMode?: 'tooltip' | 'plot';
        /**
         * Called according to clickMode, preserving the legacy arguments.
         * In plot mode, legacy point and series are undefined when no tooltip-eligible point is selected.
         * The chart supplies all modern fields; check their presence when consuming events forwarded by legacy wrappers.
         * @param legacyEvent Deprecated second argument; use data.event for the native event.
         */
        click?: (data: ChartLegacyClickData<TItem>, legacyEvent: PointerEvent) => void;
        pointermove?: (data: ChartTooltipRendererArgs | undefined, event: PointerEvent) => void;
    };
    /**
     * Configuration options for chart zooming functionality.
     */
    zoom?: ChartZoom;
}
