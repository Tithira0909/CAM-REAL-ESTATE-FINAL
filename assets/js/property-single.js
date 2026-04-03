document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
        document.getElementById('hero-title').innerText = "Property Not Found";
        document.getElementById('head-title').innerText = "Missing Property ID.";
        return;
    }

    try {
        const res = await fetch(`/api/apartments/${id}`);
        if (!res.ok) throw new Error("Failed to fetch property");
        const apt = await res.json();

        // Basic Info
        document.getElementById('hero-title').innerText = apt.title;
        document.getElementById('head-title').innerText = apt.title;
        document.getElementById('head-location').innerText = apt.location;
        document.getElementById('det-sqft').innerText = apt.area_sqft || 0;
        document.getElementById('det-beds').innerText = apt.bedrooms || 0;
        document.getElementById('det-baths').innerText = apt.bathrooms || 0;
        
        document.getElementById('side-status').innerText = apt.status;
        document.getElementById('side-price').innerHTML = `LKR ${Number(apt.price).toLocaleString()} <span style="font-size: 1rem; color:#6b7280; font-weight: 500;">${apt.status === 'For Rent' ? '/Month' : ''}</span>`;

        // Text blocks - Convert line breaks to HTML paragraphs (Legacy support for old non-HTML entries)
        const formatText = (text) => {
            if (!text) return '<p>Not provided.</p>';
            if (text.trim().startsWith('<')) return text; // Bypass formatting if HTML exists
            return text.split('\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('<div class="space24"></div>');
        };
        
        document.getElementById('about-property-content').innerHTML = formatText(apt.description);
        document.getElementById('detailed-desc-content').innerHTML = formatText(apt.detailed_description);
        document.getElementById('neighborhood-content').innerHTML = formatText(apt.neighborhood_info);

        // Key Features build
        const featuresHtml = `
            <div class="boxarea">
                <div class="icons"><img src="assets/img/icons/location1.svg" alt=""></div>
                <div class="content"><p><span>Location:</span> ${apt.location}</p></div>
            </div>
            <div class="boxarea">
                <div class="icons"><img src="assets/img/icons/bed.svg" alt=""></div>
                <div class="content"><p><span>Bedrooms:</span> ${apt.bedrooms || 0} spacious bedrooms.</p></div>
            </div>
            <div class="boxarea">
                <div class="icons"><img src="assets/img/icons/bath.svg" alt=""></div>
                <div class="content"><p><span>Bathrooms:</span> ${apt.bathrooms || 0} elegantly appointed bathrooms.</p></div>
            </div>
            <div class="boxarea">
                <div class="icons"><img src="assets/img/icons/sqft.svg" alt=""></div>
                <div class="content"><p><span>Living Space:</span> ${apt.area_sqft ? Number(apt.area_sqft).toLocaleString() : 0} square feet of thoughtfully designed space.</p></div>
            </div>
        `;
        document.getElementById('key-features-container').innerHTML = featuresHtml;

        // Images
        const imgPath = apt.image_url ? (apt.image_url.startsWith('/') ? apt.image_url : `/${apt.image_url}`) : 'assets/img/all-images/features-img3.png';
        const mainImg = document.getElementById('main-image');
        mainImg.src = imgPath;
        mainImg.alt = apt.title;
        const mainLink = document.getElementById('main-image-link');
        if (mainLink) mainLink.href = imgPath;

        // Gallery
        const galleryContainer = document.getElementById('gallery-images-container');
        galleryContainer.innerHTML = '';
        if (apt.gallery && apt.gallery.length > 0) {
            apt.gallery.forEach(gImg => {
                const safeImg = gImg.startsWith('/') ? gImg : `/${gImg}`;
                const gHtml = `
                    <div class="col-lg-6 col-md-6" style="margin-bottom: 24px;">
                        <div class="img1 image-anime">
                            <a href="${safeImg}" class="property-popup">
                                <img src="${safeImg}" alt="" style="height: 238px; width:100%; object-fit: cover; border-radius: 12px; background: #eee;">
                            </a>
                        </div>
                    </div>
                `;
                galleryContainer.insertAdjacentHTML('beforeend', gHtml);
            });
        }

        // More Properties — fetch all, exclude current, show up to 3
        const moreContainer = document.getElementById('more-properties-container');
        if (moreContainer) {
            try {
                const allRes = await fetch('/api/apartments');
                const allApts = await allRes.json();
                const others = allApts.filter(a => String(a.id) !== String(id)).slice(0, 3);

                if (others.length === 0) {
                    moreContainer.innerHTML = '<div class="col-12 text-center"><p>No other properties available.</p></div>';
                } else {
                    moreContainer.innerHTML = '';
                    others.forEach(a => {
                        const img = a.image_url ? (a.image_url.startsWith('/') ? a.image_url : `/${a.image_url}`) : 'assets/img/all-images/features-img3.png';
                        const price = a.status === 'For Rent'
                            ? `LKR ${Number(a.price).toLocaleString()} <span>/ month</span>`
                            : `LKR ${Number(a.price).toLocaleString()}`;
                        const btnLabel = a.status === 'For Sale' ? 'Buy' : 'Rent';
                        moreContainer.insertAdjacentHTML('beforeend', `
                        <div class="col-lg-4 col-md-6 mb-4">
                          <div class="property-boxarea">
                            <div class="img1">
                              <img src="${img}" alt="${a.title}" style="height:250px;object-fit:cover;width:100%;">
                            </div>
                            <div class="sell-point">
                              <a href="property-single.html?id=${a.id}" class="sell">${a.status}</a>
                            </div>
                            <div class="content-area">
                              <a href="property-single.html?id=${a.id}" style="font-size:1.1rem;font-weight:600;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.title}</a>
                              <p style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.location}</p>
                              <ul>
                                <li><a href="javascript:void(0)"><img src="assets/img/icons/sqft.svg" alt="">${a.area_sqft || 0} sqft</a></li>
                                <li><a href="javascript:void(0)"><img src="assets/img/icons/bed.svg" alt="">${a.bedrooms || 0} Beds</a></li>
                                <li class="m-0"><a href="javascript:void(0)"><img src="assets/img/icons/bath.svg" alt="">${a.bathrooms || 0} Baths</a></li>
                              </ul>
                              <div class="price-area">
                                <h3>${price}</h3>
                                <div class="btn-area1">
                                  <a href="property-single.html?id=${a.id}" class="header-btn1">${btnLabel}</a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>`);
                    });
                }
            } catch (moreErr) {
                console.warn('Could not load more properties:', moreErr);
                moreContainer.innerHTML = '';
            }
        }
        
        // Initialize Magnific Popup for all elements with class property-popup
        if (typeof $.fn.magnificPopup !== 'undefined') {
            $('.property-popup').magnificPopup({
                type: 'image',
                gallery: { enabled: true }
            });
        }

    } catch (e) {
        console.error(e);
        document.getElementById('hero-title').innerText = "Error Loading Property";
    }

    // ---- Request Information Form ----
    const reqForm = document.getElementById('request-info-form');
    if (reqForm) {
        reqForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msgDiv = document.getElementById('req-form-msg');
            const btn = document.getElementById('req-submit-btn');
            const name = document.getElementById('req-name').value.trim();
            const email = document.getElementById('req-email').value.trim();
            const phone = document.getElementById('req-phone').value.trim();
            const urlParams = new URLSearchParams(window.location.search);
            const propertyId = urlParams.get('id');
            const propertyTitle = document.getElementById('head-title') ? document.getElementById('head-title').innerText : propertyId;

            btn.disabled = true;
            msgDiv.style.color = '#555';
            msgDiv.innerText = 'Sending...';

            try {
                const res = await fetch('/api/request-information', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, propertyId, propertyTitle })
                });
                const data = await res.json();
                if (res.ok) {
                    msgDiv.style.color = '#16a34a';
                    msgDiv.innerText = 'Request sent! Redirecting to WhatsApp...';
                    
                    try {
                        const configRes = await fetch('/api/config');
                        const configData = await configRes.json();
                        const waMsg = `Hello CAM Holdings, I am ${name}.\nI am interested in "${propertyTitle}" (ID: ${propertyId}).\nEmail: ${email}\nPhone: ${phone || 'N/A'}`;
                        const waUrl = `https://wa.me/${configData.whatsappNumber}?text=${encodeURIComponent(waMsg)}`;
                        window.open(waUrl, '_blank');
                    } catch (e) { console.error("WhatsApp redirect failed", e); }

                    reqForm.reset();
                } else {
                    throw new Error(data.error || 'Failed to send');
                }
            } catch (err) {
                msgDiv.style.color = '#dc2626';
                msgDiv.innerText = 'Failed to send. Please try again.';
            } finally {
                btn.disabled = false;
            }
        });
    }
});
