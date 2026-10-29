/* Pizza Asrifriska — pilihan pizza, ukuran, topping, keranjang, checkout WhatsApp */
const ADMIN_WHATSAPP = '6285362464950'; // Pastikan nomor benar sebelum dipublikasikan.
const LETTERING_FEE = 10000;
const PLUS_ICON = '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

// Urutan topping harus sama dengan urutan harga pada setiap varian.
const TOPPINGS = [
  { id: 'standar', name: 'Standar' },
  { id: 'extra-topping', name: 'Extra Topping' },
  { id: 'pepperoni', name: 'Pepperoni' },
  { id: 'extra-cheese', name: 'Extra Cheese' },
  { id: 'carbonara', name: 'Carbonara' },
  { id: 'mentai', name: 'Mentai' }
];

// Harga ditulis dalam ribuan: Standar, Extra Topping, Pepperoni, Extra Cheese, Carbonara, Mentai.
const variant = (id, name, ...prices) => ({ id, name, prices: prices.map(price => price * 1000) });
const products = [
  {
    id: 'pizgul', category: 'gulung', categoryLabel: 'Pizza Gulung (Pizgul)',
    name: 'Pizza Gulung', 
    image: 'assets/pizza-gulung.jpg', lettering: true,
    variants: [
      variant('isi4', 'Isi 4', 25, 30, 30, 30, 35, 40),
      variant('isi6', 'Isi 6', 30, 35, 35, 35, 40, 45),
      variant('isi8', 'Isi 8', 40, 45, 45, 50, 60, 70),
      variant('isi9', 'Isi 9', 50, 60, 60, 60, 70, 75),
      variant('isi12', 'Isi 12', 60, 70, 70, 75, 80, 85),
      variant('isi16', 'Isi 16', 80, 95, 95, 100, 100, 120),
      variant('isi25', 'Isi 25', 120, 135, 140, 150, 150, 160)
    ]
  },
  {
    id: 'pizbul', category: 'bulat', categoryLabel: 'Pizza Bulat (Pizbul)',
    name: 'Pizza Bulat', 
    image: 'assets/pizza-bulat-standar.jpg', lettering: true,
    variants: [
      variant('mini', 'Mini', 15, 20, 20, 20, 25, 25),
      variant('medium', 'Medium', 50, 65, 70, 70, 75, 80),
      variant('sedang', 'Sedang', 70, 85, 90, 85, 95, 100),
      variant('large', 'Large', 100, 120, 120, 120, 125, 135)
    ]
  }
];

let cart = [];
let selectedProduct = null;
let selectedQty = 1;
let selectedVariantItem = null;
const variantImage = (product, item) => product.images?.[item.id] ?? `assets/variants/${product.id}-${item.id}.jpg`;
function toppingSources(product, item, toppingId) {
  return [
    product.toppingImages?.[item.id]?.[toppingId] ?? `assets/toppings/${product.id}-${item.id}-${toppingId}.jpg`,
    `assets/toppings/${product.id}-${toppingId}.jpg`,
    variantImage(product, item),
    product.image
  ];
}
let toastTimer;
const $ = id => document.getElementById(id);
const rupiah = value => 'Rp' + Math.round(value).toLocaleString('id-ID');
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const toppingById = id => TOPPINGS.find(topping => topping.id === id) || TOPPINGS[0];
const priceOf = (pickedVariant, toppingId) => pickedVariant.prices[TOPPINGS.findIndex(topping => topping.id === toppingId)];
const minPrice = product => Math.min(...product.variants.flatMap(item => item.prices));
const maxPrice = product => Math.max(...product.variants.flatMap(item => item.prices));

function renderProducts(filter = 'all') {
  const shown = products.filter(product => filter === 'all' || product.category === filter);
  $('product-count').textContent = `${shown.reduce((sum, product) => sum + product.variants.length, 0)} menu`;
  $('product-list').innerHTML = shown.map(product => `
    <section class="rounded-3xl border border-stone-200 bg-white px-4 pb-2 pt-5 sm:px-6">
      <h3 class="border-b border-stone-200 pb-3 text-center text-xl font-extrabold uppercase tracking-[.2em] ">${escapeHtml(product.name)}</h3>
      <div class="divide-y divide-stone-100">
        ${product.variants.map(item => `
        <article class="relative flex items-center gap-4 py-4">
          <img src="${variantImage(product, item)}" alt="${escapeHtml(product.name + ' ' + item.name)}" loading="lazy" class="h-20 w-20 shrink-0 rounded-2xl bg-stone-100 object-cover" onerror="this.onerror=null;this.src='${product.image}'">
          <div class="min-w-0 flex-1 pr-14">
            <h4 class="text-lg text-stone-800">${escapeHtml(product.name)} ${escapeHtml(item.name)}</h4>
            <p class="text-sm text-stone-500">${TOPPINGS.length} pilihan topping</p>
            <p class="mt-2 text-lg font-bold text-stone-900">${rupiah(item.prices[0])}</p>
          </div>
          <button type="button" data-add="${product.id}:${item.id}" aria-label="Pilih ${escapeHtml(product.name + ' ' + item.name)}" class="absolute bottom-4 right-0 grid h-10 w-10 place-items-center rounded-full bg-emerald-700 text-2xl text-white shadow transition hover:bg-emerald-800">${PLUS_ICON}</button>
        </article>`).join('')}
      </div>
    </section>`).join('');
}

