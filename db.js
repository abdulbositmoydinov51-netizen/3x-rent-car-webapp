let supabaseClient = null;
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
  console.warn('Supabase mijozini ishga tushirib bo\u2018lmadi:', e);
}

function dbReady() {
  return !!supabaseClient;
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
      status: car.status || 'Bo\u2018sh',
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.error('dbSaveCar xato:', e);
    return { ok: false, reason: e.message };
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
