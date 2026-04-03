const fs = require('fs');
let src = fs.readFileSync('assets/js/dynamic-apartments.js', 'utf8');

const newFeatured = `
    // ---- RENDER: Featured widget ----
    function renderFeatured(container, limit, apartments) {
        if (!container) return;
        container.innerHTML = '';

        const featuredData = apartments.slice(0, limit);
        if (featuredData.length === 0) {
            container.innerHTML = '<div class="text-center mt-5 mb-5"><p>No featured properties found.</p></div>';
            return;
        }

        // Wrap in a bootstrap row
        container.insertAdjacentHTML('beforeend', '<div class="row" id="featured-row"></div>');
        const row = container.querySelector('#featured-row');

        featuredData.forEach((apt, index) => {
            const mainImg = apt.image_url ? '/' + apt.image_url : 'assets/img/all-images/features-img7.png';
            const galleryImgs = (apt.gallery && apt.gallery.length > 0) ? apt.gallery.map(g => '/' + g) : [];
            const allImages = [mainImg, ...galleryImgs];
            const cardId = 'feat-card-' + (apt.id || index);

            const statusColor = apt.status === 'For Sale' ? '#3b82f6' : '#f59e0b';
            const availLabel = apt.availability_status === 'Sold' ? 'SOLD OUT' : 'AVAILABLE';

            const slides = allImages.map((imgSrc, i) =>
                '<div class="cam-slide" style="display:' + (i === 0 ? 'block' : 'none') + ';">' +
                '<img src="' + imgSrc + '" alt="' + apt.title + '" style="width:100%;height:220px;object-fit:cover;display:block;">' +
                '</div>').join('');

            const dots = allImages.map((_, i) =>
                '<span class="cam-dot' + (i === 0 ? ' active' : '') + '" onclick="camGoTo(\\'' + cardId + '\\', ' + i + ')"></span>'
            ).join('');

            const arrows = allImages.length > 1
                ? '<button class="cam-arrow cam-prev" onclick="camSlide(\\'' + cardId + '\\', -1)">&#8249;</button>' +
                  '<button class="cam-arrow cam-next" onclick="camSlide(\\'' + cardId + '\\', 1)">&#8250;</button>' +
                  '<div class="cam-dots">' + dots + '</div>'
                : '';

            const complexBadge = apt.complex_name
                ? '<div style="position:absolute;bottom:12px;left:12px;z-index:3;"><span style="background:rgba(255,255,255,0.9);color:#111;padding:3px 12px;border-radius:20px;font-size:0.72rem;font-weight:700;font-family:Inter,sans-serif;">' + apt.complex_name + '</span></div>'
                : '';

            const descriptionHtml = apt.description
                ? '<p style="font-size:0.82rem;color:#6b7280;font-family:Inter,sans-serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px;">' + apt.description + '</p>'
                : '';

            const waMsg = encodeURIComponent('Hello CAM Holdings, I am interested in ' + apt.title + ' in ' + apt.location + '. Please send more details.');

            row.insertAdjacentHTML('beforeend',
                '<div class="col-lg-4 col-md-6 mb-4">' +
                '<div class="cam-card" id="' + cardId + '" data-index="0" data-total="' + allImages.length + '" style="font-family:Inter,sans-serif;">' +
                '<div style="position:relative;overflow:hidden;border-radius:16px 16px 0 0;">' +
                    slides + arrows +
                    '<div style="position:absolute;top:12px;left:12px;z-index:3;"><span style="background:' + statusColor + ';color:white;padding:4px 14px;border-radius:20px;font-size:0.72rem;font-weight:700;font-family:Inter,sans-serif;">' + (apt.status || '') + '</span></div>' +
                    '<div style="position:absolute;top:12px;right:12px;z-index:3;"><span style="background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);color:white;padding:4px 12px;border-radius:20px;font-size:0.72rem;font-weight:600;font-family:Inter,sans-serif;">' + availLabel + '</span></div>' +
                    complexBadge +
                    '<div style="position:absolute;bottom:12px;right:12px;z-index:3;"><span style="background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.4);color:white;padding:3px 12px;border-radius:20px;font-size:0.68rem;font-weight:700;letter-spacing:0.8px;font-family:Inter,sans-serif;">&#9733; FEATURED</span></div>' +
                '</div>' +
                '<div class="cam-card-body">' +
                    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><i class="fa-solid fa-location-dot" style="color:#9ca3af;font-size:0.8rem;"></i><p style="margin:0;font-size:0.8rem;color:#9ca3af;font-family:Inter,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (apt.location || '') + '</p></div>' +
                    '<a href="property-single.html?id=' + apt.id + '" class="cam-card-title">' + apt.title + '</a>' +
                    descriptionHtml +
                    '<div class="cam-card-specs">' +
                        '<span><i class="fa-solid fa-vector-square" style="color:#aaa;margin-right:4px;"></i>' + (apt.area_sqft || 0) + ' sqft</span>' +
                        '<span><i class="fa-solid fa-bed" style="color:#aaa;margin-right:4px;"></i>' + (apt.bedrooms || 0) + ' Beds</span>' +
                        '<span><i class="fa-solid fa-bath" style="color:#aaa;margin-right:4px;"></i>' + (apt.bathrooms || 0) + ' Baths</span>' +
                    '</div>' +
                    '<div class="cam-card-footer">' +
                        '<div><p style="margin:0;font-size:0.68rem;color:#9ca3af;font-family:Inter,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">Price</p><p style="margin:0;font-size:1.05rem;font-weight:700;color:#111;font-family:Inter,sans-serif;">LKR ' + Number(apt.price).toLocaleString() + '</p></div>' +
                        '<div style="display:flex;gap:8px;align-items:center;">' +
                            '<a href="property-single.html?id=' + apt.id + '" class="cam-btn cam-btn-dark">View</a>' +
                            '<a href="https://wa.me/' + whatsappNumber + '?text=' + waMsg + '" target="_blank" class="cam-btn cam-btn-whatsapp"><i class="fa-brands fa-whatsapp"></i></a>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '</div></div>'
            );
        });
    }
`;

// Replace from the renderFeatured comment to the closing });
const start = src.indexOf('    // ---- RENDER: Featured widget ----');
const end = src.lastIndexOf('});');
if (start === -1 || end === -1) {
    console.log('Could not find markers. start=' + start + ' end=' + end);
    process.exit(1);
}
const newSrc = src.substring(0, start) + newFeatured + '\n});\n';
fs.writeFileSync('assets/js/dynamic-apartments.js', newSrc, 'utf8');
console.log('Done - renderFeatured updated.');
