import {getPreparedOptions} from '../prepare-options';

it('keeps independent plugin defaults when sharing and changing user options', () => {
    const common = {states: {hover: {enabled: false}}};

    const options = getPreparedOptions({line: common, 'bar-x': common});

    expect(options['bar-x']).toMatchObject({
        groupPadding: getPreparedOptions()['bar-x'].groupPadding,
        barPadding: getPreparedOptions()['bar-x'].barPadding,
        states: {hover: {enabled: false, brightness: 0.3}},
    });
    expect(options.line).toMatchObject({states: {hover: {enabled: false}}});
    options['bar-x'].barPadding = 0.8;
    expect(getPreparedOptions()['bar-x']).toMatchObject({
        barPadding: 0.2,
        states: {hover: {enabled: true, brightness: 0.3}},
    });
});
