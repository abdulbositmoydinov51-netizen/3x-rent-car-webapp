/* Mock data — mirrors copy/numbers from the Figma source
   ("3X Rent Car — Yagona ilova dizayni"). Swap for a real API later. */

const CARS = [
  { id:'cobalt',  name:'Chevrolet Cobalt', trans:'Avtomat',  seats:5, fuel:'Benzin', year:2023, city:'Toshkent', district:'Chilonzor', price:350000, rating:4.8, reviews:120, cat:['komfort','avtomat','5orin','konditsioner'] },
  { id:'rio',     name:'Kia Rio',          trans:'Mexanika', seats:5, fuel:'Benzin', year:2022, city:'Samarqand', district:'Markaz', price:300000, rating:4.6, reviews:86,  cat:['ekonom','mexanika','5orin'] },
  { id:'malibu2', name:'Malibu 2',         trans:'Avtomat',  seats:5, fuel:'Benzin', year:2023, city:'Buxoro', district:'Aeroport', price:260000, rating:4.7, reviews:64, cat:['komfort','avtomat','5orin','gps'] },
  { id:'nexia3',  name:'Nexia 3',          trans:'Mexanika', seats:5, fuel:'Benzin', year:2021, city:'Toshkent', district:'Yunusobod', price:180000, rating:4.5, reviews:52, cat:['ekonom','mexanika','5orin','yoqilgi'] },
  { id:'tucson',  name:'Hyundai Tucson',   trans:'Avtomat',  seats:5, fuel:'Benzin', year:2023, city:'Toshkent', district:'Mirzo Ulug’bek', price:520000, rating:4.9, reviews:210, cat:['suv','avtomat','premium','gps','konditsioner'] },
  { id:'spark',   name:'Chevrolet Spark',  trans:'Mexanika', seats:4, fuel:'Benzin', year:2020, city:'Andijon', district:'Markaz', price:150000, rating:4.4, reviews:38, cat:['ekonom','mexanika','yoqilgi'] },
  { id:'tesla',   name:'Tesla Model 3',    trans:'Avtomat',  seats:5, fuel:'Elektro', year:2023, city:'Toshkent', district:'Yashnobod', price:610000, rating:4.9, reviews:47, cat:['elektro','avtomat','premium','gps'] },
  { id:'malibu1', name:'Chevrolet Malibu 1', trans:'Avtomat', seats:5, fuel:'Benzin', year:2022, city:'Farg’ona', district:'Markaz', price:420000, rating:4.7, reviews:73, cat:['premium','avtomat','konditsioner'] },
];

const CATEGORIES = [
  { key:'barchasi',   label:'Barchasi',  title:null,                        count:null },
  { key:'ekonom',     label:'Ekonom',    title:'Ekonom toifasi',            count:18 },
  { key:'komfort',    label:'Komfort',   title:'Komfort toifasi',           count:24 },
  { key:'premium',    label:'Premium',   title:'Premium toifasi',           count:9  },
  { key:'suv',        label:'SUV',       title:'SUV toifasi',               count:15 },
  { key:'avtomat',    label:'Avtomat',   title:'Avtomat uzatma',            count:31 },
  { key:'mexanika',   label:'Mexanika',  title:'Mexanika uzatma',           count:11 },
  { key:'elektro',    label:'Elektro',   title:'Elektromobillar',           count:7  },
  { key:'5orin',      label:"5 o'rin",   title:"5 o'rinli mashinalar",      count:26 },
  { key:'konditsioner', label:'Konditsioner', title:'Konditsionerli mashinalar', count:33 },
  { key:'yoqilgi',    label:"Tejamkor",  title:"Yoqilg'i tejamkor mashinalar", count:19 },
  { key:'gps',        label:'GPS',       title:'GPS bilan mashinalar',      count:12 },
];

const HOME_CHIPS = ['barchasi','ekonom','komfort','premium','suv','avtomat','mexanika','elektro'];
const SEARCH_CHIPS = ['barchasi','ekonom','komfort','suv','premium'];

const REVIEWS = [
  { name:'Aziz K.', text:'Mashina juda toza va yaxshi holatda edi. Xizmatdan mamnunman!' },
  { name:'Malika R.', text:'Bron qilish oson bo’ldi, egasi ham juda yordamchi edi.' },
];

const MY_BOOKINGS = [
  { car:'Chevrolet Cobalt', loc:'Toshkent, Chilonzor', status:'Faol', dates:'12-sen — 15-sen', total:'1 135 000 so‘m' },
  { car:'Kia Rio', loc:'Samarqand markazi', status:'Yakunlangan', dates:'02-avg — 05-avg', total:'980 000 so‘m' },
  { car:'Malibu 2', loc:'Buxoro aeroporti', status:'Yakunlangan', dates:'18-iyul — 20-iyul', total:'760 000 so‘m' },
];
const BOOKING_TABS = ['Barchasi','Faol','Yakunlangan'];

const LANGUAGES = [
  { code:'UZ', label:"O'zbekcha" },
  { code:'RU', label:'Русский' },
  { code:'EN', label:'English' },
];

const OWNER_CARS = [
  { name:'Chevrolet Cobalt', trans:'Avtomat', seats:5, status:'Bo‘sh' },
  { name:'Kia Rio', trans:'Mexanika', seats:5, status:'Band' },
  { name:'Malibu 2', trans:'Avtomat', seats:5, status:'Bo‘sh' },
  { name:'Nexia 3', trans:'Mexanika', seats:5, status:'Band' },
];
const OWNER_STATS = { total:13, free:9, busy:4, monthIncome:'4 250 000 so‘m' };

const INCOME = {
  allTime: '18 450 000 so‘m',
  month: '4 250 000 so‘m',
  pending: '620 000 so‘m',
  months: [
    { label:'Apr', h:30 }, { label:'May', h:44 }, { label:'Iyun', h:38 },
    { label:'Iyul', h:56 }, { label:'Avg', h:70 }, { label:'Sen', h:100, active:true },
  ],
  byCar: [
    { name:'Chevrolet Cobalt', amount:'1 750 000 so‘m' },
    { name:'Kia Rio', amount:'1 200 000 so‘m' },
    { name:'Malibu 2', amount:'900 000 so‘m' },
    { name:'Nexia 3', amount:'400 000 so‘m' },
  ],
  payments: [
    { name:'Sardor Aliyev — Kia Rio', date:'15-sen', amount:'280 000 so‘m', status:'To‘landi' },
    { name:'Dilnoza Yusupova — Cobalt', date:'12-sen', amount:'1 050 000 so‘m', status:'To‘landi' },
    { name:'Jasur Rahimov — Malibu 2', date:'20-sen', amount:'410 000 so‘m', status:'Kutilmoqda' },
  ],
};

const BOOKING_DETAIL = {
  car:'Chevrolet Cobalt', loc:'Toshkent, Chilonzor',
  pickup:'12-sen, 10:00', dropoff:'15-sen, 10:00',
  rent:'1 050 000 so‘m', service:'35 000 so‘m', insurance:'50 000 so‘m', total:'1 135 000 so‘m',
};
const PAY_METHODS = ['Payme','Click', 'Naqd pul (olib ketishda)'];
