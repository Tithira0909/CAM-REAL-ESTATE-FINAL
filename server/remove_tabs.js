const fs = require('fs');

const file = 'c:\\Users\\User\\Desktop\\Websites\\CAM Holdings Real Estate\\index4.html';
let content = fs.readFileSync(file, 'utf8');

// The regex matches everything from `<li class="nav-item" role="presentation"> <button class="nav-link" id="pills-villa-tab"`
// up to `Office</button> </li> </ul>` and replaces it with `</ul>`
content = content.replace(/<li class="nav-item" role="presentation">\s*<button class="nav-link" id="pills-villa-tab"[\s\S]*?id="pills-office-tab"[\s\S]*?<\/li>\s*<\/ul>/, '</ul>');

fs.writeFileSync(file, content, 'utf8');
console.log('Tabs removed from index4.html');
