
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Category, Condition, Banner, User, UserRole, ShopInfo } from './types';
import { INITIAL_PRODUCTS, SHOP_DETAILS, INITIAL_BANNERS } from './constants';
import { PhoneIcon, MessageIcon, LocationIcon, PlusIcon, EditIcon, TrashIcon, SparklesIcon, UsersIcon, SettingsIcon, ShareIcon, BackIcon, BannerIcon, ShopLogo } from './components/Icons';
import { generateProductDescription } from './services/geminiService';

// Safe Storage Helper to prevent crashes due to corrupted localStorage
const getSafeStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    return JSON.parse(saved);
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
    return defaultValue;
  }
};

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
  // Persistence States - Hydrated once on load
  const [products, setProducts] = useState<Product[]>(() => getSafeStorage('shop_products', INITIAL_PRODUCTS));
  const [banners, setBanners] = useState<Banner[]>(() => getSafeStorage('shop_banners', INITIAL_BANNERS));
  const [users, setUsers] = useState<User[]>(() => {
    const defaultAdmin: User = { 
      id: 'admin-1', 
      name: 'Dealer Admin', 
      phoneNumber: '8167435566', 
      password: 'Hospital@3030', 
      role: 'admin',
      createdAt: Date.now()
    };
    const savedUsers = getSafeStorage<User[]>('shop_users', []);
    // Ensure the default admin always exists
    if (!savedUsers.some(u => u.role === 'admin')) return [defaultAdmin, ...savedUsers];
    return savedUsers;
  });
  
  const [shopInfo, setShopInfo] = useState<ShopInfo>(() => getSafeStorage('shop_info', SHOP_DETAILS));
  const [currentUser, setCurrentUser] = useState<User | null>(() => getSafeStorage('shop_current_user', null));
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    const user = getSafeStorage<User | null>('shop_current_user', null);
    return user ? 'none' : 'login';
  });

  // SINGLE DECLARATION of authFormData to prevent syntax errors
  const [authFormData, setAuthFormData] = useState({ name: '', phoneNumber: '', password: '' });

  // Persistence Effects
  useEffect(() => { localStorage.setItem('shop_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('shop_banners', JSON.stringify(banners)); }, [banners]);
  useEffect(() => { localStorage.setItem('shop_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('shop_info', JSON.stringify(shopInfo)); }, [shopInfo]);
  useEffect(() => { 
    if (currentUser) localStorage.setItem('shop_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('shop_current_user');
  }, [currentUser]);

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
    if (banners.length <= 1) return;
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    bannerTimerRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => { if (bannerTimerRef.current) clearInterval(bannerTimerRef.current); };
  }, [banners.length]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesTab = activeTab === 'All' || p.category === activeTab;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [products, activeTab, searchQuery]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.phoneNumber === authFormData.phoneNumber);
    if (!user) {
      alert('Yeh mobile number registered nahi hai! Kripya naya account banayein (Sign Up).');
      return;
    }
    if (user.password !== authFormData.password) {
      alert('Galat Password! Kripya sahi password dalein.');
      return;
    }
    setCurrentUser(user);
    setAuthMode('none');
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authFormData.phoneNumber || !authFormData.password || !authFormData.name) {
      alert('Saari details bharna zaroori hai!');
      return;
    }
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
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setAuthMode('none');
    alert('Account ban gaya hai! Swagat hai.');
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = users.find(u => u.role === 'admin' && u.phoneNumber === authFormData.phoneNumber);
    if (!admin) {
      alert('Admin account nahi mila! Kripya sahi admin number dalein.');
      return;
    }
    if (admin.password !== authFormData.password) {
      alert('Galat Admin Password! Kripya check karein.');
      return;
    }
    setCurrentUser(admin);
    setAuthMode('none');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('login');
    setAuthFormData({ name: '', phoneNumber: '', password: '' });
  };

  const handleShare = async () => {
    const shareData = { title: shopInfo.name, text: `Check this out!`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied!');
      }
    } catch (err) {}
  };

  const openWhatsApp = (e?: React.MouseEvent, productName?: string) => {
    if (e) e.stopPropagation();
    const text = productName ? `Interested in ${productName}` : `Hello`;
    window.open(`https://wa.me/${shopInfo.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const makeCall = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    window.location.href = `tel:${shopInfo.phone}`;
  };

  if (authMode !== 'none') {
    return (
      <div className="min-h-screen bg-[#2874f0] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in fade-in duration-300">
          <div className="bg-[#2874f0] p-10 text-white text-center">
             <div className="flex justify-center mb-4">
               <ShopLogo className="h-16 w-auto brightness-0 invert" />
             </div>
            <h1 className="text-3xl font-black italic mb-2 tracking-tighter uppercase">{shopInfo.name}</h1>
            <p className="text-xs font-bold opacity-75 uppercase tracking-[3px]">
              {authMode === 'signup' ? 'Create Account' : authMode === 'admin-login' ? 'Dealer Portal' : 'Login'}
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={authMode === 'login' ? handleLogin : authMode === 'signup' ? handleSignup : handleAdminAuth} className="space-y-5">
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Full Name</label>
                  <input type="text" placeholder="" className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none focus:border-[#2874f0] transition-colors" value={authFormData.name} onChange={e => setAuthFormData({...authFormData, name: e.target.value})} />
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                  {authMode === 'admin-login' ? 'Admin Mobile' : 'Mobile Number'}
                </label>
                <div className="relative">
                  <span className="absolute left-0 bottom-3 text-sm text-gray-500 font-bold">+91</span>
                  <input type="tel" maxLength={10} placeholder="" className="w-full border-b-2 border-gray-100 py-3 pl-9 outline-none text-sm focus:border-[#2874f0] transition-colors" value={authFormData.phoneNumber} onChange={e => setAuthFormData({...authFormData, phoneNumber: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Password</label>
                <input type="password" placeholder="" className="w-full border-b-2 border-gray-100 py-3 outline-none text-sm focus:border-[#2874f0] transition-colors" value={authFormData.password} onChange={e => setAuthFormData({...authFormData, password: e.target.value})} />
              </div>

              <button type="submit" className={`w-full ${authMode === 'admin-login' ? 'bg-gray-900' : 'bg-[#fb641b]'} text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all mt-4`}>
                {authMode === 'signup' ? 'Sign Up' : authMode === 'admin-login' ? 'Login as Dealer' : 'Log In'}
              </button>
              
              <div className="text-center pt-2 flex flex-col gap-3">
                {authMode === 'login' && (
                  <>
                    <button type="button" onClick={() => setAuthMode('signup')} className="text-[#2874f0] text-sm font-bold hover:underline">
                      New user? Create an account
                    </button>
                    <button type="button" onClick={() => setAuthMode('admin-login')} className="mt-4 text-[10px] text-gray-300 font-bold uppercase tracking-widest hover:text-gray-500 transition-colors">
                      Dealer Login
                    </button>
                  </>
                )}
                {authMode === 'signup' && (
                  <button type="button" onClick={() => setAuthMode('login')} className="text-[#2874f0] text-sm font-bold hover:underline">
                    Already have an account? Login
                  </button>
                )}
                {authMode === 'admin-login' && (
                   <button type="button" onClick={() => setAuthMode('login')} className="text-[#2874f0] text-sm font-bold hover:underline">
                     Back to Customer Login
                   </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] pb-24 text-left">
      <header className="bg-[#2874f0] text-white sticky top-0 z-40 shadow-lg px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <h1 className="text-xl font-black italic tracking-tighter leading-none">{shopInfo.name.toUpperCase()}</h1>
                  <div className="h-[2px] w-8 bg-yellow-400 mt-1"></div>
                </div>
             </div>
             <div className="flex items-center gap-2">
               {currentUser?.role === 'admin' && <LiveClock />}
               <button onClick={handleLogout} className="text-[10px] font-bold border border-white/40 px-2 py-1 rounded">Logout</button>
             </div>
          </div>
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 rounded text-gray-800 text-sm outline-none shadow-inner" />
        </div>
      </header>

      <nav className="bg-white shadow-sm sticky top-[108px] z-30 flex max-w-4xl mx-auto border-b">
        {['All', 'Mobile', 'Accessories'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-[#2874f0] text-[#2874f0]' : 'border-transparent text-gray-400'}`}>{tab}</button>
        ))}
      </nav>

      {banners.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="relative h-36 rounded-2xl overflow-hidden shadow-xl bg-gray-200">
            {banners.map((banner, index) => (
              <div key={banner.id} className={`absolute inset-0 transition-all duration-700 ${banner.bg} flex items-center p-6 text-white`} style={{ transform: `translateX(${(index - currentBanner) * 100}%)`, opacity: currentBanner === index ? 1 : 0 }}>
                <div className="flex-1 z-10">
                  <span className="bg-black/20 text-[9px] px-2 py-0.5 rounded font-bold uppercase mb-1 inline-block">{banner.tag}</span>
                  <h2 className="text-lg font-bold line-clamp-1">{banner.title}</h2>
                  <p className="text-xs opacity-80 line-clamp-1">{banner.subtitle}</p>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30">
                  {banner.image && <img src={banner.image} className="h-full w-full object-cover" alt="banner" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-gray-100">
        {filteredProducts.map((p) => (
          <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white p-4 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-lg p-2 overflow-hidden border border-gray-100">
              <img src={p.image} className="w-full h-full object-contain" alt={p.name} />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800 truncate leading-tight">{p.name}</h3>
                <div className="flex gap-1 items-center mt-1">
                  <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">4.5★</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{p.condition}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                   {p.specs.ram && <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-100">{p.specs.ram} RAM</span>}
                   {p.specs.storage && <span className="text-[8px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-bold border border-purple-100">{p.specs.storage} ROM</span>}
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-auto">
                <span className="text-lg font-black text-[#2874f0]">₹{p.price.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400 line-through">₹{(p.price * 1.5).toLocaleString()}</span>
              </div>
              {currentUser?.role === 'admin' && (
                <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => {setEditingProduct(p); setShowAdminModal(true)}} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><EditIcon /></button>
                  <button onClick={() => {if(confirm('Delete?')) setProducts(prev => prev.filter(pr => pr.id !== p.id))}} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><TrashIcon /></button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white">
            <p className="text-gray-400 italic">No products found.</p>
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto px-4 mt-6 text-center">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 mb-20">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Our Store</p>
          <p className="text-sm text-gray-700 mb-4 font-medium leading-relaxed">{shopInfo.address}</p>
          <div className="flex gap-3">
            <a href={shopInfo.googleMapUrl} target="_blank" rel="noreferrer" className="flex-1 bg-[#2874f0] text-white py-3.5 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"><LocationIcon /> Map</a>
            <button onClick={handleShare} className="flex-1 border-2 border-gray-100 py-3.5 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-gray-50"><ShareIcon /> Share</button>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t p-4 flex gap-3 z-40 max-w-4xl mx-auto shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button onClick={() => openWhatsApp()} className="flex-1 bg-[#25D366] text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-xl shadow-green-500/20 active:scale-95 transition-all"><MessageIcon /> WhatsApp</button>
        <button onClick={() => makeCall()} className="flex-1 bg-[#fb641b] text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 active:scale-95 transition-all"><PhoneIcon /> Call Store</button>
      </div>

      {currentUser?.role === 'admin' && (
        <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-50">
          <button onClick={() => setShowDealerSettingsModal(true)} title="Store Settings" className="bg-gray-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white"><SettingsIcon /></button>
          <button onClick={() => setShowBannerManagerModal(true)} title="Manage Banners" className="bg-orange-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white"><BannerIcon /></button>
          <button onClick={() => setShowCustomerAdminModal(true)} title="Customers" className="bg-emerald-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white"><UsersIcon /></button>
          <button onClick={() => {setEditingProduct(null); setShowAdminModal(true)}} title="Add Product" className="bg-[#2874f0] text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white"><PlusIcon /></button>
        </div>
      )}

      {selectedProduct && <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onWhatsApp={openWhatsApp} onCall={makeCall} />}
      {showAdminModal && <AdminModal product={editingProduct} onClose={() => setShowAdminModal(false)} onSave={(p: Product) => {
        if(editingProduct) setProducts(prev => prev.map(item => item.id === p.id ? p : item));
        else {
          setProducts(prev => [{...p, id: Date.now().toString(), createdAt: Date.now()}, ...prev]);
          setActiveTab(p.category);
        }
        setShowAdminModal(false);
      }} />}
      {showDealerSettingsModal && <DealerSettingsModal shopInfo={shopInfo} onClose={() => setShowDealerSettingsModal(false)} onSave={(s: ShopInfo) => {setShopInfo(s); setShowDealerSettingsModal(false)}} />}
      {showBannerManagerModal && <BannerManagerModal banners={banners} onClose={() => setShowBannerManagerModal(false)} onSave={(updated: Banner[]) => {setBanners(updated); setShowBannerManagerModal(false)}} />}
      {showCustomerAdminModal && <CustomerAdminModal users={users.filter(u => u.role === 'customer')} onClose={() => setShowCustomerAdminModal(false)} onDeleteUser={(id: string) => setUsers(prev => prev.filter(u => u.id !== id))} />}
    </div>
  );
};

// ... Internal Component Parts (ProductDetailsModal, AdminModal, etc.)
const ProductDetailsModal = ({ product, onClose, onWhatsApp, onCall }: any) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-3xl overflow-hidden text-left flex flex-col max-h-[95vh] shadow-2xl">
      <div className="p-5 border-b flex justify-between items-center bg-[#2874f0] text-white">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"><BackIcon /></button>
        <span className="font-black text-xs uppercase tracking-widest">Product Info</span>
        <div className="w-8"></div>
      </div>
      <div className="overflow-y-auto p-6 space-y-8 no-scrollbar">
        <div className="bg-gray-50 rounded-2xl p-6 flex justify-center h-64 ring-1 ring-black/5">
          <img src={product.image} className="h-full object-contain drop-shadow-xl" alt="product" />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-gray-900 leading-tight">{product.name}</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-3xl font-black text-[#2874f0]">₹{product.price.toLocaleString()}</span>
            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black border border-green-100 uppercase">{product.condition}</span>
            {product.specs.ram && <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black border border-blue-100 uppercase">{product.specs.ram} RAM</span>}
            {product.specs.storage && <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-[10px] font-black border border-purple-100 uppercase">{product.specs.storage} ROM</span>}
          </div>
          <div className="bg-gray-50/80 p-5 rounded-2xl border-l-4 border-[#2874f0] shadow-inner">
            <p className="text-sm text-gray-600 leading-relaxed italic">"{product.description}"</p>
          </div>
        </div>
      </div>
      <div className="p-5 border-t bg-white flex gap-3">
        <button onClick={() => onWhatsApp(undefined, product.name)} className="flex-1 bg-[#25D366] text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-xl shadow-green-500/20 active:scale-95 transition-all"><MessageIcon /> WhatsApp</button>
        <button onClick={() => onCall()} className="flex-1 bg-[#fb641b] text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 active:scale-95 transition-all"><PhoneIcon /> Call Now</button>
      </div>
    </div>
  </div>
);

const AdminModal = ({ product, onClose, onSave }: any) => {
  const [formData, setFormData] = useState<Product>(product || { id: '', name: '', price: 0, condition: 'Good', category: 'Mobile', description: '', specs: { ram: '', storage: '' }, image: '', createdAt: Date.now() });
  const [loading, setLoading] = useState(false);

  const handleAi = async () => {
    if(!formData.name) return alert('Pehle Product Name likhein!');
    setLoading(true);
    const desc = await generateProductDescription(formData.name, formData.condition, formData.category);
    setFormData(prev => ({...prev, description: desc}));
    setLoading(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if(f) {
      const r = new FileReader();
      r.onloadend = () => setFormData(prev => ({...prev, image: r.result as string}));
      r.readAsDataURL(f);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-[100] flex items-center justify-center p-4">
      <form onSubmit={e => {e.preventDefault(); onSave(formData)}} className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto text-left shadow-2xl">
        <div className="flex justify-between border-b pb-4 items-center">
          <h2 className="font-black text-xs uppercase tracking-widest text-gray-400">Inventory Editor</h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-400">✕</button>
        </div>
        <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl">
           <div className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden bg-white shadow-inner">
             {formData.image ? <img src={formData.image} className="w-full h-full object-contain" alt="preview" /> : <PlusIcon />}
             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} />
           </div>
           <div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Photo</p>
             <p className="text-[9px] text-gray-300">Tap to upload / change</p>
           </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
          <input type="text" placeholder="e.g. iPhone 15 Pro" className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none font-bold focus:border-[#2874f0] transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="flex gap-4">
           <div className="flex-1 space-y-1">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price</label>
             <input type="number" className="w-full border-b-2 border-gray-100 py-3 outline-none text-sm font-bold focus:border-[#2874f0]" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})} />
           </div>
           <div className="flex-1 space-y-1">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
             <select className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none bg-transparent font-bold focus:border-[#2874f0]" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
               <option>Mobile</option>
               <option>Accessories</option>
             </select>
           </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Condition</label>
          <select className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none bg-transparent font-bold focus:border-[#2874f0]" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as any})}>
            <option>Like New</option>
            <option>Good</option>
            <option>Average</option>
          </select>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
            <button type="button" onClick={handleAi} className="text-[10px] font-black text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
              <SparklesIcon /> {loading ? 'AI Writing...' : 'AI Auto-Write'}
            </button>
          </div>
          <textarea className="w-full border-2 border-gray-50 rounded-2xl p-4 text-sm h-28 outline-none focus:border-[#2874f0] transition-colors shadow-inner" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        <button type="submit" className="w-full bg-[#2874f0] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all mt-4">Save to Shop</button>
      </form>
    </div>
  );
};

const DealerSettingsModal = ({ shopInfo, onClose, onSave }: any) => {
  const [s, setS] = useState({...shopInfo});
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5 text-left shadow-2xl">
        <div className="flex justify-between border-b pb-4 items-center">
          <h2 className="font-black text-xs uppercase tracking-widest text-gray-400">Store Settings</h2>
          <button onClick={onClose} className="p-2 text-gray-400">✕</button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Store Name</label>
            <input type="text" className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none font-bold focus:border-[#2874f0]" value={s.name} onChange={e => setS({...s, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Physical Address</label>
            <textarea className="w-full border-2 border-gray-50 rounded-2xl p-4 text-sm h-20 outline-none focus:border-[#2874f0] shadow-inner" value={s.address} onChange={e => setS({...s, address: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Maps Link</label>
            <input type="text" placeholder="https://..." className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none focus:border-[#2874f0]" value={s.googleMapUrl} onChange={e => setS({...s, googleMapUrl: e.target.value})} />
          </div>
          <div className="flex gap-4">
             <div className="flex-1 space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase ml-1">WhatsApp</label>
               <input type="text" className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none font-bold focus:border-[#2874f0]" value={s.whatsapp} onChange={e => setS({...s, whatsapp: e.target.value})} />
             </div>
             <div className="flex-1 space-y-1">
               <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Call Number</label>
               <input type="text" className="w-full border-b-2 border-gray-100 py-3 text-sm outline-none font-bold focus:border-[#2874f0]" value={s.phone} onChange={e => setS({...s, phone: e.target.value})} />
             </div>
          </div>
        </div>
        <button onClick={() => onSave(s)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all mt-4">Apply Dashboard Changes</button>
      </div>
    </div>
  );
};

const BannerManagerModal = ({ banners, onClose, onSave }: any) => {
  const [b, setB] = useState<Banner[]>(banners);
  const [form, setForm] = useState<Banner>({ id: '', title: '', subtitle: '', bg: 'bg-gradient-to-r from-blue-700 to-indigo-800', image: '', tag: 'OFFER' });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const gradients = [
    'bg-gradient-to-r from-blue-700 to-indigo-800',
    'bg-gradient-to-r from-orange-500 to-red-600',
    'bg-gradient-to-r from-emerald-600 to-teal-700',
    'bg-gradient-to-r from-purple-600 to-blue-500',
    'bg-gradient-to-r from-pink-600 to-orange-500',
    'bg-black'
  ];

  const handleSaveBannerLocal = () => {
    if(!form.image || !form.title) return alert('Photo aur Title zaroori hai!');
    let updated;
    if (editingId) {
      updated = b.map(item => item.id === editingId ? { ...form, id: editingId } : item);
    } else {
      updated = [{ ...form, id: Date.now().toString() }, ...b];
    }
    setB(updated);
    onSave(updated);
    resetForm();
  };

  const resetForm = () => {
    setForm({ id: '', title: '', subtitle: '', bg: 'bg-gradient-to-r from-blue-700 to-indigo-800', image: '', tag: 'OFFER' });
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 flex flex-col max-h-[95vh] text-left shadow-2xl overflow-hidden">
        <div className="flex justify-between border-b pb-4 items-center shrink-0">
          <h2 className="font-black text-xs uppercase tracking-widest text-gray-400">Slider Banners Dashboard</h2>
          <button onClick={onClose} className="p-2 text-gray-400">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 py-4 no-scrollbar space-y-6">
           <button onClick={() => setIsAdding(true)} className="w-full border-2 border-dashed border-gray-200 py-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <PlusIcon />
              <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Add New Banner</p>
           </button>
           {isAdding && (
              <div className="bg-gray-50 p-4 rounded-2xl space-y-4">
                 <input type="text" placeholder="Title" className="w-full p-3 rounded-xl border" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                 <input type="text" placeholder="Subtitle" className="w-full p-3 rounded-xl border" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} />
                 <input type="text" placeholder="Tag" className="w-full p-3 rounded-xl border" value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} />
                 <div className="flex gap-2">
                   {gradients.map(g => <div key={g} onClick={() => setForm({...form, bg: g})} className={`w-8 h-8 rounded-full cursor-pointer border-2 ${g} ${form.bg === g ? 'border-blue-500' : 'border-transparent'}`}></div>)}
                 </div>
                 <button onClick={handleSaveBannerLocal} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold uppercase text-xs">Save Banner</button>
              </div>
           )}
           <div className="grid grid-cols-1 gap-2">
             {b.map(item => (
                <div key={item.id} className="p-3 bg-white border rounded-xl flex items-center justify-between">
                   <div className="truncate pr-4"><p className="text-xs font-bold truncate">{item.title}</p></div>
                   <button onClick={() => { if(confirm('Delete?')) { const u = b.filter(x => x.id !== item.id); setB(u); onSave(u); }}} className="text-red-500"><TrashIcon /></button>
                </div>
             ))}
           </div>
        </div>
        <button onClick={onClose} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs mt-4">Close</button>
      </div>
    </div>
  );
};

const CustomerAdminModal = ({ users, onClose, onDeleteUser }: any) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 flex flex-col max-h-[80vh] text-left shadow-2xl">
        <div className="flex justify-between border-b pb-4 items-center">
          <h2 className="font-black text-xs uppercase tracking-widest text-gray-400">Customer Database</h2>
          <button onClick={onClose} className="p-2 text-gray-400">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 py-4 space-y-3 no-scrollbar">
          {users.map((u: any) => (
            <div key={u.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border">
              <div>
                <p className="text-sm font-black text-gray-800">{u.name}</p>
                <p className="text-xs text-[#2874f0] font-black">{u.phoneNumber}</p>
              </div>
              <button onClick={() => { if(confirm('Delete user?')) onDeleteUser(u.id); }} className="text-red-500"><TrashIcon /></button>
            </div>
          ))}
          {users.length === 0 && <p className="text-center py-10 text-xs text-gray-400 italic">No customers yet.</p>}
        </div>
        <button onClick={onClose} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs mt-2">Back</button>
      </div>
    </div>
  );
};

export default App;
