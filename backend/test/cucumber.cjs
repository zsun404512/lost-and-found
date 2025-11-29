module.exports = {
  // Run from backend/; paths are relative to backend/test
  default: "--require test/steps/**/*.cjs --require test/support/**/*.cjs test/features/**/*.feature",
};
