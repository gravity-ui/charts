import type {MeaningfulAny} from '../misc';

export type ChartMargin = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

type ChartEventData = {point: MeaningfulAny; series: MeaningfulAny};

export type ChartOptions = {
    margin?: Partial<ChartMargin>;
    events?: {
        click?: (data: ChartEventData, event: PointerEvent) => void;
        pointermove?: (data: ChartEventData | undefined, event: PointerEvent) => void;
    };
};
