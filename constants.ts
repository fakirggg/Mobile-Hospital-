import { Product, ShopInfo } from './types';

export const ADMIN_PASSWORD = 'Hospital@3030';

export const SHOP_DETAILS: ShopInfo = {
  name: 'Mobile Hospital',
  address: 'Shop No. 12, Main Market Road, Near City Square, New Delhi - 110001',
  whatsapp: '919876543210',
  phone: '+919876543210',
  googleMapUrl: 'https://www.google.com/maps/search/?api=1&query=Delhi+Main+Market',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Apple iPhone 13 Pro',
    price: 45000,
    condition: 'Like New',
    category: 'Mobile',
    storage: '128GB',
    ram: '6GB',
    accessoryType: '',
    image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=800&h=600',
  },
  {
    id: '2',
    name: 'Samsung Galaxy S21 Ultra',
    price: 32000,
    condition: 'Good',
    category: 'Mobile',
    storage: '256GB',
    ram: '12GB',
    accessoryType: '',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=800&h=600',
  },
  {
    id: '3',
    name: 'Apple 20W Charger',
    price: 1500,
    condition: 'Like New',
    category: 'Accessories',
    storage: '',
    ram: '',
    accessoryType: 'Charger',
    image: 'https://images.unsplash.com/photo-1619119155257-269c27632644?auto=format&fit=crop&q=80&w=800&h=600',
  },
  {
    id: '4',
    name: 'Bluetooth Earphones',
    price: 2200,
    condition: 'Average',
    category: 'Accessories',
    storage: '',
    ram: '',
    accessoryType: 'Earphones',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800&h=600',
  },
];
