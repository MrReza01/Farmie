import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Base recommended rules
  js.configs.recommended,

  // Your custom environment
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },

  // Prettier config goes LAST to turn off conflicting formatting rules
  eslintConfigPrettier,
];
