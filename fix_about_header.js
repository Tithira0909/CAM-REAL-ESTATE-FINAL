const fs = require('fs');
let c = fs.readFileSync('about.html', 'utf8');

// Replace the entire mess between <ul> and </ul> in the main-menu
// We'll target the full block from "Home" menu start to "Contact Us" end
const oldBlock = c.match(/<li><a href="index\.html">Home<\/a><\/li>[\s\S]*?<li><a href="contact\.html">Contact Us<\/a><\/li>/);
if (oldBlock) {
  c = c.replace(oldBlock[0], `<li><a href="index.html">Home</a></li>\r\n                  <li><a href="about.html">About</a></li>\r\n                  <li><a href="property.html">Apartments</a></li>\r\n                  <li><a href="contact.html">Contact Us</a></li>`);
  fs.writeFileSync('about.html', c, 'utf8');
  console.log('Done - nav cleaned up.');
} else {
  console.log('Pattern not found!');
}
