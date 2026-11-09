import isEqual from 'es-toolkit/compat/isEqual';

import type {DomainAxis} from '~core/series/axis-contract';
import {getDataCategoryValue} from '~core/utils';

import type {AreaSeries, AreaSeriesData} from '../../../types';

interface AreaStackSeries {
    data: readonly AreaSeriesData[];
    fullData?: readonly AreaSeriesData[];
}

interface StackContext {
    dataArrays: readonly (readonly AreaSeriesData[])[];
    axisType: DomainAxis['type'];
    categories: DomainAxis['categories'];
    dataMaps: Map<string, AreaSeriesData>[];
    neighbors: Map<string, {prev?: string; next?: string}>;
}

const stackContexts = new WeakMap<readonly AreaSeriesData[], Map<boolean, StackContext>>();

/** Full-stack neighbors keep gap handling stable when zoom retains only part of the data. */
export function getAreaStackContext(
    series: readonly AreaStackSeries[],
    axis: Pick<DomainAxis, 'type' | 'categories'>,
    reversed: boolean,
): StackContext {
    const dataArrays = series.map((item) => item.fullData ?? item.data);
    const contexts = stackContexts.get(dataArrays[0]);
    const cached = contexts?.get(reversed);
    if (
        cached &&
        cached.axisType === axis.type &&
        isEqual(cached.categories, axis.categories) &&
        cached.dataArrays.length === dataArrays.length &&
        cached.dataArrays.every((data, index) => data === dataArrays[index])
    ) {
        return cached;
    }

    const categories = Array.from(axis.categories ?? []);
    const keys = new Set<string>();
    const dataMaps = dataArrays.map((data) => {
        const map = new Map<string, AreaSeriesData>();
        data.forEach((point) => {
            if (
                axis.type !== 'category' &&
                (point.x === null || !Number.isFinite(Number(point.x)))
            ) {
                return;
            }
            const key = String(
                axis.type === 'category'
                    ? getDataCategoryValue({axisDirection: 'x', categories, data: point})
                    : point.x,
            );
            keys.add(key);
            map.set(key, point);
        });
        return map;
    });
    const orderedKeys =
        axis.type === 'category'
            ? categories.filter((category) => keys.has(category))
            : Array.from(keys).sort((a, b) =>
                  reversed ? Number(b) - Number(a) : Number(a) - Number(b),
              );
    const neighbors = new Map(
        orderedKeys.map((key, index) => [
            key,
            {prev: orderedKeys[index - 1], next: orderedKeys[index + 1]},
        ]),
    );
    const context = {
        dataArrays,
        dataMaps,
        neighbors,
        axisType: axis.type,
        categories: axis.categories,
    };
    const nextContexts = contexts ?? new Map<boolean, StackContext>();
    nextContexts.set(reversed, context);
    stackContexts.set(dataArrays[0], nextContexts);
    return context;
}

export function getAreaNeighborPoint(
    data: ReadonlyMap<string, AreaSeriesData> | undefined,
    key: string | undefined,
) {
    return key === undefined ? undefined : data?.get(key);
}

interface StackOffsets {
    prev: number;
    next: number;
}

interface StackPointArgs {
    key: string;
    value: number;
    prev?: AreaSeriesData;
    next?: AreaSeriesData;
    nullMode?: AreaSeries['nullMode'];
}

/** Signed offsets on each side of an X coordinate; explicit gaps stop that side's contribution. */
export function createAreaStackAccumulator() {
    const positive = new Map<string, StackOffsets>();
    const negative = new Map<string, StackOffsets>();
    return ({key, value, prev, next, nullMode}: StackPointArgs): StackOffsets => {
        const totals = value >= 0 ? positive : negative;
        const offsets = totals.get(key) ?? {prev: 0, next: 0};
        const connectNull = nullMode === 'zero';
        totals.set(key, {
            prev: prev?.y !== null || connectNull ? offsets.prev + value : offsets.prev,
            next: next?.y !== null || connectNull ? offsets.next + value : offsets.next,
        });
        return offsets;
    };
}
