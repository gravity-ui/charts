import type {PreparedSeries} from '../../../core/series/types';
import type {GradientLayoutReference} from '../../../hooks/useShapes/types';
import {isGradientReferenceCurrent} from '../gradientReferenceCache';

const series = [] as PreparedSeries[];
const entry = {
    data: {} as GradientLayoutReference,
    allPreparedSeries: series,
    width: 600,
    height: 400,
    activeLegendItems: ['first'],
};

test('reuses a full-series reference when the view alone changes', () => {
    expect(
        isGradientReferenceCurrent(entry, {
            ...entry,
            activeLegendItems: [...entry.activeLegendItems],
        }),
    ).toBe(true);
});

test.each([
    ['width', {width: 601}],
    ['height', {height: 401}],
    ['series data', {allPreparedSeries: [] as PreparedSeries[]}],
    ['legend selection', {activeLegendItems: ['second']}],
])('invalidates a full-series reference when %s changes', (_name, changes) => {
    expect(isGradientReferenceCurrent(entry, {...entry, ...changes})).toBe(false);
});
