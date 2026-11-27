export interface ShopUdhaarCategory {
  id: string;
  nameEn: string;
  nameUr: string;
}

export interface ShopTypePreset {
  id: string;
  nameEn: string;
  nameUr: string;
  categories: ShopUdhaarCategory[];
  quickItemsEn: string[];
  quickItemsUr: string[];
}

export const SHOP_TYPE_PRESETS: ShopTypePreset[] = [
  {
    id: 'home_khata',
    nameEn: 'Home / Ghar ka khata',
    nameUr: 'گھر کا کھاتہ',
    categories: [
      { id: 'doodh_wala', nameEn: 'Doodh wala', nameUr: 'دودھ والا' },
      { id: 'kiryana', nameEn: 'Kiryana', nameUr: 'کریانہ' },
      { id: 'maasi', nameEn: 'Maasi / Helper', nameUr: 'ماسی / ملازمہ' },
      { id: 'dhobi', nameEn: 'Dhobi / Press', nameUr: 'دھوبی / استری' },
      { id: 'sabzi', nameEn: 'Sabzi & Fruit', nameUr: 'سبزی اور پھل' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Milk 1L', 'Flour 10kg', 'Eggs', 'Vegetables', 'Laundry'],
    quickItemsUr: ['دودھ', 'آٹا', 'انڈے', 'سبزی', 'کپڑے دھلائی'],
  },
  {
    id: 'general_store',
    nameEn: 'General Store / Kiryana',
    nameUr: 'جنرل اسٹور / کریانہ',
    categories: [
      { id: 'rashan', nameEn: 'Rashan', nameUr: 'راشن' },
      { id: 'oil_ghee', nameEn: 'Oil & Ghee', nameUr: 'تیل اور گھی' },
      { id: 'dairy', nameEn: 'Dairy', nameUr: 'دودھ دہی' },
      { id: 'beverages', nameEn: 'Beverages', nameUr: 'مشروبات' },
      { id: 'cleaning', nameEn: 'Cleaning', nameUr: 'صفائی کا سامان' },
      { id: 'cigarettes', nameEn: 'Cigarettes & Paan', nameUr: 'سگریٹ اور پان' },
      { id: 'snacks', nameEn: 'Snacks', nameUr: 'اسنیکس' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Flour (Aata)', 'Sugar (Chini)', 'Cooking Oil', 'Tea', 'Soap'],
    quickItemsUr: ['آٹا', 'چینی', 'گھی / تیل', 'چائے', 'صابن'],
  },
  {
    id: 'electronic_store',
    nameEn: 'Electronic Store',
    nameUr: 'الیکٹرانک اسٹور',
    categories: [
      { id: 'fan', nameEn: 'Fan', nameUr: 'پنکھا' },
      { id: 'ac', nameEn: 'AC', nameUr: 'اے سی' },
      { id: 'fridge', nameEn: 'Fridge', nameUr: 'فریج' },
      { id: 'tv', nameEn: 'TV', nameUr: 'ٹی وی' },
      { id: 'wiring', nameEn: 'Wiring', nameUr: 'وائرنگ' },
      { id: 'bulbs_lights', nameEn: 'Bulbs & Lights', nameUr: 'بلب اور لائٹس' },
      { id: 'repair', nameEn: 'Repair', nameUr: 'مرمت' },
      { id: 'installation', nameEn: 'Installation', nameUr: 'فٹنگ / انسٹالیشن' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Ceiling Fan', 'LED Bulb', 'Wire Coil', 'Stabilizer', 'Service'],
    quickItemsUr: ['پنکھا', 'ایل ای ڈی بلب', 'تار', 'اسٹیبلائزر', 'مرمت'],
  },
  {
    id: 'mobile_shop',
    nameEn: 'Mobile Shop & Accessories',
    nameUr: 'موبائل شاپ اور اسیسریز',
    categories: [
      { id: 'phones', nameEn: 'Phones', nameUr: 'موبائل فون' },
      { id: 'chargers', nameEn: 'Chargers & Cables', nameUr: 'چارجر اور کیبل' },
      { id: 'handsfree', nameEn: 'Handsfree & Earbuds', nameUr: 'ہینڈز فری' },
      { id: 'covers_glass', nameEn: 'Covers & Glass', nameUr: 'کور اور گلاس' },
      { id: 'repair', nameEn: 'Mobile Repair', nameUr: 'موبائل مرمت' },
      { id: 'sim_load', nameEn: 'SIM & Load', nameUr: 'سم اور لوڈ' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Fast Charger', 'Data Cable', 'Protector Glass', 'Back Cover', 'Handsfree'],
    quickItemsUr: ['چارجر', 'کیبل', 'پروٹیکٹر گلاس', 'کور', 'ہینڈز فری'],
  },
  {
    id: 'mobile_load_agent',
    nameEn: 'Mobile Load / Easypaisa-JazzCash agent',
    nameUr: 'موبائل لوڈ / ایزی پیسہ ایجنٹ',
    categories: [
      { id: 'jazz_load', nameEn: 'Jazz / Warid Load', nameUr: 'جاز لوڈ' },
      { id: 'zong_load', nameEn: 'Zong Load', nameUr: 'زونگ لوڈ' },
      { id: 'telenor_ufone', nameEn: 'Telenor / Ufone Load', nameUr: 'ٹیلی نار / یوفون لوڈ' },
      { id: 'easypaisa', nameEn: 'Easypaisa', nameUr: 'ایزی پیسہ' },
      { id: 'jazzcash', nameEn: 'JazzCash', nameUr: 'جاز کیش' },
      { id: 'packages', nameEn: 'Bundles / Packages', nameUr: 'پیکجز' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['EasyLoad 100', 'EasyLoad 500', 'Weekly Bundle', 'Cash Transfer'],
    quickItemsUr: ['ایزی لوڈ 100', 'ایزی لوڈ 500', 'ہفتہ وار پیکج', 'رقم ٹرانسفر'],
  },
  {
    id: 'medical_store',
    nameEn: 'Medical Store / Pharmacy',
    nameUr: 'میڈیکل اسٹور / فارمیسی',
    categories: [
      { id: 'tablets', nameEn: 'Tablets & Syrups', nameUr: 'گولیاں اور شربت' },
      { id: 'injections', nameEn: 'Injections & Drips', nameUr: 'انجیکشن اور ڈرپ' },
      { id: 'baby_care', nameEn: 'Baby Care & Milk', nameUr: 'بچوں کا سامان' },
      { id: 'surgical', nameEn: 'Surgical / Bandages', nameUr: 'سرجیکل سامان' },
      { id: 'vitamins', nameEn: 'Vitamins & Tonics', nameUr: 'وٹامنز' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Panadol', 'Syrup', 'Bandage', 'Pampers', 'Multivitamin'],
    quickItemsUr: ['پیناڈول', 'شربت', 'پٹی', 'پیمپرز', 'وٹامن'],
  },
  {
    id: 'cloth_house',
    nameEn: 'Cloth House / Garments',
    nameUr: 'کلاتھ ہاؤس / گارمنٹس',
    categories: [
      { id: 'unstitched', nameEn: 'Unstitched Suit', nameUr: 'ان سلا سوٹ' },
      { id: 'ready_made', nameEn: 'Ready-made', nameUr: 'ریڈی میڈ' },
      { id: 'gents', nameEn: 'Gents Shalwar Kameez', nameUr: 'مردانہ سوٹ' },
      { id: 'ladies', nameEn: 'Ladies Suit & Dupatta', nameUr: 'زنانہ سوٹ اور دوپٹہ' },
      { id: 'kids_wear', nameEn: 'Kids Wear', nameUr: 'بچوں کے کپڑے' },
      { id: 'winter', nameEn: 'Shawls & Winter', nameUr: 'شال اور گرم کپڑے' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Lawn Suit', 'Cotton Suit', 'Dupatta', 'Kurta', 'Shawl'],
    quickItemsUr: ['لان سوٹ', 'کاٹن سوٹ', 'دوپٹہ', 'کرتا', 'شال'],
  },
  {
    id: 'shoes_bags',
    nameEn: 'Shoes & Bags',
    nameUr: 'جوتے اور بیگز',
    categories: [
      { id: 'gents_shoes', nameEn: 'Gents Shoes', nameUr: 'مردانہ جوتے' },
      { id: 'ladies_shoes', nameEn: 'Ladies Shoes', nameUr: 'زنانہ جوتے' },
      { id: 'kids_shoes', nameEn: 'Kids Shoes', nameUr: 'بچوں کے جوتے' },
      { id: 'chappal', nameEn: 'Chappal / Sandals', nameUr: 'چپل / سینڈل' },
      { id: 'school_bags', nameEn: 'School & Travel Bags', nameUr: 'اسکول اور سفری بیگ' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Sneakers', 'Chappal', 'School Shoes', 'Handbag', 'School Bag'],
    quickItemsUr: ['جوتے', 'چپل', 'اسکول جوتے', 'ہینڈ بیگ', 'اسکول بیگ'],
  },
  {
    id: 'hardware_paint',
    nameEn: 'Hardware & Paint',
    nameUr: 'ہارڈویئر اور پینٹ',
    categories: [
      { id: 'paint', nameEn: 'Paint & Primer', nameUr: 'پینٹ اور پرائمر' },
      { id: 'tools', nameEn: 'Tools', nameUr: 'اوزار' },
      { id: 'nails_screws', nameEn: 'Nails & Screws', nameUr: 'کیل اور پیچ' },
      { id: 'plumbing', nameEn: 'Plumbing & Pipes', nameUr: 'پلمبنگ اور پائپ' },
      { id: 'locks', nameEn: 'Locks & Hinges', nameUr: 'تالے اور قبضے' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Emulsion Paint', 'Brush', 'PVC Pipe', 'Door Lock', 'Screws'],
    quickItemsUr: ['پینٹ', 'برش', 'پائپ', 'تالا', 'پیچ'],
  },
  {
    id: 'building_material',
    nameEn: 'Building Material',
    nameUr: 'بلڈنگ میٹریل',
    categories: [
      { id: 'cement', nameEn: 'Cement', nameUr: 'سیمنٹ' },
      { id: 'steel', nameEn: 'Steel / Sariya', nameUr: 'سریا' },
      { id: 'bricks', nameEn: 'Bricks / Blocks', nameUr: 'اینٹیں / بلاک' },
      { id: 'sand_crush', nameEn: 'Sand & Crush', nameUr: 'ریت اور بجری' },
      { id: 'tiles', nameEn: 'Tiles & Marble', nameUr: 'ٹائل اور ماربل' },
      { id: 'transport_rent', nameEn: 'Delivery / Loader', nameUr: 'کرایہ / لوڈر' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Cement Bag', 'Sand Trolley', 'Bricks 1000', 'Crush', 'Steel'],
    quickItemsUr: ['سیمنٹ بوری', 'ریت ٹرالی', 'اینٹیں', 'بجری', 'سریا'],
  },
  {
    id: 'dairy_milk',
    nameEn: 'Dairy & Milk Shop',
    nameUr: 'ڈیری اور دودھ شاپ',
    categories: [
      { id: 'milk', nameEn: 'Fresh Milk', nameUr: 'تازہ دودھ' },
      { id: 'yogurt', nameEn: 'Yogurt (Dahi)', nameUr: 'دہی' },
      { id: 'butter_ghee', nameEn: 'Butter & Desi Ghee', nameUr: 'مکھن اور دیسی گھی' },
      { id: 'paneer_khoya', nameEn: 'Paneer & Khoya', nameUr: 'پنیر اور کھویا' },
      { id: 'lassi', nameEn: 'Lassi & Cream', nameUr: 'لسی اور ملائی' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Milk 1kg', 'Dahi 1kg', 'Desi Ghee', 'Butter', 'Lassi'],
    quickItemsUr: ['دودھ 1 کلو', 'دہی 1 کلو', 'دیسی گھی', 'مکھن', 'لسی'],
  },
  {
    id: 'vegetable_fruit',
    nameEn: 'Vegetable & Fruit',
    nameUr: 'سبزی اور فروٹ',
    categories: [
      { id: 'daily_veg', nameEn: 'Daily Vegetables', nameUr: 'روزمرہ سبزیاں' },
      { id: 'potato_onion', nameEn: 'Aloo, Piyaz, Tamatar', nameUr: 'آلو، پیاز، ٹماٹر' },
      { id: 'seasonal_fruit', nameEn: 'Seasonal Fruit', nameUr: 'موسمی پھل' },
      { id: 'herbs', nameEn: 'Dhaniya, Mirch, Adrak', nameUr: 'دھنیا، مرچ، ادرک' },
      { id: 'bulk_crates', nameEn: 'Bulk Crates', nameUr: 'تھوک کریٹ' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Potatoes', 'Onions', 'Tomatoes', 'Bananas', 'Apples'],
    quickItemsUr: ['آلو', 'پیاز', 'ٹماٹر', 'کیلے', 'سیب'],
  },
  {
    id: 'meat_chicken',
    nameEn: 'Meat & Chicken',
    nameUr: 'گوشت اور چکن',
    categories: [
      { id: 'chicken', nameEn: 'Chicken', nameUr: 'مرغی' },
      { id: 'mutton', nameEn: 'Mutton', nameUr: 'بکرا گوشت' },
      { id: 'beef', nameEn: 'Beef', nameUr: 'بڑا گوشت' },
      { id: 'fish', nameEn: 'Fish', nameUr: 'مچھلی' },
      { id: 'keema', nameEn: 'Keema / Boneless', nameUr: 'قیمہ / بون لیس' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Chicken 1kg', 'Beef 1kg', 'Mutton 1kg', 'Keema', 'Fish'],
    quickItemsUr: ['چکن 1 کلو', 'بیف 1 کلو', 'مٹن 1 کلو', 'قیمہ', 'مچھلی'],
  },
  {
    id: 'bakery_sweets',
    nameEn: 'Bakery & Sweets',
    nameUr: 'بیکری اور مٹھائی',
    categories: [
      { id: 'bread_rusk', nameEn: 'Bread & Rusk', nameUr: 'ڈبل روٹی اور رس' },
      { id: 'cakes', nameEn: 'Cakes & Pastries', nameUr: 'کیک اور پیسٹری' },
      { id: 'mithai', nameEn: 'Mithai / Sweets', nameUr: 'مٹھائی' },
      { id: 'biscuits', nameEn: 'Biscuits & Nimko', nameUr: 'بسکٹ اور نمکو' },
      { id: 'samosa_snacks', nameEn: 'Samosa & Snacks', nameUr: 'سموسے اور اسنیکس' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Bread', 'Rusk', 'Cake', 'Mithai 1kg', 'Biscuits'],
    quickItemsUr: ['ڈبل روٹی', 'رس', 'کیک', 'مٹھائی', 'بسکٹ'],
  },
  {
    id: 'tea_restaurant',
    nameEn: 'Tea Stall / Restaurant',
    nameUr: 'چائے اسٹال / ریسٹورنٹ',
    categories: [
      { id: 'tea_coffee', nameEn: 'Tea & Coffee', nameUr: 'چائے اور کافی' },
      { id: 'naan_roti', nameEn: 'Naan & Paratha', nameUr: 'نان اور پراٹھا' },
      { id: 'meals', nameEn: 'Meals / Karahi / Biryani', nameUr: 'کھانا / بریانی' },
      { id: 'cold_drinks', nameEn: 'Cold Drinks & Water', nameUr: 'کولڈ ڈرنک اور پانی' },
      { id: 'catering', nameEn: 'Parcel / Catering', nameUr: 'پارسل / کیٹرنگ' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Doodh Patti', 'Paratha', 'Biryani', 'Cold Drink', 'Mineral Water'],
    quickItemsUr: ['دودھ پتی', 'پراٹھا', 'بریانی', 'کولڈ ڈرنک', 'پانی'],
  },
  {
    id: 'salon_parlour',
    nameEn: 'Salon & Parlour',
    nameUr: 'سیلون اور پارلر',
    categories: [
      { id: 'haircut', nameEn: 'Haircut & Beard', nameUr: 'کٹنگ اور شیو' },
      { id: 'facial', nameEn: 'Facial & Clean-up', nameUr: 'فیشل' },
      { id: 'bridal', nameEn: 'Bridal / Party Makeup', nameUr: 'میک اپ' },
      { id: 'hair_color', nameEn: 'Hair Colour / Keratin', nameUr: 'ہیئر کلر' },
      { id: 'products', nameEn: 'Creams & Products', nameUr: 'کریم اور پروڈکٹس' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Haircut', 'Shave', 'Facial', 'Hair Colour', 'Makeup'],
    quickItemsUr: ['بال کٹائی', 'شیو', 'فیشل', 'ہیئر کلر', 'میک اپ'],
  },
  {
    id: 'tailor',
    nameEn: 'Tailor',
    nameUr: 'درزی / ٹیلر',
    categories: [
      { id: 'gents_suit', nameEn: 'Gents Stitching', nameUr: 'مردانہ سلائی' },
      { id: 'ladies_suit', nameEn: 'Ladies Stitching', nameUr: 'زنانہ سلائی' },
      { id: 'alteration', nameEn: 'Alteration / Repair', nameUr: 'آلٹریشن / مرمت' },
      { id: 'embroidery', nameEn: 'Kadhai / Piping', nameUr: 'کڑھائی / پائپنگ' },
      { id: 'urgent', nameEn: 'Urgent Stitching', nameUr: 'ارجنٹ سلائی' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Shalwar Kameez', '2-Piece Suit', 'Alteration', 'Button / Zip'],
    quickItemsUr: ['شلوار قمیض', 'سوٹ سلائی', 'آلٹریشن', 'بٹن / زپ'],
  },
  {
    id: 'auto_workshop',
    nameEn: 'Auto Parts & Workshop',
    nameUr: 'آٹو پارٹس اور ورکشاپ',
    categories: [
      { id: 'engine_oil', nameEn: 'Engine Oil & Filter', nameUr: 'انجن آئل اور فلٹر' },
      { id: 'tyres', nameEn: 'Tyres & Tubes', nameUr: 'ٹائر اور ٹیوب' },
      { id: 'spare_parts', nameEn: 'Spare Parts', nameUr: 'اسپیئر پارٹس' },
      { id: 'tuning', nameEn: 'Tuning & Service', nameUr: 'ٹیوننگ اور سروس' },
      { id: 'battery', nameEn: 'Battery & Electrical', nameUr: 'بیٹری اور الیکٹریکل' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Engine Oil', 'Air Filter', 'Spark Plug', 'Brake Shoe', 'Tuning'],
    quickItemsUr: ['انجن آئل', 'فلٹر', 'پلگ', 'بریک شو', 'ٹیوننگ'],
  },
  {
    id: 'stationery_books',
    nameEn: 'Stationery & Books',
    nameUr: 'اسٹیشنری اور کتب',
    categories: [
      { id: 'books', nameEn: 'School & College Books', nameUr: 'درسی کتب' },
      { id: 'notebooks', nameEn: 'Copies & Registers', nameUr: 'کاپیاں اور رجسٹر' },
      { id: 'pens', nameEn: 'Pens, Pencils & Geometry', nameUr: 'قلم اور اسٹیشنری' },
      { id: 'photocopy', nameEn: 'Photocopy & Print', nameUr: 'فوٹو کاپی اور پرنٹ' },
      { id: 'art_craft', nameEn: 'Art & Craft', nameUr: 'آرٹ اور چارٹ' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Register', 'Ballpoint', 'Photocopy', 'Geometry Box', 'Chart Paper'],
    quickItemsUr: ['رجسٹر', 'بال پوائنٹ', 'فوٹو کاپی', 'جیومیٹری باکس', 'چارٹ'],
  },
  {
    id: 'cosmetics_jewellery',
    nameEn: 'Cosmetics & Jewellery',
    nameUr: 'کاسمیٹکس اور جیولری',
    categories: [
      { id: 'makeup', nameEn: 'Makeup', nameUr: 'میک اپ' },
      { id: 'skincare', nameEn: 'Skincare & Creams', nameUr: 'اسکن کیئر' },
      { id: 'perfume', nameEn: 'Perfumes & Attar', nameUr: 'پرفیوم اور عطر' },
      { id: 'bangles', nameEn: 'Bangles & Rings', nameUr: 'چوڑیاں اور انگوٹھی' },
      { id: 'bridal_sets', nameEn: 'Jewellery Sets', nameUr: 'جیولری سیٹ' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Face Cream', 'Lipstick', 'Perfume', 'Bangles', 'Earrings'],
    quickItemsUr: ['فیس کریم', 'لپ اسٹک', 'پرفیوم', 'چوڑیاں', 'جھمکے'],
  },
  {
    id: 'furniture',
    nameEn: 'Furniture',
    nameUr: 'فرنیچر',
    categories: [
      { id: 'beds', nameEn: 'Beds & Mattresses', nameUr: 'بیڈ اور گدے' },
      { id: 'sofa', nameEn: 'Sofa & Chairs', nameUr: 'صوفہ اور کرسیاں' },
      { id: 'tables', nameEn: 'Tables & Desks', nameUr: 'میز اور ڈیسک' },
      { id: 'cupboards', nameEn: 'Almirah / Cupboards', nameUr: 'الماری' },
      { id: 'repair', nameEn: 'Polish & Repair', nameUr: 'پالش اور مرمت' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Chair', 'Table', 'Mattress', 'Sofa Set', 'Polish'],
    quickItemsUr: ['کرسی', 'میز', 'گدا', 'صوفہ سیٹ', 'پالش'],
  },
  {
    id: 'cash_lending',
    nameEn: 'Cash Lending',
    nameUr: 'نقد لین دین',
    categories: [
      { id: 'cash_udhaar', nameEn: 'Cash Udhaar', nameUr: 'نقد ادھار' },
      { id: 'amanat', nameEn: 'Amanat / Deposit', nameUr: 'امانت' },
      { id: 'committee', nameEn: 'Committee (BC)', nameUr: 'کمیٹی' },
      { id: 'advance', nameEn: 'Salary / Work Advance', nameUr: 'ایڈوانس' },
      { id: 'qarz_hasana', nameEn: 'Qarz-e-Hasana', nameUr: 'قرض حسنہ' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Cash', 'Advance', 'Committee', 'Deposit'],
    quickItemsUr: ['نقد', 'ایڈوانس', 'کمیٹی', 'امانت'],
  },
  {
    id: 'other',
    nameEn: 'Other',
    nameUr: 'دیگر',
    categories: [
      { id: 'goods', nameEn: 'Goods / Maal', nameUr: 'سامان / مال' },
      { id: 'services', nameEn: 'Services', nameUr: 'سروسز' },
      { id: 'cash', nameEn: 'Cash', nameUr: 'نقد' },
      { id: 'delivery', nameEn: 'Delivery', nameUr: 'ڈیلیوری' },
      { id: 'repair', nameEn: 'Repair', nameUr: 'مرمت' },
      { id: 'other', nameEn: 'Other', nameUr: 'دیگر' },
    ],
    quickItemsEn: ['Goods', 'Service', 'Cash'],
    quickItemsUr: ['سامان', 'سروس', 'نقد'],
  },
];

export function categoriesForShopTypes(
  shopTypeIds: string[] | undefined,
  customShopTypes?: string[]
): ShopUdhaarCategory[] {
  const ids = shopTypeIds && shopTypeIds.length > 0 ? shopTypeIds : ['general_store'];
  const seen = new Set<string>();
  const result: ShopUdhaarCategory[] = [];

  for (const id of ids) {
    const preset = SHOP_TYPE_PRESETS.find(p => p.id === id);
    if (!preset) continue;
    for (const cat of preset.categories) {
      if (!seen.has(cat.nameEn)) {
        seen.add(cat.nameEn);
        result.push(cat);
      }
    }
  }

  for (const custom of customShopTypes ?? []) {
    const clean = custom.trim();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      result.push({ id: `custom_${clean}`, nameEn: clean, nameUr: clean });
    }
  }

  return result;
}

export function quickItemsForShopTypes(
  shopTypeIds: string[] | undefined,
  language: 'en' | 'ur'
): string[] {
  const ids = shopTypeIds && shopTypeIds.length > 0 ? shopTypeIds : ['general_store'];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const id of ids) {
    const preset = SHOP_TYPE_PRESETS.find(p => p.id === id);
    if (!preset) continue;
    const list = language === 'ur' ? preset.quickItemsUr : preset.quickItemsEn;
    for (const item of list) {
      if (!seen.has(item)) {
        seen.add(item);
        items.push(item);
      }
    }
  }
  return items;
}
