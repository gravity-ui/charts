import type * as LinePlugin from '../../../plugins/line';
import type * as Preparation from '../prepare-options';
import {getPreparedOptions} from '../prepare-options';
import type * as Registry from '../seriesRegistry';

it('merges shared user options independently and preserves plugin defaults', () => {
    const common = {states: {hover: {enabled: false}}};

    const options = getPreparedOptions({line: common, 'bar-x': common});

    expect(options['bar-x']).toMatchObject({
        groupPadding: 0.1,
        barPadding: 0.2,
        states: {hover: {enabled: false, brightness: 0.3}},
    });
    expect(options.line?.states?.hover).toEqual({enabled: false, brightness: 0.3});
    expect(options.line).not.toHaveProperty('barPadding');
    expect(common).toEqual({states: {hover: {enabled: false}}});
    options['bar-x'].barPadding = 0.8;
    expect(getPreparedOptions()['bar-x']).toMatchObject({
        barPadding: 0.2,
        states: {hover: {enabled: true, brightness: 0.3}},
    });
});

it('reads defaults from the registered plugin', () => {
    jest.isolateModules(() => {
        const {registerSeriesPlugin} = jest.requireActual<typeof Registry>('../seriesRegistry');
        const {getPreparedOptions: prepareOptions} =
            jest.requireActual<typeof Preparation>('../prepare-options');
        const {linePlugin} = jest.requireActual<typeof LinePlugin>('../../../plugins/line');
        registerSeriesPlugin({...linePlugin, optionsDefaults: {lineWidth: 7}});

        expect(prepareOptions()).toEqual({line: {lineWidth: 7}});
    });
});
