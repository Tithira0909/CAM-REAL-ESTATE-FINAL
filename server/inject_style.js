const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'assets') getFiles(name, fileList);
    } else {
      if (file.endsWith('.html')) fileList.push(name);
    }
  }
  return fileList;
}

const marker = '<link rel="stylesheet" href="assets/css/main.css';
const injection = '<link rel="stylesheet" href="style.css">';
let updatedCount = 0;

getFiles(process.cwd()).forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(injection)) return; // already done
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    // find end of that line
    const lineEnd = content.indexOf('\n', idx);
    content = content.substring(0, lineEnd + 1) + '    ' + injection + '\r\n' + content.substring(lineEnd + 1);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Linked style.css in: ' + filePath);
    updatedCount++;
  }
});
console.log('Done. Updated ' + updatedCount + ' files.');
