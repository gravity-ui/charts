import type {ChartApi, ChartData} from '../../types';

export interface ChartInnerRef extends ChartApi {
    isReady: (dimensions: {width: number; height: number}, data: ChartData) => boolean;
}

export interface ChartInnerProps {
    chartApi: ChartApi;
    reflowId?: number;
    onRenderError?: (error: unknown, generation: object) => void;
    width: number;
    height: number;
    data: ChartData;
    onReady?: (args: {dimensions: {width: number; height: number}}) => void;
}
