import fs from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'training_data_augmented.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Новые высококачественные примеры для слабых категорий (RU, EN, HE)
const augmentations = {
  bakery: [
    // RU
    "свежий хлеб", "батон нарезной", "ржаной хлеб с изюмом", "черный хлеб", "пшеничный хлеб",
    "булочка с маком", "круассан на завтрак", "слойка с творогом", "ватрушка", "пончик", "донат",
    "бородинский хлеб", "лаваш армянский", "лепешка тандырная", "хлебцы", "кекс", "маффин",
    "багет французский", "чиабата", "фокачча с травами", "пирожки с капустой", "бублик", "сушки",
    // EN
    "sourdough bread", "whole grain loaf", "rye bread", "baguette", "ciabatta", "focaccia",
    "croissant", "pain au chocolat", "danish pastry", "cinnamon roll", "donut", "bagel",
    "pita bread", "white sandwich bread", "tortilla wraps", "muffins", "cupcakes",
    // HE
    "לחם טרי", "חלה לשבת", "לחם שיפון", "בגט צרפתי", "בורקס גבינה", "קוראסון חמאה", "פיתה טריה",
    "לחמניות", "רוגעלך", "עוגת שמרים", "לחם מחמצת", "ביגלה", "קרקרים", "מצה"
  ],
  beverages: [
    // RU
    "минеральная вода", "газировка", "кока-кола", "лимонад", "сок апельсиновый", "напиток яблочный",
    "квас", "компот", "чай черный", "чай зеленый", "кофе молотый", "энергетик", "изотоник",
    "пиво светлое", "вино красное", "сидр", "морс", "холодный чай", "тоник", "смузи",
    // EN
    "sparkling water", "spring water", "soda pop", "coca-cola", "iced tea", "orange juice",
    "apple juice", "lemonade", "energy drink", "coffee beans", "tea bags", "kombucha",
    "craft beer", "dry wine", "apple cider", "hot cocoa", "milkshake",
    // HE
    "מים מינרליים", "קולה", "מיץ תפוזים", "מיץ ענבים", "סודה", "תה קר", "בירה", "יין אדום",
    "לימונדה", "משקה אנרגיה", "שוקו", "נס קפה", "תה ירוק", "נקטר", "שייק פירות"
  ],
  sports: [
    // RU
    "протеин", "гейнер", "аминокислоты", "креатин", "спортивное питание", "протеиновый батончик",
    "витамины для спортсменов", "скакалка", "гантели", "коврик для йоги", "эспандер",
    "предтреник", "шейкер для протеина", "магнезия", "эластичный бинт",
    // EN
    "whey protein", "protein powder", "bcaa", "creatine", "pre-workout", "protein bar",
    "energy gel", "electrolyte powder", "yoga mat", "dumbbells", "resistance bands",
    "jump rope", "fitness tracker", "gym towel",
    // HE
    "אבקת חלבון", "חטיף חלבון", "קריאטין", "תוספי תזונה לספורט", "חומצות אמינו", "ויטמינים",
    "מזרן יוגה", "משקולות", "דילגית", "גומיות התנגדות", "רצועות אימון"
  ],
  foodbank: [
    // RU
    "гречка", "рис длиннозерный", "макароны перья", "спагетти", "чечевица красная", "нут",
    "горох колотый", "фасоль консервированная", "кукуруза в банке", "тушенка", "рыбные консервы",
    "овсянка", "геркулес", "крупа ячневая", "пшено", "мука пшеничная", "сахар", "соль",
    // EN
    "canned beans", "canned corn", "tuna cans", "dried lentils", "chickpeas", "rice bag",
    "pasta varieties", "spaghetti", "oatmeal", "white flour", "sugar pouch", "salt box",
    "canned tomatoes", "peanut butter jar", "dry cereal",
    // HE
    "אורז פרסי", "עדשים ירוקות", "חומוס גרגירים", "פסטה", "ספגטי", "קמח לבן", "סוכר לבן",
    "מלח בישול", "שימורי תירס", "טונה בשמן", "שימורי שעועית", "פתיתים", "קוסקוס", "שיבולת שועל"
  ],
  snacks: [
    // RU
    "чипсы картофельные", "сухарики", "орешки соленые", "семечки жареные", "кукурузные палочки",
    "попкорн", "крекеры", "батончик шоколадный", "шоколад молочный", "зефир", "мармелад",
    "печенье", "вафли", "пряники", "халва", "соломка", "жевательная резинка",
    // EN
    "potato chips", "tortilla chips", "pretzels", "salted nuts", "sunflower seeds",
    "popcorn bowl", "rice cakes", "chocolate bar", "gummy bears", "marshmallows",
    "cookies", "wafers", "energy balls", "jerky", "chewing gum",
    // HE
    "צ'יפס", "במבה", "ביסלי", "פיצוחים", "גרעינים", "שוקולד", "וופלים", "עוגיות",
    "פופקורן", "בייגלה", "מסטיק", "חטיף אנרגיה", "מרשמלו"
  ]
};

// Объединяем и удаляем дубликаты
for (const [category, newExamples] of Object.entries(augmentations)) {
  if (!data[category]) data[category] = [];
  const currentSet = new Set(data[category]);
  newExamples.forEach(ex => currentSet.add(ex));
  data[category] = Array.from(currentSet);
}

// Сохраняем результат
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ training_data_augmented.json updated with high-quality examples.');
