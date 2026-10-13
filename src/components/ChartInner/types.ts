import type {ChartApi, ChartData} from '../../types';

export interface ChartInnerProps {
    chartApi: ChartApi;
    width: number;
    height: number;
    data: ChartData;
    onReady?: (args: {dimensions: {width: number; height: number}}) => void;
}
