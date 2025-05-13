import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function searchFilesForString(dir, searchString) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Skip node_modules and dist directories
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        searchFilesForString(filePath, searchString);
      }
    } else if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'))) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(searchString)) {
        console.log(`Found "${searchString}" in ${filePath}`);
      }
    }
  }
}

// Start searching from the parent directory (project root)
const projectRoot = path.resolve(__dirname, '..');
searchFilesForString(projectRoot, 'GoogleOAuthProvider');
