import {parseLegendWidth} from '../legend';

describe('parseLegendWidth', () => {
    test.each([
        -10,
        -0.5,
        NaN,
        Infinity,
        -Infinity,
        '',
        '%',
        '25',
        'px',
        '.px',
        '25em',
        '25.px',
        '25.5.5px',
        '-25px',
        '-0px',
        ' 25px',
        '25px ',
        '25px\n',
        '1e2px',
        '23e5px',
        'NaNpx',
        'Infinitypx',
        `${'9'.repeat(400)}px`,
        '25px%',
        '25.%',
        '25.5.5%',
        '-25%',
        ' 25%',
        '25%\n',
        '25%\r',
        '25%\r\n',
        '25%\u2028',
        '25%\u2029',
        '1e2%',
        'NaN%',
        'Infinity%',
        `${'9'.repeat(400)}%`,
        true,
        {},
        [],
        null,
        undefined,
    ])('returns undefined for invalid width %p', (width) => {
        expect(parseLegendWidth(width)).toBeUndefined();
    });

    test.each([
        {width: 0, value: 0, unit: 'px'},
        {width: 230, value: 230, unit: 'px'},
        {width: '.5px', value: 0.5, unit: 'px'},
        {width: '230px', value: 230, unit: 'px'},
        {width: '0%', value: 0, unit: '%'},
        {width: '12.5%', value: 12.5, unit: '%'},
        {width: '.5%', value: 0.5, unit: '%'},
        {width: '150%', value: 150, unit: '%'},
    ])('parses the magnitude and unit (%j)', ({width, value, unit}) => {
        expect(parseLegendWidth(width)).toEqual({value, unit});
    });
});
