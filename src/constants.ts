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
import { Template, TemplateItem } from './types';
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
];

// mapping from key to component for easy lookup
export const iconMap: Record<string, SvgIconComponent> = iconChoices.reduce(
  (acc, item) => ({ ...acc, [item.key]: item.icon }),
  {}
);

export const templates: Template[] = [
  {
    name: 'Еженедельные продукты',
    items: [
      { name: 'Молоко', quantity: 1 },
      { name: 'Хлеб', quantity: 1 },
      { name: 'Яйца', quantity: 12 },
    ],
  },
  {
    name: 'Принадлежности для вечеринки',
    items: [
      { name: 'Чипсы', quantity: 2 },
      { name: 'Сода', quantity: 6 },
      { name: 'Пластиковые стаканчики', quantity: 20 },
    ],
  },
];