import {getMinSpaceBetween, groupBy} from '../array';

it('includes the interval following zero', () => {
    expect(getMinSpaceBetween([0, 1, 10], (value) => value)).toBe(1);
    expect(getMinSpaceBetween([0, 1], (value) => value)).toBe(1);
});

it('groupBy keeps a "__proto__" key as a group of its own', () => {
    const groups = groupBy(['__proto__', 'a', '__proto__'], (value) => value);

    expect(Object.entries(groups)).toEqual([
        ['__proto__', ['__proto__', '__proto__']],
        ['a', ['a']],
    ]);
});
