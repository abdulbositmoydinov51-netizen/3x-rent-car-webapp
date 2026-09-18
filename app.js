/* 3X Rent Car — Telegram Mini App
   Client-side, no build step. Vanilla JS SPA driven by a single `store`
   object; every navigation just re-renders the active screen's template. */

const store = {
  theme: 'light',
  role: 'rider',           // 'rider' | 'owner'
  screen: 'splash',
  history: [],
  selectedCarId: CARS[0].id,
  categoryKey: null,       // set when opening a category screen
  homeChip: 'barchasi',
  searchChip: 'barchasi',
  bookingTab: 'Barchasi',
  payMethod: 'Payme',
  lang: 'UZ',
  galleryIdx: 0,
  ownerCarStatus: "Bo'sh",
  ownerCarStatusName: 'Chevrolet Cobalt',
  ownerCarId: null,          // haqiqiy (DB) mashina bo'lsa, uning id'si — "Band"/"Bo'sh" ni bazaga yozish uchun
  agree: false,
  currentUser: null,        // { name, phone, role } — set on register/login
  addCarTrans: 'Avtomat',
  addCarCat: 'ekonom',
};

const app = document.getElementById('app');
const toastEl = document.getElementById('toast');
let toastTimer = null;

function icon(name, cls){ return `<span class="${cls||''}">${ICONS[name]||''}</span>`; }

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toastEl.classList.remove('show'), 1800);
}

/* ---------------- doimiy saqlash: localStorage + Telegram CloudStorage ---------------
   Ba'zi qurilmalarda (ayniqsa Telegram mini ilovani to'liq yopib qayta
   ochganda) localStorage saqlanib qolmasligi mumkin. Shuning uchun Telegram
   mini ilovalar uchun maxsus ishlab chiqilgan, ancha ishonchli CloudStorage'ga
   ham (mavjud bo'lsa) parallel ravishda yozamiz/o'qiymiz. */

function cloudSet(key, value){
  try {
    const tg = window.Telegram && window.Telegram.WebApp;
    if(tg && tg.CloudStorage && tg.CloudStorage.setItem) tg.CloudStorage.setItem(key, value, function(){});
  } catch(e) {}
}

function cloudRemove(key){
  try {
    const tg = window.Telegram && window.Telegram.WebApp;
    if(tg && tg.CloudStorage && tg.CloudStorage.removeItem) tg.CloudStorage.removeItem(key, function(){});
  } catch(e) {}
}

function cloudGet(key, cb){
  try {
    const tg = window.Telegram && window.Telegram.WebApp;
    if(tg && tg.CloudStorage && tg.CloudStorage.getItem){
      tg.CloudStorage.getItem(key, function(err, value){ cb(!err && value ? value : null); });
      return;
    }
  } catch(e) {}
  cb(null);
}

const THEME_KEY = '3xrc_theme';

function setTheme(theme){
  store.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  syncTelegramChrome();
}

