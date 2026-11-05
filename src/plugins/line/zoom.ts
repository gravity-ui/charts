import {getDomainPoints} from '~core/series/domain-points';
import type {AxisDomainValue, GetAxisDomainValuesArgs} from '~core/series/plugin';

import type {LineSeries} from '../../types';
import {getVisiblePathYValues} from '../path-domain';

export function getLineAxisDomainValues({
    series,
    axis,
    viewport,
}: GetAxisDomainValuesArgs<LineSeries>) {
    if (axis !== 'y' || !viewport?.x.range) return undefined;
    const values: AxisDomainValue[] = [];
    for (const item of series) {
        const interpolation = item.interpolation;
        const contribution =
            interpolation && interpolation.type !== 'linear' && interpolation.type !== 'step'
                ? Array.from(getDomainPoints(item.data, viewport), (point) => point?.y)
                : getVisiblePathYValues({
                      points: item.data,
                      viewport,
                      step:
                          item.interpolation?.type === 'step'
                              ? (item.interpolation.position ?? 'after')
                              : undefined,
                  });
        if (!contribution) return undefined;
        for (const value of contribution) values.push(value);
    }
    return values;
}
