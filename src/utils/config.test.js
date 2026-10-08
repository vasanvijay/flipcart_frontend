import { isFeatureEnabled } from './config';

describe('isFeatureEnabled', () => {
    test.each(['true', 'TRUE', '1', 'yes', 'on'])('enables the feature for %s', (value) => {
        expect(isFeatureEnabled(value)).toBe(true);
    });

    test.each([undefined, '', 'false', '0', 'no', 'off'])('keeps the feature disabled for %s', (value) => {
        expect(isFeatureEnabled(value)).toBe(false);
    });
});
