import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DevicesIcon from '@mui/icons-material/Devices';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HomeIcon from '@mui/icons-material/Home';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import BuildIcon from '@mui/icons-material/Build';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import LiquorIcon from '@mui/icons-material/Liquor';
import SetMealIcon from '@mui/icons-material/SetMeal';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import FoodBankIcon from '@mui/icons-material/FoodBank';
import BakeryDiningIcon from '@mui/icons-material/BakeryDining';
import OutdoorGrillIcon from '@mui/icons-material/OutdoorGrill';
import IcecreamIcon from '@mui/icons-material/Icecream';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import PetsIcon from '@mui/icons-material/Pets';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import CookieIcon from '@mui/icons-material/Cookie';
import PhishingIcon from '@mui/icons-material/Phishing';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { Template } from './types';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { SvgIconTypeMap } from '@mui/material/SvgIcon';

// convenience alias matching how MUI exports its icons
export type SvgIconComponent = OverridableComponent<SvgIconTypeMap>;

export interface Category {
  value: string;
  label: string;
  // store the icon component itself; rendering is deferred to the consumer
  icon: SvgIconComponent | null;
}

export const categories: Category[] = [
  { value: '', label: 'Нет', icon: null },
  { value: 'groceries', label: 'Продукты', icon: ShoppingCartIcon },
  { value: 'electronics', label: 'Электроника', icon: DevicesIcon },
  { value: 'clothing', label: 'Одежда', icon: CheckroomIcon },
];

// list of icons a user can choose when defining a category
export const iconChoices: { key: string; label: string; icon: SvgIconComponent }[] = [
  { key: 'groceries', label: 'Продукты', icon: ShoppingCartIcon },
  { key: 'electronics', label: 'Электроника', icon: DevicesIcon },
  { key: 'clothing', label: 'Одежда', icon: CheckroomIcon },
  { key: 'dining', label: 'Еда', icon: LocalDiningIcon },
  { key: 'gas', label: 'Бензин', icon: LocalGasStationIcon },
  { key: 'library', label: 'Книги', icon: LocalLibraryIcon },
  { key: 'offer', label: 'Скидки', icon: LocalOfferIcon },
  { key: 'games', label: 'Игры', icon: SportsEsportsIcon },
  { key: 'favorite', label: 'Избранное', icon: FavoriteIcon },
  { key: 'home', label: 'Дом', icon: HomeIcon },
  { key: 'flora', label: 'Цветы', icon: LocalFloristIcon },
  { key: 'tools', label: 'Инструменты', icon: BuildIcon },
  { key: 'milk', label: 'Молоко / Напитки', icon: LocalDrinkIcon },
  { key: 'beverages', label: 'Напитки (алко/безалко)', icon: LiquorIcon },
  { key: 'meat', label: 'Мясо / Блюда', icon: SetMealIcon },
  { key: 'grill', label: 'Барбекю/Мясо', icon: OutdoorGrillIcon },
  { key: 'fastfood', label: 'Фастфуд', icon: FastfoodIcon },
  { key: 'restaurant', label: 'Готовая еда', icon: RestaurantMenuIcon },
  { key: 'bakery', label: 'Выпечка', icon: BakeryDiningIcon },
  { key: 'icecream', label: 'Мороженое', icon: IcecreamIcon },
  { key: 'coffee', label: 'Кофе/Напитки', icon: LocalCafeIcon },
  { key: 'foodbank', label: 'Крупы/Запасы', icon: FoodBankIcon },
  { key: 'health', label: 'Здоровье/Аптека', icon: LocalPharmacyIcon },
  { key: 'pets', label: 'Питомцы', icon: PetsIcon },
  { key: 'baby', label: 'Дети', icon: ChildCareIcon },
  { key: 'sports', label: 'Спорт', icon: FitnessCenterIcon },
  { key: 'car', label: 'Авто', icon: DirectionsCarIcon },
  { key: 'frozen', label: 'Заморозка', icon: AcUnitIcon },
  { key: 'snacks', label: 'Снеки', icon: CookieIcon },
  { key: 'seafood', label: 'Морепродукты', icon: PhishingIcon },
];

// mapping from key to component for easy lookup
export const iconMap: Record<string, SvgIconComponent> = iconChoices.reduce(
  (acc, item) => ({ ...acc, [item.key]: item.icon }),
  {}
);

