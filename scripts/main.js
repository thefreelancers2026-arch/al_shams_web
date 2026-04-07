// main.js

// 1. Analytics Wrapper
function trackEvent(eventName, eventCategory, eventLabel) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            'event_category': eventCategory,
            'event_label': eventLabel
        });
    } else {
        console.log(`[Analytics] ${eventName}: ${eventCategory} - ${eventLabel}`);
    }
}

// 2. STATE & DATA
let catalogData = [];
let wishlist = JSON.parse(localStorage.getItem('al_shams_wishlist')) || [];
let currentFilter = 'All';
const overlay = document.getElementById('appOverlay');
const wishSidebar = document.getElementById('wishlistSidebar');
const catSidebar = document.getElementById('catalogueSidebar');

// Initialize Feather Icons
feather.replace();

async function fetchCatalogData() {
    try {
        const response = await fetch('data/catalog.json');
        if (!response.ok) throw new Error('Network response was not ok');
        catalogData = await response.json();
    } catch (error) {
        console.error("Failed to fetch catalog. Using default fallback.", error);
        // Fallback ensures no UI breaking if JSON cannot be loaded due to local file:/// viewing
        // Uses real BRAVAT catalogue images extracted from client PDF
        catalogData = [
            { id: "p001", title: "BRAVAT Design 001", category: "BRAVAT – 1200x600mm", type: "Designer", image: "images/catalogue/tile_001.webp", delay: "0s" },
            { id: "p002", title: "BRAVAT Design 002", category: "BRAVAT – 1200x600mm", type: "Designer", image: "images/catalogue/tile_002.webp", delay: "0.1s" },
            { id: "p003", title: "BRAVAT Design 003", category: "BRAVAT – 1200x600mm", type: "Designer", image: "images/catalogue/tile_003.webp", delay: "0s" },
            { id: "p004", title: "BRAVAT Design 004", category: "BRAVAT – 1200x600mm", type: "Designer", image: "images/catalogue/tile_004.webp", delay: "0.1s" },
            { id: "p005", title: "BRAVAT Design 005", category: "BRAVAT – 1200x600mm", type: "Designer", image: "images/catalogue/tile_005.webp", delay: "0s" },
            { id: "p006", title: "BRAVAT Design 006", category: "BRAVAT – 1200x600mm", type: "Designer", image: "images/catalogue/tile_006.webp", delay: "0.1s" }
        ];
    }
    renderCatalog(currentFilter);
    updateWishlistUI();
}

function saveWishlist() { localStorage.setItem('al_shams_wishlist', JSON.stringify(wishlist)); updateWishlistUI(); }

function showToast(message) {
    const toast = document.getElementById('wishlistToast');
    if(message) toast.innerHTML = `<i data-feather="check-circle" style="width:16px;"></i> ${message}`;
    feather.replace();
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function toggleWishlistItem(itemId) {
    const index = wishlist.indexOf(itemId);
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(itemId); 
        showToast("Added! Open Selections to send to Owner.");
        trackEvent('add_to_wishlist', 'catalog', itemId);
    }
    saveWishlist(); renderCatalog(currentFilter); 
}

function removeFromWishlist(itemId) {
    wishlist = wishlist.filter(id => id !== itemId);
    saveWishlist(); renderCatalog(currentFilter);
}

function filterCatalog(category, btnElement) {
    currentFilter = category;
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
    trackEvent('filter_catalog', 'catalog', category);
    renderCatalog(category);
}

function imageFallback(imgElement) {
    imgElement.onerror = null; // prevent infinite loop
    imgElement.src = 'images/hero_bg.webp'; // ultimate fallback image
}

// 3. RENDER CATALOG into horizontal strip
function renderCatalog(filter = 'All') {
    const strip = document.getElementById('catalogGrid');
    strip.innerHTML = '';

    // Filtering still works if types are set in catalog.json
    const data = filter === 'All' ? catalogData : catalogData.filter(item => item.type === filter);

    if (data.length === 0) {
        strip.innerHTML = '<p style="color:var(--text-muted); padding: 2rem 4%;">No collections found.</p>';
        return;
    }

    data.forEach(item => {
        const isLiked = wishlist.includes(item.id);
        strip.innerHTML += `
            <div class="collection-card">
                <button class="wishlist-heart-btn ${isLiked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleWishlistItem('${item.id}')" aria-label="Add to Selections">
                    <i data-feather="heart"></i>
                </button>
                <img src="${item.image}" alt="${item.title}" loading="lazy" decoding="async" onerror="imageFallback(this)">
                <div class="collection-info">
                    <h3>${item.title}</h3>
                    <p>${item.category}</p>
                </div>
            </div>
        `;
    });

    feather.replace();
    addDragScroll(strip);
}

// Drag-to-scroll for desktop luxury feel
function addDragScroll(el) {
    let isDown = false, startX, scrollLeft;
    el.addEventListener('mousedown', (e) => {
        isDown = true; el.classList.add('grabbing');
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
    });
    el.addEventListener('mouseleave', () => { isDown = false; el.classList.remove('grabbing'); });
    el.addEventListener('mouseup', () => { isDown = false; el.classList.remove('grabbing'); });
    el.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const walk = (x - startX) * 1.5;
        el.scrollLeft = scrollLeft - walk;
    });
}

