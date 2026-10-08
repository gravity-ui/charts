import {getMinSpaceBetween} from '../array';

it('includes the interval following zero', () => {
    expect(getMinSpaceBetween([0, 1, 10], (value) => value)).toBe(1);
    expect(getMinSpaceBetween([0, 1], (value) => value)).toBe(1);
});
