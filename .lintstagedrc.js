const path = require("path");

const buildNextEslintCommand = (filenames) =>
  `bun run next:lint --fix --file ${filenames
    .map((f) => path.relative(path.join("packages", "nextjs"), f))
    .join(" --file ")}`;

const checkTypesNextCommand = () => "bun run next:check-types:exclude-trust";

const buildHardhatEslintCommand = (filenames) =>
  `bun run hardhat:lint-staged --fix ${filenames
    .map((f) => path.relative(path.join("packages", "hardhat"), f))
    .join(" ")}`;

const checkTypesHardhatCommand = () => "bun run hardhat:check-types";

module.exports = {
  "packages/nextjs/**/*.{ts,tsx,js,jsx}": [
    buildNextEslintCommand,
    checkTypesNextCommand,
  ],
  "packages/hardhat/**/*.{ts,tsx,js,jsx}": [
    buildHardhatEslintCommand,
    checkTypesHardhatCommand,
  ],
};
