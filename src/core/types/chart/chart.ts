import type {MeaningfulAny} from '../misc';

import type {ChartClickData} from './interaction';
import type {ChartTooltipRendererArgs} from './tooltip';
import type {ChartZoom} from './zoom';

export interface ChartMargin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface ChartOptions<T = MeaningfulAny> {
    margin?: Partial<ChartMargin>;
    events?: {
        /**
         * Called for clicks in the plot, including empty space, independently of tooltip settings.
         * @param legacyEvent Deprecated second argument; use data.event for the native event.
         */
        click?: (data: ChartClickData<T>, legacyEvent: PointerEvent) => void;
        pointermove?: (data: ChartTooltipRendererArgs | undefined, event: PointerEvent) => void;
    };
    /**
     * Configuration options for chart zooming functionality.
     */
    zoom?: ChartZoom;
}
