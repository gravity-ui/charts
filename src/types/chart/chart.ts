import type {MeaningfulAny} from '../misc';

import type {ChartTooltipRendererArgs} from './tooltip';
import type {ChartZoom} from './zoom';

export interface ChartMargin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface ChartOptions {
    margin?: Partial<ChartMargin>;
    events?: {
        click?: (data: {point: MeaningfulAny; series: MeaningfulAny}, event: PointerEvent) => void;
        pointermove?: (data: ChartTooltipRendererArgs | undefined, event: PointerEvent) => void;
    };
    /**
     * Configuration options for chart zooming functionality.
     */
    zoom?: ChartZoom;
}
