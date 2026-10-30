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
