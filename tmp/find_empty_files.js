const fs = require('fs');
const path = require('path');

function findEmptyFiles(dir, emptyFiles = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      findEmptyFiles(filePath, emptyFiles);
    } else if (stats.size === 0 && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      emptyFiles.push(filePath);
    }
  }

  return emptyFiles;
}

const appDir = path.join(__dirname, '..', 'apps/web/app');
const empty = findEmptyFiles(appDir);
console.log(empty.join('\n'));
