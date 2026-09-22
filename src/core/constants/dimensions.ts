// Nonnegative decimal sizes, without whitespace or exponent notation.
// A leading dot is allowed (.5px, .5%), but a trailing dot is not (25.px, 25.%).
export const SIZE_REGEXP = /^(\d+(?:\.\d+)?|\.\d+)(px|%)$/;
