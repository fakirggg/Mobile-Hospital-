export type Condition = 'Like New' | 'Good' | 'Average';
export type Category = 'Mobile' | 'Accessories';

export interface Product {
  id: string;
  name: string;
  price: number;
  condition: Condition;
  category: Category;
  storage: string;
  ram: string;
  accessoryType: string;
  image: string;
}

export interface ShopInfo {
  name: string;
  address: string;
  whatsapp: string;
  phone: string;
  googleMapUrl: string;
}
