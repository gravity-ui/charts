import type {SeriesShapeData} from '../shapes/types';

import type {GradientGeometry, GradientPoint} from './gradient-reference';

export function getGradientGeometry(
    data: Array<SeriesShapeData & {id: string; points: GradientPoint[]}>,
): GradientGeometry[] {
    return data.map(({id, points, gradientBBox, fillGradientBBox}) => ({
        id,
        points,
        bbox: gradientBBox ?? null,
        fillBBox: fillGradientBBox,
    }));
}
