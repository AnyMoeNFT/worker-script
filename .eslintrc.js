module.exports = {
  extends: ['alloy', 'alloy/typescript', 'prettier'],
  env: {
    node: true,
  },
  rules: {
    '@typescript-eslint/explicit-member-accessibility': 0,
  },
};
