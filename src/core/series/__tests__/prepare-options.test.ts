import {seriesOptionsDefaults} from '../../constants';
import {getPreparedOptions} from '../prepare-options';

it('keeps the defaults of every series type when they share one options object', () => {
    const common = {states: {hover: {enabled: false}}};

    const options = getPreparedOptions({line: common, 'bar-x': common});

    expect(options['bar-x']).toMatchObject({
        groupPadding: seriesOptionsDefaults['bar-x'].groupPadding,
        barPadding: seriesOptionsDefaults['bar-x'].barPadding,
        states: {hover: {enabled: false}},
    });
    expect(options.line).toMatchObject({states: {hover: {enabled: false}}});
});

it('restores absent options and null sizing fields from JSON', () => {
    const options = getPreparedOptions(
        JSON.parse(
            '{"waterfall":null,"bar-x":{"barMaxWidth":null,"barPadding":0.7,"opacity":null},"bar-y":{"groupPadding":null}}',
        ),
    );
    expect(options.waterfall).toEqual(seriesOptionsDefaults.waterfall);
    expect(options['bar-x']).toMatchObject({barMaxWidth: 50, barPadding: 0.7, opacity: null});
    expect(options['bar-y'].groupPadding).toBe(0.1);
});
