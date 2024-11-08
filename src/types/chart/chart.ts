export type ChartMargin = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};

export type ChartOptions = {
    margin?: Partial<ChartMargin>;
    events?: {
        click?: (data: {point: unknown; series: unknown}, event: PointerEvent) => void;
    };
};
