import type {ScaleBand, ScaleLinear, ScaleTime} from 'd3-scale';

type ChartScaleBand = ScaleBand<string>;
export type ChartScaleLinear = ScaleLinear<number, number>;
export type ChartScaleTime = ScaleTime<number, number>;
export type ChartScale = ChartScaleBand | ChartScaleLinear | ChartScaleTime;