function updateWishlistUI() {
    document.getElementById('wishCountTop').innerText = `(${wishlist.length})`;
    const container = document.getElementById('wishlistContainer');
    container.innerHTML = '';

    if(wishlist.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding-top:2rem; font-family: var(--font-serif); font-size: 1.2rem; font-style: italic;">Your selection is empty.</p>';
        return;
    }

    wishlist.forEach(id => {
        const p = catalogData.find(c => c.id === id);
        if(!p) return;
        container.innerHTML += `
            <div class="wish-item">
                <img src="${p.image}" alt="${p.title}" loading="lazy" decoding="async" onerror="imageFallback(this)">
                <div class="wish-item-info"><h4>${p.title}</h4><p>${p.category}</p></div>
                <button class="remove-btn" onclick="removeFromWishlist('${p.id}')" aria-label="Remove item"><i data-feather="trash-2" style="width:18px;"></i></button>
            </div>
        `;
    });
    feather.replace();
}

// 4. CHECKOUTS & LEAD FORMS
function checkoutWishlist(e) {
    e.preventDefault();
    if(wishlist.length === 0) { alert("Your selection is empty!"); return; }
    const name = document.getElementById('wlName').value.trim();
    const phone = document.getElementById('wlPhone').value.trim();
    
    let itemListText = "";
    wishlist.forEach((id, i) => { 
        const p = catalogData.find(c => c.id === id); 
        if(p) itemListText += `${i+1}. ${p.title} (${p.category})\n`; 
    });
    
    let msg = `*Premium Selection Enquiry*\n\nHi Al Shams, I am *${name}*.\nI am highly interested in the following selections:\n\n${itemListText}\nPlease share pricing and availability. My contact is ${phone}.`;
    
    trackEvent('submit_wishlist', 'lead', 'whatsapp_checkout');
    window.open(`https://wa.me/919500208677?text=${encodeURIComponent(msg)}`, '_blank');
}

function requestCatalogue(e) {
    e.preventDefault();
    const name = document.getElementById('catName').value.trim();
    const phone = document.getElementById('catPhone').value.trim();
    let msg = `*Catalogue Request*\n\nHello Al Shams, I am *${name}*.\nPlease share your exclusive PDF E-Catalogue.\nMy number: ${phone}`;
    
    trackEvent('request_catalogue', 'lead', 'whatsapp_catalog');
    window.open(`https://wa.me/919500208677?text=${encodeURIComponent(msg)}`, '_blank');
}

async function handleEnquirySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    
    // Store original button text
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Sending Enquiry...';
    btn.disabled = true;

    // Build Payload
    const formData = new FormData(form);
    
    try {
        // Formspree Backend Integration Point
        const response = await fetch('https://formspree.io/f/xojprwkw', {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
            showToast("Success! Our designer will contact you shortly.");
            form.reset();
            trackEvent('form_submit', 'lead', 'consult_designer_success');
        } else {
            showToast("Issue sending enquiry. Please contact via WhatsApp.");
            trackEvent('form_error', 'lead', 'consult_designer_fail');
        }
    } catch(err) {
        console.error('Form submission error', err);
        showToast("Network Error: Please try WhatsApp instead.");
    } finally {
        // Restore button state
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 5. MODAL LOGIC
function toggleWishlist() {
    catSidebar.classList.remove('open');
    wishSidebar.classList.toggle('open');
    updateOverlay(wishSidebar.classList.contains('open'));
}

function toggleCatalogue() {
    wishSidebar.classList.remove('open');
    catSidebar.classList.toggle('open');
    updateOverlay(catSidebar.classList.contains('open'));
}

function closeAllModals() {
    wishSidebar.classList.remove('open');
    catSidebar.classList.remove('open');
    updateOverlay(false);
}

function updateOverlay(isOpen) {
    if(isOpen) {
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    } else {
        overlay.classList.remove('open');
        document.body.style.overflow = 'auto';
    }
}

// 6. SCROLL ANIMATIONS
function revealOnScroll() {
    document.querySelectorAll('.reveal').forEach(reveal => {
        if (reveal.getBoundingClientRect().top < window.innerHeight - 100) reveal.classList.add('active');
    });
}
window.addEventListener('scroll', revealOnScroll);

// Interaction Triggers for Analytics
document.addEventListener('click', (e) => {
    let callHit = e.target.closest('.call-btn');
    if (callHit) trackEvent('click_call', 'contact', 'sticky_call_button');
    
    let whatsappHit = e.target.closest('a[href^="https://wa.me"]');
    if (whatsappHit && !whatsappHit.closest('.call-btn') && !whatsappHit.hasAttribute('onclick')) {
        trackEvent('click_whatsapp', 'contact', 'sticky_whatsapp_button');
    }
});

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => { 
    fetchCatalogData(); 
    setTimeout(revealOnScroll, 100); 
});
