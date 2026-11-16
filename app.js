(() => {
  'use strict';
  const products = Array.isArray(window.VENARI_PRODUCTS) ? window.VENARI_PRODUCTS.map((p, i) => ({ ...p, id: slug(p.name) || `item-${i}` })) : [];
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const money = value => value == null ? 'Harga menyusul' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  function slug(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  const read = (key, fallback) => { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  let cart = read('kvenari-cart', []);
  let selectedCategory = 'All';
  let searchTerm = '';
  let sortMode = 'featured';
  let toastTimer;

  function showToast(message) { const el = $('#toast'); if (!el) return; el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200); }
  function categoryMatches(product, category) {
    if (category === 'All') return true;
    if (category === 'Apparel') return ['Hoodies', 'Sweaters', 'T-shirts', 'Jackets', 'Jerseys', 'Pants'].includes(product.category);
    return product.category === category;
  }
  function filteredProducts(category = selectedCategory) {
    let result = products.filter(p => categoryMatches(p, category) && `${p.name} ${p.category}`.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sortMode === 'name-asc') result.sort((a,b) => a.name.localeCompare(b.name));
    if (sortMode === 'price-asc') result.sort((a,b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sortMode === 'price-desc') result.sort((a,b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    return result;
  }
  function productCard(p) {
    const image = p.images?.[0] || '';
    return `<article class="product-card"><a class="product-image" href="#product/${p.id}" aria-label="Lihat ${esc(p.name)}"><img src="${attr(image)}" alt="${attr(p.name)}" loading="lazy" onerror="this.style.visibility='hidden'"><span class="product-quick">VIEW PRODUCT ↗</span></a><div class="product-info"><div class="product-category">${esc(p.category)}</div><a class="product-name" href="#product/${p.id}">${esc(p.name)}</a><div class="product-price">${money(p.price)}${p.price == null ? ' <span class="price-note">· contact for availability</span>' : ''}</div></div></article>`;
  }
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function attr(s) { return esc(s); }
  function updateBagCount() { const count = cart.reduce((n, item) => n + item.qty, 0); const el = $('#bag-count'); if (el) el.textContent = count; }
  function renderGrid() {
    const latest = $('#latest-grid'); const shop = $('#shop-grid');
    if (latest) latest.innerHTML = products.slice(0, 4).map(productCard).join('');
    if (shop) {
      const result = filteredProducts(); shop.innerHTML = result.map(productCard).join('');
      $('#result-count').textContent = `${result.length} items`;
      $('#empty-state').hidden = result.length > 0;
    }
    $$('.filter-chip').forEach(btn => btn.classList.toggle('active', btn.dataset.category === selectedCategory));
  }
  function setCategory(category, scroll = true) {
    selectedCategory = category; renderGrid();
    if (scroll) $('#shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function setView(view) {
    const homeSections = ['.campaign-layout','.category-strip','#latest-section','.wide-banner','#shop'];
    homeSections.forEach(sel => { const el = $(sel); if (el) el.hidden = view !== 'home'; });
    ['#product-view','#cart-view','#checkout-view'].forEach(sel => { const el = $(sel); if (el) el.hidden = true; });
    if (view === 'home') { document.title = 'K VÉNARI — Streetwear'; return; }
    const el = view === 'product' ? $('#product-view') : view === 'cart' ? $('#cart-view') : $('#checkout-view');
    if (el) el.hidden = false;
  }
  function productDetail(id) {
    const p = products.find(item => item.id === id); if (!p) { location.hash = '#shop'; return; }
    setView('product'); document.title = `${p.name} — K VÉNARI`;
    const gallery = (p.images || []).slice(0, 6).map((src,i) => `<img src="${attr(src)}" alt="${attr(p.name)}${i ? ` view ${i+1}` : ''}" onerror="this.style.visibility='hidden'">`).join('');
    $('#product-view').innerHTML = `<a class="back-link" href="#shop">← BACK TO SHOP</a><div class="detail-layout"><div class="detail-gallery">${gallery}</div><div class="detail-info"><p class="eyebrow">${esc(p.category)} / K VÉNARI</p><h1>${esc(p.name)}</h1><div class="detail-price">${money(p.price)}</div><p class="detail-description">${esc(p.description || 'Selected piece from K VÉNARI Streetwear.')}${p.price == null ? '<br><br>Harga dan ketersediaan perlu dikonfirmasi sebelum pemesanan.' : ''}</p><div class="detail-actions"><button class="button button-dark" id="add-to-bag" data-id="${attr(p.id)}">ADD TO BAG</button><button class="button button-outline" id="buy-now" data-id="${attr(p.id)}">BUY NOW</button></div><p class="price-note">Harga dapat berubah mengikuti ketersediaan produk.</p></div></div>`;
    $('#add-to-bag').addEventListener('click', () => addToCart(p.id));
    $('#buy-now').addEventListener('click', () => { addToCart(p.id, false); location.hash = '#cart'; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function addToCart(id, notify = true) {
    const p = products.find(item => item.id === id); if (!p) return;
    const found = cart.find(item => item.id === id);
    if (found) found.qty += 1; else cart.push({ id, qty: 1 });
    write('kvenari-cart', cart); updateBagCount(); if (notify) showToast('Produk ditambahkan ke bag.');
  }
  function renderCart() {
    setView('cart'); document.title = 'Shopping Bag — K VÉNARI';
    const items = cart.map(item => ({...item, product: products.find(p => p.id === item.id)})).filter(item => item.product);
    if (!items.length) {
      $('#cart-view').innerHTML = `<a class="back-link" href="#shop">← CONTINUE SHOPPING</a><div class="section-heading"><div><p class="eyebrow">YOUR SELECTION</p><h1>Your bag is empty.</h1></div></div><a class="button button-dark" href="#shop">EXPLORE COLLECTION</a>`; window.scrollTo(0,0); return;
    }
    const total = items.reduce((sum, item) => sum + (item.product.price || 0) * item.qty, 0);
    const hasUnknown = items.some(item => item.product.price == null);
    $('#cart-view').innerHTML = `<a class="back-link" href="#shop">← CONTINUE SHOPPING</a><div class="section-heading"><div><p class="eyebrow">YOUR SELECTION</p><h1>Shopping bag</h1></div><span class="result-count">${items.reduce((n,i)=>n+i.qty,0)} items</span></div><div class="cart-layout"><div class="cart-list">${items.map(item => `<article class="cart-item"><img src="${attr(item.product.images[0]||'')}" alt="${attr(item.product.name)}" onerror="this.style.visibility='hidden'"><div><div class="product-category">${esc(item.product.category)}</div><h3>${esc(item.product.name)}</h3><p>${money(item.product.price)}</p><div class="quantity-control"><button data-action="decrease" data-id="${attr(item.id)}" aria-label="Kurangi jumlah">−</button><span>${item.qty}</span><button data-action="increase" data-id="${attr(item.id)}" aria-label="Tambah jumlah">+</button></div><button class="remove-item" data-action="remove" data-id="${attr(item.id)}">Remove</button></div><strong class="product-price">${item.product.price == null ? '—' : money(item.product.price * item.qty)}</strong></article>`).join('')}</div><aside class="cart-summary"><h2>Order summary</h2><div class="summary-row"><span>Subtotal</span><strong>${money(total)}</strong></div>${hasUnknown ? '<p class="price-note">Beberapa harga perlu dikonfirmasi. Total ini belum mencakup produk tanpa harga.</p>' : ''}<div class="summary-row summary-total"><span>Total</span><strong>${money(total)}</strong></div><button class="button button-dark" id="go-checkout">CONTINUE TO CHECKOUT</button></aside></div>`;
    $$('[data-action]', $('#cart-view')).forEach(btn => btn.addEventListener('click', () => changeCart(btn.dataset.id, btn.dataset.action)));
    $('#go-checkout').addEventListener('click', () => location.hash = '#checkout'); window.scrollTo(0,0);
  }
  function changeCart(id, action) {
    const item = cart.find(i => i.id === id); if (!item) return;
    if (action === 'increase') item.qty++;
    if (action === 'decrease') item.qty--;
    if (action === 'remove' || item.qty < 1) cart = cart.filter(i => i.id !== id);
    write('kvenari-cart', cart); updateBagCount(); renderCart();
  }
  function renderCheckout() {
    setView('checkout'); document.title = 'Checkout — K VÉNARI';
    const items = cart.map(item => ({...item, product: products.find(p => p.id === item.id)})).filter(item => item.product);
    if (!items.length) { $('#checkout-view').innerHTML = '<h1>Your bag is empty.</h1><a class="button button-dark" href="#shop">EXPLORE COLLECTION</a>'; return; }
    const total = items.reduce((sum, item) => sum + (item.product.price || 0) * item.qty, 0);
    const list = items.map(i => `${i.product.name} × ${i.qty} — ${money(i.product.price)}`).join('\n');
    $('#checkout-view').innerHTML = `<a class="back-link" href="#cart">← BACK TO BAG</a><div class="section-heading"><div><p class="eyebrow">FINAL STEP</p><h1>Checkout</h1></div></div><div class="checkout-layout"><form id="checkout-form"><div class="form-section"><h2>Contact & delivery</h2><div class="field"><label for="buyer-name">Nama lengkap</label><input id="buyer-name" name="name" required autocomplete="name"></div><div class="field"><label for="buyer-phone">Nomor WhatsApp</label><input id="buyer-phone" name="phone" type="tel" required autocomplete="tel"></div><div class="field"><label for="buyer-address">Alamat lengkap</label><textarea id="buyer-address" name="address" rows="3" required autocomplete="street-address"></textarea></div><div class="field"><label for="buyer-note">Catatan pesanan (opsional)</label><textarea id="buyer-note" name="note" rows="2"></textarea></div></div><div class="form-section"><h2>Payment</h2><div class="payment-box"><strong>GoPay / DANA</strong><br>Nomor pembayaran<br><span class="payment-number">+62 896-7032-9456</span><br>Pastikan nama penerima dan jumlah pembayaran sudah sesuai sebelum transfer. Konfirmasi pesanan melalui WhatsApp setelah pembayaran.</div></div><button class="button button-dark" type="submit" style="width:100%">CONFIRM VIA WHATSAPP ↗</button></form><aside class="cart-summary"><h2>Order summary</h2>${items.map(i=>`<div class="summary-row"><span>${esc(i.product.name)} × ${i.qty}</span><strong>${i.product.price == null ? 'TBD' : money(i.product.price*i.qty)}</strong></div>`).join('')}<div class="summary-row summary-total"><span>Subtotal</span><strong>${money(total)}</strong></div><p class="price-note">Harga produk yang belum tersedia dan ongkos kirim akan dikonfirmasi sebelum pembayaran.</p></aside></div>`;
    $('#checkout-form').addEventListener('submit', event => {
      event.preventDefault(); const fd = new FormData(event.currentTarget);
      const text = `Halo K VÉNARI Streetwear, saya ingin konfirmasi pesanan.\n\nNama: ${fd.get('name')}\nWhatsApp: ${fd.get('phone')}\nAlamat: ${fd.get('address')}\nCatatan: ${fd.get('note') || '-'}\n\nPesanan:\n${list}\n\nSubtotal terhitung: ${money(total)}\nMetode pembayaran: GoPay/DANA\nMohon konfirmasi harga final dan ketersediaan sebelum saya melakukan pembayaran.`;
      window.open(`https://wa.me/6289670329456?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }); window.scrollTo(0,0);
  }
  function route() {
    const hash = location.hash || '#home';
    if (hash.startsWith('#product/')) return productDetail(hash.slice(9));
    if (hash === '#cart') return renderCart();
    if (hash === '#checkout') return renderCheckout();
    setView('home');
    if (hash === '#shop') { renderGrid(); setTimeout(() => $('#shop')?.scrollIntoView({behavior:'smooth'}), 20); }
    else window.scrollTo(0,0);
  }
  $('#year').textContent = new Date().getFullYear();
  $('#theme-toggle').addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; write('kvenari-theme', next); });
  const savedTheme = read('kvenari-theme', 'light'); document.documentElement.dataset.theme = savedTheme;
  $('#search-toggle').addEventListener('click', () => { const panel = $('#search-panel'); panel.hidden = !panel.hidden; if (!panel.hidden) $('#search-input').focus(); });
  $('#search-close').addEventListener('click', () => { $('#search-panel').hidden = true; $('#search-input').value = ''; searchTerm = ''; renderGrid(); });
  $('#search-input').addEventListener('input', e => { searchTerm = e.target.value.trim(); renderGrid(); if (location.hash !== '#shop') location.hash = '#shop'; });
  $$('.filter-chip').forEach(btn => btn.addEventListener('click', () => setCategory(btn.dataset.category, false)));
  $$('.desktop-nav [data-category], .category-strip [data-category], .campaign[data-category]').forEach(btn => btn.addEventListener('click', () => { selectedCategory = btn.dataset.category; renderGrid(); }));
  $('#sort-select').addEventListener('change', e => { sortMode = e.target.value; renderGrid(); });
  window.addEventListener('hashchange', route);
  updateBagCount(); renderGrid(); route();
})();
