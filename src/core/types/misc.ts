/**
 * A utilitarian type to describe `any` when it does not contradict the typescript usage paradigm.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MeaningfulAny = any;

export type PointPosition = [number, number];

/**
 * Makes all properties in T required, including nested objects.
 * Inspired by: https://stackoverflow.com/a/76927120
 */
export type DeepRequired<T> = Required<{
    [K in keyof T]: T[K] extends Required<T[K]> ? T[K] : DeepRequired<T[K]>;
}>;

/**
 * Makes all properties in T optional, including nested objects.
 */
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
