import type {MeaningfulAny} from '../misc';

import type {ChartTooltipRendererArgs} from './tooltip';

export type ChartMargin = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

export type ChartOptions = {
    margin?: Partial<ChartMargin>;
    events?: {
        click?: (data: {point: MeaningfulAny; series: MeaningfulAny}, event: PointerEvent) => void;
        pointermove?: (data: ChartTooltipRendererArgs | undefined, event: PointerEvent) => void;
    };
};
