module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    extends: ['plugin:@typescript-eslint/recommended', 'prettier/@typescript-eslint', 'plugin:prettier/recommended'],
    ignorePatterns: ['src/api/**/*.ts'],
    rules: {
        '@typescript-eslint/interface-name-prefix': 'warn',
        '@typescript-eslint/no-namespace': 'warn',
    },
}
