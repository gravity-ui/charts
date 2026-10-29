import {validateData} from '~core/validation';

import {CHART_ERROR_CODE} from '../../libs';
import type {WaterfallSeries} from '../../types';

function validateConnectors(connectors: unknown) {
    const series: WaterfallSeries = {
        type: 'waterfall',
        name: 'Balance',
        data: [{x: 0, y: 10}],
        // Exercise runtime input that does not necessarily conform to the public type.
        connectors: connectors as WaterfallSeries['connectors'],
    };
    validateData({series: {data: [series]}});
}

describe('waterfall connector validation', () => {
    test.each([undefined, {}, {enabled: undefined}, {enabled: true}, {enabled: false}])(
        'accepts valid options: %j',
        (connectors) => {
            expect(() => validateConnectors(connectors)).not.toThrow();
        },
    );

    test.each(['false', 'true', 0, 1, null, [], {}])(
        'rejects non-boolean enabled: %j',
        (enabled) => {
            expect(() => validateConnectors({enabled})).toThrow(
                expect.objectContaining({
                    code: CHART_ERROR_CODE.INVALID_DATA,
                    message: 'waterfall.connectors.enabled must be a boolean',
                }),
            );
        },
    );

    test.each([null, false, 'false', 0, []])('rejects invalid options: %j', (connectors) => {
        expect(() => validateConnectors(connectors)).toThrow(
            expect.objectContaining({
                code: CHART_ERROR_CODE.INVALID_DATA,
                message: 'waterfall.connectors must be an object',
            }),
        );
    });
});
