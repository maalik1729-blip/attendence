const fs = require('fs');
const path = require('path');

const srcDir = 'd:/hotel/frontend/src';

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already refactored
  if (content.includes('useTheme()')) return;

  // Add import for useTheme
  if (content.includes('import { COLORS }')) {
    content = content.replace(/import\s+\{\s*(?:[^}]*,\s*)?COLORS(?:,\s*[^}]*)?\s*\}\s*from\s*['"]\.\.\/config['"];?/g, '');
    content = content.replace(/import\s+\{\s*(?:[^}]*,\s*)?COLORS(?:,\s*[^}]*)?\s*\}\s*from\s*['"]\.\/config['"];?/g, '');
    
    // Add useTheme import near the top
    const importRegex = /import\s+.*?;?\n/g;
    let lastMatch;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      lastMatch = match;
    }
    
    const themeImport = filePath.includes('screens') || filePath.includes('utils') 
      ? `import { useTheme } from '../ThemeContext';\n`
      : `import { useTheme } from './ThemeContext';\n`;
      
    if (lastMatch) {
      content = content.slice(0, lastMatch.index + lastMatch[0].length) + themeImport + content.slice(lastMatch.index + lastMatch[0].length);
    } else {
      content = themeImport + content;
    }
  } else {
    return; // No COLORS import, skip
  }

  // Inject const { theme: COLORS } = useTheme(); into components
  const componentRegex = /export\s+(?:default\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
  content = content.replace(componentRegex, (match) => {
    return `${match}\n  const { theme: COLORS } = useTheme();`;
  });

  // Convert StyleSheet.create to dynamic function if it uses COLORS
  if (content.includes('StyleSheet.create') && content.includes('COLORS')) {
    content = content.replace(/const\s+styles\s*=\s*StyleSheet\.create\(/, 'const getStyles = (COLORS) => StyleSheet.create(');
    
    // Inject const styles = getStyles(COLORS); into components
    content = content.replace(/(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{\n\s*const\s+\{\s*theme:\s*COLORS\s*\}\s*=\s*useTheme\(\);)/g, '$1\n  const styles = getStyles(COLORS);');
  }

  // Same for inputStyle if it exists
  if (content.includes('export const inputStyle') && content.includes('COLORS')) {
     content = content.replace(/export\s+const\s+inputStyle\s*=\s*\{/g, 'export const getInputStyle = (COLORS) => ({');
     content = content.replace(/};\s*$/m, '});');
  }

  fs.writeFileSync(filePath, content);
  console.log('Refactored:', filePath);
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js')) {
      refactorFile(fullPath);
    }
  }
}

walk(srcDir);
