const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\User\\Desktop\\Websites\\CAM Holdings Real Estate';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove generic list items (My House, Villa, etc.)
    content = content.replace(/<li>\s*<a[^>]*>\s*(Villa|House|Studio|Office|My House|villa|house|studio|office)\s*<\/a>\s*<\/li>/gi, '');
    
    // 2. Remove options from forms
    content = content.replace(/<option[^>]*>\s*(Villa|House|Studio|Office|villa|house|studio|office)\s*<\/option>/gi, '');

    // 3. Remove list items with spans (e.g., <li><a href="#"><span>Villa </span> ...</a></li>)
    content = content.replace(/<li>\s*<a[^>]*>\s*<span>\s*(Villa|House|Studio|Office|villa|house|studio|office)\s*<\/span>[\s\S]*?<\/a>\s*<\/li>/gi, '');

    // 4. Specifically for index4.html tab panes
    if (file === 'index4.html') {
        const regexTabs = /<div class="tab-pane fade" id="pills-(villa|studio|house|office)"[\s\S]*?(?=<div class="tab-pane fade"|<\!--===== PROPERTIES AREA ENDS)/gi;
        content = content.replace(regexTabs, '');
    }

    fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Removed all references to villa, house, studio, and office successfully.');