function showOverlay(id) { $(id).hidden = false; document.body.style.overflow = 'hidden'; }
function hideOverlay(id) {
  $(id).hidden = true;
  if (![...document.querySelectorAll('[data-overlay]')].some(overlay => !overlay.hidden)) document.body.style.overflow = '';
}
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2300);
}

function selectedVariant() { return selectedVariantItem; }
function selectedTopping() {
  const picked = document.querySelector('input[name="topping-choice"]:checked');
  return toppingById(picked?.value);
}
function variantPrice() {
  if (!selectedProduct) return 0;
  return priceOf(selectedVariant(), selectedTopping().id) + ($('lettering').checked ? LETTERING_FEE : 0);
}
function optionCard(name, value, label, priceAttribute, checked, image = '', fallback = '', imgAttribute = '') {
  const cls = 'h-20 w-20 shrink-0 rounded-2xl bg-stone-100 object-cover';
  const img = imgAttribute
    ? `<img ${imgAttribute} alt="" loading="lazy" class="${cls}">`
    : image
      ? `<img src="${image}" alt="" loading="lazy" class="${cls}" onerror="this.onerror=null;${fallback ? `this.src='${fallback}'` : `this.style.visibility='hidden'`}">`
      : '';
  return `<label class="relative flex cursor-pointer items-center gap-4 py-4">
    <input class="peer sr-only" type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''}>
    ${img}
    <span class="min-w-0 flex-1 pr-14">
      <span class="block text-lg text-stone-800">${escapeHtml(label)}</span>
      <span ${priceAttribute} class="mt-2 block text-lg font-bold text-stone-900"></span>
    </span>
    <span class="absolute bottom-4 right-0 grid h-10 w-10 place-items-center rounded-full bg-emerald-700 text-2xl text-white shadow peer-checked:hidden">${PLUS_ICON}</span>
    <span class="absolute bottom-4 right-0 hidden h-10 w-10 place-items-center rounded-full border-2 border-emerald-700 bg-white text-lg font-bold text-emerald-700 peer-checked:grid">✓</span>
  </label>`;
}

function setImage(img, sources) {
  const list = sources.filter(Boolean);
  const key = list.join('|');
  if (img.dataset.src === key) return;
  img.dataset.src = key;
  img.style.visibility = 'visible';
  let i = 0;
  img.onerror = () => {
    i++;
    if (i < list.length) img.src = list[i];
    else { img.onerror = null; img.style.visibility = 'hidden'; }
  };
  img.src = list[0];
}
function updateOptionPrices() {
  const pickedVariant = selectedVariant();
  const pickedTopping = selectedTopping();
  document.querySelectorAll('[data-topping-price]').forEach(element => {
    element.textContent = rupiah(priceOf(pickedVariant, element.dataset.toppingPrice));
  });
  document.querySelectorAll('[data-topping-img]').forEach(img => {
    setImage(img, toppingSources(selectedProduct, pickedVariant, img.dataset.toppingImg));
  });
}
function updateVariantSubtotal() {
  updateOptionPrices();
  $('variant-subtotal').textContent = rupiah(variantPrice() * selectedQty);
  $('variant-qty').textContent = selectedQty;
}
function openVariant(key) {
  const [productId, variantId] = key.split(':');
  selectedProduct = products.find(product => product.id === productId);
  selectedVariantItem = selectedProduct?.variants.find(item => item.id === variantId);
  if (!selectedProduct || !selectedVariantItem) return;
  selectedQty = 1;
  setImage($('variant-image'), [variantImage(selectedProduct, selectedVariantItem), selectedProduct.image]);
  $('variant-image').alt = `${selectedProduct.name} ${selectedVariantItem.name}`;
  $('variant-category').textContent = selectedProduct.categoryLabel;
  $('variant-title').textContent = `${selectedProduct.name} ${selectedVariantItem.name}`;
  $('variant-description').textContent = '';
  $('topping-options').innerHTML = TOPPINGS.map((topping, index) => optionCard('topping-choice', topping.id, topping.name, `data-topping-price="${topping.id}"`, index === 0, '', '', `data-topping-img="${topping.id}"`)).join('');
  $('lettering-option').hidden = !selectedProduct.lettering;
  $('lettering').checked = false;
  updateVariantSubtotal();
  showOverlay('variant-overlay');
}

