const fs = require('fs');
const path = require('path');

/**
 * Recursively get all files in a directory
 */
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        getFiles(name, fileList);
      }
    } else {
      if (file.endsWith('.html')) {
        fileList.push(name);
      }
    }
  }
  return fileList;
}

/**
 * Handle Footer Updating
 */
function updateFooter() {
  const htmlFiles = getFiles(process.cwd());
  let updatedCount = 0;

  htmlFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Regex to update the copyright text specifically
    // Handles variations of copyright symbol and spacing
    content = content.replace(/(Copyright|&#169;|ⓒ) 2024 CAM Holdings/gi, '$1 2026 CAM Holdings');

    // Regex to replace the Terms & Conditions and Privacy list with Powered By
    // We target the UL structure in the copyright div
    const listPattern = /<ul>\s*<li><a href="#">Terms & Condition<\/a><\/li>\s*<li>\|<\/li>\s*<li><a href="#">Privacy<\/a><\/li>\s*<\/ul>/gi;
    const replacement = `<ul>
                <li>Powered by <a href="https://www.zeatralabs.com" target="_blank" style="color: inherit; text-decoration: none;">Zeatra Labs</a></li>
              </ul>`;

    content = content.replace(listPattern, replacement);

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
      updatedCount++;
    }
  });

  console.log(`\nFinished! Updated ${updatedCount} files.`);
}

updateFooter();
