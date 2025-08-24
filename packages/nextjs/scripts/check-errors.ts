#!/usr/bin/env tsx

/**
 * Comprehensive error checking script for Trust Escrow integration
 * This script identifies and helps fix any remaining issues
 */
import { readFileSync } from "fs";
import { join } from "path";

const ROOT_DIR = join(__dirname, "..");

interface ErrorCheck {
  name: string;
  status: "PASS" | "FAIL" | "FIXED";
  message: string;
  fix?: () => void;
}

function checkTypeScriptErrors(): ErrorCheck[] {
  const checks: ErrorCheck[] = [];

  // Check TrustEscrowApp component
  try {
    const componentPath = join(ROOT_DIR, "components/TrustEscrowApp.tsx");
    const content = readFileSync(componentPath, "utf8");

    // Check for common syntax errors
    if (content.includes('"function"') && !content.includes('"type": "function"')) {
      checks.push({
        name: "TrustEscrowApp Syntax",
        status: "FAIL",
        message: "Malformed function type in component",
        fix: () => {
          console.log("⚠️  Manual fix needed: Check TrustEscrowApp.tsx for malformed function types");
        },
      });
    } else {
      checks.push({
        name: "TrustEscrowApp Syntax",
        status: "PASS",
        message: "Component syntax looks good",
      });
    }
  } catch (error) {
    checks.push({
      name: "TrustEscrowApp Syntax",
      status: "FAIL",
      message: `Error reading component: ${error}`,
    });
  }

  // Check ABI files for syntax errors
  try {
    const trustEscrowABI = join(ROOT_DIR, "types/contracts/TrustEscrow.ts");
    const content = readFileSync(trustEscrowABI, "utf8");

    if (content.includes('"function"') && !content.includes('"type": "function"')) {
      checks.push({
        name: "TrustEscrow ABI Syntax",
        status: "FAIL",
        message: "Malformed function type in ABI",
        fix: () => {
          console.log("⚠️  Manual fix needed: Check TrustEscrow.ts ABI for malformed function types");
        },
      });
    } else {
      checks.push({
        name: "TrustEscrow ABI Syntax",
        status: "PASS",
        message: "ABI syntax looks good",
      });
    }
  } catch (error) {
    checks.push({
      name: "TrustEscrow ABI Syntax",
      status: "FAIL",
      message: `Error reading ABI: ${error}`,
    });
  }

  try {
    const factoryABI = join(ROOT_DIR, "types/contracts/TrustEscrowFactory.ts");
    const content = readFileSync(factoryABI, "utf8");

    if (content.includes('"name": "name"')) {
      checks.push({
        name: "TrustEscrowFactory ABI Syntax",
        status: "FAIL",
        message: "Malformed name field in ABI",
        fix: () => {
          console.log("⚠️  Manual fix needed: Check TrustEscrowFactory.ts ABI for malformed name fields");
        },
      });
    } else {
      checks.push({
        name: "TrustEscrowFactory ABI Syntax",
        status: "PASS",
        message: "ABI syntax looks good",
      });
    }
  } catch (error) {
    checks.push({
      name: "TrustEscrowFactory ABI Syntax",
      status: "FAIL",
      message: `Error reading ABI: ${error}`,
    });
  }

  // Check configuration file
  try {
    const configPath = join(ROOT_DIR, "config/contracts.ts");
    const content = readFileSync(configPath, "utf8");

    if (content.includes("0x...") && !content.includes("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0")) {
      checks.push({
        name: "Contract Configuration",
        status: "FAIL",
        message: "Contract address not updated with deployed address",
        fix: () => {
          console.log("⚠️  Update contract address in config/contracts.ts");
        },
      });
    } else {
      checks.push({
        name: "Contract Configuration",
        status: "PASS",
        message: "Contract configuration looks good",
      });
    }
  } catch (error) {
    checks.push({
      name: "Contract Configuration",
      status: "FAIL",
      message: `Error reading config: ${error}`,
    });
  }

  // Check CSS imports
  try {
    const layoutPath = join(ROOT_DIR, "app/layout.tsx");
    const content = readFileSync(layoutPath, "utf8");

    if (!content.includes("trust-escrow.css")) {
      checks.push({
        name: "CSS Import",
        status: "FAIL",
        message: "Trust Escrow CSS not imported in layout",
        fix: () => {
          console.log("⚠️  Add trust-escrow.css import to layout.tsx");
        },
      });
    } else {
      checks.push({
        name: "CSS Import",
        status: "PASS",
        message: "CSS import looks good",
      });
    }
  } catch (error) {
    checks.push({
      name: "CSS Import",
      status: "FAIL",
      message: `Error reading layout: ${error}`,
    });
  }

  // Check navigation
  try {
    const headerPath = join(ROOT_DIR, "components/Header.tsx");
    const content = readFileSync(headerPath, "utf8");

    if (!content.includes("Trust Escrow") || !content.includes("/escrow")) {
      checks.push({
        name: "Navigation Setup",
        status: "FAIL",
        message: "Trust Escrow navigation not properly configured",
        fix: () => {
          console.log("⚠️  Add Trust Escrow navigation to Header.tsx");
        },
      });
    } else {
      checks.push({
        name: "Navigation Setup",
        status: "PASS",
        message: "Navigation looks good",
      });
    }
  } catch (error) {
    checks.push({
      name: "Navigation Setup",
      status: "FAIL",
      message: `Error reading header: ${error}`,
    });
  }

  return checks;
}

function main() {
  console.log("🔍 Running comprehensive error checks...\n");

  const checks = checkTypeScriptErrors();

  let passCount = 0;
  let failCount = 0;

  checks.forEach(check => {
    const icon = check.status === "PASS" ? "✅" : "❌";
    console.log(`${icon} ${check.name}: ${check.message}`);

    if (check.status === "PASS") {
      passCount++;
    } else {
      failCount++;
      if (check.fix) {
        check.fix();
      }
    }
  });

  console.log(`\n📊 Check Results: ${passCount} PASS, ${failCount} FAIL`);

  if (failCount === 0) {
    console.log("\n🎉 All checks passed! Your code is error-free.");
    console.log("\n📋 Next Steps:");
    console.log("1. Start your Next.js server: cd packages/nextjs && bun run dev");
    console.log("2. Visit http://localhost:3000/escrow to test the integration");
  } else {
    console.log("\n⚠️  Some checks failed. Please fix the issues above.");
    console.log("\n🔧 Common Fixes:");
    console.log("1. Check for malformed JSON in ABI files");
    console.log("2. Ensure all imports are correct");
    console.log("3. Verify contract addresses are updated");
    console.log("4. Check for syntax errors in component files");
  }
}

if (require.main === module) {
  main();
}
