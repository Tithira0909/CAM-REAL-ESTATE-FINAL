document.addEventListener('DOMContentLoaded', async () => {
    const allContainer = document.querySelector('#pills-all .row');
    const aptContainer = document.querySelector('#pills-apartment .row');
    const featuredContainer = document.getElementById('dynamic-featured-container');
    const isPropertyPage = !!document.getElementById('filter-location');

    if (!allContainer && !aptContainer && !featuredContainer) return;

    let allApartments = [];
    let whatsappNumber = '94778983618'; // Default

    // Fetch config
    try {
        const configRes = await fetch('/api/config');
        const configData = await configRes.json();
        whatsappNumber = configData.whatsappNumber;
    } catch (e) { console.error("Failed to fetch WhatsApp config"); }

    // ---- Define applyFilters BEFORE the fetch so inline onchange="applyFilters()" works ----
    window.applyFilters = function () {
        if (!isPropertyPage) return;

        const search = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
        const location = document.getElementById('filter-location')?.value || '';
        const status = document.getElementById('filter-status')?.value || '';
        const type = document.getElementById('filter-type')?.value || '';

        const filtered = allApartments.filter(apt => {
            const matchSearch = !search
                || apt.title?.toLowerCase().includes(search)
                || apt.location?.toLowerCase().includes(search);
            const matchLocation = !location || apt.location === location;
            const matchStatus = !status || apt.status === status;
            const matchType = !type || apt.property_type === type;
            return matchSearch && matchLocation && matchStatus && matchType;
        });

        renderApartments(allContainer, null, filtered);
    };

    try {
        const response = await fetch('/api/apartments');
        if (!response.ok) throw new Error('Failed to fetch from backend');
        allApartments = await response.json();

        // ---- PROPERTY PAGE: Populate filter dropdowns from DB data ----
        if (isPropertyPage) {
            const locations = [...new Set(allApartments.map(a => a.location).filter(Boolean))];
            const locSel = document.getElementById('filter-location');
            locations.forEach(loc => {
                const opt = document.createElement('option');
                opt.value = loc;
                opt.textContent = loc;
                locSel.appendChild(opt);
            });

            const types = [...new Set(allApartments.map(a => a.property_type).filter(Boolean))];
            const typeSel = document.getElementById('filter-type');
            types.forEach(type => {
                const opt = document.createElement('option');
                opt.value = type;
                opt.textContent = type;
                typeSel.appendChild(opt);
            });

            // Live search on keyup
            document.getElementById('search-input').addEventListener('keyup', applyFilters);
        }

        // Inject Inter font once
        if (!document.getElementById('cam-inter-font')) {
            const link = document.createElement('link');
            link.id = 'cam-inter-font';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
            document.head.appendChild(link);
        }

        // Inject card CSS once
        if (!document.getElementById('cam-card-styles')) {
            const style = document.createElement('style');
            style.id = 'cam-card-styles';
            style.textContent = `
                .cam-card {
                    background: #fff;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    border: 1px solid #f0f0f0;
                }
                .cam-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.14);
                }
                .cam-card-body { padding: 18px 20px 20px; }
                .cam-card-title {
                    display: block;
                    font-size: 1rem;
                    font-weight: 700;
                    color: #111;
                    font-family: 'Inter', sans-serif;
                    margin-bottom: 12px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .cam-card-title:hover { color: #c0392b; }
                .cam-card-specs {
                    display: flex;
                    gap: 14px;
                    margin-bottom: 16px;
                    padding: 10px 0;
                    border-top: 1px solid #f3f4f6;
                    border-bottom: 1px solid #f3f4f6;
                    flex-wrap: wrap;
                }
                .cam-card-specs span {
                    font-size: 0.8rem;
                    color: #555;
                    font-family: 'Inter', sans-serif;
                    font-weight: 500;
                }
                .cam-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 14px;
                }
                .cam-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 9px 20px;
                    border-radius: 30px;
                    font-size: 0.82rem;
                    font-weight: 600;
                    font-family: 'Inter', sans-serif;
                    text-decoration: none;
                    transition: all 0.25s;
                    border: none;
                    cursor: pointer;
                    letter-spacing: 0.3px;
                }
                .cam-btn-dark { background: #111; color: #fff; }
                .cam-btn-dark:hover { background: #333; color: #fff; }
                .cam-btn-whatsapp { background: #25D366; color: #fff; padding: 9px 14px; }
                .cam-btn-whatsapp:hover { background: #1ebe5d; color: #fff; }
                .cam-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 4;
                    background: rgba(255,255,255,0.85);
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    font-size: 1.4rem;
                    color: #111;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
                    transition: background 0.2s;
                    padding: 0;
                    line-height: 1;
                }
                .cam-arrow:hover { background: #fff; }
                .cam-prev { left: 10px; }
                .cam-next { right: 10px; }
                .cam-dots {
                    position: absolute;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 5px;
                    z-index: 4;
                }
                .cam-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.5);
                    cursor: pointer;
                    transition: background 0.2s, transform 0.2s;
                }
                .cam-dot.active { background: #fff; transform: scale(1.3); }
            `;
            document.head.appendChild(style);
        }

        // Render the initial full list
        renderApartments(allContainer, null, allApartments);
        renderApartments(aptContainer, 'Apartment', allApartments);
        renderFeatured(featuredContainer, 3, allApartments);

        setTimeout(() => {
            if (typeof AOS !== 'undefined') AOS.refresh();
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            window.dispatchEvent(new Event('resize'));
        }, 500);

    } catch (err) {
        console.error('Error fetching apartments:', err);
        if (allContainer) allContainer.innerHTML = '<div class="col-12 mt-5 mb-5 text-center text-danger"><h5>Failed to load properties.</h5></div>';
    }

    // ---- Global carousel controls ----
    window.camSlide = function(cardId, dir) {
        const card = document.getElementById(cardId);
        if (!card) return;
        let idx = parseInt(card.dataset.index || 0);
        const total = parseInt(card.dataset.total || 1);
        idx = (idx + dir + total) % total;
        card.dataset.index = idx;
        const slides = card.querySelectorAll('.cam-slide');
        const dots = card.querySelectorAll('.cam-dot');
        slides.forEach((s, i) => s.style.display = (i === idx ? 'block' : 'none'));
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    };

    window.camGoTo = function(cardId, idx) {
        const card = document.getElementById(cardId);
        if (!card) return;
        card.dataset.index = idx;
        const slides = card.querySelectorAll('.cam-slide');
        const dots = card.querySelectorAll('.cam-dot');
        slides.forEach((s, i) => s.style.display = (i === idx ? 'block' : 'none'));
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    };

    // ---- RENDER: Card grid ----
    function renderApartments(container, filterType, apartments) {
        if (!container) return;
        container.innerHTML = '';

        const data = filterType
            ? apartments.filter(a => a.property_type === filterType)
            : apartments;

        if (data.length === 0) {
            container.innerHTML = '<div class="col-12 text-center mt-5 mb-5"><p>No properties found.</p></div>';
            return;
        }

        data.forEach((apt, index) => {
            const mainImg = apt.image_url ? `/${apt.image_url}` : 'assets/img/all-images/features-img3.png';
            const galleryImgs = (apt.gallery && apt.gallery.length > 0) ? apt.gallery.map(g => `/${g}`) : [];
            const allImages = [mainImg, ...galleryImgs];
            const cardId = `apt-card-${apt.id || index}`;

            const statusColor = apt.status === 'For Sale' ? '#3b82f6' : '#f59e0b';
            const availLabel = apt.availability_status === 'Sold' ? 'SOLD OUT' : 'AVAILABLE';

            const slides = allImages.map((imgSrc, i) => `
                <div class="cam-slide" style="display:${i === 0 ? 'block' : 'none'};">
                    <img src="${imgSrc}" alt="${apt.title}" style="width:100%;height:220px;object-fit:cover;display:block;">
                </div>`).join('');

            const arrows = allImages.length > 1 ? `
                <button class="cam-arrow cam-prev" onclick="camSlide('${cardId}', -1)">&#8249;</button>
                <button class="cam-arrow cam-next" onclick="camSlide('${cardId}', 1)">&#8250;</button>
                <div class="cam-dots">
                    ${allImages.map((_, i) => `<span class="cam-dot${i === 0 ? ' active' : ''}" onclick="camGoTo('${cardId}', ${i})"></span>`).join('')}
                </div>` : '';

            container.insertAdjacentHTML('beforeend', `
            <div class="col-lg-4 col-md-6 mb-4">
              <div class="cam-card" id="${cardId}" data-index="0" data-total="${allImages.length}" style="font-family:'Inter',sans-serif;">
                <div style="position:relative; overflow:hidden; border-radius:16px 16px 0 0;">
                    ${slides}
                    ${arrows}
                    <div style="position:absolute;top:12px;left:12px;z-index:3;">
                        <span style="background:${statusColor};color:white;padding:4px 14px;border-radius:20px;font-size:0.72rem;font-weight:700;font-family:'Inter',sans-serif;">${apt.status || ''}</span>
                    </div>
                    <div style="position:absolute;top:12px;right:12px;z-index:3;">
                        <span style="background:rgba(0,0,0,0.5);backdrop-filter:blur(6px);color:white;padding:4px 12px;border-radius:20px;font-size:0.72rem;font-weight:600;font-family:'Inter',sans-serif;">${availLabel}</span>
                    </div>
                    ${apt.complex_name ? `<div style="position:absolute;bottom:12px;left:12px;z-index:3;"><span style="background:rgba(255,255,255,0.9);color:#111;padding:3px 12px;border-radius:20px;font-size:0.72rem;font-weight:700;font-family:'Inter',sans-serif;">${apt.complex_name}</span></div>` : ''}
                </div>
                <div class="cam-card-body">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                        <i class="fa-solid fa-location-dot" style="color:#9ca3af;font-size:0.8rem;"></i>
                        <p style="margin:0;font-size:0.8rem;color:#9ca3af;font-family:'Inter',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${apt.location || ''}</p>
                    </div>
                    <a href="property-single.html?id=${apt.id}" class="cam-card-title">${apt.title}</a>
                    <div class="cam-card-specs">
                        <span><i class="fa-solid fa-vector-square" style="color:#aaa;margin-right:4px;"></i>${apt.area_sqft || 0} sqft</span>
                        <span><i class="fa-solid fa-bed" style="color:#aaa;margin-right:4px;"></i>${apt.bedrooms || 0} Beds</span>
                        <span><i class="fa-solid fa-bath" style="color:#aaa;margin-right:4px;"></i>${apt.bathrooms || 0} Baths</span>
                    </div>
                    <div class="cam-card-footer">
                        <div>
                            <p style="margin:0;font-size:0.68rem;color:#9ca3af;font-family:'Inter',sans-serif;text-transform:uppercase;letter-spacing:0.5px;">Price</p>
                            <p style="margin:0;font-size:1.05rem;font-weight:700;color:#111;font-family:'Inter',sans-serif;">LKR ${Number(apt.price).toLocaleString()}</p>
                        </div>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <a href="property-single.html?id=${apt.id}" class="cam-btn cam-btn-dark">View</a>
                            <a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello CAM Holdings, I am interested in ' + apt.title + ' in ' + apt.location + '. Please send more details.')}" 
                               target="_blank" class="cam-btn cam-btn-whatsapp">
                               <i class="fa-brands fa-whatsapp"></i>
                            </a>
                        </div>
                    </div>
                </div>
              </div>
            </div>`);
        });
    }


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
                '<span class="cam-dot' + (i === 0 ? ' active' : '') + '" onclick="camGoTo(\'' + cardId + '\', ' + i + ')"></span>'
            ).join('');

            const arrows = allImages.length > 1
                ? '<button class="cam-arrow cam-prev" onclick="camSlide(\'' + cardId + '\', -1)">&#8249;</button>' +
                  '<button class="cam-arrow cam-next" onclick="camSlide(\'' + cardId + '\', 1)">&#8250;</button>' +
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

});
