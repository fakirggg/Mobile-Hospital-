
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Category, Condition, Banner, User, UserRole, ShopInfo } from './types';
import { INITIAL_PRODUCTS, SHOP_DETAILS, INITIAL_BANNERS } from './constants';
import { PhoneIcon, MessageIcon, LocationIcon, PlusIcon, EditIcon, TrashIcon, SparklesIcon, UsersIcon, SettingsIcon, ShareIcon } from './components/Icons';
import { generateProductDescription } from './services/geminiService';

const App: React.FC = () => {
  // Persistence States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('shop_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem('shop_banners');
    return saved ? JSON.parse(saved) : INITIAL_BANNERS;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('shop_users');
    const defaultAdmin: User = { 
      id: 'admin-1', 
      name: 'Dealer Admin', 
      phoneNumber: '8167435566', 
      password: 'Hospital@3030', 
      role: 'admin' 
    };
    return saved ? JSON.parse(saved) : [defaultAdmin];
  });
  
  const [shopInfo, setShopInfo] = useState<ShopInfo>(() => {
    const saved = localStorage.getItem('shop_info');
    return saved ? JSON.parse(saved) : SHOP_DETAILS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('shop_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'admin-login' | 'none'>(() => {
    const savedUser = localStorage.getItem('shop_current_user');
    return savedUser ? 'none' : 'login';
  });

  const [activeTab, setActiveTab] = useState<Category | 'All'>('All');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showBannerAdminModal, setShowBannerAdminModal] = useState(false);
  const [showCustomerAdminModal, setShowCustomerAdminModal] = useState(false);
  const [showDealerSettingsModal, setShowDealerSettingsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [authFormData, setAuthFormData] = useState({ name: '', phoneNumber: '', password: '' });

  useEffect(() => {
    localStorage.setItem('shop_products', JSON.stringify(products));
    localStorage.setItem('shop_banners', JSON.stringify(banners));
    localStorage.setItem('shop_users', JSON.stringify(users));
    localStorage.setItem('shop_info', JSON.stringify(shopInfo));
    if (currentUser) {
      localStorage.setItem('shop_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('shop_current_user');
    }
  }, [products, banners, users, currentUser, shopInfo]);

  useEffect(() => {
    if (banners.length === 0) return;
    bannerTimerRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
  }, [banners]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesTab = activeTab === 'All' || p.category === activeTab;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [products, activeTab, searchQuery]);

  const validatePhone = (phone: string) => /^[6-9]\d{9}$/.test(phone);

  const handleShare = async () => {
    const shareData = {
      title: shopInfo.name,
      text: `Check out the latest second-hand mobiles and accessories at ${shopInfo.name}! Best prices guaranteed.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Website link copied to clipboard! Share it on WhatsApp.');
      }
    } catch (err) {
      console.log('Share failed:', err);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(authFormData.phoneNumber)) {
      alert('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (authMode === 'signup') {
      if (users.some(u => u.phoneNumber === authFormData.phoneNumber)) {
        alert('This phone number is already registered.');
        return;
      }
      const newUser: User = { id: Date.now().toString(), name: authFormData.name, phoneNumber: authFormData.phoneNumber, password: authFormData.password, role: 'customer' };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      setAuthMode('none');
    } else {
      const user = users.find(u => u.phoneNumber === authFormData.phoneNumber && u.password === authFormData.password);
      if (user) {
        if (authMode === 'admin-login' && user.role !== 'admin') {
          alert('This account does not have Dealer privileges.');
          return;
        }
        setCurrentUser(user);
        setAuthMode('none');
      } else {
        alert('Invalid Phone Number or Password');
      }
    }
    setAuthFormData({ name: '', phoneNumber: '', password: '' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
  };

  const handleUpdateDealer = (updatedDealer: User, updatedShopInfo: ShopInfo) => {
    setUsers(users.map(u => u.role === 'admin' ? updatedDealer : u));
    setCurrentUser(updatedDealer);
    setShopInfo(updatedShopInfo);
    setShowDealerSettingsModal(false);
    alert('Dealer settings updated!');
  };

  const handleAddOrEdit = (product: Product) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === product.id ? product : p));
    } else {
      setProducts([{ ...product, id: Date.now().toString(), createdAt: Date.now() }, ...products]);
    }
    setShowAdminModal(false);
    setEditingProduct(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleEditClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditingProduct(product);
    setShowAdminModal(true);
  };

  const openWhatsApp = (e?: React.MouseEvent, productName?: string) => {
    if (e) e.stopPropagation();
    const text = productName 
      ? `Hello, I'm interested in "${productName}" at ${shopInfo.name}.` 
      : `Hello, I'm interested in products at ${shopInfo.name}.`;
    window.open(`https://wa.me/${shopInfo.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const makeCall = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    window.location.href = `tel:${shopInfo.phone}`;
  };

  if (authMode !== 'none') {
    return (
      <div className="min-h-screen bg-[#2874f0] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-[#2874f0] p-8 text-white text-center">
            <h1 className="text-3xl font-black italic tracking-tighter mb-4">{shopInfo.name.toUpperCase()}</h1>
            <h2 className="text-xl font-bold uppercase tracking-wide">
              {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Join Us' : 'Admin Portal'}
            </h2>
          </div>
          <form onSubmit={handleAuth} className="p-8 space-y-4">
            {authMode === 'signup' && (
              <input type="text" required placeholder="Full Name" className="w-full border-b border-gray-300 py-3 focus:border-[#2874f0] outline-none text-sm" value={authFormData.name} onChange={e => setAuthFormData({ ...authFormData, name: e.target.value })} />
            )}
            <div className="relative">
              <span className="absolute left-0 bottom-3 text-sm text-gray-500 font-medium">+91</span>
              <input type="tel" required maxLength={10} placeholder="Phone Number" className="w-full border-b border-gray-300 py-3 pl-8 focus:border-[#2874f0] outline-none text-sm" value={authFormData.phoneNumber} onChange={e => setAuthFormData({ ...authFormData, phoneNumber: e.target.value.replace(/\D/g, '') })} />
            </div>
            <input type="password" required placeholder="Password" className="w-full border-b border-gray-300 py-3 focus:border-[#2874f0] outline-none text-sm" value={authFormData.password} onChange={e => setAuthFormData({ ...authFormData, password: e.target.value })} />
            <button type="submit" className="w-full bg-[#fb641b] text-white py-3 font-bold uppercase shadow-md hover:bg-[#e6550e] transition-colors">{authMode === 'signup' ? 'Continue' : 'Login'}</button>
            <div className="flex flex-col gap-2 pt-4 text-center">
              {authMode === 'login' ? (
                <>
                  <button type="button" onClick={() => setAuthMode('signup')} className="text-[#2874f0] text-sm font-medium hover:underline">New here? Create account</button>
                  <button type="button" onClick={() => setAuthMode('admin-login')} className="text-gray-500 text-xs font-medium hover:underline">Dealer Admin Portal</button>
                </>
              ) : (
                <button type="button" onClick={() => setAuthMode('login')} className="text-[#2874f0] text-sm font-medium hover:underline">Back to Login</button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] pb-24">
      <header className="bg-[#2874f0] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black italic tracking-tighter leading-none">{shopInfo.name.toUpperCase()}</h1>
              <div className="h-[2px] w-12 bg-yellow-400 mt-1 rounded-full"></div>
            </div>
            <div className="flex gap-3 items-center">
              <button 
                onClick={handleShare}
                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all animate-pulse-small"
                title="Share Website"
              >
                <ShareIcon />
              </button>
              <div className="h-8 w-[1px] bg-white/20"></div>
              {currentUser && (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-[9px] font-bold text-yellow-300 uppercase">{currentUser.role}</p>
                    <p className="text-xs font-medium truncate max-w-[80px]">{currentUser.name}</p>
                  </div>
                  <button onClick={handleLogout} className="text-[10px] font-bold border border-white/40 px-3 py-1 rounded-sm uppercase">Logout</button>
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 rounded-sm text-gray-800 focus:outline-none text-sm" />
            <div className="absolute right-3 top-2 text-[#2874f0]"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-[110px] z-30">
        <div className="max-w-4xl mx-auto flex px-4">
          {['All', 'Mobile', 'Accessories'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-[#2874f0] text-[#2874f0]' : 'border-transparent text-gray-400'}`}>{tab}</button>
          ))}
        </div>
      </nav>

      {banners.length > 0 && (
        <div className="bg-white py-3">
          <div className="max-w-4xl mx-auto px-4">
            <div className="relative h-36 rounded-lg overflow-hidden shadow-md">
              {banners.map((banner, index) => (
                <div key={banner.id} className={`absolute inset-0 transition-all duration-700 ${banner.bg} flex items-center p-6 text-white`} style={{ transform: `translateX(${(index - currentBanner) * 100}%)`, opacity: currentBanner === index ? 1 : 0 }}>
                  <div className="flex-1">
                    <span className="bg-black/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase mb-1 inline-block">{banner.tag}</span>
                    <h2 className="text-lg font-bold line-clamp-1">{banner.title}</h2>
                    <p className="text-xs opacity-80 line-clamp-1">{banner.subtitle}</p>
                  </div>
                  <div className="w-1/3 opacity-20"><img src={banner.image} className="w-full h-full object-cover" /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-gray-200">
          {filteredProducts.map((product) => (
            <div key={product.id} onClick={() => setSelectedProduct(product)} className="bg-white p-4 flex gap-4 cursor-pointer hover:bg-gray-50">
              <div className="w-28 h-28 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-sm p-2">
                <img src={product.image} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium line-clamp-2">{product.name}</h3>
                <div className="flex items-center gap-2 my-1">
                  <span className="bg-green-600 text-white text-[10px] font-bold px-1 rounded-sm">4.5 ★</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{product.condition}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">₹{product.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 line-through">₹{(product.price * 1.5).toLocaleString()}</span>
                </div>
                {currentUser?.role === 'admin' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={(e) => handleEditClick(e, product)} className="p-1.5 bg-blue-50 text-blue-600 rounded"><EditIcon /></button>
                    <button onClick={(e) => handleDelete(e, product.id)} className="p-1.5 bg-red-50 text-red-600 rounded"><TrashIcon /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-4 mt-6 mb-20 text-center">
        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
          <h2 className="text-sm font-bold uppercase mb-2">Visit Our Shop</h2>
          <p className="text-xs text-gray-500 mb-4">{shopInfo.address}</p>
          <div className="flex gap-2">
            <a href={shopInfo.googleMapUrl} target="_blank" className="flex-1 bg-[#2874f0] text-white py-2.5 text-[10px] font-bold uppercase rounded-sm">Google Maps</a>
            <button onClick={handleShare} className="flex-1 border border-gray-300 py-2.5 text-[10px] font-bold uppercase rounded-sm flex items-center justify-center gap-2"><ShareIcon /> Share Shop</button>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex p-3 gap-3 z-50 max-w-4xl mx-auto shadow-2xl">
        <button onClick={() => openWhatsApp()} className="flex-1 border border-gray-300 py-3 rounded-sm font-bold text-xs uppercase flex items-center justify-center gap-2"><MessageIcon /> WhatsApp</button>
        <button onClick={() => makeCall()} className="flex-1 bg-[#fb641b] text-white py-3 rounded-sm font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-md"><PhoneIcon /> Call Now</button>
      </div>

      {currentUser?.role === 'admin' && (
        <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-50">
          <button onClick={() => setShowDealerSettingsModal(true)} className="bg-gray-800 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center"><SettingsIcon /></button>
          <button onClick={() => setShowCustomerAdminModal(true)} className="bg-emerald-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center"><UsersIcon /></button>
          <button onClick={() => { setEditingProduct(null); setShowAdminModal(true); }} className="bg-[#2874f0] text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center"><PlusIcon /></button>
        </div>
      )}

      {selectedProduct && <ProductDetailsModal product={selectedProduct} shopInfo={shopInfo} onClose={() => setSelectedProduct(null)} onContactWhatsApp={openWhatsApp} onContactCall={makeCall} />}
      {showAdminModal && <AdminModal product={editingProduct} onClose={() => setShowAdminModal(false)} onSave={handleAddOrEdit} />}
      {showDealerSettingsModal && <DealerSettingsModal dealer={currentUser as User} shopInfo={shopInfo} onClose={() => setShowDealerSettingsModal(false)} onSave={handleUpdateDealer} />}
      {showCustomerAdminModal && <CustomerAdminModal users={users.filter(u => u.role === 'customer')} onClose={() => setShowCustomerAdminModal(false)} onDeleteUser={(id) => setUsers(users.filter(u => u.id !== id))} />}
    </div>
  );
};

// Re-using simplified versions of sub-components to keep code clean
const ProductDetailsModal = ({ product, shopInfo, onClose, onContactWhatsApp, onContactCall }: any) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="bg-white w-full max-w-lg rounded-t-xl sm:rounded-sm overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b flex justify-between items-center bg-[#2874f0] text-white">
        <h2 className="text-xs font-bold uppercase tracking-widest">Product Info</h2>
        <button onClick={onClose} className="p-2">✕</button>
      </div>
      <div className="overflow-y-auto p-6 space-y-6">
        <div className="flex justify-center"><img src={product.image} className="max-h-60 object-contain" /></div>
        <div>
          <h2 className="text-lg font-bold leading-tight">{product.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-black">₹{product.price.toLocaleString()}</span>
            <span className="text-green-600 font-bold text-sm">{product.condition} Condition</span>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-sm italic text-sm text-gray-600 border-l-4 border-[#2874f0]">{product.description}</div>
      </div>
      <div className="p-4 border-t flex gap-3">
        <button onClick={() => onContactWhatsApp(undefined, product.name)} className="flex-1 border py-3 rounded-sm font-bold text-xs uppercase">WhatsApp</button>
        <button onClick={() => onContactCall()} className="flex-1 bg-[#fb641b] text-white py-3 rounded-sm font-bold text-xs uppercase shadow-md">Call Store</button>
      </div>
    </div>
  </div>
);

const AdminModal = ({ product, onClose, onSave }: any) => {
  const [formData, setFormData] = useState(product || { name: '', price: 0, condition: 'Good', category: 'Mobile', description: '', image: 'https://picsum.photos/400/300' });
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="bg-white w-full max-w-md rounded-sm p-6 space-y-4">
        <h2 className="font-bold uppercase text-sm border-b pb-2">Listing Manager</h2>
        <input type="text" required placeholder="Product Name" className="w-full border-b py-2 text-sm outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <input type="number" required placeholder="Price" className="w-full border-b py-2 text-sm outline-none" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} />
        <select className="w-full border-b py-2 text-sm outline-none bg-transparent" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
          <option>Like New</option><option>Good</option><option>Average</option>
        </select>
        <textarea placeholder="Description..." className="w-full border p-2 text-sm rounded outline-none h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-green-600 text-white py-3 font-bold text-xs uppercase rounded shadow">Save</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-3 font-bold text-xs uppercase rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
};

const DealerSettingsModal = ({ dealer, shopInfo, onClose, onSave }: any) => {
  const [dData, setDData] = useState({...dealer});
  const [sData, setSData] = useState({...shopInfo});
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-sm p-6 overflow-y-auto max-h-[90vh] space-y-4">
        <h2 className="font-bold uppercase text-sm border-b pb-2">Shop Settings</h2>
        <input type="text" placeholder="Shop Name" className="w-full border-b py-2 text-sm outline-none" value={sData.name} onChange={e => setSData({...sData, name: e.target.value})} />
        <textarea placeholder="Shop Address" className="w-full border p-2 text-sm rounded outline-none h-20" value={sData.address} onChange={e => setSData({...sData, address: e.target.value})} />
        <input type="text" placeholder="WhatsApp Number" className="w-full border-b py-2 text-sm outline-none" value={sData.whatsapp} onChange={e => setSData({...sData, whatsapp: e.target.value})} />
        <div className="flex gap-2">
          <button onClick={() => onSave(dData, sData)} className="flex-1 bg-orange-600 text-white py-3 font-bold text-xs uppercase rounded">Update All</button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-3 font-bold text-xs uppercase rounded">Close</button>
        </div>
      </div>
    </div>
  );
};

const CustomerAdminModal = ({ users, onClose, onDeleteUser }: any) => (
  <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-md rounded-sm p-6 max-h-[80vh] flex flex-col">
      <h2 className="font-bold uppercase text-sm border-b pb-2 mb-4">Customer Database</h2>
      <div className="overflow-y-auto flex-1 space-y-2">
        {users.map((u: any) => (
          <div key={u.id} className="p-3 bg-gray-50 flex justify-between items-center rounded">
            <div><p className="text-sm font-bold">{u.name}</p><p className="text-xs text-gray-500">{u.phoneNumber}</p></div>
            <button onClick={() => onDeleteUser(u.id)} className="text-red-500 p-1"><TrashIcon /></button>
          </div>
        ))}
      </div>
      <button onClick={onClose} className="mt-4 w-full bg-gray-800 text-white py-2 text-xs font-bold uppercase rounded">Close</button>
    </div>
  </div>
);

export default App;
