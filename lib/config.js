'use strict';

const configParser = require('gemini-configparser');

const {root, section, option} = configParser;
const ENV_PREFIX = 'hermione_passive_browsers_';
const CLI_PREFIX = '--hermione-passive-browsers-';

const assertRequestedType = (name, type) => {
    type = [].concat(type);

    return (v) => {
        const result = type.some((t) => v.constructor.name === t);

        if (!result) {
            throw new Error(`"${name}" option must be: ${type.join(' or ')}, but got ${typeof v}`);
        }
    };
};

const isBoolean = (name) => assertRequestedType(name, 'Boolean');
const isString = (name) => assertRequestedType(name, 'String');

const getParser = () => {
    return root(section({
        enabled: option({
            defaultValue: true,
            parseEnv: JSON.parse,
            parseCli: JSON.parse,
            validate: isBoolean('enabled')
        }),
        browsers: option({
            defaultValue: [],
            validate: assertRequestedType(
                'browsers',
                ['String', 'RegExp', 'Array']
            )
        }),
        commandName: option({
            validate: isString('commandName')
        })
    }), {envPrefix: ENV_PREFIX, cliPrefix: CLI_PREFIX});
};

module.exports = (options) => {
    const env = process.env;
    const argv = process.argv;

    return getParser()({options, env, argv});
};
