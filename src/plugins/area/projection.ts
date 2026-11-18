import {min} from 'd3-array';
import round from 'es-toolkit/compat/round';

import {projectAreaData} from '~core/shapes/area/prepare-data';
import {getXValue, getYValue} from '~core/shapes/utils';
import {getDataCategoryValue} from '~core/utils';

import {prepareAreaGeometry} from './geometry';
import type {PreparedGeometryOptions} from './geometry';

type ProjectionArgs = Parameters<typeof projectAreaData>[0];

export function createAreaXProjector(
    args: Pick<ProjectionArgs, 'xAxis' | 'xScale'>,
): NonNullable<ProjectionArgs['projectX']> {
    const {xAxis, xScale} = args;
    const categories = xAxis.categories ?? [];
    const indices = new Map(categories.map((name, index) => [name, index]));
    const domain = xScale.domain();
    const first = String(domain[0]);
    const origin = getXValue({point: {x: first}, xAxis, xScale}) ?? 0;
    const step = 'step' in xScale ? xScale.step() : 0;
    const range = xScale.range().map(Number);
    return (point, series) => {
        if (
            xAxis.type !== 'category' ||
            !series.interpolation ||
            series.interpolation.type === 'linear'
        ) {
            return getXValue({point, points: series.data, xAxis, xScale});
        }
        const category = getDataCategoryValue({axisDirection: 'x', categories, data: point});
        const index = indices.get(category);
        const start = indices.get(first);
        if (index === undefined || start === undefined) return null;
        return origin + (index - start) * step * Math.sign(range[1] - range[0]);
    };
}

export function createAreaGeometryPreparer(
    args: Pick<ProjectionArgs, 'yAxis' | 'yScale' | 'split' | 'xScale' | 'boundsWidth'>,
) {
    return (data: ReturnType<typeof projectAreaData>) => {
        const projections = new Map<number, PreparedGeometryOptions>();
        prepareAreaGeometry(data, (series) => {
            const cached = projections.get(series.yAxis);
            if (cached) return cached;
            const axis = args.yAxis[series.yAxis];
            const scale = args.yScale[series.yAxis];
            if (!scale) throw new Error('Area projection requires its Y scale');
            const top = args.split.plots[axis.plotIndex]?.top ?? 0;
            const base = axis.type === 'logarithmic' ? (min(scale.domain().map(Number)) ?? 0) : 0;
            const baseline = round(
                top + (getYValue({point: {y: base}, yAxis: axis, yScale: scale}) ?? 0),
                2,
            );
            const range = scale.range().map(Number);
            const xRange = args.xScale.range().map(Number);
            const project = (value: number) => {
                if (value === 0) return baseline;
                if (axis.type === 'category') {
                    const step = 'step' in scale ? scale.step() : 1;
                    return baseline + value * step * Math.sign(range[1] - range[0]);
                }
                const y = value;
                return round(
                    top + (getYValue({point: {y}, yAxis: axis, yScale: scale}) ?? baseline - top),
                    2,
                );
            };
            const invert = (coordinate: number) => {
                if ('invert' in scale) return Number(scale.invert(coordinate - top));
                const unit = project(1) - baseline;
                return unit ? (coordinate - baseline) / unit : 0;
            };
            const options: PreparedGeometryOptions = {
                baseline,
                projection: {project, invert},
                reversedX: xRange[0] > xRange[1],
                xRange: [0, args.boundsWidth ?? Math.max(...xRange)],
                yRange: [top + Math.min(...range), top + Math.max(...range)],
            };
            projections.set(series.yAxis, options);
            return options;
        });
    };
}

export function projectInterpolatedAreaData(args: ProjectionArgs) {
    return projectAreaData({
        ...args,
        projectX: createAreaXProjector(args),
        prepareGeometry: createAreaGeometryPreparer(args),
    });
}
