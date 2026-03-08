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
    milk: ['молоко', 'кефир', 'йогурт', 'молочные'],
    beverages: ['вода', 'сок', 'напиток', 'напитки', 'вино', 'пиво', 'сода'],
    meat: ['мясо', 'свинина', 'говядина', 'курица', 'бекон', 'стейк'],
    grill: ['гриль', 'барбекю', 'шашлык'],
    fastfood: ['фастфуд', 'бург', 'гамбургер', 'картофель фри', 'пицца'],
    restaurant: ['еда', 'блюдо', 'готовая еда'],
    bakery: ['хлеб', 'булочка', 'выпечка', 'булки', 'пирог'],
    icecream: ['мороженое'],
    coffee: ['кофе', 'капучино', 'латте', 'эспрессо', 'кофейня'],
    foodbank: ['крупа', 'рис', 'макароны', 'мука', 'запас', 'консервы'],
  },
  en: {
    milk: ['milk', 'dairy'],
    beverages: ['juice', 'drink', 'water'],
    meat: ['meat', 'chicken', 'pork', 'beef'],
    grill: ['grill', 'barbecue'],
    fastfood: ['fastfood', 'burger', 'pizza'],
    restaurant: ['restaurant', 'meal'],
    bakery: ['cake', 'bread', 'bakery'],
    icecream: ['icecream'],
    coffee: ['coffee', 'cafe'],
    foodbank: ['grains', 'rice', 'pasta'],
  },
  he: {
    milk: ['חלב', 'יוגורט', 'מוצרי חלב'],
    beverages: ['מים', 'מיץ', 'משקה', 'יין', 'בירה', 'סודה'],
    meat: ['בשר', 'חזיר', 'בקר', 'עוף', 'בקון', 'סטייק'],
    grill: ['גריל', 'ברביקיו', 'שווארמה'],
    fastfood: ['אוכל מהיר', 'המבורגר', 'פיצה'],
    restaurant: ['אוכל', 'מנה', 'אוכל מוכן'],
    bakery: ['לחם', 'עוגה', 'מאפה'],
    icecream: ['גלידה'],
    coffee: ['קפה', 'קפוצ׳ינו', 'לאטה', 'אספרסו', 'בית קפה'],
    foodbank: ['דגנים', 'אורז', 'פסטה', 'קמח', 'מלאי', 'שימורים'],
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