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

it('isDataEqual compares class instances with a tag field by their fields', () => {
    class Price {
        value: number;
        constructor(value: number) {
            this.value = value;
        }
    }
    // As decimal.js tags its Decimal.
    Object.assign(Price.prototype, {[Symbol.toStringTag]: 'Price'});

    expect(isDataEqual({custom: new Price(1)}, {custom: new Price(1)})).toBe(true);
    expect(isDataEqual({custom: new Price(1)}, {custom: new Price(2)})).toBe(false);
});

it('isDataEqual takes objects with a getter tag for unequal, as lodash did', () => {
    // Its state may be private, so equal fields do not make the objects equal.
    class Price {
        #value: number;
        constructor(value: number) {
            this.#value = value;
        }
        valueOf() {
            return this.#value;
        }
        get [Symbol.toStringTag]() {
            return 'Price';
        }
    }

    expect(isDataEqual({custom: new Price(1)}, {custom: new Price(2)})).toBe(false);
});

it('isDataEqual ignores the order of Maps in tagged objects', () => {
    const tagged = (entries: [string, number][]) => ({
        [Symbol.toStringTag]: 'Meta',
        m: new Map(entries),
    });

    expect(
        isDataEqual(
            tagged([
                ['a', 1],
                ['b', 2],
            ]),
            tagged([
                ['b', 2],
                ['a', 1],
            ]),
        ),
    ).toBe(true);
});

it('isDataEqual stops at cycles of tagged objects with different shapes', () => {
    const node = () => ({[Symbol.toStringTag]: 'Node'}) as Record<string, unknown>;
    const a = node();
    a.self = a;
    const b1 = node();
    const b2 = node();
    b1.self = b2;
    b2.self = b1;

    expect(isDataEqual(a, b1)).toBe(false);
});

it('isDataEqual tells DataViews with other offsets apart', () => {
    const buffer = new Uint8Array([1, 2, 1, 2]).buffer;

    expect(isDataEqual(new DataView(buffer, 0, 2), new DataView(buffer, 2, 2))).toBe(false);
});
