#!/usr/bin/env node

/**
 * Simple script to run the product seeding process
 * This script can be run from the backend directory
 */

const { spawn } = require("child_process");
const path = require("path");


// Run the TypeScript seeding script
const seedProcess = spawn("npm", ["run", "seed-products"], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});

seedProcess.on("close", (code) => {
  if (code === 0) {
  } else {
    process.exit(code);
  }
});

seedProcess.on("error", (error) => {
  console.error("❌ Error running seeding process:", error);
  process.exit(1);
});
