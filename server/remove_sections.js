const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\User\\Desktop\\Websites\\CAM Holdings Real Estate';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove Testimonial area
    content = content.replace(/<!--===== TESTIMONIAL AREA STARTS =======-->[\s\S]*?<!--===== TESTIMONIAL AREA ENDS =======-->/g, '');

    // Remove Blog area
    content = content.replace(/<!--===== BLOG AREA STARTS =======-->[\s\S]*?<!--===== BLOG AREA ENDS =======-->/g, '');

    fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Testimonial and Blog sections removed successfully.');