// Foydalanuvchi rejimni ONGLI ravishda almashtirganda chaqiriladi — tanlovni
// localStorage'ga VA Telegram CloudStorage'ga saqlaydi. (Diqqat: bu boot
// paytida chaqirilmaydi — aks holda hali CloudStorage'dan o'qib ulgurmasdan
// standart qiymat bilan uni ustidan yozib tashlagan bo'lardik.)
function setThemeAndSave(theme){
  setTheme(theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch(e) {}
  cloudSet(THEME_KEY, theme);
}

/* ---------------- session (qayta ochilganda ham "kirgan" holatda qolish) ---------------- */

const SESSION_KEY = '3xrc_session';

function saveSession(){
  if(!store.currentUser) return;
  const raw = JSON.stringify({ user: store.currentUser, role: store.role });
  try { localStorage.setItem(SESSION_KEY, raw); } catch(e) { /* localStorage yo'q bo'lsa ham ilova ishlashda davom etadi */ }
  cloudSet(SESSION_KEY, raw);
}

function clearSession(){
  try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
  cloudRemove(SESSION_KEY);
}

function loadSession(){
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function navigate(screen, opts){
  opts = opts || {};
  if(store.screen !== screen){
    store.history.push(store.screen);
  }
  Object.assign(store, opts);
  store.screen = screen;
  render();
  app.scrollTop = 0;
  syncTelegramBackButton();
}

function goBack(){
  const prev = store.history.pop();
  if(prev){
    store.screen = prev;
    render();
    app.scrollTop = 0;
    syncTelegramBackButton();
  }
}

function resetTo(screen, opts){
  store.history = [];
  Object.assign(store, opts||{});
  store.screen = screen;
  render();
  syncTelegramBackButton();
}

/* ---------------- shared pieces ---------------- */

function bottomNav(active){
  const rider = [
    { id:'home', label:'Bosh sahifa', icon:'home' },
    { id:'search-results', label:'Qidiruv', icon:'search' },
    { id:'my-bookings', label:'Bandlarim', icon:'calendar' },
    { id:'profile', label:'Profil', icon:'user' },
  ];
  const owner = [
    { id:'owner-cars', label:'Mashinalarim', icon:'car' },
    { id:'income', label:'Daromad', icon:'wallet' },
    { id:'profile', label:'Profil', icon:'user' },
  ];
  const items = store.role === 'owner' ? owner : rider;
  return `<nav class="bottom-nav">
    ${items.map(it => `
      <button class="nav-item ${it.id===active?'active':''}" data-nav="${it.id}">
        ${icon(it.icon)}
        <span>${it.label}</span>
      </button>`).join('')}
  </nav>`;
}

function topBar(title){
  return `<div class="topbar">
    <button class="topbar-icon" data-action="toast" data-msg="Menyu (demo)">${icon('menu')}</button>
    <div class="topbar-title">${title}</div>
    <button class="topbar-icon" data-action="toast" data-msg="Bildirishnomalar yo'q">${icon('bell')}</button>
  </div>`;
}

function backHeader(title, opts){
  opts = opts || {};
  return `<div class="header-back">
    <button class="back-btn" data-action="go-back">${icon('back')}</button>
    <div class="h-title">${title}</div>
    ${opts.right || ''}
  </div>`;
}

function chipRow(items, activeKey, group){
  return `<div class="chip-row">
    ${items.map(key => {
      const cat = CATEGORIES.find(c=>c.key===key);
      const label = cat ? cat.label : key;
      return `<button class="chip ${key===activeKey?'selected':''}" data-action="select-chip" data-group="${group}" data-value="${key}">${label}</button>`;
    }).join('')}
  </div>`;
}

function starRow(rating, reviews){
  if(rating == null) return `<div class="car-rating text-small">Yangi qo'shildi</div>`;
  return `<div class="car-rating">${icon('star')}<span>${rating}${reviews!=null ? ' ('+reviews+')' : ''}</span></div>`;
}

function carCard(car){
  return `<div class="car-card" data-nav="car-details" data-car="${car.id}">
    <div class="row">
      <div class="car-thumb">${icon('car')}</div>
      <div class="car-info">
        <div class="name">${car.name}</div>
        <div class="text-small">${car.trans} · ${car.seats} o'rin · ${car.city}</div>
        ${starRow(car.rating, car.reviews)}
      </div>
    </div>
    <hr/>
    <div class="price-row">
      <div class="text-price">${car.price ? fmt(car.price) + " so'm/kun" : "Narx kelishiladi"}</div>
      <button class="btn btn-primary btn-small" data-nav="booking" data-car="${car.id}">Band qilish</button>
    </div>
  </div>`;
}

function fmt(n){ return Number(n).toLocaleString('ru-RU').replace(/,/g,' '); }

/* ---------------- real cars (owner-qo'shgan, Supabase'dan) ---------------- */

let realCarsLoaded = false;
let realCarRows = []; // owner-qo'shgan mashinalarning xom (DB) qatorlari — "Mening mashinalarim" statistikasi uchun

function ownerRealCars(){
  const phone = store.currentUser ? store.currentUser.phone : '';
  if(!phone) return [];
  return realCarRows.filter(r => r.owner_phone === phone);
}

function ownerRealStats(){
  const rows = ownerRealCars();
  const total = rows.length;
  const busy = rows.filter(r => r.status === 'Band').length;
  const free = total - busy;
  return { total, free, busy };
}

function mapDbCarToAppCar(row){
  const transKey = (row.transmission||'').toLowerCase()==='mexanika' ? 'mexanika' : 'avtomat';
  const catMatch = CATEGORIES.find(c => c.label && row.category && c.label.toLowerCase()===String(row.category).toLowerCase());
  const catKey = catMatch ? catMatch.key : 'ekonom';
  const priceNum = parseInt(String(row.price||'').replace(/[^\d]/g,''), 10);
  return {
    id: 'db-' + row.id,
    name: row.model || 'Nomsiz mashina',
    trans: row.transmission || 'Avtomat',
    seats: 5,
    fuel: 'Benzin',
    year: row.year || '',
    city: 'Toshkent',
    district: '',
    price: isNaN(priceNum) ? 0 : priceNum,
    rating: null,
    reviews: null,
    cat: [catKey, transKey],
    ownerPhone: row.owner_phone || '',
    status: row.status || "Bo'sh",
    isReal: true,
  };
}

// Haqiqiy (bazadan olingan) mashinalarni CARS ro'yxatiga har doim eng
// so'nggi holatiga moslab qayta yozadi — shunda narx/holat ("Band"/"Bo'sh")
// o'zgargani ham darhol aks etadi, eski nusxasi osilib qolmaydi.
function refreshCarsFromRows(){
  const demoOnly = CARS.filter(c => !c.isReal);
  const mapped = realCarRows.map(mapDbCarToAppCar);
  CARS.length = 0;
  mapped.forEach(c => CARS.push(c));
  demoOnly.forEach(c => CARS.push(c));
}

async function loadRealCars(){
  const res = await dbListCars();
  if(!res.ok) return;
  realCarRows = res.data || [];
  refreshCarsFromRows();
  realCarsLoaded = true;

  // Foydalanuvchi hozir shu mashinalarni ko'rib turgan ekranda bo'lsa, darhol yangilansin
  if(['owner-cars','home','search-results'].includes(store.screen)) render();
}

/* ---------------- screen templates ---------------- */

function screenSplash(){
  return `<div class="splash">
    <div class="logo-mark">${icon('car')}</div>
    <h1>3X Rent Car</h1>
    <p>O'zbekiston bo'ylab minglab avtomobil — bitta ilovada</p>
    <div class="dots"><span class="on"></span><span></span><span></span></div>
  </div>`;
}

function screenWelcome(){
  return `<div class="welcome">
    <div class="art">
      <div class="logo-mark">${icon('car')}</div>
      <h1>3X Rent Car</h1>
      <p>O'zbekiston bo'ylab minglab avtomobil — bitta ilovada</p>
    </div>
    <div class="actions">
      <button class="btn btn-primary" data-nav="role-select">Boshlash</button>
      <button class="btn btn-secondary" data-nav="login">Kirish</button>
    </div>
  </div>`;
}

function screenRoleSelect(){
  return `<div class="screen-body">
    <div class="h-page" style="margin-top:24px">Qanday davom etmoqchisiz?</div>
    <p class="text-secondary text-body" style="margin-bottom:24px">Xizmatdan qanday foydalanishni tanlang, buni keyinroq ham o'zgartirish mumkin.</p>
    <button class="role-card" data-action="select-role" data-value="rider">
      <div class="emoji">🚗</div>
      <div><b>Ijaraga oluvchiman</b><span>Mashinalarni qidirib, band qilib ijaraga olaman</span></div>
    </button>
    <button class="role-card" data-action="select-role" data-value="owner">
      <div class="emoji">🔑</div>
      <div><b>Ijaraga beruvchiman</b><span>O'z mashinalarimni ijaraga qo'yib, boshqaraman</span></div>
    </button>
  </div>`;
}

function screenRegister(){
  const owner = store.role === 'owner';
  return `<div class="screen-body">
    <div style="padding-top:16px">
      <div class="h-title">3X Rent Car</div>
      <p class="text-secondary text-body" style="margin:6px 0 22px">${owner ? "Mashinalaringizni ijaraga qo'yib, daromad qiling" : "O'zbekiston bo'ylab minglab avtomobil — bitta ilovada"}</p>
    </div>
    <div class="h-subtitle" style="margin-bottom:16px">Ro'yxatdan o'tish</div>
    <div class="field"><label>Ism va familiya</label><input id="reg-name" type="text" placeholder="Ism Familiya"/></div>
    <div class="field"><label>Telefon raqam</label><input id="reg-phone" type="tel" placeholder="+998 90 123 45 67"/></div>
    <div class="field"><label>Parol</label><input id="reg-password" type="password" placeholder="Parol o'rnating"/></div>
    <label class="checkbox-row"><input type="checkbox"/><span>Foydalanish shartlariga roziman</span></label>
    <button class="btn btn-primary" data-submit="register" data-role="${owner ? 'owner' : 'rider'}" data-target="${owner ? 'owner-cars' : 'home'}">Ro'yxatdan o'tish</button>
    <p class="text-small center" style="margin-top:16px">Akkountingiz bormi? <a data-nav="login" style="color:var(--color-accent-primary);font-weight:600;text-decoration:none">Kirish</a></p>
  </div>`;
}

function screenLogin(){
  return `<div class="screen-body">
    <div style="padding-top:32px">
      <div class="h-page">Xush kelibsiz</div>
      <p class="text-secondary text-body" style="margin:6px 0 26px">Hisobingizga kiring va safaringizni davom ettiring</p>
    </div>
    <div class="field"><label>Telefon raqam</label><input id="login-phone" type="tel" placeholder="+998 90 123 45 67"/></div>
    <div class="field"><label>Parol</label><input id="login-password" type="password" placeholder="Parolingiz"/></div>
    <p class="text-small" style="text-align:right;margin:-6px 0 20px"><a data-action="toast" data-msg="Parolni tiklash havolasi yuborildi (demo)" style="color:var(--color-accent-primary);font-weight:600;text-decoration:none">Parolni unutdingizmi?</a></p>
    <button class="btn btn-primary" data-submit="login">Kirish</button>
    <p class="text-small center" style="margin-top:16px">Akkountingiz yo'qmi? <a data-nav="role-select" style="color:var(--color-accent-primary);font-weight:600;text-decoration:none">Ro'yxatdan o'tish</a></p>
  </div>`;
}

function screenHome(){
  const real = CARS.filter(c => c.isReal && c.status !== 'Band');
  const list = real.filter(c => store.homeChip==='barchasi' || c.cat.includes(store.homeChip)).slice(0,4);
  return `${topBar('3X Rent Car')}
  <div class="screen-body no-pad" style="padding:0 20px 100px">
    <button class="search-box" style="width:100%;border:1px solid var(--color-border-subtle);text-align:left" data-nav="search-results">
      ${icon('search')}
      <div class="st"><b>Qayerga boramiz?</b><span>Shahar yoki aeroport</span></div>
    </button>
    ${chipRow(HOME_CHIPS, store.homeChip, 'home')}
    <div class="section-header"><div class="section-title" style="margin:0">Yaqin atrofdagi mashinalar</div><button class="link-accent" data-nav="search-results">Barchasi</button></div>
    ${list.length ? list.map(carCard).join('') : `
      <div class="card" style="text-align:center;color:var(--color-text-secondary)">
        <p style="margin:8px 0 2px">Hozircha mashinalar yo'q.</p>
        <p class="text-small">Ijaraga beruvchilar mashina qo'shishi bilan shu yerda paydo bo'ladi.</p>
      </div>`}
  </div>
  ${bottomNav('home')}`;
}

function screenSearchResults(){
  const cat = store.categoryKey ? CATEGORIES.find(c=>c.key===store.categoryKey) : null;
  const title = cat ? cat.title : 'Toshkent shahri';
  const activeChip = store.categoryKey || store.searchChip;
  const real = CARS.filter(c => c.isReal && c.status !== 'Band');
  const list = real.filter(c => activeChip==='barchasi' || !activeChip || c.cat.includes(activeChip));
  return `${backHeader(title)}
  <div class="screen-body no-nav-pad" style="padding-top:14px;padding-bottom:100px">
    <div class="section-header">
      <div class="text-secondary text-small" style="font-weight:600">${list.length} ta mashina topildi</div>
      <button class="link-accent" data-action="toast" data-msg="Saralash (demo)">Narx bo'yicha ↓</button>
    </div>
    ${chipRow(SEARCH_CHIPS, store.categoryKey ? (SEARCH_CHIPS.includes(store.categoryKey)?store.categoryKey:'barchasi') : store.searchChip, 'search')}
    ${list.length ? list.map(carCard).join('') : `
      <div class="card" style="text-align:center;color:var(--color-text-secondary)">
        <p style="margin:8px 0 2px">Hozircha mashinalar yo'q.</p>
        <p class="text-small">Ijaraga beruvchilar mashina qo'shishi bilan shu yerda paydo bo'ladi.</p>
      </div>`}
  </div>
  ${bottomNav('search-results')}`;
}

function screenCarDetails(){
  const car = CARS.find(c=>c.id===store.selectedCarId) || CARS[0];
  const days = 3;
  const total = car.price*days + 85000;
  return `${backHeader('', { right:`<button class="topbar-icon" style="margin-left:auto" data-action="toast" data-msg="Saqlandi (demo)">${icon('heart')}</button>` })}
  <div class="gallery">
    ${icon('car')}
    <div class="dots">${[0,1,2,3].map(i=>`<span class="${i===store.galleryIdx?'on':''}"></span>`).join('')}</div>
  </div>
  <div class="screen-body no-nav-pad">
    <div class="section-header" style="align-items:flex-start">
      <div>
        <div class="h-title">${car.name}</div>
        <div class="text-secondary text-small" style="margin-top:6px">${car.rating!=null ? car.rating+' · '+car.reviews+' sharh · ' : ''}${car.city}${car.district ? ', '+car.district : ''}</div>
      </div>
      <div class="text-price">${car.price ? fmt(car.price)+'/kun' : 'Narx kelishiladi'}</div>
    </div>
    <div class="spec-grid">
      <div class="spec-chip">${icon('gear')}${car.trans}</div>
      <div class="spec-chip">${icon('seat')}${car.seats} o'rin</div>
      <div class="spec-chip">${icon('fuel')}${car.fuel}</div>
      <div class="spec-chip">${icon('cal')}${car.year} yil</div>
    </div>
    <div class="section">
      <div class="section-title">Tavsif</div>
      <p class="text-body text-secondary" style="line-height:21px">Shinam va ishonchli ${car.name} — shahar ichida yoki viloyatlararo safar uchun qulay. Konditsioner, Bluetooth va orqa ko'rish kamerasi bilan jihozlangan.</p>
    </div>
    <div class="section">
      <div class="section-title">Sharhlar (${car.reviews})</div>
      ${REVIEWS.map(r=>`<div class="review"><div class="avatar">${r.name.split(' ').map(w=>w[0]).join('')}</div><div><div class="name">${r.name}</div><div class="txt">${r.text}</div></div></div>`).join('')}
    </div>
  </div>
  <div class="sticky-cta">
    <div class="price"><span>Jami (${days} kun)</span><b class="text-price">${car.price ? fmt(car.price*days)+" so'm" : 'Narx kelishiladi'}</b></div>
    <button class="btn btn-primary" data-nav="booking" data-car="${car.id}">Band qilish</button>
  </div>`;
}

function screenBooking(){
  const car = CARS.find(c=>c.id===store.selectedCarId) || CARS[0];
  return `${backHeader("Band qilishni tasdiqlash")}
  <div class="screen-body no-nav-pad" style="padding-top:14px">
    <div class="card" style="margin-bottom:18px">
      <div class="row" style="display:flex;gap:12px;align-items:center;margin-bottom:14px">
        <div class="car-thumb" style="width:56px;height:56px;border-radius:12px">${icon('car')}</div>
        <div><b>${car.name}</b><div class="text-small">${car.city}, ${car.district}</div></div>
      </div>
      <div class="trip-row">
        <div class="trip-point"><div class="trip-dot"></div><div class="trip-line"></div></div>
        <div class="trip-info"><b>Olib ketish</b><span>${BOOKING_DETAIL.pickup}</span></div>
      </div>
      <div class="trip-row" style="margin-bottom:0">
        <div class="trip-point"><div class="trip-dot" style="background:var(--color-text-secondary)"></div></div>
        <div class="trip-info"><b>Qaytarish</b><span>${BOOKING_DETAIL.dropoff}</span></div>
      </div>
    </div>

    <div class="card" style="margin-bottom:18px">
      <div class="section-title">To'lov tafsiloti</div>
      <div class="kv-row"><span>Ijara narxi (3 kun)</span><span>${BOOKING_DETAIL.rent}</span></div>
      <div class="kv-row"><span>Xizmat haqi</span><span>${BOOKING_DETAIL.service}</span></div>
      <div class="kv-row"><span>Sug'urta</span><span>${BOOKING_DETAIL.insurance}</span></div>
      <div class="kv-row total"><span>Jami</span><span>${BOOKING_DETAIL.total}</span></div>
    </div>

    <div class="section">
      <div class="section-title">To'lov usuli</div>
      ${PAY_METHODS.map(m => `<button class="pay-option ${m===store.payMethod?'selected':''}" data-action="select-chip" data-group="pay" data-value="${m}"><div class="radio"></div><span>${m}</span></button>`).join('')}
    </div>
  </div>
  <div class="sticky-cta">
    <div class="price"><span>Jami to'lov</span><b class="text-price">${BOOKING_DETAIL.total}</b></div>
    <button class="btn btn-primary" data-submit="booking" data-car="${car.name}">To'lovni tasdiqlash</button>
  </div>`;
}

function screenBookingSuccess(){
  return `<div class="success-wrap">
    <div class="icon">${icon('checkCircle')}</div>
    <h2>Band qilish tasdiqlandi!</h2>
    <p>Mashina egasi tez orada siz bilan bog'lanadi. Tafsilotlarni "Bandlarim" bo'limidan kuzatib borishingiz mumkin.</p>
    <button class="btn btn-primary" style="margin-top:14px;width:auto;padding:14px 28px" data-nav="my-bookings" data-reset="1">Bandlarimga o'tish</button>
  </div>`;
}

function screenMyBookings(){
  return `${topBar('Mening bandlarim')}
  <div class="screen-body no-pad" style="padding:0 20px 100px">
    <div class="chip-row">
      ${BOOKING_TABS.map(t=>`<button class="chip ${t===store.bookingTab?'selected':''}" data-action="select-chip" data-group="booking-tab" data-value="${t}">${t}</button>`).join('')}
    </div>
    ${MY_BOOKINGS.filter(b=> store.bookingTab==='Barchasi' || b.status===store.bookingTab).map(b => `
      <div class="booking-card">
        <div class="top">
          <div class="car-thumb" style="width:48px;height:48px;border-radius:12px">${icon('car')}</div>
          <div style="flex:1">
            <div class="name">${b.car}</div>
            <div class="loc">${b.loc}</div>
          </div>
          <span class="badge ${b.status==='Faol'?'success':'neutral'}">${b.status}</span>
        </div>
        <div class="bottom">
          <span class="text-small">${b.dates}</span>
          <b class="text-price" style="font-size:14px">${b.total}</b>
        </div>
      </div>`).join('')}
  </div>
  ${bottomNav('my-bookings')}`;
}

function screenProfile(){
  const owner = store.role === 'owner';
  return `${topBar('Profil')}
  <div class="screen-body no-pad" style="padding:0 20px 100px">
    <div class="profile-head">
      <div class="avatar">${(store.currentUser && store.currentUser.name ? store.currentUser.name : 'Abdulbosit Moydinov').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
      <div><b style="display:block">${(store.currentUser && store.currentUser.name) || 'Abdulbosit Moydinov'}</b><span>${(store.currentUser && store.currentUser.phone) || '+998 90 123 45 67'}</span></div>
    </div>
    <div class="menu-list" style="margin-bottom:14px">
      ${owner ? `
      <button class="menu-item" data-nav="owner-cars">${icon('car')}<span>Mashinalarim</span>${icon('chevron','chev')}</button>
      <button class="menu-item" data-nav="income">${icon('wallet')}<span>Daromad</span>${icon('chevron','chev')}</button>
      ` : `
      <button class="menu-item" data-nav="my-bookings">${icon('calendar')}<span>Bandlarim</span>${icon('chevron','chev')}</button>
      <button class="menu-item" data-action="toast" data-msg="To'lov usullari (demo)">${icon('card')}<span>To'lov usullari</span>${icon('chevron','chev')}</button>
      `}
      <button class="menu-item" data-nav="language-settings">${icon('globe')}<span>Til sozlamalari</span>${icon('chevron','chev')}</button>
      <button class="menu-item" data-action="toggle-theme">${icon('moon')}<span>Tungi rejim</span><span class="toggle ${store.theme==='dark'?'on':''}"></span></button>
      <button class="menu-item" data-action="toast" data-msg="Yordam markazi (demo)">${icon('help')}<span>Yordam markazi</span>${icon('chevron','chev')}</button>
      <button class="menu-item danger" data-nav="welcome" data-reset="1" data-logout="1">${icon('logout')}<span>Chiqish</span></button>
    </div>
    <button class="btn btn-ghost" data-action="toast" data-msg="Rol almashtirish (demo)" data-nav="role-select">Rolni almashtirish</button>
  </div>
  ${bottomNav('profile')}`;
}

function screenLanguageSettings(){
  return `${backHeader('Til sozlamalari')}
  <div class="screen-body no-nav-pad" style="padding-top:6px">
    <p class="text-secondary text-body" style="margin:0 0 18px">Ilova tilini tanlang</p>
    ${LANGUAGES.map(l => `
      <button class="lang-item ${l.code===store.lang?'selected':''}" data-action="select-chip" data-group="lang" data-value="${l.code}" style="width:100%">
        <div class="lang-flag">${l.code}</div>
        <span class="text-body" style="font-weight:600">${l.label}</span>
        ${l.code===store.lang ? icon('check','check') : ''}
      </button>`).join('')}
  </div>`;
}

function screenOwnerCars(){
  const rows = ownerRealCars();
  const stats = ownerRealStats();
  return `${topBar('Mening mashinalarim')}
  <div class="screen-body no-pad" style="padding:0 20px 100px">
    <div class="section-header">
      <div></div>
      <button class="topbar-icon" data-nav="add-car">${icon('plus')}</button>
    </div>
    <div class="stat-row">
      <div class="stat-box"><b>${stats.total}</b><span>Jami</span></div>
      <div class="stat-box"><b>${stats.free}</b><span>Bo'sh</span></div>
      <div class="stat-box"><b>${stats.busy}</b><span>Band</span></div>
    </div>
    <div class="section-title">Mashinalaringiz</div>
    ${rows.length ? rows.map(r => `
      <button class="owner-car-row" style="width:100%;text-align:left" data-nav="car-status" data-owner-car="${r.model||'Nomsiz mashina'}" data-status="${r.status||"Bo'sh"}" data-car-id="${r.id}">
        <div class="thumb">${icon('car')}</div>
        <div class="info"><b>${r.model||'Nomsiz mashina'}</b><span>${r.transmission||''}${r.year ? ' · '+r.year+' yil' : ''}</span></div>
        <span class="badge ${r.status==="Bo'sh"?'success':'warning'}">${r.status||"Bo'sh"}</span>
      </button>`).join('') : `
      <div class="card" style="text-align:center;color:var(--color-text-secondary)">
        <p style="margin:8px 0 2px">Hali mashina qo'shmagansiz.</p>
        <p class="text-small">Yuqoridagi + tugmasini bosib birinchi mashinangizni qo'shing.</p>
      </div>`}
  </div>
  ${bottomNav('owner-cars')}`;
}

function screenCarStatus(){
  const busy = store.ownerCarStatus === 'Band';
  return `${backHeader('Mashina holati')}
  <div class="screen-body no-nav-pad" style="padding-top:10px">
    <div class="card">
      <div class="section-header">
        <div class="h-subtitle">${store.ownerCarStatusName}</div>
        <span class="badge ${busy?'warning':'success'}">${store.ownerCarStatus}</span>
      </div>
      <p class="text-small" style="margin:-6px 0 16px">Avtomat · 5 o'rin · Toshkent, Chilonzor</p>
      ${busy ? `
        <p class="text-body" style="margin:0 0 6px">Ijarachi: Sardor Aliyev, +998 90 111 22 33</p>
        <p class="text-body text-secondary" style="margin:0">Muddati: 12-sen — 15-sen</p>
      ` : `
        <p class="text-body" style="margin:0 0 6px">Bu mashina hozircha bo'sh va ijaraga tayyor turibdi.</p>
        <p class="text-body text-secondary" style="margin:0">Yangi buyurtma tushganda sizga bildirishnoma yuboriladi.</p>
      `}
    </div>
    <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">
      ${busy
        ? `<button class="btn btn-primary" data-action="toast" data-msg="Ijarachiga qo'ng'iroq (demo)">${icon('phone')} Ijarachiga qo'ng'iroq qilish</button>`
        : `<button class="btn btn-primary" data-action="toast" data-msg="Tahrirlash (demo)">Tahrirlash</button>
           <button class="btn btn-secondary" data-action="car-status-toggle">Band deb belgilash (demo)</button>`
      }
      ${busy ? `<button class="btn btn-secondary" data-action="car-status-toggle">Bo'sh deb belgilash (demo)</button>` : ''}
    </div>
  </div>`;
}

function screenAddCar(){
  return `${backHeader("Yangi mashina qo'shish")}
  <div class="screen-body no-nav-pad" style="padding-top:10px">
    <button class="upload-box" style="width:100%" data-action="toast" data-msg="Rasm yuklash (demo)">${icon('camera')}Rasm qo'shish</button>
    <div class="field"><label>Mashina modeli</label><input id="car-model" type="text" placeholder="Masalan: Chevrolet Cobalt"/></div>
    <div class="field"><label>Ishlab chiqarilgan yili</label><input id="car-year" type="text" placeholder="2023"/></div>
    <div class="field"><label>Kunlik narx (so'm)</label><input id="car-price" type="text" placeholder="350 000"/></div>
    <div class="section-title" style="margin-bottom:10px">Uzatma turi</div>
    <div class="chip-row">
      <button class="chip ${store.addCarTrans==='Avtomat'?'selected':''}" data-action="select-chip" data-group="addcar-trans" data-value="Avtomat">Avtomat</button>
      <button class="chip ${store.addCarTrans==='Mexanika'?'selected':''}" data-action="select-chip" data-group="addcar-trans" data-value="Mexanika">Mexanika</button>
    </div>
    <div class="section-title" style="margin-bottom:10px">Toifasi</div>
    <div class="chip-row">
      ${['ekonom','komfort','premium','suv','elektro'].map(key => {
        const cat = CATEGORIES.find(c=>c.key===key);
        return `<button class="chip ${store.addCarCat===key?'selected':''}" data-action="select-chip" data-group="addcar-cat" data-value="${key}">${cat.label}</button>`;
      }).join('')}
    </div>
    <button class="btn btn-primary" style="margin-top:8px" data-submit="add-car">Saqlash</button>
  </div>`;
}

function screenIncome(){
  const maxH = Math.max(...INCOME.months.map(m=>m.h));
  return `${topBar('Daromad')}
  <div class="screen-body no-pad" style="padding:0 20px 100px">
    <div class="income-hero"><span>Jami daromad (barcha vaqt)</span><b>${INCOME.allTime}</b></div>
    <div class="stat-row">
      <div class="stat-box"><b>${INCOME.month}</b><span>Bu oy</span></div>
      <div class="stat-box"><b>${INCOME.pending}</b><span>Kutilmoqda</span></div>
    </div>
    <div class="section-title">So'nggi 6 oy</div>
    <div class="card">
      <div class="bar-chart">
        ${INCOME.months.map(m => `
          <div class="bar ${m.active?'active':''}">
            <div class="fill" style="height:${(m.h/maxH*100).toFixed(0)}%"></div>
            <span>${m.label}</span>
          </div>`).join('')}
      </div>
    </div>
    <div class="section" style="margin-top:20px">
      <div class="section-title">Mashinalar bo'yicha (bu oy)</div>
      <div class="card">
        ${INCOME.byCar.map(c => `<div class="kv-row"><span>${c.name}</span><span style="font-weight:700;color:var(--color-text-primary)">${c.amount}</span></div>`).join('')}
      </div>
    </div>
    <div class="section">
      <div class="section-title">So'nggi to'lovlar</div>
      <div class="card">
        ${INCOME.payments.map(p => `
          <div class="payment-row">
            <div class="avatar">${icon('car')}</div>
            <div class="info"><b>${p.name}</b><span>${p.date}</span></div>
            <div class="amt"><b>${p.amount}</b><span class="badge ${p.status==="To'landi"?'success':'warning'}" style="margin-top:4px">${p.status}</span></div>
          </div>`).join('')}
      </div>
    </div>
  </div>
  ${bottomNav('income')}`;
}

/* ---------------- router table ---------------- */

const SCREENS = {
  'splash': screenSplash,
  'welcome': screenWelcome,
  'role-select': screenRoleSelect,
  'register': screenRegister,
  'login': screenLogin,
  'home': screenHome,
  'search-results': screenSearchResults,
  'car-details': screenCarDetails,
  'booking': screenBooking,
  'booking-success': screenBookingSuccess,
  'my-bookings': screenMyBookings,
  'profile': screenProfile,
  'language-settings': screenLanguageSettings,
  'owner-cars': screenOwnerCars,
  'car-status': screenCarStatus,
  'add-car': screenAddCar,
  'income': screenIncome,
};

function render(){
  const fn = SCREENS[store.screen] || screenHome;
  app.innerHTML = `<div class="screen active">${fn()}</div>`;
}

/* ---------------- event delegation ---------------- */

app.addEventListener('click', async (e) => {
  const submitEl = e.target.closest('[data-submit]');
  const navEl = e.target.closest('[data-nav]');
  const actionEl = e.target.closest('[data-action]');

  if(submitEl){
    const kind = submitEl.getAttribute('data-submit');

    if(kind === 'register'){
      const name = (document.getElementById('reg-name')||{}).value || '';
      const phone = (document.getElementById('reg-phone')||{}).value || '';
      const role = submitEl.dataset.role;
      store.currentUser = { name: name.trim() || 'Mehmon', phone: phone.trim(), role };
      store.role = role;
      const res = await dbSaveUser(store.currentUser);
      if(dbReady()) showToast(res.ok ? "Ma'lumotlaringiz saqlandi" : "Bazaga ulanishda xatolik yuz berdi");
      saveSession();
      return resetTo(submitEl.dataset.target, { role });
    }

    if(kind === 'login'){
      const phone = (document.getElementById('login-phone')||{}).value || '';
      const trimmedPhone = phone.trim();
      let user = { name: 'Mehmon', phone: trimmedPhone, role: store.role };
      let found = false;
      if(dbReady() && trimmedPhone){
        const res = await dbFindUserByPhone(trimmedPhone);
        if(res.ok && res.user){
          user = { name: res.user.name || 'Mehmon', phone: res.user.phone || trimmedPhone, role: res.user.role || store.role };
          found = true;
        }
      }
      store.currentUser = user;
      store.role = user.role;
      if(found) saveSession();
      if(dbReady()) showToast(found ? `Xush kelibsiz, ${user.name}!` : "Akkount topilmadi, mehmon sifatida kirdingiz");
      const target = user.role === 'owner' ? 'owner-cars' : 'home';
      return resetTo(target);
    }

    if(kind === 'add-car'){
      if(!store.currentUser || !store.currentUser.phone){
        showToast("Avval ro'yxatdan o'ting yoki hisobingizga kiring");
        return resetTo('register', { role: 'owner' });
      }
      const model = (document.getElementById('car-model')||{}).value || '';
      const year = (document.getElementById('car-year')||{}).value || '';
      const price = (document.getElementById('car-price')||{}).value || '';
      if(!model.trim()){
        showToast("Mashina modelini kiriting");
        return;
      }
      if(!price.trim() || !/\d/.test(price)){
        showToast("Kunlik narxni kiriting");
        return;
      }
      const catObj = CATEGORIES.find(c=>c.key===store.addCarCat);
      const res = await dbSaveCar({
        ownerName: store.currentUser ? store.currentUser.name : '',
        ownerPhone: store.currentUser ? store.currentUser.phone : '',
        model: model.trim(),
        year: year.trim(),
        transmission: store.addCarTrans,
        category: catObj ? catObj.label : store.addCarCat,
        price: price.trim(),
        status: "Bo'sh",
      });
      showToast(dbReady() ? (res.ok ? "Mashina saqlandi" : "Bazaga ulanishda xatolik yuz berdi") : "Mashina qo'shildi (demo)");
      if(res.ok) loadRealCars();
      return navigate('owner-cars');
    }

    if(kind === 'booking'){
      const car = CARS.find(c=>c.id===store.selectedCarId) || CARS[0];
      const res = await dbSaveBooking({
        renterName: store.currentUser ? store.currentUser.name : '',
        renterPhone: store.currentUser ? store.currentUser.phone : '',
        carName: submitEl.dataset.car || car.name,
        pickup: BOOKING_DETAIL.pickup,
        dropoff: BOOKING_DETAIL.dropoff,
        total: BOOKING_DETAIL.total,
        paymentMethod: store.payMethod,
      });
      showToast(dbReady() ? (res.ok ? "To'lov qabul qilindi va saqlandi" : "Bazaga ulanishda xatolik yuz berdi") : "To'lov qabul qilindi");
      return navigate('booking-success');
    }
  }

  if(navEl){
    const screen = navEl.getAttribute('data-nav');
    const opts = {};
    if(navEl.dataset.car) opts.selectedCarId = navEl.dataset.car;
    if(navEl.dataset.cat){ opts.categoryKey = navEl.dataset.cat; }
    if(navEl.dataset.ownerCar){
      opts.ownerCarStatusName = navEl.dataset.ownerCar;
      opts.ownerCarStatus = navEl.dataset.status;
      opts.ownerCarId = navEl.dataset.carId ? Number(navEl.dataset.carId) : null;
    }
    if(screen === 'search-results' && !navEl.dataset.cat){ opts.categoryKey = null; }
    if(navEl.dataset.logout){
      clearSession();
      opts.currentUser = null;
      opts.role = 'rider';
    }
    if(navEl.dataset.reset){
      resetTo(screen, opts);
    } else {
      navigate(screen, opts);
    }
    return;
  }

  if(actionEl){
    const action = actionEl.getAttribute('data-action');
    if(action === 'go-back') return goBack();
    if(action === 'toggle-theme') return setThemeAndSave(store.theme==='dark' ? 'light' : 'dark'), render();
    if(action === 'toast') return showToast(actionEl.dataset.msg || '');
    if(action === 'select-chip'){
      const group = actionEl.dataset.group, value = actionEl.dataset.value;
      if(group === 'home') store.homeChip = value;
      if(group === 'search'){ store.searchChip = value; store.categoryKey = null; }
      if(group === 'pay') store.payMethod = value;
      if(group === 'lang') store.lang = value;
      if(group === 'booking-tab') store.bookingTab = value;
      if(group === 'addcar-trans') store.addCarTrans = value;
      if(group === 'addcar-cat') store.addCarCat = value;
      return render();
    }
    if(action === 'select-role'){
      store.role = actionEl.dataset.value;
      return navigate('register');
    }
    if(action === 'car-status-toggle'){
      const newStatus = store.ownerCarStatus === 'Band' ? "Bo'sh" : 'Band';
      store.ownerCarStatus = newStatus; // ekranda darhol ko'rinishi uchun
      render();
      if(store.ownerCarId != null){
        const res = await dbUpdateCarStatus(store.ownerCarId, newStatus);
        if(res.ok){
          const row = realCarRows.find(r => r.id === store.ownerCarId);
          if(row) row.status = newStatus;
          refreshCarsFromRows(); // ijaraga oluvchilar ko'rgan ro'yxat ham darhol yangilansin
        } else if(dbReady()){
          showToast("Bazaga ulanishda xatolik yuz berdi");
        }
        render();
      }
      return;
    }
  }
});

/* ---------------- Telegram WebApp glue ---------------- */

function syncTelegramChrome(){
  const tg = window.Telegram && window.Telegram.WebApp;
  if(!tg) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-base').trim();
  try{
    tg.setHeaderColor && tg.setHeaderColor(bg);
    tg.setBackgroundColor && tg.setBackgroundColor(bg);
  }catch(e){}
}

function syncTelegramBackButton(){
  const tg = window.Telegram && window.Telegram.WebApp;
  if(!tg || !tg.BackButton) return;
  if(store.history.length > 0){ tg.BackButton.show(); } else { tg.BackButton.hide(); }
}

function initTelegram(){
  const tg = window.Telegram && window.Telegram.WebApp;
  if(!tg) return;
  tg.ready();
  tg.expand();
  // Eslatma: ilova doim kunduzgi (light) rejimda ochiladi — Telegram'ning
  // o'z tungi rejimiga qarab avtomatik almashtirilmaydi. Tungi rejim faqat
  // foydalanuvchi Profil ichidagi "Tungi rejim" tugmasini bosganda yonadi.
  tg.BackButton.onClick(() => goBack());
  syncTelegramChrome();
  syncTelegramBackButton();
}

/* ---------------- boot ---------------- */

window.store = store; // debugging/testing convenience
window.CARS = CARS;   // debugging/testing convenience

// Ilova qayta ochilganda avvalgi "kirgan" holatni tiklaymiz — har safar
// qayta "Kirish" bosishga majburlamaslik uchun (Telegram mini ilovalar
// ko'pincha har ochilishda sahifani yangidan yuklaydi).
const savedSession = loadSession();
if(savedSession && savedSession.user && savedSession.user.phone){
  store.currentUser = savedSession.user;
  store.role = savedSession.role || savedSession.user.role || 'rider';
  store.screen = store.role === 'owner' ? 'owner-cars' : 'home';
}

// Avvalgi saqlangan rejim (kunduzgi/tungi) bo'lsa, o'shani, bo'lmasa
// standart kunduzgi rejimni qo'llaymiz.
let initialTheme = store.theme;
try {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if(savedTheme === 'dark' || savedTheme === 'light') initialTheme = savedTheme;
} catch(e) {}

setTheme(initialTheme);
render();
initTelegram();
loadRealCars();

setTimeout(() => { if(store.screen === 'splash') resetTo('welcome'); }, 1600);

// Telegram CloudStorage'dan ham tekshirib qo'yamiz (localStorage saqlanmagan
// bo'lsa ham) — agar u yerda boshqacha qiymat topilsa, holatni to'g'rilaymiz.
cloudGet(THEME_KEY, function(cloudTheme){
  if((cloudTheme === 'dark' || cloudTheme === 'light') && cloudTheme !== store.theme){
    setTheme(cloudTheme);
    render();
  }
});
if(!store.currentUser){
  cloudGet(SESSION_KEY, function(raw){
    if(!raw || store.currentUser) return;
    try {
      const parsed = JSON.parse(raw);
      if(parsed && parsed.user && parsed.user.phone){
        store.currentUser = parsed.user;
        store.role = parsed.role || parsed.user.role || 'rider';
        store.screen = store.role === 'owner' ? 'owner-cars' : 'home';
        store.history = [];
        render();
        syncTelegramBackButton();
      }
    } catch(e) {}
  });
}
