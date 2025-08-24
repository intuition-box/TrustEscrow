#!/usr/bin/env tsx

/**
 * Test script to verify Trust Escrow integration
 * This script checks that all components are properly set up
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT_DIR = join(__dirname, "..");

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  message: string;
}

function testFileExists(filePath: string, description: string): TestResult {
  if (existsSync(filePath)) {
    return {
      name: description,
      status: "PASS",
      message: `File exists: ${filePath}`,
    };
  } else {
    return {
      name: description,
      status: "FAIL",
      message: `File missing: ${filePath}`,
    };
  }
}

function testFileContent(filePath: string, description: string, requiredContent: string[]): TestResult {
  if (!existsSync(filePath)) {
    return {
      name: description,
      status: "FAIL",
      message: `File missing: ${filePath}`,
    };
  }

  try {
    const content = readFileSync(filePath, "utf8");
    const missingContent = requiredContent.filter(item => !content.includes(item));

    if (missingContent.length === 0) {
      return {
        name: description,
        status: "PASS",
        message: `All required content found in ${filePath}`,
      };
    } else {
      return {
        name: description,
        status: "FAIL",
        message: `Missing content: ${missingContent.join(", ")}`,
      };
    }
  } catch (error) {
    return {
      name: description,
      status: "FAIL",
      message: `Error reading file: ${error}`,
    };
  }
}

function runTests(): TestResult[] {
  const tests: TestResult[] = [];

  // Test file existence
  tests.push(testFileExists(join(ROOT_DIR, "components/TrustEscrowApp.tsx"), "TrustEscrowApp Component"));

  tests.push(testFileExists(join(ROOT_DIR, "styles/trust-escrow.css"), "Trust Escrow CSS"));

  tests.push(testFileExists(join(ROOT_DIR, "app/escrow/page.tsx"), "Escrow Page Route"));

  tests.push(testFileExists(join(ROOT_DIR, "config/contracts.ts"), "Contract Configuration"));

  tests.push(testFileExists(join(ROOT_DIR, "types/contracts/TrustEscrow.ts"), "TrustEscrow ABI"));

  tests.push(testFileExists(join(ROOT_DIR, "types/contracts/TrustEscrowFactory.ts"), "TrustEscrowFactory ABI"));

  // Test file content
  tests.push(
    testFileContent(join(ROOT_DIR, "components/TrustEscrowApp.tsx"), "TrustEscrowApp Imports", [
      "TrustEscrowFactoryABI",
      "TrustEscrowABI",
      "getContractAddress",
    ]),
  );

  tests.push(
    testFileContent(join(ROOT_DIR, "components/Header.tsx"), "Header Navigation", ["Trust Escrow", "/escrow"]),
  );

  tests.push(testFileContent(join(ROOT_DIR, "app/layout.tsx"), "Layout CSS Import", ["trust-escrow.css"]));

  return tests;
}

function main() {
  console.log("🧪 Testing Trust Escrow Integration...\n");

  const results = runTests();

  let passCount = 0;
  let failCount = 0;

  results.forEach(result => {
    const icon = result.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} ${result.name}: ${result.message}`);

    if (result.status === "PASS") {
      passCount++;
    } else {
      failCount++;
    }
  });

  console.log(`\n📊 Test Results: ${passCount} PASS, ${failCount} FAIL`);

  if (failCount === 0) {
    console.log("\n🎉 All tests passed! Your Trust Escrow integration is ready.");
    console.log("\n📋 Next Steps:");
    console.log("1. Deploy your contracts: cd ../hardhat && npm run deploy");
    console.log("2. Update contract addresses in config/contracts.ts");
    console.log("3. Start your app: npm run dev");
    console.log("4. Visit /escrow to test the integration");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the issues above.");
    console.log("\n🔧 To fix issues:");
    console.log("1. Run: bun run tsx scripts/setup-escrow.ts update");
    console.log("2. Check file paths and content");
    console.log("3. Re-run tests: bun run tsx scripts/test-integration.ts");
  }
}

if (require.main === module) {
  main();
}
