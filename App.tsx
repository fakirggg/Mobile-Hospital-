import React, { useMemo, useState } from 'react';
import { Category, Condition, Product } from './types';
import { INITIAL_PRODUCTS, SHOP_DETAILS, ADMIN_PASSWORD } from './constants';

const safeGetProducts = (): Product[] => {
  try {
    const data = localStorage.getItem('mobile_hospital_products');
    if (!data) return INITIAL_PRODUCTS;
    const parsed = JSON.parse(data) as Product[];
    return Array.isArray(parsed) ? parsed : INITIAL_PRODUCTS;
  } catch {
    return INITIAL_PRODUCTS;
  }
};

const emptyForm = {
  name: '',
  price: '',
  condition: 'Like New' as Condition,
  category: 'Mobile' as Category,
  storage: '',
  ram: '',
  accessoryType: '',
  image: '',
};

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(safeGetProducts);
  const [activeCategory, setActiveCategory] = useState<'All' | Category>('All');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  const persistProducts = (nextProducts: Product[]) => {
    setProducts(nextProducts);
    localStorage.setItem('mobile_hospital_products', JSON.stringify(nextProducts));
  };

  const onSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const product: Product = {
      id: editingId ?? String(Date.now()),
      name: form.name.trim(),
      price: Number(form.price),
      condition: form.condition,
      category: form.category,
      storage: form.category === 'Mobile' ? form.storage.trim() : '',
      ram: form.category === 'Mobile' ? form.ram.trim() : '',
      accessoryType: form.category === 'Accessories' ? form.accessoryType.trim() : '',
      image: form.image.trim() || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800&h=600',
    };

    if (!product.name || !product.price) return;

    const nextProducts = editingId
      ? products.map((item) => (item.id === editingId ? product : item))
      : [product, ...products];

    persistProducts(nextProducts);
    setForm(emptyForm);
    setEditingId(null);
  };

  const onEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      condition: product.condition,
      category: product.category,
      storage: product.storage,
      ram: product.ram,
      accessoryType: product.accessoryType,
      image: product.image,
    });
    setIsAdminOpen(true);
  };

  const onDelete = (id: string) => {
    persistProducts(products.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
  };

  return (
    <main style={{ fontFamily: 'Inter, Arial, sans-serif', background: '#f5f7fb', minHeight: '100vh', color: '#1f2937' }}>
      <header style={{ background: '#0f172a', color: 'white', padding: '16px' }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>{SHOP_DETAILS.name}</h1>
        <p style={{ margin: '6px 0 0 0', opacity: 0.9 }}>Second hand mobiles & accessories catalog</p>
      </header>

      <section style={{ display: 'flex', gap: 8, padding: 16, flexWrap: 'wrap' }}>
        {['All', 'Mobile', 'Accessories'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveCategory(tab as 'All' | Category)}
            style={{
              border: 'none',
              borderRadius: 999,
              padding: '10px 14px',
              cursor: 'pointer',
              background: activeCategory === tab ? '#0f172a' : 'white',
              color: activeCategory === tab ? 'white' : '#111827',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            {tab === 'Mobile' ? 'Mobiles' : tab}
          </button>
        ))}
      </section>

      <section style={{ padding: '0 16px 20px', display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {filteredProducts.map((product) => (
          <article key={product.id} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.1)' }}>
            <img src={product.image} alt={product.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
            <div style={{ padding: 12 }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 17 }}>{product.name}</h3>
              <p style={{ margin: '4px 0', fontWeight: 700 }}>₹ {product.price.toLocaleString('en-IN')}</p>
              <p style={{ margin: '4px 0' }}>Condition: <b>{product.condition}</b></p>
              {product.category === 'Mobile' ? (
                <p style={{ margin: '4px 0' }}>Storage/RAM: <b>{product.storage || '-'} / {product.ram || '-'}</b></p>
              ) : (
                <p style={{ margin: '4px 0' }}>Type: <b>{product.accessoryType || 'General'}</b></p>
              )}

              {isAdminLoggedIn && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button onClick={() => onEdit(product)} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => onDelete(product.id)} style={{ border: 'none', background: '#dc2626', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>Delete</button>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      <section style={{ margin: 16, background: 'white', borderRadius: 14, padding: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0 }}>Shop Address</h2>
        <p style={{ marginBottom: 12 }}>{SHOP_DETAILS.address}</p>
        <a href={SHOP_DETAILS.googleMapUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>
          Open Google Map Location
        </a>
      </section>

      <section style={{ margin: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a href={`https://wa.me/${SHOP_DETAILS.whatsapp}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', background: '#16a34a', color: 'white', borderRadius: 10, padding: '10px 14px', fontWeight: 700 }}>
          WhatsApp Contact
        </a>
        <a href={`tel:${SHOP_DETAILS.phone}`} style={{ textDecoration: 'none', background: '#0f172a', color: 'white', borderRadius: 10, padding: '10px 14px', fontWeight: 700 }}>
          Call Shop
        </a>
        <button onClick={() => setIsAdminOpen((s) => !s)} style={{ border: '1px solid #cbd5e1', borderRadius: 10, background: 'white', padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
          Admin Panel
        </button>
      </section>

      {isAdminOpen && (
        <section style={{ margin: 16, background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0 }}>Admin Panel</h2>

          {!isAdminLoggedIn ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (adminPassword === ADMIN_PASSWORD) {
                  setIsAdminLoggedIn(true);
                  setAdminPassword('');
                }
              }}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
            >
              <input
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin password"
                type="password"
                style={{ flex: '1 1 200px', border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }}
              />
              <button type="submit" style={{ border: 'none', background: '#0f172a', color: 'white', borderRadius: 8, padding: '10px 14px' }}>Login</button>
            </form>
          ) : (
            <form onSubmit={onSubmitProduct} style={{ display: 'grid', gap: 10 }}>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Model/Product name" style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }} />
              <input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="Price" type="number" style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }} />

              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as Category }))} style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }}>
                  <option value="Mobile">Mobile</option>
                  <option value="Accessories">Accessories</option>
                </select>

                <select value={form.condition} onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value as Condition }))} style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }}>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                </select>
              </div>

              {form.category === 'Mobile' ? (
                <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
                  <input value={form.storage} onChange={(e) => setForm((p) => ({ ...p, storage: e.target.value }))} placeholder="Storage e.g. 128GB" style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }} />
                  <input value={form.ram} onChange={(e) => setForm((p) => ({ ...p, ram: e.target.value }))} placeholder="RAM e.g. 8GB" style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }} />
                </div>
              ) : (
                <input value={form.accessoryType} onChange={(e) => setForm((p) => ({ ...p, accessoryType: e.target.value }))} placeholder="Accessory type e.g. Charger" style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }} />
              )}

              <input value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} placeholder="Photo URL" style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: 10 }} />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="submit" style={{ border: 'none', background: '#2563eb', color: 'white', borderRadius: 8, padding: '10px 14px' }}>{editingId ? 'Update Product' : 'Add Product'}</button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, padding: '10px 14px' }}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      )}
    </main>
  );
};

export default App;
