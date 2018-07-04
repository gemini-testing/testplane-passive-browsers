'use strict';

const parseConfig = require('../../lib/config');
const {mkConfig_} = require('./utils');

describe('config', () => {
    describe('enabled', () => {
        it('should be enabled by default', () => {
            assert.isTrue(parseConfig(mkConfig_()).enabled);
        });

        it('should throw error if option is not boolean', () => {
            assert.throws(
                () => parseConfig(mkConfig_({enabled: 'string'})),
                Error, `"enabled" option must be: Boolean, but got string`
            );
        });
    });

    describe('browsers', () => {
        it('should have default value', () => {
            assert.deepEqual(parseConfig(mkConfig_()).browsers, []);
        });

        it('should throw error if option is not string, regexp or array', () => {
            assert.throws(
                () => parseConfig(mkConfig_({browsers: 100500})),
                Error, `option must be: String or RegExp or Array, but got number`
            );
        });

        describe('should not throw error if an option set as', () => {
            it('String', () => {
                assert.doesNotThrow(() => parseConfig(mkConfig_({browsers: 'string'})));
            });

            it('RegExp', () => {
                assert.doesNotThrow(() => parseConfig(mkConfig_({browsers: /regexp/})));
            });

            it('Array', () => {
                assert.doesNotThrow(() => parseConfig(mkConfig_({browsers: ['str1']})));
            });
        });
    });

    describe('commandName', () => {
        it('should throw error if option is not string', () => {
            assert.throws(
                () => parseConfig(mkConfig_({commandName: 100500})),
                Error, `"commandName" option must be: String, but got number`
            );
        });
    });
});
