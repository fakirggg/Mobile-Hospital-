
import { Product, ShopInfo, Banner } from './types';

export const SHOP_DETAILS: ShopInfo = {
  name: "Mobile Hospital",
  address: "Shop No. 12, Main Market Road, Near City Square, New Delhi - 110001",
  whatsapp: "919876543210", // Format: CountryCodePhoneNumber
  phone: "+91 98765-43210",
  googleMapUrl: "https://www.google.com/maps/search/?api=1&query=Delhi+Main+Market"
};

export const INITIAL_BANNERS: Banner[] = [
  {
    id: '1',
    title: "Smartphone Dhamaka Sale",
    subtitle: "Exchange your old phone & get up to ₹10,000 off*",
    bg: "bg-gradient-to-r from-blue-700 to-indigo-800",
    image: "https://images.unsplash.com/photo-1556656793-062ff987b50c?auto=format&fit=crop&q=80&w=400&h=200",
    tag: "BEST OFFERS"
  },
  {
    id: '2',
    title: "Accessories Bonanza",
    subtitle: "Premium Covers & Chargers starting @ ₹99 only",
    bg: "bg-gradient-to-r from-orange-500 to-red-600",
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=400&h=200",
    tag: "FLAT 50% OFF"
  },
  {
    id: '3',
    title: "Certified Refurbished",
    subtitle: "7-Point Quality Check Passed on every mobile",
    bg: "bg-gradient-to-r from-emerald-600 to-teal-700",
    image: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=400&h=200",
    tag: "TRUSTED QUALITY"
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Apple iPhone 13 Pro (Graphite, 128 GB)',
    price: 45000,
    condition: 'Like New',
    category: 'Mobile',
    description: 'Graphite color, No scratches, with original box. 100% Battery Health.',
    specs: { ram: '6GB', storage: '128GB' },
    image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=400&h=300',
    createdAt: Date.now()
  },
  {
    id: '2',
    name: 'SAMSUNG Galaxy S21 Ultra 5G (Phantom Black, 256 GB)',
    price: 32000,
    condition: 'Good',
    category: 'Mobile',
    description: 'Phantom Black, slightly used on edges. Stunning camera quality.',
    specs: { ram: '12GB', storage: '256GB' },
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400&h=300',
    createdAt: Date.now() - 86400000
  },
  {
    id: '3',
    name: 'Apple 20W USB-C Power Adapter',
    price: 1500,
    condition: 'Like New',
    category: 'Accessories',
    description: 'Original Apple 20W Adapter with 3 months shop warranty.',
    specs: { type: 'Type-C' },
    image: 'https://images.unsplash.com/photo-1619119155257-269c27632644?auto=format&fit=crop&q=80&w=400&h=300',
    createdAt: Date.now() - 172800000
  },
  {
    id: '4',
    name: 'Realme Buds Air 3 Neo Bluetooth Headset',
    price: 2200,
    condition: 'Average',
    category: 'Accessories',
    description: 'Noise cancelling working fine. Compact charging case.',
    specs: { type: 'Wireless' },
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400&h=300',
    createdAt: Date.now() - 259200000
  }
];
