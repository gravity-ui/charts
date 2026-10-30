import {isDataEqual} from '../equal';

const view = (...bytes: number[]) => new DataView(new Uint8Array(bytes).buffer);

it('isDataEqual compares the bytes of DataViews in custom values', () => {
    expect(isDataEqual({custom: view(1, 2)}, {custom: view(9, 9)})).toBe(false);
    expect(isDataEqual({custom: view(1, 2)}, {custom: view(1, 2)})).toBe(true);
});
