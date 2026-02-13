
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Category, Condition, Banner, User, UserRole, ShopInfo } from './types';
import { INITIAL_PRODUCTS, SHOP_DETAILS, INITIAL_BANNERS } from './constants';
import { PhoneIcon, MessageIcon, LocationIcon, PlusIcon, EditIcon, TrashIcon, SparklesIcon, UsersIcon, SettingsIcon, ShareIcon, BackIcon, BannerIcon, ShopLogo } from './components/Icons';
import { generateProductDescription } from './services/geminiService';

const LiveClock: React.FC = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="flex flex-col items-end mr-2">
      <div className="text-[10px] font-mono font-bold text-yellow-300">
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-[8px] opacity-70 font-bold uppercase tracking-tighter">
        {now.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
};

type AuthMode = 'login' | 'signup' | 'admin-login' | 'none';

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
      role: 'admin',
      createdAt: Date.now()
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

  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    const savedUser = localStorage.getItem('shop_current_user');
    return savedUser ? 'none' : 'login';
  });

  // Auth States
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.phoneNumber === authFormData.phoneNumber && u.password === authFormData.password);
    if (user) {
      setCurrentUser(user);
      setAuthMode('none');
    } else {
      alert('Galat number ya password! Kripya sahi jaankari bharein.');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.phoneNumber === authFormData.phoneNumber)) {
      alert('Yeh number pehle se registered hai. Kripya login karein.');
      setAuthMode('login');
      return;
    }
    const newUser: User = { 
      id: Date.now().toString(), 
      name: authFormData.name, 
      phoneNumber: authFormData.phoneNumber, 
      password: authFormData.password, 
      role: 'customer',
      createdAt: Date.now()
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setAuthMode('none');
    alert('Account ban gaya hai! Swagat hai.');
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = users.find(u => u.role === 'admin' && u.phoneNumber === authFormData.phoneNumber && u.password === authFormData.password);
    if (admin) {
      setCurrentUser(admin);
      setAuthMode('none');
    } else {
      alert('Admin login galat hai.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
    setAuthFormData({ name: '', phoneNumber: '', password: '' });
  };

  const [activeTab, setActiveTab] = useState<Category | 'All'>('All');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCustomerAdminModal, setShowCustomerAdminModal] = useState(false);
  const [showDealerSettingsModal, setShowDealerSettingsModal] = useState(false);
  const [showBannerManagerModal, setShowBannerManagerModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (banners.length === 0) return;
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    bannerTimerRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => {
      if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    };
  }, [banners.length]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesTab = activeTab === 'All' || p.category === activeTab;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [products, activeTab, searchQuery]);

  const handleShare = async () => {
    const shareData = {
      title: shopInfo.name,
      text: `Check out the latest second-hand mobiles at ${shopInfo.name}!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copy ho gaya!');
      }
    } catch (err) {}
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
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-[#2874f0] p-8 text-white text-center">
            <div className="flex justify-center mb-4"><ShopLogo className="h-16 w-auto" /></div>
            <h1 className="text-3xl font-black italic tracking-tighter mb-2">{shopInfo.name.toUpperCase()}</h1>
            <p className="text-xs opacity-75 uppercase tracking-widest font-bold">
              {authMode === 'login' ? 'Login' : authMode === 'signup' ? 'Create Account' : 'Dealer Portal'}
            </p>
          </div>
          
          <div className="p-8">
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <span className="absolute left-0 bottom-3 text-sm text-gray-500 font-bold">+91</span>
                  <input type="tel" required maxLength={10} placeholder="Mobile Number" className="w-full border-b-2 border-gray-100 py-3 pl-9 focus:border-[#2874f0] outline-none text-sm transition-colors" value={authFormData.phoneNumber} onChange={e => setAuthFormData({ ...authFormData, phoneNumber: e.target.value.replace(/\D/g, '') })} />
                </div>
                <input type="password" required placeholder="Password" className="w-full border-b-2 border-gray-100 py-3 focus:border-[#2874f0] outline-none text-sm" value={authFormData.password} onChange={e => setAuthFormData({ ...authFormData, password: e.target.value })} />
                <button type="submit" className="w-full bg-[#fb641b] text-white py-4 rounded-xl font-bold uppercase shadow-lg shadow-orange-500/30 hover:bg-[#e6550e] transition-all">Login</button>
                <div className="flex flex-col gap-3 pt-4 text-center">
                  <button type="button" onClick={() => setAuthMode('signup')} className="text-[#2874f0] text-sm font-bold hover:underline">New here? Sign Up Now</button>
                  <button type="button" onClick={() => setAuthMode('admin-login')} className="mt-4 text-[10px] text-gray-300 font-bold uppercase tracking-widest">Dealer Login</button>
                </div>
              </form>
            )}

            {authMode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <input type="text" required placeholder="Full Name" className="w-full border-b-2 border-gray-100 py-3 focus:border-[#2874f0] outline-none text-sm" value={authFormData.name} onChange={e => setAuthFormData({ ...authFormData, name: e.target.value })} />
                <div className="relative">
                  <span className="absolute left-0 bottom-3 text-sm text-gray-500 font-bold">+91</span>
                  <input type="tel" required maxLength={10} placeholder="Mobile Number" className="w-full border-b-2 border-gray-100 py-3 pl-9 focus:border-[#2874f0] outline-none text-sm" value={authFormData.phoneNumber} onChange={e => setAuthFormData({ ...authFormData, phoneNumber: e.target.value.replace(/\D/g, '') })} />
                </div>
                <input type="password" required placeholder="Set Password" lg:placeholder="Min 4 chars" className="w-full border-b-2 border-gray-100 py-3 focus:border-[#2874f0] outline-none text-sm" value={authFormData.password} onChange={e => setAuthFormData({ ...authFormData, password: e.target.value })} />
                <button type="submit" className="w-full bg-[#fb641b] text-white py-4 rounded-xl font-bold uppercase shadow-lg shadow-orange-500/30">Sign Up</button>
                <button type="button" onClick={() => setAuthMode('login')} className="w-full text-[#2874f0] text-sm font-bold hover:underline mt-4">Already have an account? Login</button>
              </form>
            )}

            {authMode === 'admin-login' && (
              <form onSubmit={handleAdminAuth} className="space-y-4">
                <div className="relative">
                  <span className="absolute left-0 bottom-3 text-sm text-gray-500 font-bold">+91</span>
                  <input type="tel" required maxLength={10} placeholder="Admin Mobile" className="w-full border-b-2 border-gray-100 py-3 pl-9 focus:border-[#2874f0] outline-none text-sm" value={authFormData.phoneNumber} onChange={e => setAuthFormData({ ...authFormData, phoneNumber: e.target.value.replace(/\D/g, '') })} />
                </div>
                <input type="password" required placeholder="Admin Password" className="w-full border-b-2 border-gray-100 py-3 focus:border-[#2874f0] outline-none text-sm" value={authFormData.password} onChange={e => setAuthFormData({ ...authFormData, password: e.target.value })} />
                <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold uppercase shadow-lg">Login as Dealer</button>
                <button type="button" onClick={() => setAuthMode('login')} className="w-full text-gray-400 text-sm font-medium hover:underline mt-2">Go back to Customer Login</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] pb-24 text-left">
      <header className="bg-[#2874f0] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <ShopLogo className="h-8 w-auto invert brightness-0" />
              <div className="flex flex-col">
                <h1 className="text-xl font-black italic tracking-tighter leading-none">{shopInfo.name.toUpperCase()}</h1>
                <div className="h-[2px] w-8 bg-yellow-400 mt-1 rounded-full"></div>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              {currentUser?.role === 'admin' && <LiveClock />}
              <button onClick={handleShare} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all" title="Share Website">
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
            <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 rounded-sm text-gray-800 focus:outline-none text-sm shadow-inner" />
            <div className="absolute right-3 top-2 text-[#2874f0] opacity-50"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div>
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
            <div className="relative h-36 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/10">
              {banners.map((banner, index) => (
                <div key={banner.id} className={`absolute inset-0 transition-all duration-700 ${banner.bg} flex items-center p-6 text-white`} style={{ transform: `translateX(${(index - currentBanner) * 100}%)`, opacity: currentBanner === index ? 1 : 0 }}>
                  <div className="flex-1 z-10">
                    <span className="bg-black/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase mb-1 inline-block">{banner.tag}</span>
                    <h2 className="text-lg font-bold line-clamp-1">{banner.title}</h2>
                    <p className="text-xs opacity-80 line-clamp-1">{banner.subtitle}</p>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden flex items-center justify-center opacity-40">
                    <img src={banner.image} className="h-full w-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-gray-100">
          {filteredProducts.map((product) => (
            <div key={product.id} onClick={() => setSelectedProduct(product)} className="bg-white p-4 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="w-28 h-28 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-xl p-2 border border-gray-50 overflow-hidden">
                <img src={product.image} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">{product.name}</h3>
                <div className="flex items-center gap-2 my-1">
                  <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">4.5 ★</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{product.condition}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1 mb-1">
                   {product.specs.ram && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">{product.specs.ram} RAM</span>}
                   {product.specs.storage && <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold">{product.specs.storage} ROM</span>}
                </div>
                <div className="flex items-baseline gap-2 mt-auto">
                  <span className="text-lg font-black text-[#2874f0]">₹{product.price.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 line-through">₹{(product.price * 1.5).toLocaleString()}</span>
                </div>
                {currentUser?.role === 'admin' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={(e) => { e.stopPropagation(); setEditingProduct(product); setShowAdminModal(true); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><EditIcon /></button>
                    <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) setProducts(products.filter(p => p.id !== product.id)); }} className="p-2 bg-red-50 text-red-600 rounded-lg"><TrashIcon /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-4 mt-6 mb-20 text-center">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Store Location</h2>
          <p className="text-sm font-medium text-gray-700 mb-4 leading-relaxed">{shopInfo.address}</p>
          <div className="flex gap-3">
            <a href={shopInfo.googleMapUrl} target="_blank" className="flex-1 bg-[#2874f0] text-white py-3 text-[10px] font-bold uppercase rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"><LocationIcon /> Google Maps</a>
            <button onClick={handleShare} className="flex-1 border border-gray-100 py-3 text-[10px] font-bold uppercase rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50"><ShareIcon /> Share Shop</button>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 flex p-4 gap-3 z-50 max-w-4xl mx-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={() => openWhatsApp()} className="flex-1 border-2 border-gray-100 py-3.5 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 text-gray-700"><MessageIcon /> WhatsApp</button>
        <button onClick={() => makeCall()} className="flex-1 bg-[#fb641b] text-white py-3.5 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30"><PhoneIcon /> Call Store</button>
      </div>

      {currentUser?.role === 'admin' && (
        <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-50">
          <button onClick={() => setShowDealerSettingsModal(true)} className="bg-gray-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><SettingsIcon /></button>
          <button onClick={() => setShowBannerManagerModal(true)} className="bg-orange-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><BannerIcon /></button>
          <button onClick={() => setShowCustomerAdminModal(true)} className="bg-emerald-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><UsersIcon /></button>
          <button onClick={() => { setEditingProduct(null); setShowAdminModal(true); }} className="bg-[#2874f0] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><PlusIcon /></button>
        </div>
      )}

      {selectedProduct && <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onContactWhatsApp={openWhatsApp} onContactCall={makeCall} />}
      {showAdminModal && <AdminModal product={editingProduct} onClose={() => { setShowAdminModal(false); setEditingProduct(null); }} onSave={(p: Product) => {
        if(editingProduct) setProducts(products.map(pr => pr.id === p.id ? p : pr));
        else setProducts([{ ...p, id: Date.now().toString(), createdAt: Date.now() }, ...products]);
        setShowAdminModal(false);
      }} />}
      {showDealerSettingsModal && <DealerSettingsModal dealer={currentUser} shopInfo={shopInfo} onClose={() => setShowDealerSettingsModal(false)} onSave={(u: User, s: ShopInfo) => {
        setUsers(users.map(user => user.role === 'admin' ? u : user));
        setShopInfo(s);
        setCurrentUser(u);
        setShowDealerSettingsModal(false);
      }} />}
      {showCustomerAdminModal && <CustomerAdminModal users={users.filter(u => u.role === 'customer')} onClose={() => setShowCustomerAdminModal(false)} onDeleteUser={(id: string) => setUsers(users.filter(u => u.id !== id))} />}
      {showBannerManagerModal && <BannerManagerModal currentBanners={banners} onClose={() => setShowBannerManagerModal(false)} onSave={(b: Banner[]) => { setBanners(b); setShowBannerManagerModal(false); }} />}
    </div>
  );
};

const ProductDetailsModal = ({ product, onClose, onContactWhatsApp, onContactCall }: any) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl text-left">
      <div className="p-5 border-b flex items-center bg-[#2874f0] text-white gap-3">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center">
          <BackIcon />
        </button>
        <h2 className="text-xs font-black uppercase tracking-[3px] flex-1 text-center">Product Information</h2>
        <div className="w-8"></div>
      </div>
      <div className="overflow-y-auto p-6 space-y-8 no-scrollbar">
        <div className="flex justify-center bg-gray-50 rounded-2xl p-6 ring-1 ring-black/5">
          <img src={product.image} className="max-h-64 object-contain drop-shadow-2xl" />
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900 leading-tight">{product.name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-3xl font-black text-[#2874f0]">₹{product.price.toLocaleString()}</span>
            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-black text-[10px] uppercase border border-green-100">{product.condition}</span>
            {product.specs.ram && <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black text-[10px] uppercase border border-blue-100">{product.specs.ram} RAM</span>}
            {product.specs.storage && <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-black text-[10px] uppercase border border-purple-100">{product.specs.storage} ROM</span>}
          </div>
          <div className="p-5 bg-gray-50 rounded-2xl italic text-sm text-gray-600 border-l-4 border-[#2874f0] leading-relaxed shadow-inner">
            {product.description}
          </div>
        </div>
      </div>
      <div className="p-5 border-t bg-gray-50/50 flex gap-3">
        <button onClick={() => onContactWhatsApp(undefined, product.name)} className="flex-1 border-2 border-gray-100 bg-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2"><MessageIcon /> WhatsApp</button>
        <button onClick={() => onContactCall()} className="flex-1 bg-[#fb641b] text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2"><PhoneIcon /> Call Store</button>
      </div>
    </div>
  </div>
);

const AdminModal = ({ product, onClose, onSave }: any) => {
  const [formData, setFormData] = useState<Product>(product || { id: '', name: '', price: 0, condition: 'Good', category: 'Mobile', description: '', specs: { ram: '', storage: '' }, image: 'https://images.unsplash.com/photo-1556656793-062ff987b50c?q=80&w=400', createdAt: Date.now() });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiDescription = async () => {
    if (!formData.name) return alert("Pehle naam likhein.");
    setIsGenerating(true);
    const desc = await generateProductDescription(formData.name, formData.condition, formData.category);
    setFormData({ ...formData, description: desc });
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-[100] flex items-center justify-center p-4">
      <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="bg-white w-full max-w-md rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto text-left">
        <h2 className="font-black uppercase text-xs tracking-widest text-gray-400 border-b pb-4 flex justify-between items-center">
          {product ? 'Update Inventory' : 'Add New Item'}
          <button type="button" onClick={onClose} className="text-gray-400 p-2">✕</button>
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl">
            <div className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative bg-white">
                {formData.image ? <img src={formData.image} className="w-full h-full object-contain" /> : <PlusIcon />}
                <input type="file" accept="image/*" onChange={e => {
                  const f = e.target.files?.[0];
                  if(f) {
                    const r = new FileReader();
                    r.onloadend = () => setFormData({...formData, image: r.result as string});
                    r.readAsDataURL(f);
                  }
                }} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase leading-snug">Tap to upload<br/>product photo</p>
          </div>
          <input type="text" required placeholder="Product Name (e.g. iPhone 14)" className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <div className="flex gap-4">
            <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Price</label><input type="number" required className="w-full border-b-2 border-gray-100 py-2 text-sm outline-none" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})} /></div>
            <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Category</label><select className="w-full border-b-2 border-gray-100 py-2 text-sm outline-none bg-transparent" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}><option>Mobile</option><option>Accessories</option></select></div>
          </div>
          
          {formData.category === 'Mobile' && (
            <div className="flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">RAM</label><input type="text" placeholder="e.g. 8GB" className="w-full border-b-2 border-gray-100 py-2 text-sm outline-none" value={formData.specs.ram || ''} onChange={e => setFormData({...formData, specs: {...formData.specs, ram: e.target.value}})} /></div>
               <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Storage (ROM)</label><input type="text" placeholder="e.g. 256GB" className="w-full border-b-2 border-gray-100 py-2 text-sm outline-none" value={formData.specs.storage || ''} onChange={e => setFormData({...formData, specs: {...formData.specs, storage: e.target.value}})} /></div>
            </div>
          )}

          <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Condition</label><select className="w-full border-b-2 border-gray-100 py-2 text-sm outline-none bg-transparent" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as any})}><option>Like New</option><option>Good</option><option>Average</option></select></div>

          <div className="relative">
            <div className="flex justify-between mb-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">About Product</label>
              <button type="button" onClick={handleAiDescription} disabled={isGenerating} className="text-[#2874f0] text-[10px] font-bold flex items-center gap-1"><SparklesIcon /> {isGenerating ? 'AI Writing...' : 'AI Auto-Write'}</button>
            </div>
            <textarea className="w-full border-2 border-gray-50 rounded-xl p-3 text-sm outline-none h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
        </div>
        <button type="submit" className="w-full bg-[#2874f0] text-white py-4 rounded-xl font-bold uppercase shadow-xl shadow-blue-500/20">Save to Inventory</button>
      </form>
    </div>
  );
};

const DealerSettingsModal = ({ shopInfo, onClose, onSave, dealer }: any) => {
  const [s, setS] = useState({...shopInfo});
  const [d, setD] = useState({...dealer});
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto">
        <h2 className="font-black uppercase text-xs tracking-widest text-gray-400 border-b pb-4 flex justify-between items-center">Shop Dashboard <button onClick={onClose} className="p-2">✕</button></h2>
        <div className="space-y-4">
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Shop Name</label><input type="text" className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none" value={s.name} onChange={e => setS({...s, name: e.target.value})} /></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Full Address</label><textarea className="w-full border-2 border-gray-50 rounded-xl p-3 text-sm outline-none h-20" value={s.address} onChange={e => setS({...s, address: e.target.value})} /></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Google Maps URL</label><input type="text" placeholder="https://www.google.com/maps/..." className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none" value={s.googleMapUrl} onChange={e => setS({...s, googleMapUrl: e.target.value})} /></div>
          <div className="flex gap-4">
            <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp (With Country Code)</label><input type="text" className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none" value={s.whatsapp} onChange={e => setS({...s, whatsapp: e.target.value})} /></div>
          </div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Calling Number</label><input type="text" className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none" value={s.phone} onChange={e => setS({...s, phone: e.target.value})} /></div>
          <div><label className="text-[10px] font-bold text-gray-400 uppercase">Change Admin Password</label><input type="password" placeholder="New Password" className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none" value={d.password} onChange={e => setD({...d, password: e.target.value})} /></div>
        </div>
        <button onClick={() => onSave(d, s)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold uppercase shadow-xl shadow-black/20">Update Dashboard</button>
      </div>
    </div>
  );
};

const CustomerAdminModal = ({ users, onClose, onDeleteUser }: any) => {
  const formatDate = (ts?: number) => ts ? new Date(ts).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Unknown';
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 flex flex-col max-h-[80vh] text-left">
        <h2 className="font-black uppercase text-xs tracking-widest text-gray-400 border-b pb-4 flex justify-between items-center">Customer Database <button onClick={onClose} className="p-2">✕</button></h2>
        <div className="overflow-y-auto flex-1 py-4 space-y-3 no-scrollbar">
          {users.map((u: any) => (
            <div key={u.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center ring-1 ring-black/5">
              <div>
                <p className="text-sm font-bold text-gray-800">{u.name}</p>
                <p className="text-xs text-[#2874f0] font-bold">{u.phoneNumber}</p>
                <p className="text-[9px] text-gray-400 font-mono mt-1">Join: {formatDate(u.createdAt)}</p>
              </div>
              <button onClick={() => { if(confirm('Delete user?')) onDeleteUser(u.id); }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><TrashIcon /></button>
            </div>
          ))}
          {users.length === 0 && <p className="text-center py-10 text-xs text-gray-400 italic">No customers yet.</p>}
        </div>
        <button onClick={onClose} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold uppercase">Back to Dashboard</button>
      </div>
    </div>
  );
};

const BannerManagerModal = ({ currentBanners, onClose, onSave }: any) => {
  const [b, setB] = useState<Banner[]>(currentBanners);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [bannerForm, setBannerForm] = useState<Banner>({ id: '', title: '', subtitle: '', bg: 'bg-gradient-to-r from-blue-700 to-indigo-800', image: '', tag: 'OFFER' });

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setBannerForm(b[index]);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.image) return alert("Kripya banner ke liye photo upload karein.");
    const newList = [...b];
    if (editingIndex !== null) {
      newList[editingIndex] = bannerForm;
    } else {
      newList.push({ ...bannerForm, id: Date.now().toString() });
    }
    setB(newList);
    setEditingIndex(null);
    setBannerForm({ id: '', title: '', subtitle: '', bg: 'bg-gradient-to-r from-blue-700 to-indigo-800', image: '', tag: 'OFFER' });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onloadend = () => setBannerForm({...bannerForm, image: r.result as string});
      r.readAsDataURL(f);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl p-6 space-y-5 text-left flex flex-col max-h-[90vh]">
        <h2 className="font-black uppercase text-xs tracking-widest text-gray-400 border-b pb-4 flex justify-between items-center">Banner Ads Manager <button onClick={onClose} className="p-2">✕</button></h2>
        
        <form onSubmit={handleSaveForm} className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100">
           <p className="text-[10px] font-bold text-[#2874f0] uppercase tracking-widest">{editingIndex !== null ? 'Edit Banner' : 'Add New Banner'}</p>
           
           <div className="flex gap-4 items-start">
             <div className="w-24 h-16 bg-white border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative shrink-0">
               {bannerForm.image ? (
                 <img src={bannerForm.image} className="w-full h-full object-cover" />
               ) : (
                 <PlusIcon />
               )}
               <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
             <div className="flex-1 grid grid-cols-1 gap-2">
                <input type="text" placeholder="Offer Title (e.g. Festival Dhamaka)" required className="w-full border-b text-xs py-1.5 outline-none bg-transparent font-bold" value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} />
                <input type="text" placeholder="Short Subtitle" required className="w-full border-b text-[10px] py-1 outline-none bg-transparent" value={bannerForm.subtitle} onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})} />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase">Banner Tag</label>
                <input type="text" placeholder="e.g. FLAT 50% OFF" className="w-full border-b text-xs py-1.5 outline-none bg-transparent" value={bannerForm.tag} onChange={e => setBannerForm({...bannerForm, tag: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase">Color Theme</label>
                <select className="w-full border-b text-xs py-1.5 outline-none bg-transparent" value={bannerForm.bg} onChange={e => setBannerForm({...bannerForm, bg: e.target.value})}>
                  <option value="bg-gradient-to-r from-blue-700 to-indigo-800">Blue Gradient</option>
                  <option value="bg-gradient-to-r from-orange-500 to-red-600">Orange Gradient</option>
                  <option value="bg-gradient-to-r from-emerald-600 to-teal-700">Green Gradient</option>
                  <option value="bg-gray-900">Solid Black</option>
                  <option value="bg-purple-600">Solid Purple</option>
                </select>
              </div>
           </div>

           <div className="flex gap-2 pt-2">
              <button type="submit" className="bg-[#2874f0] text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase shadow-lg shadow-blue-500/20">{editingIndex !== null ? 'Update Banner' : 'Add to Slider'}</button>
              {editingIndex !== null && <button type="button" onClick={() => { setEditingIndex(null); setBannerForm({ id: '', title: '', subtitle: '', bg: 'bg-gradient-to-r from-blue-700 to-indigo-800', image: '', tag: 'OFFER' }); }} className="text-gray-400 text-[10px] font-bold uppercase p-2">Cancel</button>}
           </div>
        </form>

        <div className="space-y-2 overflow-y-auto flex-1 no-scrollbar pt-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Slider Banners</p>
          {b.map((banner, i) => (
            <div key={banner.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-3 hover:ring-1 ring-[#2874f0]/20 transition-all group">
              <div className={`w-14 h-10 rounded-lg ${banner.bg} shrink-0 overflow-hidden`}>
                <img src={banner.image} className="w-full h-full object-cover opacity-60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black truncate">{banner.title}</p>
                <p className="text-[9px] text-gray-400 truncate uppercase tracking-tighter">{banner.tag}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(i)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><EditIcon /></button>
                <button onClick={() => { if(confirm('Delete banner?')) setB(b.filter((_, idx) => idx !== i)); }} className="p-2 text-red-500 bg-red-50 rounded-lg"><TrashIcon /></button>
              </div>
            </div>
          ))}
          {b.length === 0 && <p className="text-center py-6 text-[10px] text-gray-400 italic">No banners active. Upload your first offer banner above.</p>}
        </div>
        
        <button onClick={() => onSave(b)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold uppercase mt-2 shadow-2xl">Apply Slider Changes</button>
      </div>
    </div>
  );
};

export default App;
