import globals from 'globals';
import babelParser from '@babel/eslint-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory:     __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig:         js.configs.all
});

export default [...compat.extends('eslint:recommended'), {
    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser:      babelParser,
        ecmaVersion: 2021,
        sourceType:  'module',

        parserOptions: {
            requireConfigFile: false,
        },
    },

    rules: {
        'no-alert':                   2,
        'no-array-constructor':       2,
        'no-caller':                  2,
        'no-catch-shadow':            2,
        'no-console':                 0,
        'no-eval':                    2,
        'no-extend-native':           2,
        'no-extra-bind':              2,
        'no-implied-eval':            2,
        'no-iterator':                2,
        'no-label-var':               2,
        'no-labels':                  2,
        'no-lone-blocks':             2,
        'no-loop-func':               2,
        'no-multi-str':               2,
        'no-native-reassign':         2,
        'no-new':                     2,
        'no-new-func':                2,
        'no-new-object':              2,
        'no-new-wrappers':            2,
        'no-octal-escape':            2,
        'no-proto':                   2,
        'no-return-assign':           2,
        'no-script-url':              2,
        'no-sequences':               2,
        'no-shadow':                  2,
        'no-shadow-restricted-names': 2,
        'no-spaced-func':             2,
        'no-undef-init':              2,
        'no-unused-expressions':      2,
        'no-with':                    2,
        camelcase:                    2,
        'comma-spacing':              2,
        'consistent-return':          2,
        eqeqeq:                       2,
        semi:                         2,

        'semi-spacing': [2, {
            before: false,
            after:  true,
        }],

        'space-infix-ops': 2,

        'keyword-spacing': [2, {
            after: true,
        }],

        'space-unary-ops': [2, {
            words:    true,
            nonwords: false,
        }],

        yoda: [2, 'never'],

        'brace-style': [2, 'stroustrup', {
            allowSingleLine: false,
        }],

        'eol-last': 2,
        indent:     2,

        'key-spacing': [2, {
            align: 'value',
        }],

        'max-nested-callbacks': [2, 3],
        'new-parens':           2,
        'newline-after-var':    [2, 'always'],
        'no-lonely-if':         2,

        'no-multiple-empty-lines': [2, {
            max: 2,
        }],

        'no-nested-ternary':    2,
        'no-underscore-dangle': 0,
        'no-unneeded-ternary':  2,
        'object-curly-spacing': [2, 'always'],
        'operator-assignment':  [2, 'always'],
        quotes:                 [2, 'single', 'avoid-escape'],
        'space-before-blocks':  [2, 'always'],
        'prefer-const':         2,
        'no-path-concat':       2,
        'no-undefined':         2,
        strict:                 0,
        curly:                  [2, 'multi-or-nest'],
        'dot-notation':         0,
        'no-else-return':       2,
        'one-var':              [2, 'never'],

        'no-multi-spaces': [2, {
            exceptions: {
                VariableDeclarator:   true,
                AssignmentExpression: true,
            },
        }],

        radix:             2,
        'no-extra-parens': 2,

        'new-cap': [2, {
            capIsNew: false,
        }],

        'space-before-function-paren': [2, 'always'],
        'no-use-before-define':        [2, 'nofunc'],
        'handle-callback-err':         0,
    },
}];
