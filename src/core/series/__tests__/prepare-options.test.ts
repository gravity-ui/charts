import {getPreparedOptions} from '../prepare-options';

it('keeps the defaults of every series type when they share one options object', () => {
    const common = {states: {hover: {enabled: false}}};

    const options = getPreparedOptions({line: common, 'bar-x': common});

    expect(options['bar-x']).toMatchObject({
        groupPadding: getPreparedOptions()['bar-x'].groupPadding,
        barPadding: getPreparedOptions()['bar-x'].barPadding,
        states: {hover: {enabled: false}},
    });
    expect(options.line).toMatchObject({states: {hover: {enabled: false}}});
});

it('copies nested plugin defaults before applying user options', () => {
    const options = getPreparedOptions({'bar-x': {states: {hover: {enabled: false}}}});
    expect(options['bar-x'].states?.hover).toEqual({enabled: false, brightness: 0.3});
    expect(getPreparedOptions()['bar-x'].states?.hover).toEqual({enabled: true, brightness: 0.3});
    options['bar-x'].barPadding = 0.8;
    expect(getPreparedOptions()['bar-x'].barPadding).toBe(0.2);
    expect(getPreparedOptions().radar?.states?.inactive).toEqual({enabled: true, opacity: 0.5});
    expect(getPreparedOptions().heatmap?.states).toEqual({hover: {enabled: true, brightness: 0.3}});
});
