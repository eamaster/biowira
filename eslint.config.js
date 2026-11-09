import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'

export default [
  // ── Global ignores ─────────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      'scripts/**',
      'e2e/**',         // Playwright has its own tsconfig
      '*.config.js',
    ],
  },

  // ── Base JS rules ──────────────────────────────────────────────────────────
  js.configs.recommended,

  // ── Vue recommended ────────────────────────────────────────────────────────
  ...pluginVue.configs['flat/recommended'],

  // ── TypeScript + Vue combined config ───────────────────────────────────────
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      // Provide browser + ES2022 globals so we don't get false no-undef errors
      // for window, document, fetch, structuredClone, HTMLElement, etc.
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // ── Console ──────────────────────────────────────────────────────────
      // Allow console.error / .warn (used in catch blocks across repositories)
      'no-console': ['warn', { allow: ['error', 'warn'] }],

      // ── Variables ────────────────────────────────────────────────────────
      // TypeScript checks undefined variables better than ESLint's no-undef
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          // Vue <script setup> defineProps() return is consumed by the template;
          // the assignment itself is just for TypeScript typing context.
          varsIgnorePattern: '^(_|props)$',
        },
      ],

      // ── Vue component conventions ─────────────────────────────────────────
      // Single-word names are fine for page components (HomePage, QuizPage…)
      'vue/multi-word-component-names': 'off',

      // Enforce <script setup> SFC style everywhere
      'vue/component-api-style': ['error', ['script-setup']],

      // Enforce type-based declarations (no string-array Options API)
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/define-props-declaration': ['error', 'type-based'],

      // Require :key on v-for
      'vue/require-v-for-key': 'error',

      // ── Formatting — set to warn so CI doesn't block on style ─────────────
      // These are enforced by Prettier; keep as warnings only.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': ['warn', {
        html: { void: 'never', normal: 'never', component: 'always' },
      }],
      'vue/attributes-order': ['warn', { alphabetical: false }],

      // No v-html (XSS risk — we don't use it)
      'vue/no-v-html': 'warn',

      // ── General quality ───────────────────────────────────────────────────
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  // ── Test file overrides ────────────────────────────────────────────────────
  {
    files: ['src/test/**/*.ts', 'e2e/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Tests define multiple inline components — that's fine
      'vue/one-component-per-file': 'off',
      // Tests often use console for debugging
      'no-console': 'off',
    },
  },
]
