const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'assets') {
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

const newMobileMenuHTML = `<div class="mobile-sidebar mobile-sidebar1">
  <div class="mobile-menu-container">
    <div class="menu-close">
      <i class="fa-solid fa-xmark"></i>
    </div>
    
    <div class="mobile-menu-section">
      <h3>NAVIGATE</h3>
      <ul class="mobile-nav-list nav-list1">
        <li><a href="index.html"><i class="fa-solid fa-house"></i> Home</a></li>
        <li><a href="about.html"><i class="fa-solid fa-users"></i> About</a></li>
        <li><a href="property.html"><i class="fa-solid fa-building"></i> Apartments</a></li>
        <li><a href="contact.html"><i class="fa-solid fa-envelope"></i> Contact Us</a></li>
      </ul>
    </div>

    <div class="divider"></div>

    <div class="mobile-menu-section">
      <h3>GET HELP!</h3>
      <div class="help-buttons">
        <a href="contact.html" class="help-btn">Support</a>
        <a href="faq.html" class="help-btn">Help Center</a>
      </div>
    </div>

    <div class="divider"></div>

    <div class="mobile-menu-section">
      <h3>FOLLOW US</h3>
      <div class="social-links-mobile-menu">
        <ul>
          <li><a href="#"><i class="fa-brands fa-facebook-f"></i></a></li>
          <li><a href="#"><i class="fa-brands fa-twitter"></i></a></li>
          <li><a href="#"><i class="fa-brands fa-instagram"></i></a></li>
          <li><a href="#"><i class="fa-brands fa-pinterest-p"></i></a></li>
        </ul>
      </div>
    </div>
  </div>
</div>`;

function updateMobileMenu() {
  const htmlFiles = getFiles(process.cwd());
  let updatedCount = 0;

  htmlFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    const startIndex = content.indexOf('<div class="mobile-sidebar');
    if(startIndex !== -1) {
       let endIndex = content.indexOf('<!--===== MOBILE HEADER STARTS =======-->', startIndex);
       if(endIndex === -1) {
           endIndex = content.indexOf('<!--===== HERO AREA STARTS =======-->', startIndex);
       }
       if(endIndex !== -1) {
           const part1 = content.substring(0, startIndex);
           const part2 = content.substring(endIndex);
           content = part1 + newMobileMenuHTML + '\n  ' + part2;
           
           if (content !== originalContent) {
             fs.writeFileSync(filePath, content, 'utf8');
             console.log("Updated: " + filePath);
             updatedCount++;
           }
       }
    }
  });

  console.log("\\nFinished! Updated " + updatedCount + " files.");
}

updateMobileMenu();
