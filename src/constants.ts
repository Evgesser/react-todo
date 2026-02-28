import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DevicesIcon from '@mui/icons-material/Devices';
import CheckroomIcon from '@mui/icons-material/Checkroom';
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