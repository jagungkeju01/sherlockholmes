(() => {
  'use strict';
  const products = Array.isArray(window.VENARI_PRODUCTS) ? window.VENARI_PRODUCTS.map((p,i)=>({...p,id:slug(p.name)||`item-${i}`})) : [];
  function slug(value){return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
  function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function money(value){return value==null?'Harga menyusul':new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value)}
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
  function toast(message){const el=document.querySelector('#toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(window.__venariToast);window.__venariToast=setTimeout(()=>el.classList.remove('show'),2200)}
  function card(p){const image=p.images?.[0]||'';return `<article class="product-card"><a class="product-image" href="checkout.html" aria-label="Lihat ${esc(p.name)}"><img src="${esc(image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='assets/Campaign.jpg';this.style.objectFit='cover'"></a><div class="product-info"><div class="product-category">${esc(p.category)}</div><a class="product-name" href="checkout.html">${esc(p.name)}</a><div class="product-price">${money(p.price)}</div><div class="product-actions"><button type="button" data-add="${esc(p.id)}">ADD TO BAG</button><button type="button" data-buy="${esc(p.id)}">BUY NOW</button></div></div></article>`}
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelector('#year')?.replaceChildren(document.createTextNode(new Date().getFullYear()));
    const root=document.documentElement;root.dataset.theme=read('kvenari-theme','dark');
    document.querySelector('#theme-toggle')?.addEventListener('click',()=>{const next=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=next;write('kvenari-theme',next)});
    const panel=document.querySelector('#search-panel'),input=document.querySelector('#search-input');
    document.querySelector('#search-toggle')?.addEventListener('click',()=>{if(!panel)return;panel.hidden=!panel.hidden;if(!panel.hidden)input?.focus()});
    document.querySelector('#search-close')?.addEventListener('click',()=>{if(panel)panel.hidden=true;if(input)input.value='';if(location.pathname.endsWith('shop.html')){const u=new URL(location.href);u.searchParams.delete('q');history.replaceState({},'',u);document.dispatchEvent(new CustomEvent('venari-search',{detail:''}))}});
    input?.addEventListener('input',()=>{if(location.pathname.endsWith('shop.html'))document.dispatchEvent(new CustomEvent('venari-search',{detail:input.value.trim()}));else if(input.value.trim())location.href='shop.html?q='+encodeURIComponent(input.value.trim())});
    document.querySelectorAll('[data-go-category]').forEach(btn=>btn.addEventListener('click',()=>location.href='shop.html?category='+encodeURIComponent(btn.dataset.goCategory)));
    document.addEventListener('click',e=>{const add=e.target.closest('[data-add]');const buy=e.target.closest('[data-buy]');if(add||buy){const id=(add||buy).dataset.add||(add||buy).dataset.buy;window.VenariCart?.add(id);if(buy)location.href='checkout.html'}});
  });
  window.Venari={products,slug,esc,money,read,write,toast,card};
})();
