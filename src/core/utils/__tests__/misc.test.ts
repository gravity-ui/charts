import {getUniqId} from '../misc';

afterEach(() => jest.restoreAllMocks());

test('generated IDs remain distinct when the random source repeats', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(getUniqId()).not.toBe(getUniqId());
});
