import type {PreparedXAxis, PreparedYAxis} from '../axes/types';
import type {PreparedSplit} from '../layout/split-types';
import type {ChartScale} from '../scales/types';
import type {PrepareShapeDataArgs} from '../series/plugin';
import type {PreparedSeries} from '../series/types';
import type {GradientShapeData} from '../shapes/types';

import {hasGradient} from './gradient';
import type {GradientGeometry, ProjectedGradientPoint} from './gradient-reference';

interface ProjectionArgs<T extends PreparedSeries> extends Omit<
    PrepareShapeDataArgs,
    'series' | 'xAxis' | 'xScale' | 'yAxis' | 'yScale' | 'split' | 'isOutsideBounds'
> {
    series: T[];
    xAxis: PreparedXAxis;
    xScale: ChartScale;
    yAxis: PreparedYAxis[];
    yScale: (ChartScale | undefined)[];
    split: PreparedSplit;
    isOutsideBounds: (x: number, y: number) => boolean;
}

export function createGradientGeometryPreparer<T extends PreparedSeries>(
    project: (
        args: ProjectionArgs<T>,
    ) => Array<GradientShapeData & {id: string; points: ProjectedGradientPoint[]}>,
    options: {includeSolidSeries?: boolean} = {},
) {
    return (args: PrepareShapeDataArgs): GradientGeometry[] => {
        const {xAxis, xScale, yAxis, yScale, split} = args;
        if (!xAxis || !xScale || !yScale || !split) return [];
        return getGradientGeometry(
            project({
                ...args,
                series: (options.includeSolidSeries
                    ? args.series
                    : args.series.filter(hasGradient)) as T[],
                xAxis,
                xScale,
                yAxis: yAxis ?? [],
                yScale,
                split,
                isOutsideBounds: () => false,
            }),
        );
    };
}

export function getGradientGeometry(
    data: Array<GradientShapeData & {id: string; points: ProjectedGradientPoint[]}>,
): GradientGeometry[] {
    return data.map(({id, points, gradientBBox, fillGradientBBox}) => ({
        id,
        points,
        strokeBBox: gradientBBox ?? null,
        fillBBox: fillGradientBBox,
    }));
}