// keywords to heuristically map product/category names to icon keys
// keys are iconChoice keys, values are arrays of lowercase tokens to match
export const categoryKeywords: Record<string, Record<string, string[]>> = {
  ru: {
    groceries: ['продукты', 'еда', 'кухня', 'холодильник', 'супермаркет', 'бакалея', 'магазин', 'капуста', 'авокадо', 'огурец', 'огурцы', 'помидор', 'помидоры', 'апельсин', 'апельсины', 'яблоко', 'яблоки', 'банан', 'бананы', 'лимон', 'лимоны', 'картофель', 'картошка', 'лук', 'морковь', 'перец', 'салат', 'шпинат', 'брокколи', 'виноград', 'груша', 'манго', 'мандарин', 'мандарины', 'слива', 'сливы', 'персик', 'персики', 'нектарин', 'киви', 'клубника', 'клубника', 'малина', 'черника', 'вишня', 'черешня', 'абрикос', 'абрикосы', 'арбуз', 'дыня', 'канталупа', 'кабачок', 'кабачки', 'баклажан', 'тыква', 'свекла', 'редис', 'сельдерей', 'чеснок', 'имбирь', 'петрушка', 'кинза', 'укроп', 'базилик', 'руккола', 'кале', 'кукуруза', 'горох', 'фасоль', 'спаржа', 'бамия', 'шампиньоны', 'грибы'],
    electronics: ['электроника', 'гаджет', 'телефон', 'компьютер', 'ноутбук', 'зарядка', 'батарейки', 'наушники', 'кабель', 'техника', 'провод'],
    clothing: ['одежда', 'футболка', 'штаны', 'носки', 'обувь', 'куртка', 'платье', 'джинсы', 'белье', 'шапка', 'шарф'],
    dining: ['ресторан', 'кафе', 'ужин', 'обед', 'завтрак', 'столовая', 'на вынос'],
    gas: ['бензин', 'заправка', 'топливо', 'дизель', 'газ', 'азс'],
    library: ['книга', 'тетрадь', 'ручка', 'карандаш', 'бумага', 'офис', 'канцелярия', 'блокнот', 'журнал'],
    offer: ['скидка', 'акция', 'распродажа', 'купон'],
    games: ['игры', 'игрушка', 'приставка', 'xbox', 'playstation', 'nintendo', 'steam', 'game', 'настолка'],
    home: ['дом', 'мебель', 'уборка', 'химия', 'порошок', 'мыло', 'салфетки', 'туалетная', 'губка', 'шампунь', 'гель для душа', 'зубная паста', 'щетка', 'бытовая химия', 'для дома'],
    flora: ['цветы', 'растение', 'сад', 'земля', 'горшок', 'букет', 'семена', 'удобрение'],
    tools: ['инструменты', 'ремонт', 'гвозди', 'молоток', 'отвертка', 'дрель', 'шуруп', 'клей', 'скотч', 'лампочка'],
    milk: ['молоко', 'кефир', 'йогурт', 'молочные', 'сметана', 'творог', 'сыр', 'масло сливочное'],
    beverages: ['вода', 'сок', 'напиток', 'напитки', 'вино', 'пиво', 'сода', 'лимонад', 'квас', 'энергетик', 'алкоголь'],
    meat: ['мясо', 'свинина', 'говядина', 'курица', 'бекон', 'стейк', 'фарш', 'колбаса', 'сосиски', 'индейка'],
    grill: ['гриль', 'барбекю', 'шашлык', 'мангал', 'угли', 'шампуры'],
    fastfood: ['фастфуд', 'бургер', 'гамбургер', 'картофель фри', 'пицца', 'шаурма', 'суши', 'роллы'],
    restaurant: ['еда', 'блюдо', 'готовая еда', 'доставка'],
    bakery: ['хлеб', 'булочка', 'выпечка', 'булки', 'пирог', 'торт', 'печенье', 'круассан'],
    icecream: ['мороженое', 'пломбир', 'эскимо', 'сорбет'],
    coffee: ['кофе', 'капучино', 'латте', 'эспрессо', 'кофейня', 'чай'],
    foodbank: ['крупа', 'рис', 'макароны', 'мука', 'запас', 'консервы', 'гречка', 'овсянка', 'сахар', 'соль', 'масло растительное', 'тушенка'],
    health: ['аптека', 'лекарство', 'таблетки', 'витамины', 'мазь', 'пластырь', 'градусник', 'болит', 'бинт', 'анальгин'],
    pets: ['животные', 'корм', 'собака', 'кошка', 'наполнитель', 'кот', 'пес', 'поводок', 'ошейник'],
    baby: ['дети', 'ребенок', 'памперсы', 'подгузники', 'игрушки', 'соска', 'малыш', 'пюре детское', 'смесь'],
    sports: ['спорт', 'фитнес', 'мяч', 'тренировка', 'зал', 'гантели', 'протеин'],
    car: ['машина', 'авто', 'запчасти', 'масло', 'шины', 'мойка', 'колесо', 'омывайка', 'антифриз'],
    frozen: ['заморозка', 'замороженные', 'пельмени', 'вареники', 'пицца замороженная', 'лед', 'овощи замороженные', 'полуфабрикаты', 'котлеты замороженные', 'наггетсы'],
    snacks: ['снеки', 'чипсы', 'сухарики', 'орехи', 'крекеры', 'попкорн', 'закуска', 'сухофрукты', 'батончик'],
    seafood: ['рыба', 'морепродукты', 'креветки', 'кальмары', 'мидии', 'лосось', 'тунец', 'икра', 'осьминог', 'краб'],
  },
  en: {
    groceries: ['groceries', 'food', 'kitchen', 'fridge', 'supermarket', 'pantry', 'cabbage', 'avocado', 'cucumber', 'cucumbers', 'tomato', 'tomatoes', 'orange', 'oranges', 'apple', 'apples', 'banana', 'bananas', 'lemon', 'lemons', 'potato', 'potatoes', 'onion', 'onions', 'carrot', 'carrots', 'pepper', 'peppers', 'lettuce', 'spinach', 'broccoli', 'grape', 'grapes', 'pear', 'mango', 'mandarin', 'tangerine', 'clementine', 'plum', 'plums', 'peach', 'peaches', 'nectarine', 'kiwi', 'strawberry', 'strawberries', 'raspberry', 'raspberries', 'blueberry', 'blueberries', 'cherry', 'cherries', 'apricot', 'apricots', 'watermelon', 'melon', 'cantaloupe', 'zucchini', 'courgette', 'eggplant', 'aubergine', 'pumpkin', 'beet', 'beetroot', 'radish', 'radishes', 'celery', 'garlic', 'ginger', 'parsley', 'cilantro', 'coriander', 'dill', 'basil', 'arugula', 'rocket', 'kale', 'corn', 'sweetcorn', 'pea', 'peas', 'bean', 'beans', 'green beans', 'asparagus', 'okra', 'mushroom', 'mushrooms', 'sprouts'],
    electronics: ['electronics', 'gadget', 'phone', 'computer', 'laptop', 'charger', 'batteries', 'headphones', 'cable', 'tech', 'wire'],
    clothing: ['clothing', 'shirt', 'pants', 'socks', 'shoes', 'jacket', 'dress', 'jeans', 'underwear', 'hat', 'scarf'],
    dining: ['dining', 'dinner', 'lunch', 'breakfast', 'eating out', 'takeaway', 'restaurant'],
    gas: ['gas', 'fuel', 'petrol', 'diesel', 'station'],
    library: ['book', 'notebook', 'pen', 'pencil', 'paper', 'office', 'stationery', 'magazine'],
    offer: ['offer', 'discount', 'sale', 'coupon'],
    games: ['games', 'toy', 'console', 'xbox', 'playstation', 'nintendo', 'video game', 'board game'],
    home: ['home', 'furniture', 'cleaning', 'detergent', 'soap', 'napkins', 'toilet paper', 'sponge', 'shampoo', 'shower gel', 'toothpaste', 'toothbrush', 'household'],
    flora: ['flowers', 'plant', 'garden', 'soil', 'pot', 'seeds', 'bouquet', 'fertilizer'],
    tools: ['tools', 'repair', 'nails', 'hammer', 'screwdriver', 'drill', 'screw', 'glue', 'tape', 'lightbulb'],
    milk: ['milk', 'dairy', 'kefir', 'yogurt', 'sour cream', 'cottage cheese', 'cheese', 'butter'],
    beverages: ['juice', 'drink', 'water', 'wine', 'beer', 'soda', 'lemonade', 'soft drink', 'energy drink', 'alcohol'],
    meat: ['meat', 'chicken', 'pork', 'beef', 'bacon', 'steak', 'minced meat', 'sausage', 'turkey'],
    grill: ['grill', 'barbecue', 'bbq', 'charcoal', 'skewers'],
    fastfood: ['fastfood', 'burger', 'pizza', 'sushi', 'rolls', 'fries'],
    restaurant: ['restaurant', 'meal', 'prepared food', 'delivery'],
    bakery: ['cake', 'bread', 'bakery', 'pastry', 'pie', 'cookies', 'croissant'],
    icecream: ['icecream', 'ice-cream', 'sorbet', 'popsicle'],
    coffee: ['coffee', 'cafe', 'tea', 'cappuccino', 'latte', 'espresso'],
    foodbank: ['grains', 'rice', 'pasta', 'flour', 'canned', 'canned goods', 'sugar', 'salt', 'oil', 'buckwheat'],
    health: ['pharmacy', 'medicine', 'pills', 'vitamins', 'ointment', 'bandaid', 'drug', 'health', 'bandage'],
    pets: ['pets', 'food', 'dog', 'cat', 'litter', 'puppy', 'kitten', 'leash', 'collar'],
    baby: ['baby', 'child', 'diapers', 'toys', 'pacifier', 'wipes', 'baby food', 'formula'],
    sports: ['sports', 'fitness', 'ball', 'workout', 'gym', 'training', 'protein', 'dumbbells'],
    car: ['car', 'auto', 'parts', 'oil', 'tires', 'wash', 'wheel', 'antifreeze', 'washer fluid'],
    frozen: ['frozen', 'frozen food', 'dumplings', 'frozen pizza', 'ice', 'frozen vegetables', 'semi-finished', 'nuggets'],
    snacks: ['snacks', 'chips', 'crisps', 'nuts', 'crackers', 'popcorn', 'dried fruit', 'bar'],
    seafood: ['seafood', 'fish', 'shrimp', 'salmon', 'tuna', 'caviar', 'squid', 'mussels', 'octopus', 'crab'],
  },
  he: {
    groceries: ['מצרכים', 'אוכל', 'מטבח', 'מקרר', 'סופר', 'מזווה', 'כרוב', 'אבוקדו', 'מלפפון', 'מלפפונים', 'עגבנייה', 'עגבניות', 'תפוז', 'תפוזים', 'תפוח', 'תפוחים', 'בננה', 'בננות', 'לימון', 'לימונים', 'תפוח אדמה', 'בצל', 'גזר', 'פלפל', 'חסה', 'תרד', 'ברוקולי', 'ענבים', 'אגס', 'מנגו', 'מנדרינה', 'מנדרינות', 'שזיף', 'שזיפים', 'אפרסק', 'נקטארין', 'קיווי', 'תות', 'תותים', 'פטל', 'אוכמניות', 'דובדבן', 'משמש', 'משמשים', 'אבטיח', 'מלון', 'קישוא', 'קישואים', 'חציל', 'דלעת', 'סלק', 'צנון', 'סלרי', 'שום', 'גינגר', 'פטרוזיליה', 'כוסברה', 'שמיר', 'בזיליקום', 'רוקט', 'קייל', 'תירס', 'אפונה', 'שעועית', 'אספרגוס', 'במיה', 'פטריות', 'נבטים'],
    electronics: ['אלקטרוניקה', 'גאדג\'ט', 'טלפון', 'מחשב', 'מטען', 'סוללות', 'אוזניות', 'כבל', 'טכנולוגיה'],
    clothing: ['בגדים', 'חולצה', 'מכנסיים', 'גרביים', 'נעליים', 'מעיל', 'שמלה', 'ג\'ינס', 'תחתונים', 'כובע', 'צעיף'],
    dining: ['מסעדה', 'ארוחת ערב', 'ארוחת צהריים', 'בוקר', 'אוכל בחוץ', 'טייקאווי'],
    gas: ['דלק', 'בנזין', 'סולר', 'תחנת דלק', 'גז'],
    library: ['ספר', 'מחברת', 'עט', 'עיפרון', 'נייר', 'משרד', 'ציוד משרדי', 'מגזין'],
    offer: ['מבצע', 'הנחה', 'מכירה', 'קופון'],
    games: ['משחקים', 'צעצוע', 'קונסולה', 'אקס בוקס', 'פלייסטיישן', 'נינטנדו', 'משחק קופסא'],
    home: ['בית', 'רהיטים', 'ניקיון', 'אבקת כביסה', 'סבון', 'מפיות', 'נייר טואלט', 'ספוג', 'שמפו', 'ג\'ל רחצה', 'משחת שיניים', 'מברשת שיניים', 'חומרי ניקוי'],
    flora: ['פרחים', 'צמח', 'גינה', 'אדמה', 'עציץ', 'זר', 'זרעים', 'דשן'],
    tools: ['כלים', 'תיקון', 'מסמרים', 'פטיש', 'מברג', 'מקדחה', 'בורג', 'דבק', 'נורה'],
    milk: ['חלב', 'יוגורט', 'מוצרי חלב', 'שמנת חמוצה', 'גבינה', 'קוטג\'', 'חמאה'],
    beverages: ['מים', 'מיץ', 'משקה', 'יין', 'בירה', 'סודה', 'לימונדה', 'משקה קל', 'משקה אנרגיה', 'אלכוהול'],
    meat: ['בשר', 'חזיר', 'בקר', 'עוף', 'בייקון', 'סטייק', 'בשר טחון', 'נקניק', 'הודו'],
    grill: ['גריל', 'ברביקיו', 'מנגל', 'פחמים', 'שיפודים', 'על האש'],
    fastfood: ['אוכל מהיר', 'המבורגר', 'פיצה', 'סושי', 'רולים', 'צ\'יפס'],
    restaurant: ['אוכל', 'מנה', 'אוכל מוכן', 'משלוח'],
    bakery: ['לחם', 'עוגה', 'מאפה', 'מאפים', 'פאי', 'עוגיות', 'קרואסון'],
    icecream: ['גלידה', 'ארטיק', 'סורבה'],
    coffee: ['קפה', 'קפוצ׳ינו', 'לאטה', 'אספרסו', 'בית קפה', 'תה'],
    foodbank: ['דגנים', 'אורז', 'פסטה', 'קמח', 'מלאי', 'שימורים', 'כוסמת', 'סוכר', 'מלח', 'שמן'],
    health: ['בית מרקחת', 'תרופה', 'כדורים', 'ויטמינים', 'משחה', 'פלסטר', 'בריאות', 'תחבושת'],
    pets: ['חיות מחמד', 'אוכל לכלבים', 'כלב', 'חתול', 'חול', 'חיות', 'רצועה', 'קולר'],
    baby: ['תינוק', 'ילד', 'חיתולים', 'צעצועים', 'מוצץ', 'מגבונים', 'אוכל לתינוקות', 'פורמולה'],
    sports: ['ספורט', 'כושר', 'כדור', 'אימון', 'חדר כושר', 'חלבון', 'משקולות'],
    car: ['רכב', 'אוטו', 'חלקים', 'שמן', 'צמיגים', 'שטיפה', 'גלגל', 'אנטיפריז'],
    frozen: ['קפוא', 'אוכל קפוא', 'כיסונים', 'פיצה קפואה', 'קרח', 'ירקות קפואים', 'חצי מבושל', 'נאגטס'],
    snacks: ['חטיפים', 'צ\'יפס', 'אגוזים', 'קרקרים', 'פופקורן', 'פירות יבשים', 'חטיף'],
    seafood: ['פירות ים', 'דגים', 'שרימפס', 'סלמון', 'טונה', 'קוויאר', 'קלמארי', 'מולים', 'תמנון', 'סרטן'],
  },
};

export const templates: Template[] = [
  {
    key: 'weekly',
    name: 'Еженедельные продукты',
    items: [
      { name: 'Молоко', quantity: 1 },
      { name: 'Хлеб', quantity: 1 },
      { name: 'Яйца', quantity: 12 },
    ],
  },
  {
    key: 'party',
    name: 'Принадлежности для вечеринки',
    items: [
      { name: 'Чипсы', quantity: 2 },
      { name: 'Сода', quantity: 6 },
      { name: 'Пластиковые стаканчики', quantity: 20 },
    ],
  },
];