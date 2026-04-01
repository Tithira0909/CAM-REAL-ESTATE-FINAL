const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\User\\Desktop\\Websites\\CAM Holdings Real Estate';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const desktopPropertyRepl = `<li><a href="#">Apartments <i class="fa-solid fa-angle-down"></i></a>
                    <ul class="dropdown-padding">
                      <li><a href="property.html">Apartments</a></li>
                      <li><a href="property-location.html">Apartment Location</a></li>
                      <li><a href="property-sell-rent.html">Apartment Sale Rent </a></li>
                      <li><a href="property-listing.html">Apartment Listing</a></li>
                      <li><a href="property-listing-left.html">Apartment Listing Left</a></li>
                      <li><a href="property-listing-right.html"> Apartment Listing Right</a></li>
                      <li><a href="property-single.html">Apartment Single</a></li>
                    </ul>
                  </li>`;

const mobilePropertyRepl = `<li><a href="features.html">Apartments</a>
        <ul class="sub-menu">
          <li><a href="property.html">Apartments</a></li>
          <li><a href="property-location.html">Apartment Location</a></li>
          <li><a href="property-sell-rent.html">Apartment Sale Rent </a></li>
          <li><a href="property-listing.html">Apartment Listing</a></li>
          <li><a href="property-listing-left.html">Apartment Listing Left</a></li>
          <li><a href="property-listing-right.html"> Apartment Listing Right</a></li>
          <li><a href="property-single.html">Apartment Single</a></li>
        </ul>
      </li>`;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace desktop menus
    content = content.replace(/<li>\s*<a href="#">Property <i class="fa-solid fa-angle-down"><\/i><\/a>[\s\S]*?<\/ul>\s*<\/li>/g, desktopPropertyRepl);
    content = content.replace(/<li>\s*<a href="#">Blogs <i class="fa-solid fa-angle-down"><\/i><\/a>[\s\S]*?<\/ul>\s*<\/li>/g, '');
    content = content.replace(/<li>\s*<a href="#">Pages <i class="fa-solid fa-angle-down"><\/i><\/a>[\s\S]*?<\/ul>\s*<\/li>/g, '');
    
    // Replace mobile menus
    content = content.replace(/<li>\s*<a href="features\.html">Property<\/a>[\s\S]*?<\/ul>\s*<\/li>/g, mobilePropertyRepl);
    content = content.replace(/<li>\s*<a href="#">Blogs<\/a>[\s\S]*?<\/ul>\s*<\/li>/g, '');
    content = content.replace(/<li>\s*<a href="#">Pages<\/a>[\s\S]*?<\/ul>\s*<\/li>/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
}
