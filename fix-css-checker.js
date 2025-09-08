#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔍 CSS Loading Issue Checker\n');

// Check if files exist
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

// Read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

// Find all CSS imports in JS/JSX files
function findCSSImports(content, filePath) {
  const imports = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Match various import patterns
    const importMatches = line.match(/import\s+.*?['"`]([^'"`]+\.css)['"`]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const cssFile = match.match(/['"`]([^'"`]+\.css)['"`]/)[1];
        imports.push({
          file: filePath,
          line: index + 1,
          cssFile: cssFile,
          fullLine: line.trim()
        });
      });
    }
  });
  
  return imports;
}

// Find CSS links in HTML
function findCSSLinks(content, filePath) {
  const links = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const linkMatches = line.match(/<link[^>]*rel=['"`]stylesheet['"`][^>]*href=['"`]([^'"`]+)['"`][^>]*>/g);
    if (linkMatches) {
      linkMatches.forEach(match => {
        const href = match.match(/href=['"`]([^'"`]+)['"`]/)[1];
        links.push({
          file: filePath,
          line: index + 1,
          href: href,
          fullLine: line.trim()
        });
      });
    }
  });
  
  return links;
}

// Main analysis
const issues = [];
const recommendations = [];

console.log('📁 Checking file structure...\n');

// Check main files
const mainFiles = [
  'index.html',
  'src/main.jsx',
  'src/App.jsx',
  'src/pages/home.jsx',
  'src/pages/celebration.jsx'
];

mainFiles.forEach(file => {
  if (fileExists(file)) {
    console.log(`✅ Found: ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    issues.push(`Missing file: ${file}`);
  }
});

console.log('\n📄 Analyzing CSS imports...\n');

// Check CSS imports in JSX files
const jsxFiles = ['src/pages/home.jsx', 'src/pages/celebration.jsx'];
let allCSSImports = [];

jsxFiles.forEach(file => {
  if (fileExists(file)) {
    const content = readFile(file);
    if (content) {
      const imports = findCSSImports(content, file);
      allCSSImports = allCSSImports.concat(imports);
      
      if (imports.length > 0) {
        console.log(`📦 ${file}:`);
        imports.forEach(imp => {
          console.log(`   Line ${imp.line}: ${imp.fullLine}`);
        });
        console.log('');
      }
    }
  }
});

// Check if CSS files exist
console.log('🎨 Checking CSS file existence...\n');

const cssFiles = [
  'src/pages/home.styles.css',
  'src/pages/celebration.styles.css',
  'src/index.css',
  'src/App.css'
];

cssFiles.forEach(cssFile => {
  if (fileExists(cssFile)) {
    console.log(`✅ Found: ${cssFile}`);
  } else {
    console.log(`❌ Missing: ${cssFile}`);
    issues.push(`Missing CSS file: ${cssFile}`);
  }
});

// Check HTML for CSS links
console.log('\n🔗 Checking HTML for CSS links...\n');

if (fileExists('index.html')) {
  const htmlContent = readFile('index.html');
  const cssLinks = findCSSLinks(htmlContent, 'index.html');
  
  if (cssLinks.length > 0) {
    console.log('📄 index.html CSS links:');
    cssLinks.forEach(link => {
      console.log(`   Line ${link.line}: ${link.fullLine}`);
    });
  } else {
    console.log('⚠️  No CSS links found in index.html');
  }
}

// Check for Tailwind CDN
console.log('\n🎯 Checking Tailwind CDN usage...\n');

if (fileExists('index.html')) {
  const htmlContent = readFile('index.html');
  if (htmlContent.includes('tailwindcss.com')) {
    console.log('✅ Tailwind CDN found in index.html');
  } else {
    console.log('❌ Tailwind CDN not found in index.html');
    issues.push('Tailwind CDN not found in index.html');
  }
}

// Check for service workers
console.log('\n⚙️  Checking for service workers...\n');

const swFiles = ['public/sw.js', 'public/service-worker.js', 'src/sw.js'];
let hasServiceWorker = false;

swFiles.forEach(swFile => {
  if (fileExists(swFile)) {
    console.log(`⚠️  Found service worker: ${swFile}`);
    hasServiceWorker = true;
  }
});

if (!hasServiceWorker) {
  console.log('✅ No service workers found');
}

// Check main.jsx for CSS imports
console.log('\n📋 Checking main.jsx for CSS imports...\n');

if (fileExists('src/main.jsx')) {
  const mainContent = readFile('src/main.jsx');
  const mainImports = findCSSImports(mainContent, 'src/main.jsx');
  
  if (mainImports.length > 0) {
    console.log('📦 src/main.jsx CSS imports:');
    mainImports.forEach(imp => {
      console.log(`   Line ${imp.line}: ${imp.fullLine}`);
    });
  } else {
    console.log('⚠️  No CSS imports found in src/main.jsx');
    recommendations.push('Consider importing global CSS in src/main.jsx');
  }
}

// Check App.jsx for CSS imports
console.log('\n📋 Checking App.jsx for CSS imports...\n');

if (fileExists('src/App.jsx')) {
  const appContent = readFile('src/App.jsx');
  const appImports = findCSSImports(appContent, 'src/App.jsx');
  
  if (appImports.length > 0) {
    console.log('📦 src/App.jsx CSS imports:');
    appImports.forEach(imp => {
      console.log(`   Line ${imp.line}: ${imp.fullLine}`);
    });
  } else {
    console.log('⚠️  No CSS imports found in src/App.jsx');
  }
}

// Analysis summary
console.log('\n' + '='.repeat(60));
console.log('📊 ANALYSIS SUMMARY');
console.log('='.repeat(60));

if (issues.length === 0) {
  console.log('✅ No critical issues found!');
} else {
  console.log('❌ Issues found:');
  issues.forEach(issue => {
    console.log(`   • ${issue}`);
  });
}

console.log('\n💡 RECOMMENDATIONS:');
console.log('1. Ensure all CSS files are imported at the entry level (src/main.jsx)');
console.log('2. Use <link> tags in index.html for critical CSS');
console.log('3. Consider preloading CSS files for faster loading');
console.log('4. Avoid lazy loading CSS in components to prevent FOUC');

if (allCSSImports.length > 0) {
  console.log('\n🔧 CSS IMPORT ANALYSIS:');
  allCSSImports.forEach(imp => {
    const isRelative = imp.cssFile.startsWith('./') || imp.cssFile.startsWith('../');
    const isAbsolute = imp.cssFile.startsWith('/');
    
    console.log(`   ${imp.file}:${imp.line}`);
    console.log(`     CSS: ${imp.cssFile}`);
    console.log(`     Type: ${isRelative ? 'Relative' : isAbsolute ? 'Absolute' : 'Module'}`);
    console.log(`     Location: ${imp.file.includes('pages/') ? 'Component-level' : 'Entry-level'}`);
    console.log('');
  });
}

console.log('\n🎯 QUICK FIXES:');
console.log('1. Add CSS imports to src/main.jsx:');
console.log('   import "./index.css";');
console.log('   import "./pages/home.styles.css";');
console.log('   import "./pages/celebration.styles.css";');

console.log('\n2. Add CSS preload to index.html:');
console.log('   <link rel="preload" href="/src/index.css" as="style">');

console.log('\n3. Ensure Tailwind loads before React:');
console.log('   <script src="https://cdn.tailwindcss.com"></script>');

console.log('\n✨ Analysis complete!');
