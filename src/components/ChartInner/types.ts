import type {ChartApi, ChartData} from '../../types';

export interface ChartPreparation {
    width: number;
    height: number;
    data: ChartData;
}

export interface ChartInnerRef extends ChartApi {
    hasFailed: () => boolean;
    isReady: (dimensions: {width: number; height: number}, data: ChartData) => boolean;
}

export interface ChartInnerProps {
    chartApi: ChartApi;
    reflowId?: number;
    onRenderError?: (error: unknown, generation: ChartPreparation) => void;
    width: number;
    height: number;
    data: ChartData;
    onCommitted?: (args: {dimensions: {width: number; height: number}}) => void;
    onReady?: (args: {dimensions: {width: number; height: number}}) => void;
}
