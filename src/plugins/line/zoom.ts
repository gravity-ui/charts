import type {AxisDomainValue, GetAxisDataArgs} from '~core/series/axis-contract';
import {getDomainPoints} from '~core/series/domain-points';

import type {LineSeries} from '../../types';
import {getVisiblePathYValues} from '../path-domain';

import {getCurveFactory} from './interpolation';

export function getLineAxisData({series, viewport}: GetAxisDataArgs<LineSeries>) {
    if (!viewport?.x.range) return undefined;
    const values: AxisDomainValue[] = [];
    for (const item of series) {
        const contribution =
            getVisiblePathYValues({
                points: item.data,
                viewport,
                curveFactory: getCurveFactory(item.interpolation),
            }) ?? Array.from(getDomainPoints(item.data, viewport), (point) => point?.y);
        for (const value of contribution) values.push(value);
    }
    return {domainValues: values};
}
