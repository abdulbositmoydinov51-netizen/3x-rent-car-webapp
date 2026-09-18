/* Supabase bilan ishlash — yozish (insert) funksiyalari.
   config.js to'ldirilmagan bo'lsa, bu funksiyalar jim ishlamaydi (xato bermaydi),
   ilova baribir demo rejimida to'liq ishlayveradi. */

let supabaseClient = null;

// Mijozni "dangasa" (lazy) tarzda ishga tushiramiz — bir marta emas, har safar
// dbReady() chaqirilganda qayta tekshiramiz. Sabab: Supabase kutubxonasi CDN
// orqali yuklanadi va sekin internetda db.js ishga tushgan paytda hali
// ulgurmagan bo'lishi mumkin (index.html'da zaxira CDN ham qo'shilgan —
// birinchisi ishlamasa, ikkinchisi biroz kechroq yuklanadi). Shu sababli
// bir martalik tekshiruv o'rniga har safar qayta urinib ko'ramiz.
function ensureSupabaseClient() {
  if (supabaseClient) return true;
  try {
    if (
      window.supabase &&
      typeof SUPABASE_URL === 'string' &&
      typeof SUPABASE_ANON_KEY === 'string' &&
      !SUPABASE_URL.includes('YOUR-PROJECT') &&
      !SUPABASE_ANON_KEY.includes('YOUR-ANON')
    ) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.warn("Supabase mijozini ishga tushirib bo'lmadi:", e);
  }
  return !!supabaseClient;
}

function dbReady() {
  return ensureSupabaseClient();
}

function tgUser() {
  const tg = window.Telegram && window.Telegram.WebApp;
  return (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) || null;
}

async function dbSaveUser(user) {
  if (!dbReady()) return { ok: false, reason: 'no-config' };
  try {
    const u = tgUser();
    const { error } = await supabaseClient.from('users').insert({
      name: user.name || null,
      phone: user.phone || null,
      role: user.role || null,
      telegram_id: u ? u.id : null,
      telegram_username: u ? u.username : null,
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.error('dbSaveUser xato:', e);
    return { ok: false, reason: e.message };
  }
}

async function dbSaveCar(car) {
  if (!dbReady()) return { ok: false, reason: 'no-config' };
  try {
    const { error } = await supabaseClient.from('cars').insert({
      owner_name: car.ownerName || null,
      owner_phone: car.ownerPhone || null,
      model: car.model || null,
      year: car.year || null,
      transmission: car.transmission || null,
      category: car.category || null,
      price: car.price || null,
      status: car.status || "Bo'sh",
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.error('dbSaveCar xato:', e);
    return { ok: false, reason: e.message };
  }
}

async function dbFindUserByPhone(phone) {
  if (!dbReady()) return { ok: false, reason: 'no-config', user: null };
  try {
    // Bu Supabase'dagi maxsus SQL funksiya (find_user_by_phone) orqali ishlaydi —
    // butun "users" jadvalini o'qish o'rniga, faqat bitta mos telefon raqamiga
    // tegishli yozuvni qaytaradi (schema.sql ga qarang).
    const { data, error } = await supabaseClient.rpc('find_user_by_phone', { p_phone: phone });
    if (error) throw error;
    const user = (data && data[0]) || null;
    return { ok: true, user };
  } catch (e) {
    console.error('dbFindUserByPhone xato:', e);
    return { ok: false, reason: e.message, user: null };
  }
}

async function dbListCars() {
  if (!dbReady()) return { ok: false, reason: 'no-config', data: [] };
  try {
    const { data, error } = await supabaseClient
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { ok: true, data: data || [] };
  } catch (e) {
    console.error('dbListCars xato:', e);
    return { ok: false, reason: e.message, data: [] };
  }
}

async function dbSaveBooking(booking) {
  if (!dbReady()) return { ok: false, reason: 'no-config' };
  try {
    const { error } = await supabaseClient.from('bookings').insert({
      renter_name: booking.renterName || null,
      renter_phone: booking.renterPhone || null,
      car_name: booking.carName || null,
      pickup_date: booking.pickup || null,
      dropoff_date: booking.dropoff || null,
      total_price: booking.total || null,
      payment_method: booking.paymentMethod || null,
      status: 'Yangi',
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.error('dbSaveBooking xato:', e);
    return { ok: false, reason: e.message };
  }
}
