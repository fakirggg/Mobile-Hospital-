
export type Condition = 'Like New' | 'Good' | 'Average';
export type Category = 'Mobile' | 'Accessories';
export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  password?: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  condition: Condition;
  category: Category;
  description: string;
  specs: {
    ram?: string;
    storage?: string;
    type?: string;
  };
  image: string;
  createdAt: number;
}

export interface ShopInfo {
  name: string;
  address: string;
  whatsapp: string;
  phone: string;
  googleMapUrl: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  bg: string;
  image: string;
  tag: string;
}
