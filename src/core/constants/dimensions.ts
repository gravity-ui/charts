// Nonnegative decimal sizes, without whitespace or exponent notation.
// A leading dot is allowed (.5px, .5%), but a trailing dot is not (25.px, 25.%).
export const PIXEL_SIZE_REGEXP = /^(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)px$/;
export const PERCENTAGE_SIZE_REGEXP = /^(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)%$/;