function lineKey(productId, variantId, toppingId, lettering) {
  return `${productId}__${variantId}__${toppingId}__${lettering ? 'letter' : 'plain'}`;
}
function addToCart(product, pickedVariant, topping, qty, lettering) {
  const key = lineKey(product.id, pickedVariant.id, topping.id, lettering);
  const existing = cart.find(item => item.key === key);
  if (existing) existing.qty = Math.min(99, existing.qty + qty);
  else cart.push({ key, productId: product.id, variantId: pickedVariant.id, toppingId: topping.id, lettering, qty });
  renderCart();
}
function cartLine(item) {
  const product = products.find(product => product.id === item.productId);
  const pickedVariant = product.variants.find(variant => variant.id === item.variantId);
  const topping = toppingById(item.toppingId);
  const unitPrice = priceOf(pickedVariant, topping.id) + (item.lettering ? LETTERING_FEE : 0);
  return { item, product, variant: pickedVariant, topping, unitPrice, subtotal: unitPrice * item.qty };
}
function cartTotals() {
  const lines = cart.map(cartLine);
  return { lines, total: lines.reduce((sum, line) => sum + line.subtotal, 0), count: lines.reduce((sum, line) => sum + line.item.qty, 0) };
}
function renderCart() {
  const { lines, total, count } = cartTotals();
  $('cart-dock').hidden = count === 0;
  $('dock-count').textContent = `Keranjang · ${count} item`;
  $('dock-total').textContent = rupiah(total);
  $('cart-total').textContent = rupiah(total);
  $('cart-items').innerHTML = lines.length ? lines.map(({ item, product, variant: pickedVariant, topping, subtotal }) => `
    <article class="grid grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-3 py-4 sm:grid-cols-[72px_minmax(0,1fr)_auto]">
      <img class="h-[60px] w-[60px] rounded-xl bg-stone-100 object-cover sm:h-[72px] sm:w-[72px]" src="${product.image}" alt="" onerror="this.style.visibility='hidden'">
      <div class="min-w-0"><h3 class="text-sm font-extrabold">${escapeHtml(product.name)}</h3><p class="mt-1 text-xs leading-5 text-stone-500">${escapeHtml(pickedVariant.name)} · ${escapeHtml(topping.name)}${item.lettering ? ' · Cetak huruf' : ''}</p><b class="mt-1 block text-sm text-emerald-800">${rupiah(subtotal)}</b></div>
      <div class="flex flex-col items-end gap-2"><div class="flex items-center gap-2 rounded-full bg-stone-100 p-1"><button type="button" class="grid h-7 w-7 place-items-center rounded-full bg-white font-bold shadow-sm" data-cart-action="minus" data-key="${item.key}" aria-label="Kurangi jumlah">−</button><span class="min-w-4 text-center text-xs font-extrabold">${item.qty}</span><button type="button" class="grid h-7 w-7 place-items-center rounded-full bg-white font-bold shadow-sm" data-cart-action="plus" data-key="${item.key}" aria-label="Tambah jumlah">+</button></div><button type="button" class="text-xs font-semibold text-red-600 hover:underline" data-cart-action="remove" data-key="${item.key}">Hapus</button></div>
    </article>`).join('') : '<p class="py-8 text-center text-sm text-stone-500">Keranjang masih kosong. Silakan pilih menu terlebih dahulu.</p>';
  $('checkout-mini-summary').innerHTML = `<span>${count} item dari ${new Set(lines.map(line => line.product.id)).size} jenis pizza</span><b class="shrink-0 text-base font-extrabold">${rupiah(total)}</b>`;
  $('final-total').textContent = rupiah(total);
}
function changeCart(key, action) {
  const item = cart.find(item => item.key === key);
  if (!item) return;
  if (action === 'plus') item.qty = Math.min(99, item.qty + 1);
  if (action === 'minus') item.qty -= 1;
  if (action === 'remove' || item.qty <= 0) cart = cart.filter(item => item.key !== key);
  renderCart();
  if (!cart.length) {
    hideOverlay('cart-overlay');
    showToast('Keranjang kosong. Silakan pilih menu lagi.');
  }
}
function openCheckout() {
  if (!cart.length) { showToast('Pilih menu terlebih dahulu.'); return; }
  hideOverlay('cart-overlay');
  renderCart();
  showOverlay('checkout-overlay');
}
function sendOrder(event) {
  event.preventDefault();
  const name = $('customer-name').value.trim();
  const delivery = document.querySelector('input[name="delivery"]:checked').value;
  const time = $('order-time').value;
  const address = $('customer-address').value.trim();
  const payment = $('payment-method').value;
  const notes = $('order-notes').value.trim();
  const error = $('checkout-error');
  error.hidden = true;
  if (!cart.length) { error.textContent = 'Keranjang kosong. Silakan pilih menu terlebih dahulu.'; error.hidden = false; return; }
  if (!name || !time || (delivery !== 'Ambil sendiri' && !address)) {
    error.textContent = 'Lengkapi nama, jam, dan alamat jika pesanan diantar.';
    error.hidden = false;
    return;
  }
  const { lines, total } = cartTotals();
  const orderLines = lines.map((line, index) => `${index + 1}. ${line.product.name} — ${line.variant.name} — Topping ${line.topping.name}${line.item.lettering ? ' + cetak huruf' : ''} x${line.item.qty} = ${rupiah(line.subtotal)}`);
  const toppingSummary = [...new Set(lines.map(line => line.topping.name))].join(', ');
  const message = [
    "Wa'alaikumsalam 🙏",
    '👉 SELAMAT DATANG DI PIZZA ASRIFRISKA🍕🙏',
    '✅ Order ?',
    'Yuk Isi formatnya dulu ya.. 👇',
    `🫑 Atas Nama : ${name}`,
    '🫑 Jenis pesanan :',
    ...orderLines,
    `🫑 Pilihan Topping : ${toppingSummary}`,
    `🫑 Jam pengambilan/pengantaran : ${time}`,
    `🫑 Gojek/ambil : ${delivery}`,
    `🫑 COD / TF : ${payment}`,
    `🫑 Alamat lengkap / sharelok : ${delivery === 'Ambil sendiri' ? 'Ambil sendiri' : address}`,
    `💰 Total menu : ${rupiah(total)}`,
    notes ? `📝 Catatan : ${notes}` : ''
  ].filter(Boolean).join('\n');
  const phone = ADMIN_WHATSAPP.replace(/\D/g, '');
  if (!phone || phone.length < 10) { error.textContent = 'Nomor WhatsApp admin belum valid. Periksa ADMIN_WHATSAPP di script.js.'; error.hidden = false; return; }
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

// Event handlers

document.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  if (add) openVariant(add.dataset.add);
  const close = event.target.closest('[data-close]');
  if (close) hideOverlay(close.dataset.close);
  const action = event.target.closest('[data-cart-action]');
  if (action) changeCart(action.dataset.key, action.dataset.cartAction);
  const filter = event.target.closest('[data-filter]');
  if (filter) {
    document.querySelectorAll('[data-filter]').forEach(button => {
      const active = button === filter;
      button.classList.toggle('bg-emerald-700', active);
      button.classList.toggle('text-white', active);
      button.classList.toggle('bg-white', !active);
      button.classList.toggle('border', !active);
      button.classList.toggle('border-stone-200', !active);
      button.classList.toggle('text-stone-700', !active);
    });
    renderProducts(filter.dataset.filter);
  }
});
document.querySelectorAll('[data-overlay]').forEach(overlay => overlay.addEventListener('click', event => {
  if (event.target === overlay) hideOverlay(overlay.id);
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.querySelectorAll('[data-overlay]').forEach(overlay => {
    if (!overlay.hidden) hideOverlay(overlay.id);
  });
});
$('variant-minus').addEventListener('click', () => { selectedQty = Math.max(1, selectedQty - 1); updateVariantSubtotal(); });
$('variant-plus').addEventListener('click', () => { selectedQty = Math.min(99, selectedQty + 1); updateVariantSubtotal(); });
$('topping-options').addEventListener('change', updateVariantSubtotal);
$('lettering').addEventListener('change', updateVariantSubtotal);
$('variant-form').addEventListener('submit', event => {
  event.preventDefault();
  addToCart(selectedProduct, selectedVariant(), selectedTopping(), selectedQty, $('lettering').checked);
  hideOverlay('variant-overlay');
  showToast('Menu ditambahkan ke keranjang.');
});
$('open-cart').addEventListener('click', () => { renderCart(); showOverlay('cart-overlay'); });
$('add-more').addEventListener('click', () => { hideOverlay('cart-overlay'); $('menu').scrollIntoView({ behavior: 'smooth' }); });
$('confirm-order').addEventListener('click', openCheckout);
document.querySelectorAll('input[name="delivery"]').forEach(input => input.addEventListener('change', () => {
  const needsAddress = document.querySelector('input[name="delivery"]:checked').value !== 'Ambil sendiri';
  $('address-field').hidden = !needsAddress;
  $('customer-address').required = needsAddress;
}));
$('checkout-form').addEventListener('submit', sendOrder);
renderProducts();
renderCart();
