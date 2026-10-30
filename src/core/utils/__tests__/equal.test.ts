import {runInNewContext} from 'node:vm';

import {isDataEqual} from '../equal';

const view = (...bytes: number[]) => new DataView(new Uint8Array(bytes).buffer);

it('isDataEqual compares the bytes of DataViews in custom values', () => {
    expect(isDataEqual({custom: view(1, 2)}, {custom: view(9, 9)})).toBe(false);
    expect(isDataEqual({custom: view(1, 2)}, {custom: view(1, 2)})).toBe(true);
});

it('isDataEqual compares DataViews from another realm', () => {
    const foreign = runInNewContext('new DataView(new Uint8Array([9, 9]).buffer)');

    expect(isDataEqual({custom: view(1, 2)}, {custom: foreign})).toBe(false);
});

it('isDataEqual does not take an object tagged as DataView for one', () => {
    const tagged = (code: number) => ({[Symbol.toStringTag]: 'DataView', code});

    expect(isDataEqual({custom: tagged(1)}, {custom: tagged(2)})).toBe(false);
});

it('isDataEqual compares plain objects with a custom tag by their fields', () => {
    const tagged = (code: number) => ({[Symbol.toStringTag]: 'ChartMetadata', code});

    expect(isDataEqual({custom: tagged(1)}, {custom: tagged(1)})).toBe(true);
    expect(isDataEqual({custom: tagged(1)}, {custom: tagged(2)})).toBe(false);
});

it('isDataEqual tells DataViews with other offsets apart', () => {
    const buffer = new Uint8Array([1, 2, 1, 2]).buffer;

    expect(isDataEqual(new DataView(buffer, 0, 2), new DataView(buffer, 2, 2))).toBe(false);
});
