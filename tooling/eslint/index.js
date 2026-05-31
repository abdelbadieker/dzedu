module.exports = {
  root: true,
  extends: ['next'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    'react/no-unescaped-entities': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
