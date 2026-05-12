import {isPointDataLabelEnabled, shouldPrepareSeriesDataLabels} from '../data-labels';
import {isPointTooltipEnabled} from '../tooltip-helpers';

describe('isPointTooltipEnabled', () => {
    it('returns true when nothing is set', () => {
        expect(isPointTooltipEnabled({})).toBe(true);
    });

    it('returns true when only series is enabled', () => {
        expect(isPointTooltipEnabled({series: {tooltip: {enabled: true}}})).toBe(true);
    });

    it('returns false when series is disabled and point has no override', () => {
        expect(isPointTooltipEnabled({series: {tooltip: {enabled: false}}})).toBe(false);
    });

    it('point override takes precedence over series — point=true wins over series=false', () => {
        expect(
            isPointTooltipEnabled({
                series: {tooltip: {enabled: false}},
                data: {tooltip: {enabled: true}},
            }),
        ).toBe(true);
    });

    it('point override takes precedence over series — point=false wins over series=true', () => {
        expect(
            isPointTooltipEnabled({
                series: {tooltip: {enabled: true}},
                data: {tooltip: {enabled: false}},
            }),
        ).toBe(false);
    });
});

describe('isPointDataLabelEnabled', () => {
    it('returns true when nothing is set', () => {
        expect(isPointDataLabelEnabled({})).toBe(true);
    });

    it('returns false when series is disabled and point has no override', () => {
        expect(isPointDataLabelEnabled({series: {dataLabels: {enabled: false}}})).toBe(false);
    });

    it('point override takes precedence — point=true wins over series=false', () => {
        expect(
            isPointDataLabelEnabled({
                series: {dataLabels: {enabled: false}},
                data: {dataLabels: {enabled: true}},
            }),
        ).toBe(true);
    });

    it('point override takes precedence — point=false wins over series=true', () => {
        expect(
            isPointDataLabelEnabled({
                series: {dataLabels: {enabled: true}},
                data: {dataLabels: {enabled: false}},
            }),
        ).toBe(false);
    });
});

describe('shouldPrepareSeriesDataLabels', () => {
    it('returns true when series-level is enabled', () => {
        expect(shouldPrepareSeriesDataLabels({dataLabels: {enabled: true}, data: []})).toBe(true);
    });

    it('returns false when series-level is disabled and no point opts in', () => {
        expect(
            shouldPrepareSeriesDataLabels({
                dataLabels: {enabled: false},
                data: [{dataLabels: {enabled: false}}, {}],
            }),
        ).toBe(false);
    });

    it('returns true when series-level is disabled but a point opts in', () => {
        expect(
            shouldPrepareSeriesDataLabels({
                dataLabels: {enabled: false},
                data: [{}, {dataLabels: {enabled: true}}],
            }),
        ).toBe(true);
    });

    it('returns false when series.dataLabels and data are missing', () => {
        expect(shouldPrepareSeriesDataLabels({})).toBe(false);
    });
});
