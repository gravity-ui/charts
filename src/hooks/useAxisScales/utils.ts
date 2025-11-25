import get from 'lodash/get';

import type {PreparedAxis} from '../../hooks';
import type {ChartAxis} from '../../types';

type OptionalNumber = number | undefined;

function getNormilizedMinMax(args: {
    maxValues: OptionalNumber[];
    minValues: OptionalNumber[];
}): OptionalNumber[] {
    const {maxValues, minValues} = args;
    const filteredMaxValues = maxValues.filter((v) => typeof v === 'number');
    const filteredMinValues = minValues.filter((v) => typeof v === 'number');
    const max = filteredMaxValues.length ? Math.max(...filteredMaxValues) : undefined;
    const min = filteredMinValues.length ? Math.min(...filteredMinValues) : undefined;

    return [min, max];
}

export function getMinMaxPropsOrState(args: {
    axis: PreparedAxis | ChartAxis;
    maxValues: OptionalNumber[];
    minValues: OptionalNumber[];
}): [OptionalNumber, OptionalNumber] {
    const {axis, maxValues, minValues} = args;
    const minProps = get(axis, 'min');
    const maxProps = get(axis, 'max');
    const [minState, maxState] = getNormilizedMinMax({maxValues, minValues});
    const min = minState ?? minProps;
    const max = maxState ?? maxProps;

    return [min, max];
}
