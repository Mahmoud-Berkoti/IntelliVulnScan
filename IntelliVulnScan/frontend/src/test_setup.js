/**
 * This script verifies that the frontend setup is correct
 * Run with: node test_setup.js
 */

const fs = require('fs');
const path = require('path');

// Define required directories
const requiredDirs = [
  'src/components',
  'src/components/layouts',
  'src/pages',
  'src/context',
  'src/hooks',
  'src/services',
  'src/types',
  'src/utils'
];

// Define required files
const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'src/index.tsx',
  'src/App.tsx',
  'src/index.css',
  'src/types/index.ts',
  'src/services/api.ts',
  'src/hooks/useApi.ts',
  'src/utils/helpers.ts',
  'src/context/AuthContext.tsx',
  'src/context/ThemeContext.tsx',
  'src/components/layouts/MainLayout.tsx',
  'src/components/layouts/AuthLayout.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Assets.tsx',
  'src/pages/Login.tsx',
  'src/pages/Register.tsx',
  'src/pages/NotFound.tsx'
];

// Check if directories exist
console.log('Checking directories...');
let dirErrors = 0;
for (const dir of requiredDirs) {
  const dirPath = path.resolve(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Directory not found: ${dir}`);
    dirErrors++;
  } else {
    console.log(`✅ Directory found: ${dir}`);
  }
}

// Check if files exist
console.log('\nChecking files...');
let fileErrors = 0;
for (const file of requiredFiles) {
  const filePath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${file}`);
    fileErrors++;
  } else {
    console.log(`✅ File found: ${file}`);
  }
}

// Check package.json for required dependencies
console.log('\nChecking dependencies...');
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredDependencies = [
  'react',
  'react-dom',
  'react-router-dom',
  '@mui/material',
  '@mui/icons-material',
  'axios',
  'recharts'
];

let depErrors = 0;
for (const dep of requiredDependencies) {
  if (!packageJson.dependencies[dep]) {
    console.error(`❌ Dependency not found: ${dep}`);
    depErrors++;
  } else {
    console.log(`✅ Dependency found: ${dep}`);
  }
}

// Check dev dependencies
const requiredDevDependencies = [
  '@types/react',
  '@types/react-dom',
  '@types/node',
  'typescript'
];

for (const dep of requiredDevDependencies) {
  if (!packageJson.devDependencies || !packageJson.devDependencies[dep]) {
    console.error(`❌ Dev dependency not found: ${dep}`);
    depErrors++;
  } else {
    console.log(`✅ Dev dependency found: ${dep}`);
  }
}

// Summary
console.log('\n=== Setup Verification Summary ===');
console.log(`Directories: ${dirErrors === 0 ? '✅ All OK' : `❌ ${dirErrors} missing`}`);
console.log(`Files: ${fileErrors === 0 ? '✅ All OK' : `❌ ${fileErrors} missing`}`);
console.log(`Dependencies: ${depErrors === 0 ? '✅ All OK' : `❌ ${depErrors} missing`}`);

if (dirErrors === 0 && fileErrors === 0 && depErrors === 0) {
  console.log('\n✅ Frontend setup is correct! You can start the application with "npm start".');
} else {
  console.log('\n❌ There are issues with the frontend setup. Please fix them before running the application.');
  process.exit(1);
} 