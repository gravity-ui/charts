import type {GradientLayoutReference} from '../../hooks/useShapes/types';

import {prepareAxisLayout} from './prepareAxisLayout';

type Args = Parameters<typeof prepareAxisLayout>[0];

/** Use the unfiltered layout even when a chart first opens with a selected range. */
export async function prepareGradientReference(args: Args): Promise<GradientLayoutReference> {
    return {...(await prepareAxisLayout(args)), series: args.preparedSeries};
}
