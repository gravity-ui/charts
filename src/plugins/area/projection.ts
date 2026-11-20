import {min} from 'd3-array';
import round from 'es-toolkit/compat/round';

import type {projectAreaData} from '~core/shapes/area/prepare-data';
import {getXValue, getYValue} from '~core/shapes/utils';
import {getDataCategoryValue, isBandScale} from '~core/utils';

import {prepareAreaGeometry} from './geometry';
import type {AreaGeometryOptions} from './geometry';

type CoreProjectionArgs = Parameters<typeof projectAreaData>[0];

interface ProjectionArgs extends CoreProjectionArgs {
    boundsWidth?: number;
}

/**
 * Creates a function that maps a point's X value to its chart coordinate in pixels.
 * Supports interpolation on categorical axes during zoom by projecting offscreen categories.
 */
export function createAreaCategoryXProjector(
    args: Pick<ProjectionArgs, 'series' | 'xAxis' | 'xScale'>,
): ProjectionArgs['projectX'] {
    const {xAxis, xScale} = args;
    if (
        xAxis.type !== 'category' ||
        !isBandScale(xScale) ||
        !args.series.some(
            (series) => series.interpolation && series.interpolation.type !== 'linear',
        )
    ) {
        return undefined;
    }
    const categories = xAxis.categories ?? [];
    const indices = new Map(categories.map((name, index) => [name, index]));
    const domain = xScale.domain();
    const centers = new Map(
        domain.map((category) => [category, getXValue({point: {x: category}, xAxis, xScale})]),
    );
    const first = domain[0];
    const last = domain[domain.length - 1];
    const start = indices.get(first);
    const end = indices.get(last);
    const [rangeStart, rangeEnd] = xScale.range();
    const step = xScale.step() * Math.sign(rangeEnd - rangeStart);
    const firstX = centers.get(first) ?? 0;
    const lastX = centers.get(last) ?? 0;
    return (point, series) => {
        if (!series.interpolation || series.interpolation.type === 'linear') {
            return getXValue({point, points: series.data, xAxis, xScale});
        }
        const category = getDataCategoryValue({axisDirection: 'x', categories, data: point});
        const center = centers.get(category);
        if (center !== undefined) {
            return center;
        }
        const index = indices.get(category);
        if (index === undefined || start === undefined || end === undefined) {
            return null;
        }
        if (index < start) {
            return firstX + (index - start) * step;
        }
        if (index > end) {
            return lastX + (index - end) * step;
        }
        return null;
    };
}

function roundProjectedCoordinate(value: number) {
    const scaled = value * 100;
    const rounded = Math.round(scaled);
    // Near a rounding midpoint, match prepared points despite multiplication error.
    const distanceFromTie = Math.abs(Math.abs(scaled - rounded) - 0.5);
    return distanceFromTie <= Math.abs(scaled) * Number.EPSILON ? round(value, 2) : rounded / 100;
}

function createAreaGeometryPreparer(
    args: Pick<ProjectionArgs, 'series' | 'yAxis' | 'yScale' | 'split' | 'xScale' | 'boundsWidth'>,
) {
    if (
        !args.series.some(
            (series) => series.interpolation && series.interpolation.type !== 'linear',
        )
    ) {
        return undefined;
    }
    const xRange = args.xScale.range();
    return (data: ReturnType<typeof projectAreaData>) => {
        const projections = new Map<number, AreaGeometryOptions>();
        prepareAreaGeometry(data, (series) => {
            const cached = projections.get(series.yAxis);
            if (cached) {
                return cached;
            }
            const axis = args.yAxis[series.yAxis];
            const scale = args.yScale[series.yAxis];
            if (!scale) {
                throw new Error('Area projection requires its Y scale');
            }
            const top = args.split.plots[axis.plotIndex]?.top ?? 0;
            const base = axis.type === 'logarithmic' ? (min(scale.domain().map(Number)) ?? 0) : 0;
            const baseline = round(
                top + (getYValue({point: {y: base}, yAxis: axis, yScale: scale}) ?? 0),
                2,
            );
            const [rangeStart, rangeEnd] = scale.range();
            let projection: AreaGeometryOptions['projection'];
            if (isBandScale(scale)) {
                const unit = scale.step() * Math.sign(rangeEnd - rangeStart);
                projection = {
                    project: (value) => baseline + value * unit,
                    invert: (coordinate) => (unit ? (coordinate - baseline) / unit : 0),
                };
            } else {
                projection = {
                    project: (value) => {
                        const coordinate = value === 0 ? undefined : scale(value);
                        return coordinate === undefined
                            ? baseline
                            : roundProjectedCoordinate(top + coordinate);
                    },
                    invert: (coordinate) => Number(scale.invert(coordinate - top)),
                };
            }
            const options: AreaGeometryOptions = {
                baseline,
                projection,
                reversedX: xRange[0] > xRange[1],
                xRange: [0, args.boundsWidth ?? Math.max(...xRange)],
                yRange: [
                    top + Math.min(rangeStart, rangeEnd),
                    top + Math.max(rangeStart, rangeEnd),
                ],
            };
            projections.set(series.yAxis, options);
            return options;
        });
    };
}

export function getAreaProjectionArgs(args: ProjectionArgs) {
    return {
        ...args,
        projectX: createAreaCategoryXProjector(args),
        prepareGeometry: createAreaGeometryPreparer(args),
    };
}
