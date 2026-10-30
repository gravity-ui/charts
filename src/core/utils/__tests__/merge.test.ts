import {merge} from '../merge';

it('merges an object shared by several paths into each path on its own', () => {
    const shared = {width: 2};

    const result = merge({a: {color: 'red'}, b: {color: 'blue'}}, {a: shared, b: shared});

    expect(result).toEqual({a: {color: 'red', width: 2}, b: {color: 'blue', width: 2}});
});

it('merges an object shared by two sources into each path on its own', () => {
    const shared = {width: 2};

    const result = merge({}, {a: shared}, {b: shared}, {a: {width: 3}});

    expect(result).toEqual({a: {width: 3}, b: {width: 2}});
    expect(shared).toEqual({width: 2});
});

it('puts a date of a source in place of a target object', () => {
    const date = new Date(0);

    expect(merge({a: {x: 1}}, {a: date}).a).toBe(date);
});

it('does not change a source object merged in place of a function', () => {
    const source = {a: {x: 1}};

    merge({a: () => 1}, source, {a: {y: 2}});

    expect(source).toEqual({a: {x: 1}});
});

it('keeps functions and handles cycles in a source with shared objects', () => {
    const format = () => 'x';
    const shared: Record<string, unknown> = {format};
    shared.self = shared;

    const result = merge({}, {a: shared, b: shared});

    expect(result.a.format).toBe(format);
    expect(result.b.format).toBe(format);
});
