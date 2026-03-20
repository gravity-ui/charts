import {DATETIME_LABEL_FORMATS, TIME_UNITS, getDefaultDateFormat} from '../time';

describe('getDefaultDateFormat', () => {
    it('without overrides matches DATETIME_LABEL_FORMATS by inferred unit', () => {
        const twoHours = 2 * TIME_UNITS.hour;
        expect(getDefaultDateFormat(twoHours)).toBe(DATETIME_LABEL_FORMATS.hour);
    });

    it('merges partial overrides; overridden unit uses custom string', () => {
        const twoHours = 2 * TIME_UNITS.hour;
        expect(getDefaultDateFormat(twoHours, {hour: 'HH:mm'})).toBe('HH:mm');
    });

    it('merges partial overrides; non-overridden units keep defaults', () => {
        const oneDay = TIME_UNITS.day;
        expect(getDefaultDateFormat(oneDay, {hour: 'HH:mm'})).toBe(DATETIME_LABEL_FORMATS.day);
    });

    it('when range is undefined, returns effective day format including overrides', () => {
        expect(getDefaultDateFormat(undefined, {day: 'YYYY-MM-DD'})).toBe('YYYY-MM-DD');
    });

    it('when range is undefined without overrides, returns default day format', () => {
        expect(getDefaultDateFormat()).toBe(DATETIME_LABEL_FORMATS.day);
    });
});
