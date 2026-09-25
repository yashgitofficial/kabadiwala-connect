import React, { useState, createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import { 
  ClipboardList, CheckCircle, Clock, FileText, Settings, UserCircle,
  Recycle, ArrowRight, Loader2, X, Menu, Home, Package, IndianRupee, Search,
  ShieldCheck, BarChart, LogIn, UserPlus, Building2, Bell, MapPin, BrainCircuit,
  Camera, ShieldAlert, UploadCloud, Play, TrendingUp, Scale, Wallet, Users,
  ChevronRight, ChevronLeft, Filter, Plus, Image as ImageIcon,
  TrendingDown, Minus, Activity, ChevronDown, Info, LineChart,
  Map, Phone, Navigation, Truck, Star, Award, ExternalLink,
  Wifi, WifiOff, RefreshCw, Database, CloudOff,
  Volume2, Languages, Globe
} from 'lucide-react';

// --- HELPER FUNCTIONS FOR AUDIO (TTS) ---
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function pcmToWav(pcm16, sampleRate) {
  const numChannels = 1;
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = pcm16.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm16.length; i++, offset += 2) {
    view.setInt16(offset, pcm16[i], true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = error => reject(error);
});

// --- MULTILINGUAL TRANSLATION ENGINE ---
const TRANSLATIONS = {
  en: {
    'nav.home': 'Home', 'nav.materials': 'Materials', 'nav.prices': 'Prices', 'nav.find': 'Find Recycler',
    'nav.incoming': 'Incoming', 'nav.offers': 'Offers', 'nav.verify': 'Verify', 'nav.data': 'Data', 'nav.settings': 'Settings', 'nav.history': 'History', 'nav.admin': 'Admin',
    'dash.greeting': 'Namaste,', 'dash.earnings': 'Earnings',
    'dash.myMaterials': 'MY MATERIALS', 'dash.myMaterials.sub': 'Track your lots',
    'dash.prices': 'TODAY\'S PRICES', 'dash.prices.sub': 'Market rates',
    'dash.findRecycler': 'FIND RECYCLER', 'dash.findRecycler.sub': 'Authorized partners',
    'dash.transactions': 'LEDGER', 'dash.transactions.sub': 'Earnings history',
    'dash.weighAndSell': 'Weigh & Sell Now',
    'step.photo': '📸 Take Photo', 'step.category': '📦 Choose Material',
    'step.weight': '⚖️ Enter Weight', 'step.price': '💰 Check Price', 'step.publish': '📄 Confirm',
    'tts.welcome': 'Welcome to Kabadiwala Connect. Tap the big green button below to weigh and sell your scrap.',
    'tts.photo': 'Take a clear picture of the materials you want to sell.',
    'tts.category': 'Select the type of material you have.',
    'tts.weight': 'Enter the approximate weight in kilograms.',
    'tts.price': 'Review the estimated value based on today’s market price.',
    'tts.safety': 'Always wear gloves when handling e-waste. Wash your hands thoroughly afterwards.',
    'landing.badge': 'Empowering India\'s Informal Waste Sector',
    'landing.title1': 'Turn E-Waste Into',
    'landing.title2': 'Fair Earnings',
    'landing.subtitle': 'Discover transparent prices, connect with verified recyclers, and build a traceable, profitable recycling journey.',
    'landing.btnDashboard': 'Go to My Dashboard',
    'landing.btnJoin': 'Join as Collector',
    'landing.btnLogin': 'Login / Recycler Access',
    'landing.how': 'How It Works',
    'landing.howSub': 'A simple, transparent process for better earnings.',
    'login.title': 'Welcome Back',
    'login.sub': 'Sign in to your account',
    'login.email': 'Email Address',
    'login.pass': 'Password',
    'login.btn': 'Sign In',
    'login.or': 'Or continue instantly',
    'login.guestC': 'Guest Collector',
    'login.guestR': 'Guest Recycler',
    'login.noAcc': 'Don\'t have an account?',
    'login.signup': 'Sign up'
  },
  hi: {
    'nav.home': 'होम', 'nav.materials': 'सामान', 'nav.prices': 'भाव', 'nav.find': 'खोजें',
    'nav.incoming': 'आवक', 'nav.offers': 'ऑफर', 'nav.verify': 'सत्यापन', 'nav.data': 'डेटा', 'nav.settings': 'सेटिंग्स', 'nav.history': 'इतिहास', 'nav.admin': 'एडमिन',
    'dash.greeting': 'नमस्ते,', 'dash.earnings': 'कमाई',
    'dash.myMaterials': 'मेरा सामान', 'dash.myMaterials.sub': 'अपने लॉट देखें',
    'dash.prices': 'आज के भाव', 'dash.prices.sub': 'बाज़ार रेट',
    'dash.findRecycler': 'रिसाइकलर खोजें', 'dash.findRecycler.sub': 'प्रमाणित पार्टनर',
    'dash.transactions': 'खाता-बही', 'dash.transactions.sub': 'कमाई का इतिहास',
    'dash.weighAndSell': 'अभी तौलें और बेचें',
    'step.photo': '📸 फोटो लें', 'step.category': '📦 सामान चुनें',
    'step.weight': '⚖️ वज़न डालें', 'step.price': '💰 भाव देखें', 'step.publish': '📄 पक्का करें',
    'tts.welcome': 'कबाड़ीवाला कनेक्ट में आपका स्वागत है। अपना कबाड़ बेचने के लिए नीचे दिए गए हरे बटन को दबाएं।',
    'tts.photo': 'आप जो सामान बेचना चाहते हैं, उसकी एक साफ फोटो लें।',
    'tts.category': 'आपके पास जो सामान है उसका प्रकार चुनें।',
    'tts.weight': 'किलोग्राम में अंदाजन वज़न डालें।',
    'tts.price': 'आज के बाज़ार भाव के आधार पर अनुमानित कीमत देखें।',
    'tts.safety': 'ई-कचरे को संभालते समय हमेशा दस्ताने पहनें। उसके बाद अपने हाथ अच्छी तरह धो लें।',
    'landing.badge': 'भारत के असंगठित कचरा क्षेत्र को सशक्त बनाना',
    'landing.title1': 'ई-कचरे को बदलें',
    'landing.title2': 'उचित कमाई में',
    'landing.subtitle': 'पारदर्शी मूल्य जानें, प्रमाणित रिसाइकलर से जुड़ें, और एक लाभदायक रीसाइक्लिंग यात्रा बनाएं।',
    'landing.btnDashboard': 'मेरे डैशबोर्ड पर जाएं',
    'landing.btnJoin': 'कलेक्टर के रूप में जुड़ें',
    'landing.btnLogin': 'लॉगिन / रिसाइकलर एक्सेस',
    'landing.how': 'यह कैसे काम करता है',
    'landing.howSub': 'बेहतर कमाई के लिए एक सरल, पारदर्शी प्रक्रिया।',
    'login.title': 'वापसी पर स्वागत है',
    'login.sub': 'अपने खाते में साइन इन करें',
    'login.email': 'ईमेल पता',
    'login.pass': 'पासवर्ड',
    'login.btn': 'साइन इन करें',
    'login.or': 'या तुरंत जारी रखें',
    'login.guestC': 'गेस्ट कलेक्टर',
    'login.guestR': 'गेस्ट रिसाइकलर',
    'login.noAcc': 'क्या आपके पास खाता नहीं है?',
    'login.signup': 'साइन अप करें'
  },
  mr: {
    'nav.home': 'होम', 'nav.materials': 'सामान', 'nav.prices': 'भाव', 'nav.find': 'शोधा',
    'nav.incoming': 'आवक', 'nav.offers': 'ऑफर', 'nav.verify': 'पडताळणी', 'nav.data': 'डेटा', 'nav.settings': 'सेटिंग्ज', 'nav.history': 'इतिहास', 'nav.admin': 'प्रशासक',
    'dash.greeting': 'नमस्कार,', 'dash.earnings': 'कमाई',
    'dash.myMaterials': 'माझे सामान', 'dash.myMaterials.sub': 'तुमचे लॉट पहा',
    'dash.prices': 'आजचे भाव', 'dash.prices.sub': 'बाजार भाव',
    'dash.findRecycler': 'रिसायकलर शोधा', 'dash.findRecycler.sub': 'प्रमाणित भागीदार',
    'dash.transactions': 'खातेवही', 'dash.transactions.sub': 'कमाईचा इतिहास',
    'dash.weighAndSell': 'आता मोजा आणि विका',
    'step.photo': '📸 फोटो काढा', 'step.category': '📦 सामान निवडा',
    'step.weight': '⚖️ वजन टाका', 'step.price': '💰 भाव तपासा', 'step.publish': '📄 पुष्टी करा',
    'tts.welcome': 'कबाडीवाला कनेक्ट मध्ये आपले स्वागत आहे. तुमचे भंगार विकण्यासाठी खालील मोठे हिरवे बटण दाबा.',
    'tts.photo': 'तुम्हाला जे सामान विकायचे आहे, त्याचा स्पष्ट फोटो काढा.',
    'tts.category': 'सामान प्रकार निवडा.',
    'tts.weight': 'किलोग्रॅम मध्ये अंदाजे वजन टाका.',
    'tts.price': 'आजच्या बाजार भावानुसार अंदाजित किंमत तपासा.',
    'tts.safety': 'ई-कचरा हाताळताना नेहमी हातमोजे घाला. त्यानंतर आपले हात स्वच्छ धुवा.',
    'landing.badge': 'भारतातील असंघटित कचरा क्षेत्राचे सक्षमीकरण',
    'landing.title1': 'ई-कचऱ्याचे रूपांतर करा',
    'landing.title2': 'योग्य कमाईत',
    'landing.subtitle': 'पारदर्शक किमती शोधा, प्रमाणित रिसायकलर्सशी कनेक्ट व्हा आणि फायदेशीर रीसायकलिंग प्रवास तयार करा.',
    'landing.btnDashboard': 'माझ्या डॅशबोर्डवर जा',
    'landing.btnJoin': 'कलेक्टर म्हणून सामील व्हा',
    'landing.btnLogin': 'लॉगिन / रिसायकलर प्रवेश',
    'landing.how': 'हे कसे कार्य करते',
    'landing.howSub': 'उत्तम कमाईसाठी एक सोपी, पारदर्शक प्रक्रिया.',
    'login.title': 'पुन्हा स्वागत आहे',
    'login.sub': 'तुमच्या खात्यात साइन इन करा',
    'login.email': 'ईमेल पत्ता',
    'login.pass': 'पासवर्ड',
    'login.btn': 'साइन इन करा',
    'login.or': 'किंवा त्वरित सुरू ठेवा',
    'login.guestC': 'अतिथी कलेक्टर',
    'login.guestR': 'अतिथी रिसायकलर',
    'login.noAcc': 'तुमचे खाते नाही का?',
    'login.signup': 'साइन अप करा'
  }
};

const LanguageContext = createContext(null);
export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');
  
  const speechLangMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
  
  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
  
  return (
    <LanguageContext.Provider value={{ lang, setLang, t, speechLang: speechLangMap[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

const VoiceAssistant = ({ textKey }) => {
  const { t, speechLang } = useLanguage();
  
  const speak = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(t(textKey));
    utterance.lang = speechLang;
    utterance.rate = 0.9; // Slightly slower for better comprehension
    window.speechSynthesis.speak(utterance);
  };
  
  return (
    <button 
      onClick={speak} 
      className="w-12 h-12 rounded-full bg-emerald-900/40 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/50 hover:bg-emerald-900/60 active:scale-90 transition-all shadow-lg shrink-0"
      aria-label="Listen"
    >
      <Volume2 className="w-6 h-6" />
    </button>
  );
};

const LanguageSelectionPage = ({ onNavigate }) => {
  const { lang, setLang } = useLanguage();
  const { currentUser } = useAuth();
  
  const languages = [
    { id: 'hi', name: 'हिंदी', nativeName: 'हिंदी', char: 'अ' },
    { id: 'en', name: 'English', nativeName: 'English', char: 'A' },
    { id: 'mr', name: 'मराठी', nativeName: 'मराठी', char: 'अ' },
  ];

  const handleSelect = (id) => {
    setLang(id);
    if(currentUser) {
      onNavigate(currentUser.role === 'recycler' ? 'recycler-dashboard' : 'dashboard');
    } else {
      onNavigate('landing');
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-8 border-2 border-gray-700 shadow-lg">
        <Languages className="h-10 w-10 text-emerald-500" />
      </div>
      <h2 className="text-3xl font-black text-white mb-2">Select Language</h2>
      <p className="text-gray-400 mb-10 text-lg">भाषा चुनें • भाषा निवडा</p>
      
      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        {languages.map(l => (
          <button 
            key={l.id} 
            onClick={() => handleSelect(l.id)}
            className={`relative overflow-hidden group flex items-center p-5 rounded-2xl border-2 transition-all ${lang === l.id ? 'bg-emerald-900/40 border-emerald-500' : 'bg-[#24242B] border-[#2A2A35] hover:border-gray-500'}`}
          >
            <div className="w-14 h-14 rounded-full bg-gray-800/80 flex items-center justify-center text-2xl font-bold text-gray-300 mr-4 border border-gray-700">
              {l.char}
            </div>
            <div className="text-left flex-1">
              <div className={`text-2xl font-bold ${lang === l.id ? 'text-emerald-400' : 'text-white'}`}>{l.nativeName}</div>
              {l.name !== l.nativeName && <div className="text-gray-500 text-sm mt-0.5">{l.name}</div>}
            </div>
            {lang === l.id && <CheckCircle className="w-8 h-8 text-emerald-500 absolute right-6" />}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- OFFLINE-FIRST INDEXEDDB ENGINE ---
const DB_NAME = 'KC_OfflineDataStore';
const DB_VERSION = 1;

const initDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('lots')) db.createObjectStore('lots', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { keyPath: 'id' });
    if (!db.objectStoreNames.contains('syncHistory')) db.createObjectStore('syncHistory', { keyPath: 'id' });
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const idbPut = async (store, item) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });
};

const idbGetAll = async (store) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(tx.error);
  });
};

const idbDelete = async (store, id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- ADVANCED PRICING SERVICE ---
// Fully reusable, clearly separated pricing logic
const PricingService = {
  materials: [
    { id: 'Copper Cables', category: 'Wires', unit: 'kg', basePrice: 650 },
    { id: 'PCBs', category: 'Electronics', unit: 'kg', basePrice: 450 },
    { id: 'Batteries', category: 'Hazardous', unit: 'kg', basePrice: 120 },
    { id: 'CRT', category: 'Displays', unit: 'unit', basePrice: 50 },
    { id: 'LCD Panels', category: 'Displays', unit: 'unit', basePrice: 200 },
    { id: 'Motors', category: 'Components', unit: 'kg', basePrice: 350 },
    { id: 'Magnets', category: 'Components', unit: 'kg', basePrice: 250 },
    { id: 'Mixed Plastics', category: 'Plastics', unit: 'kg', basePrice: 30 }
  ],
  locations: ['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai'],
  
  // Seed for deterministic randomization based on string (to keep demo data stable across renders)
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    return hash;
  },
  
  // Get location multiplier (prices vary slightly by city)
  _getLocationMultiplier(location) {
    const locMap = { 'Mumbai': 1.05, 'Delhi': 1.02, 'Pune': 1.0, 'Bangalore': 1.08, 'Chennai': 0.98 };
    // Find closest match or default to 1
    const match = this.locations.find(l => location.toLowerCase().includes(l.toLowerCase()));
    return match ? locMap[match] : 1.0;
  },

  getAllCategories() {
    return ['All', ...new Set(this.materials.map(m => m.category))];
  },

  getAllMaterials() {
    return this.materials.map(m => m.id);
  },

  getMaterialDetails(materialId) {
    return this.materials.find(m => m.id === materialId) || this.materials[0];
  },

  // Get current exact buying price
  getCurrentPrice(materialId, location = 'Pune') {
    const mat = this.getMaterialDetails(materialId);
    const locMulti = this._getLocationMultiplier(location);
    // Add minor day-of-week variance
    const dayMulti = 1 + (new Date().getDay() * 0.01) - 0.03; 
    return Math.round(mat.basePrice * locMulti * dayMulti);
  },

  // Trend detection algorithm comparing historical to current
  getTrendAnalysis(currentPrice, materialId, location = 'Pune') {
    const mat = this.getMaterialDetails(materialId);
    const locMulti = this._getLocationMultiplier(location);
    // Simulate previous week price using a different variance
    const previousWeekPrice = Math.round(mat.basePrice * locMulti * 0.96); 
    
    const diff = currentPrice - previousWeekPrice;
    const percent = previousWeekPrice > 0 ? (diff / previousWeekPrice) * 100 : 0;
    
    if (percent > 1.5) return { status: 'Rising', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', value: `+${percent.toFixed(1)}%`, text: `${percent.toFixed(1)}% this week` };
    if (percent < -1.5) return { status: 'Falling', icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10', value: `${percent.toFixed(1)}%`, text: `${percent.toFixed(1)}% this week` };
    return { status: 'Stable', icon: Minus, color: 'text-gray-400', bg: 'bg-gray-400/10', value: `0%`, text: `Stable this week` };
  },

  // Get 7-day mock historical data for charts
  getHistoricalPrices(materialId, location = 'Pune') {
    const current = this.getCurrentPrice(materialId, location);
    const mat = this.getMaterialDetails(materialId);
    const hash = this._hashString(materialId + location);
    const data = [];
    let movingPrice = current;
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      // Simulate realistic fluctuation +/- 3%
      const fluctuation = 1 + (Math.sin(hash + i) * 0.05);
      data.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        price: i === 0 ? current : Math.round(mat.basePrice * fluctuation)
      });
    }
    return data;
  },

  // Get market aggregate range (Avg, Min, Max)
  getMarketStats(materialId, location = 'Pune') {
    const current = this.getCurrentPrice(materialId, location);
    return {
      avg: current,
      min: Math.round(current * 0.92),
      max: Math.round(current * 1.08)
    };
  },

  // Mock nearby recyclers offering bids on this material
  getRecyclerOffers(materialId, location = 'Pune') {
    const current = this.getCurrentPrice(materialId, location);
    return [
      { id: 'r1', name: 'GreenTech Solutions', distance: '2.4 km', rating: 4.8, offer: Math.round(current * 1.05), isVerified: true },
      { id: 'r2', name: 'EcoRecycle Hub', distance: '5.1 km', rating: 4.5, offer: Math.round(current * 0.98), isVerified: true },
      { id: 'r3', name: 'Apex Metal Traders', distance: '8.0 km', rating: 4.2, offer: Math.round(current * 1.02), isVerified: false },
    ].sort((a, b) => b.offer - a.offer); // Sort highest offer first
  }
};

// --- RECYCLER DISCOVERY SERVICE ---
const RecyclerService = {
  recyclers: [
    {
      id: 'r1', name: 'GreenTech Solutions', status: 'Authorized', isVerified: true,
      location: 'Pune', address: 'Plot 45, MIDC Bhosari, Pune', distance: 2.4,
      materials: ['Copper Cables', 'PCBs', 'Motors', 'Mixed Plastics'],
      pickupAvailable: true, serviceArea: 'Pune District', contact: '+91 98765 43210',
      authDetails: { licenseNo: 'MPCB/RO-PUNE/E-WASTE/2024/01', validTill: 'Dec 2027', body: 'Maharashtra Pollution Control Board' },
      performance: { completedTrades: 450, rating: 4.8, responseTime: 'Under 2 hours' },
      coordinates: { lat: 18.6279, lng: 73.8331 },
      priceMultiplier: 1.05
    },
    {
      id: 'r2', name: 'EcoRecycle Hub', status: 'Authorized', isVerified: true,
      location: 'Mumbai', address: 'Gala 12, Kurla Industrial Estate, Mumbai', distance: 5.1,
      materials: ['Batteries', 'PCBs', 'LCD Panels', 'CRT'],
      pickupAvailable: true, serviceArea: 'Mumbai & Navi Mumbai', contact: '+91 99887 76655',
      authDetails: { licenseNo: 'MPCB/RO-MUM/E-WASTE/2023/14', validTill: 'Oct 2026', body: 'Maharashtra Pollution Control Board' },
      performance: { completedTrades: 820, rating: 4.9, responseTime: 'Under 1 hour' },
      coordinates: { lat: 19.0760, lng: 72.8777 },
      priceMultiplier: 0.98
    },
    {
      id: 'r3', name: 'Apex Metal Traders', status: 'Pending Validation', isVerified: false,
      location: 'Pune', address: 'Shed 3, Hadapsar Industrial Area, Pune', distance: 8.0,
      materials: ['Copper Cables', 'Motors', 'Magnets'],
      pickupAvailable: false, serviceArea: 'Hadapsar & Magarpatta', contact: '+91 91234 56789',
      authDetails: { licenseNo: 'Application Under Review', validTill: 'N/A', body: 'Local Municipal Corporation' },
      performance: { completedTrades: 34, rating: 4.2, responseTime: 'Same day' },
      coordinates: { lat: 18.5089, lng: 73.9259 },
      priceMultiplier: 1.02
    },
    {
      id: 'r4', name: 'Metro E-Waste Packers', status: 'Authorized', isVerified: true,
      location: 'Delhi', address: 'Okhla Phase 2, New Delhi', distance: 15.2,
      materials: ['Mixed Plastics', 'LCD Panels', 'Motors'],
      pickupAvailable: true, serviceArea: 'Delhi NCR', contact: '+91 98111 22334',
      authDetails: { licenseNo: 'DPCC/E-WASTE/2025/88', validTill: 'Jan 2028', body: 'Delhi Pollution Control Committee' },
      performance: { completedTrades: 1200, rating: 4.7, responseTime: 'Within 24 hours' },
      coordinates: { lat: 28.5355, lng: 77.2713 },
      priceMultiplier: 1.08
    }
  ],
  
  search({ query = '', material = 'All', location = '', authorizedOnly = false, pickupOnly = false, sortBy = 'rating' }) {
    let results = this.recyclers.filter(r => {
      const matchQuery = r.name.toLowerCase().includes(query.toLowerCase()) || r.address.toLowerCase().includes(query.toLowerCase());
      const matchMaterial = material === 'All' ? true : r.materials.includes(material);
      const matchLocation = location ? r.location.toLowerCase().includes(location.toLowerCase()) : true;
      const matchAuth = authorizedOnly ? r.status === 'Authorized' : true;
      const matchPickup = pickupOnly ? r.pickupAvailable === true : true;
      return matchQuery && matchMaterial && matchLocation && matchAuth && matchPickup;
    });

    results.sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'price') return b.priceMultiplier - a.priceMultiplier; // Higher is better
      return b.performance.rating - a.performance.rating; // Default rating
    });

    return results;
  },

  getById(id) {
    return this.recyclers.find(r => r.id === id);
  }
};

// --- SMART RECOMMENDATION ENGINE ---
// Architected as a discrete service so the rules-based heuristic algorithm 
// can seamlessly be replaced with ML inference models later.
const MatchingService = {
  getRecommendations(lotCategory, lotLocation, lotWeight = 1) {
    const allRecyclers = RecyclerService.recyclers;
    const basePrice = PricingService.getCurrentPrice(lotCategory, lotLocation);
    
    // Find max multiplier to calculate relative price scoring
    const maxMultiplier = Math.max(...allRecyclers.map(r => r.priceMultiplier));
    
    let scored = allRecyclers.map(recycler => {
      let score = 0;
      let reasons = [];
      
      // 1. Material Compatibility (25%)
      const acceptsMaterial = recycler.materials.includes(lotCategory);
      if (acceptsMaterial) {
        score += 25;
        reasons.push(`Accepts ${lotCategory}`);
      }
      
      // 2. Authorization Status (30%)
      if (recycler.isVerified && recycler.status === 'Authorized') {
        score += 30;
        reasons.push('Verified authorized recycler');
      }

      // 3. Offered Price (20%)
      const offerPrice = Math.round(basePrice * recycler.priceMultiplier);
      if (recycler.priceMultiplier >= maxMultiplier) {
        score += 20;
        reasons.push('Highest offered price in area');
      } else if (recycler.priceMultiplier >= 1.0) {
        score += 15;
        reasons.push('Competitive market price');
      } else {
        score += 10;
      }

      // 4. Distance (15%) - Assuming max optimal distance is ~20km for a full sliding scale
      const maxDist = 20;
      let distScore = Math.max(0, ((maxDist - recycler.distance) / maxDist) * 15);
      score += distScore;
      if (recycler.distance <= 5) {
        reasons.push(`Only ${recycler.distance} km away`);
      } else if (recycler.distance <= 15) {
        reasons.push(`Within optimal service range (${recycler.distance} km)`);
      }

      // 5. Pickup Availability (10%)
      if (recycler.pickupAvailable) {
        score += 10;
        reasons.push('Pickup service available');
      }

      return {
        recycler,
        score: Math.round(score),
        reasons,
        offerPrice
      };
    });

    // Hard filter: Only recommend recyclers that actually accept the material
    scored = scored.filter(s => s.recycler.materials.includes(lotCategory));

    // Sort descending by highest match score
    scored.sort((a, b) => b.score - a.score);

    // Return Top 3
    return scored.slice(0, 3);
  }
};


// --- MOCK DATA STORE (Replacing Firebase for Sandbox Compatibility) ---
let MOCK_PROFILES = [
  { uid: '1', role: 'collector', email: 'collector@demo.com', password: 'demo123', name: 'Ramesh Kumar', location: 'Pune', language: 'hi' },
  { uid: '2', role: 'recycler', email: 'recycler@demo.com', password: 'demo123', orgName: 'GreenTech Solutions', location: 'Pune', contact: '9876543210', status: 'Authorized' },
  { uid: '3', role: 'admin', email: 'admin@demo.com', password: 'demo123', name: 'System Admin' }
];

// --- DATABASE ABSTRACTION & SEEDING ---
const DatabaseContext = createContext(null);
export const useDatabase = () => useContext(DatabaseContext);

const SEED_DATA = {
  lots: [
    { id: 'l1', lot_id: 'KC-2026-000101', collector_id: '1', category: 'PCBs', weight: '2.5', condition: 'Mixed', status: 'Completed', estimated_value: 1125, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'l2', lot_id: 'KC-2026-000102', collector_id: '1', category: 'Copper Cables', weight: '10', condition: 'Clean', status: 'Accepted', estimated_value: 6500, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'l3', lot_id: 'KC-2026-000103', collector_id: '1', category: 'Batteries', weight: '45', condition: 'Mixed', status: 'Created', estimated_value: 5400, created_at: new Date().toISOString() }
  ],
  transactions: [
    {
      id: 'tx1', tx_ref: 'TX-2026-9901', lot_id: 'KC-2026-000101', collector_id: '1', recycler_id: 'r1', recycler_name: 'GreenTech Solutions',
      category: 'PCBs', initial_weight: 2.5, final_weight: 2.4, final_price: 1080,
      transaction_status: 'Completed', handover_location: 'Plot 45, MIDC Bhosari, Pune',
      payment_status: 'Cash Received', payment_date: new Date(Date.now() - 86400000 * 0.4).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      timeline: [
        { status: 'Created', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Lot listed on network' },
        { status: 'Matched', timestamp: new Date(Date.now() - 86400000 * 1.9).toISOString(), note: 'Smart matched with GreenTech Solutions' },
        { status: 'Accepted', timestamp: new Date(Date.now() - 86400000 * 1.8).toISOString(), note: 'Offer of ₹450/kg accepted' },
        { status: 'Handed Over', timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(), note: 'Collector handed material to facility' },
        { status: 'Completed', timestamp: new Date(Date.now() - 86400000 * 0.4).toISOString(), note: 'Weight verified (2.4kg), Payment ₹1080 recorded as Cash Received' }
      ]
    },
    {
      id: 'tx2', tx_ref: 'TX-2026-9902', lot_id: 'KC-2026-000102', collector_id: '1', recycler_id: 'r1', recycler_name: 'GreenTech Solutions',
      category: 'Copper Cables', initial_weight: 10, final_weight: null, final_price: null,
      transaction_status: 'Pending Handover', handover_location: 'Plot 45, MIDC Bhosari, Pune',
      payment_status: 'Pending', payment_date: null,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      timeline: [
        { status: 'Created', timestamp: new Date(Date.now() - 3600000).toISOString(), note: 'Lot listed on network' },
        { status: 'Matched', timestamp: new Date(Date.now() - 3000000).toISOString(), note: 'Smart matched with GreenTech Solutions' },
        { status: 'Accepted', timestamp: new Date(Date.now() - 1800000).toISOString(), note: 'Offer of ₹650/kg accepted. Awaiting physical handover.' }
      ]
    }
  ],
  traceability_records: []
};

export const DatabaseProvider = ({ children, authUser }) => {
  const [data, setData] = useState({
    lots: [],
    transactions: [],
    traceability_records: SEED_DATA.traceability_records,
    profiles: MOCK_PROFILES
  });
  
  const [dbLoading, setDbLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState(navigator.onLine ? 'synced' : 'offline');
  const [syncQueue, setSyncQueue] = useState([]);
  const [syncHistory, setSyncHistory] = useState([]);

  // Network Listeners
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); };
    const handleOffline = () => { setIsOnline(false); setSyncState('offline'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Logic Engine
  const processSync = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0) {
      if (isOnline) setSyncState('synced');
      return;
    }
    
    setSyncState('syncing');
    let currentQueue = [...syncQueue];
    
    for (const item of currentQueue) {
      try {
        // Simulate network delay for cloud push
        await new Promise(res => setTimeout(res, 800));
        
        await idbDelete('syncQueue', item.id);
        const historyItem = { ...item, status: 'success', syncedAt: new Date().toISOString() };
        await idbPut('syncHistory', historyItem);
        
        setSyncHistory(prev => [historyItem, ...prev]);
        setSyncQueue(prev => prev.filter(q => q.id !== item.id));
      } catch (err) {
        console.error("Sync failed for item:", item, err);
      }
    }
    setSyncState('synced');
  }, [isOnline, syncQueue]);

  // Trigger sync automatically when coming back online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0 && syncState !== 'syncing') {
      processSync();
    } else if (isOnline && syncQueue.length === 0) {
      setSyncState('synced');
    }
  }, [isOnline, processSync, syncQueue.length, syncState]);

  // Bootstrap Local IDB Cache
  useEffect(() => {
    const loadOfflineData = async () => {
      setDbLoading(true);
      try {
        const cachedLots = await idbGetAll('lots');
        const cachedTxs = await idbGetAll('transactions');
        const sQueue = await idbGetAll('syncQueue');
        const sHistory = await idbGetAll('syncHistory');
        
        setSyncQueue(sQueue);
        setSyncHistory(sHistory);

        if (cachedLots.length > 0 || cachedTxs.length > 0) {
          setData(prev => ({ 
            ...prev, 
            lots: cachedLots.length > 0 ? cachedLots : SEED_DATA.lots, 
            transactions: cachedTxs.length > 0 ? cachedTxs : SEED_DATA.transactions 
          }));
        } else {
          // Initialize DB on first run
          for (const lot of SEED_DATA.lots) await idbPut('lots', lot);
          for (const tx of SEED_DATA.transactions) await idbPut('transactions', tx);
          setData(prev => ({ ...prev, lots: SEED_DATA.lots, transactions: SEED_DATA.transactions }));
        }
      } catch (e) {
        console.error("Failed to load local DB", e);
      } finally {
        setDbLoading(false);
      }
    };
    loadOfflineData();
  }, []);

  const createDocument = async (collectionName, payload) => {
    if (!authUser) throw new Error("Must be logged in");
    const id = Math.random().toString(36).substr(2, 9);
    const newItem = { id, ...payload, created_at: new Date().toISOString() };
    
    // Optimistic UI Update
    setData(prev => ({ ...prev, [collectionName]: [...prev[collectionName], newItem] }));
    await idbPut(collectionName, newItem);

    // Sync Queue logic
    if (isOnline) {
       // Simulate direct push
       setSyncState('synced');
    } else {
       const queuedItem = { 
         id: Math.random().toString(36).substr(2, 9), 
         action: 'CREATE', 
         collection: collectionName, 
         payload: newItem, 
         timestamp: new Date().toISOString(), 
         status: 'pending' 
       };
       await idbPut('syncQueue', queuedItem);
       setSyncQueue(prev => [...prev, queuedItem]);
       setSyncState('offline');
    }
    return newItem;
  };

  const updateDocument = async (collectionName, id, payload) => {
    if (!authUser) throw new Error("Must be logged in");
    
    // Find & update item locally
    const existing = data[collectionName].find(x => x.id === id) || {};
    const updatedItem = { ...existing, ...payload, updated_at: new Date().toISOString() };
    
    setData(prev => ({
      ...prev,
      [collectionName]: prev[collectionName].map(item => item.id === id ? updatedItem : item)
    }));
    await idbPut(collectionName, updatedItem);

    if (isOnline) {
       setSyncState('synced');
    } else {
       const queuedItem = { 
         id: Math.random().toString(36).substr(2, 9), 
         action: 'UPDATE', 
         collection: collectionName, 
         payload: updatedItem, 
         timestamp: new Date().toISOString(), 
         status: 'pending' 
       };
       await idbPut('syncQueue', queuedItem);
       setSyncQueue(prev => [...prev, queuedItem]);
       setSyncState('offline');
    }
    return true;
  };

  const dbHelpers = useMemo(() => {
    if (!authUser) return {};
    return {
      // Collector Queries
      getCollectorLots: (collectorId) => data.lots.filter(l => l.collector_id === collectorId),
      getCollectorTransactions: (collectorId) => data.transactions.filter(t => t.collector_id === collectorId),
      getCollectorEarnings: (collectorId) => {
        const txs = data.transactions.filter(t => t.collector_id === collectorId && t.transaction_status === 'Completed');
        return txs.reduce((sum, tx) => sum + (Number(tx.final_price) || 0), 0);
      },
      getLedgerStats: (collectorId) => {
        const txs = data.transactions.filter(t => t.collector_id === collectorId);
        const completedTxs = txs.filter(t => t.transaction_status === 'Completed');
        return {
          totalEarnings: completedTxs.reduce((sum, tx) => sum + (Number(tx.final_price) || 0), 0),
          pendingPayments: txs.filter(t => t.payment_status === 'Pending').reduce((sum, tx) => sum + (Number(tx.final_price) || 0), 0),
          completedPayments: txs.filter(t => ['Paid', 'Cash Received', 'Digital Payment'].includes(t.payment_status)).reduce((sum, tx) => sum + (Number(tx.final_price) || 0), 0),
          totalLotsSold: completedTxs.length
        };
      },
      getMonthlyEarnings: (collectorId) => {
        const txs = data.transactions.filter(t => t.collector_id === collectorId && t.transaction_status === 'Completed');
        const months = [];
        for(let i=5; i>=0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          months.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), amount: 0 });
        }
        // Seed past months to demonstrate ledger capability
        months[0].amount = 4500; months[1].amount = 6200; months[2].amount = 5800; months[3].amount = 8100; months[4].amount = 7400;
        txs.forEach(tx => { months[5].amount += (Number(tx.final_price) || 0) });
        return months;
      },
      getRecyclerEarnings: (collectorId) => {
         const txs = data.transactions.filter(t => t.collector_id === collectorId && t.transaction_status === 'Completed');
         const breakdown = {};
         txs.forEach(tx => {
           breakdown[tx.recycler_name] = (breakdown[tx.recycler_name] || 0) + (Number(tx.final_price) || 0);
         });
         // Add visual demonstration data if network is empty
         if (Object.keys(breakdown).length === 0) {
           breakdown['GreenTech Solutions'] = 15400;
           breakdown['EcoRecycle Hub'] = 8200;
         }
         return Object.entries(breakdown).map(([name, amount]) => ({ name, amount })).sort((a,b) => b.amount - a.amount);
      },

      // Recycler Queries
      getRecyclerIncomingLots: () => data.lots.filter(l => l.status === 'Available' || l.status === 'Pending' || l.status === 'Created'),
      getRecyclerTransactions: (recyclerId) => data.transactions.filter(t => t.recycler_id === recyclerId),
      getRecyclerTotalWeight: (recyclerId) => {
        const txs = data.transactions.filter(t => t.recycler_id === recyclerId && t.transaction_status === 'Completed');
        return txs.length * 45; // Mocking 45kg per tx
      },

      // Admin Queries
      getTotalStats: () => ({
        collectors: data.profiles.filter(p => p.role === 'collector').length,
        recyclers: data.profiles.filter(p => p.role === 'recycler').length,
        totalLots: data.lots.length,
        transactions: data.transactions.length
      }),

      // Transaction Action
      completeHandover: async (txRef, finalWeight) => {
        const tx = data.transactions.find(t => t.tx_ref === txRef);
        if(!tx) throw new Error("Transaction not found");
        
        const matInfo = PricingService.getMaterialDetails(tx.category);
        const currentPrice = PricingService.getCurrentPrice(tx.category, 'Pune');
        const finalPrice = Math.round(finalWeight * currentPrice);
        
        const newTimeline = [...tx.timeline, 
          { status: 'Handed Over', timestamp: new Date().toISOString(), note: 'Material physically received' },
          { status: 'Completed', timestamp: new Date(Date.now() + 1000).toISOString(), note: `Weight verified (${finalWeight}${matInfo.unit}), Payment ₹${finalPrice} recorded as Cash Received` }
        ];

        const updatedTx = { ...tx, transaction_status: 'Completed', final_weight: finalWeight, final_price: finalPrice, payment_status: 'Cash Received', payment_date: new Date().toISOString(), timeline: newTimeline };
        
        // Update local memory and IDB
        setData(prev => ({
          ...prev,
          transactions: prev.transactions.map(t => t.tx_ref === txRef ? updatedTx : t),
          lots: prev.lots.map(l => l.lot_id === tx.lot_id ? { ...l, status: 'Completed' } : l)
        }));
        
        await idbPut('transactions', updatedTx);
        const l = data.lots.find(x => x.lot_id === tx.lot_id);
        if(l) await idbPut('lots', { ...l, status: 'Completed' });

        if (isOnline) {
           setSyncState('synced');
        } else {
           const queuedItem = { 
             id: Math.random().toString(36).substr(2, 9), 
             action: 'UPDATE', 
             collection: 'transactions', 
             payload: updatedTx, 
             timestamp: new Date().toISOString(), 
             status: 'pending' 
           };
           await idbPut('syncQueue', queuedItem);
           setSyncQueue(prev => [...prev, queuedItem]);
           setSyncState('offline');
        }
        
        return { finalPrice, finalWeight, lotId: tx.lot_id };
      },

      isOnline, syncState, syncQueue, syncHistory, processSync,
      ...data, createDocument, updateDocument
    };
  }, [data, authUser, isOnline, syncState, syncQueue, syncHistory, processSync]);

  return (
    <DatabaseContext.Provider value={{ ...dbHelpers, dbLoading }}>
      {children}
    </DatabaseContext.Provider>
  );
};


// --- AUTHENTICATION ABSTRACTION ---
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = MOCK_PROFILES.find(u => u.email === email && u.password === password);
        if (user) {
          setCurrentUser(user);
          resolve(user);
        } else {
          reject(new Error("Invalid credentials. Try the demo buttons below."));
        }
        setLoading(false);
      }, 600);
    });
  };

  const register = async (userData) => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = { 
          uid: Math.random().toString(36).substr(2, 9), 
          ...userData, 
          created_at: new Date().toISOString() 
        };
        MOCK_PROFILES.push(newUser);
        setCurrentUser(newUser);
        resolve(newUser);
        setLoading(false);
      }, 600);
    });
  };

  const guestLogin = async (role) => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const guestUser = role === 'collector' 
          ? { uid: `guest_${Date.now()}`, role: 'collector', email: `guest_${Date.now()}@local`, name: 'Guest Collector', location: 'Pune', language: 'en' }
          : { uid: `guest_${Date.now()}`, role: 'recycler', email: `guest_${Date.now()}@local`, orgName: 'Guest Recycler Org', location: 'Mumbai', contact: '0000000000', status: 'Guest User' };
          
        MOCK_PROFILES.push(guestUser);
        setCurrentUser(guestUser);
        resolve(guestUser);
        setLoading(false);
      }, 600);
    });
  };

  const logout = () => {
    setCurrentUser(null); 
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, guestLogin, loading }}>
      <DatabaseProvider authUser={currentUser}>
        {children}
      </DatabaseProvider>
    </AuthContext.Provider>
  );
};


// --- COMPONENTS ---
const Button = ({ children, variant = 'primary', className = '', isLoading = false, ...props }) => {
  const baseStyle = "font-semibold rounded-xl px-6 py-3 transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md",
    secondary: "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700",
    outline: "bg-transparent text-emerald-500 border-2 border-emerald-500 hover:bg-emerald-50",
    action: "bg-amber-400 text-gray-900 hover:bg-amber-500 shadow-lg text-lg py-4 w-full",
    admin: "bg-purple-600 text-white hover:bg-purple-700 shadow-md"
  };
  
  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''} ${className}`} 
      disabled={isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin h-5 w-5" />}
      {!isLoading && children}
    </button>
  );
};

const Card = ({ children, className = '', hover = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-gray-800 border border-gray-700 rounded-2xl p-6 ${hover ? 'hover:border-emerald-500 cursor-pointer transition-colors duration-200' : ''} ${className}`}
  >
    {children}
  </div>
);

const DashboardCard = ({ icon, imageUrl, title, subtitle, onClick }) => (
  <div
    onClick={onClick}
    className="flex flex-col bg-[#383842] rounded-[28px] p-3 cursor-pointer active:scale-95 transition-transform duration-200 hover:ring-1 hover:ring-emerald-500/30"
  >
    <div className="relative w-full h-36 rounded-[20px] overflow-hidden bg-gradient-to-br from-[#24242B] to-[#12121A] mb-3 group shadow-inner">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 mix-blend-lighten"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/30 to-transparent opacity-90 z-0 pointer-events-none"></div>
      <div className="absolute top-3 left-3 z-10 w-10 h-10 rounded-[12px] bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-xl">
        {icon}
      </div>
    </div>
    <div className="px-2 pb-1 text-left">
      <h3 className="text-white font-extrabold text-[13px] tracking-wider leading-tight mb-1 uppercase drop-shadow-sm">{title}</h3>
      <p className="text-[#9CA3AF] text-[11px] font-medium">{subtitle}</p>
    </div>
  </div>
);

// --- CONNECTION INDICATOR ---
const ConnectionIndicator = ({ onClick }) => {
  const { isOnline, syncState, syncQueue } = useDatabase();
  
  let config = { icon: CheckCircle, text: 'Online • Live', bg: 'bg-[#1A2F2B]', border: 'border-[#23453D]', textCol: 'text-emerald-400' };
  
  if (!isOnline) {
    config = { icon: CloudOff, text: `Offline (${syncQueue?.length || 0})`, bg: 'bg-[#2D1A1A]', border: 'border-[#4A2323]', textCol: 'text-rose-400' };
  } else if (syncState === 'syncing') {
    config = { icon: RefreshCw, text: 'Syncing Data...', bg: 'bg-[#1A2A3A]', border: 'border-[#233D4A]', textCol: 'text-cyan-400', spin: true };
  } else if (syncQueue?.length > 0) {
    config = { icon: Database, text: `${syncQueue.length} Pending`, bg: 'bg-[#2D2A1A]', border: 'border-[#4A4523]', textCol: 'text-amber-400' };
  }

  const Icon = config.icon;
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-inner transition-all ${config.bg} ${config.border} ${config.textCol} hover:opacity-80 active:scale-95`}>
      <Icon className={`h-3.5 w-3.5 ${config.spin ? 'animate-spin' : ''}`} />
      {config.text}
    </button>
  );
};

// --- SYNC CENTER PAGE ---
const SyncCenterPage = ({ onBack }) => {
  const { isOnline, syncQueue, syncHistory, processSync, syncState } = useDatabase();

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans text-white">
      <div className="sticky top-0 bg-[#121212]/90 backdrop-blur z-20 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-xl font-bold">Sync Center</h1>
        </div>
        <ConnectionIndicator />
      </div>

      <div className="p-6">
        {/* Main Status Panel */}
        <div className="bg-[#24242B] border border-[#2A2A35] rounded-3xl p-6 mb-8 text-center shadow-lg relative overflow-hidden">
          {isOnline ? (
             <div className="w-20 h-20 bg-emerald-900/30 rounded-full mx-auto flex items-center justify-center border-4 border-emerald-500/20 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
               <Wifi className="w-10 h-10 text-emerald-400" />
             </div>
          ) : (
             <div className="w-20 h-20 bg-rose-900/30 rounded-full mx-auto flex items-center justify-center border-4 border-rose-500/20 mb-4 shadow-[0_0_30px_rgba(225,29,72,0.15)]">
               <WifiOff className="w-10 h-10 text-rose-400" />
             </div>
          )}
          
          <h2 className="text-2xl font-bold mb-2">
            {isOnline ? (syncState === 'syncing' ? 'Synchronizing...' : 'Network Connected') : 'Offline Mode Active'}
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            {isOnline 
              ? "Your app is connected to the cloud server. Data will be saved remotely." 
              : "No internet detected. You can continue working safely. Data will sync automatically when you reconnect."}
          </p>
          
          <Button 
            onClick={processSync} 
            disabled={!isOnline || syncQueue.length === 0 || syncState === 'syncing'} 
            variant="outline" 
            className="w-full max-w-xs mx-auto py-3"
          >
            {syncState === 'syncing' ? 'Syncing Now...' : 'Force Sync Now'}
          </Button>
        </div>

        {/* Pending Queue */}
        <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
          <Database className="w-4 h-4 text-amber-500" /> Pending Uploads ({syncQueue.length})
        </h3>
        <div className="space-y-3 mb-8">
          {syncQueue.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center text-sm text-gray-500">
              No pending records. Everything is up to date.
            </div>
          ) : (
            syncQueue.map(item => (
              <div key={item.id} className="bg-gray-800 border border-amber-500/30 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] bg-gray-900 text-gray-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold mb-1 inline-block">
                    {item.collection}
                  </span>
                  <p className="font-medium text-white text-sm">{item.action} Record</p>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <RefreshCw className={`w-5 h-5 text-amber-500 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
              </div>
            ))
          )}
        </div>

        {/* Sync History */}
        <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
          <Clock className="w-4 h-4 text-gray-500" /> Recent Activity
        </h3>
        <div className="space-y-3">
          {syncHistory.length === 0 ? (
            <div className="text-sm text-gray-500 pl-2">No recent sync history.</div>
          ) : (
            syncHistory.slice(0, 10).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-300">Synced {item.collection}</p>
                    <p className="text-[10px] text-gray-500">{new Date(item.syncedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


// --- LAYOUTS ---
const Navbar = ({ onNavigate, currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate('landing');
  };

  const getDashboardRoute = () => {
    if (!currentUser) return 'login';
    if (currentUser.role === 'admin') return 'admin-dashboard';
    if (currentUser.role === 'recycler') return 'recycler-dashboard';
    return 'dashboard';
  };

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('landing')}>
            <Recycle className="h-8 w-8 text-emerald-500" />
            <span className="ml-2 text-xl font-bold text-white tracking-tight hidden sm:block">
              Kabadiwala <span className="text-emerald-500">Connect</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => onNavigate('landing')} className={`text-sm font-medium ${currentPage === 'landing' ? 'text-emerald-400' : 'text-gray-300 hover:text-white'}`}>Home</button>
            <button onClick={() => onNavigate('language')} className={`text-sm font-medium ${currentPage === 'language' ? 'text-emerald-400' : 'text-gray-300 hover:text-white'}`}>Language</button>
            
            {currentUser ? (
              <div className="flex items-center gap-4 ml-4">
                <button onClick={() => onNavigate(getDashboardRoute())} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                  My Dashboard
                </button>
                <div className="h-4 w-px bg-gray-700"></div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <UserCircle className="h-5 w-5" />
                  {currentUser.name || currentUser.orgName}
                </div>
                <Button onClick={handleLogout} variant="secondary" className="py-2 px-4 text-sm">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4 ml-4">
                <button onClick={() => onNavigate('login')} className="text-sm font-medium text-gray-300 hover:text-white">
                  Login
                </button>
                <Button onClick={() => onNavigate('register')} variant="primary" className="py-2 px-4 text-sm">
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-gray-800 border-b border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             <button onClick={() => { onNavigate('landing'); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">Home</button>
             {currentUser ? (
               <>
                 <button onClick={() => { onNavigate(getDashboardRoute()); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-emerald-400 hover:bg-gray-700">My Dashboard</button>
                 <div className="px-3 py-2 text-sm text-gray-400 border-t border-gray-700 mt-2 pt-2">Logged in as: {currentUser.name || currentUser.orgName}</div>
                 <button onClick={() => { handleLogout(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-gray-700">Logout</button>
               </>
             ) : (
               <>
                 <button onClick={() => { onNavigate('login'); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700">Login</button>
                 <button onClick={() => { onNavigate('register'); setIsOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-emerald-400 hover:bg-gray-700">Sign Up</button>
               </>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

const MobileBottomNav = ({ onNavigate, currentPage }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  
  let navItems = [
    { id: 'dashboard', icon: Home, labelKey: 'nav.home' },
    { id: 'materials', icon: Package, labelKey: 'nav.materials' },
    { id: 'prices', icon: IndianRupee, labelKey: 'nav.prices' },
    { id: 'recyclers', icon: Search, labelKey: 'nav.find' },
  ];

  if (currentUser?.role === 'recycler') {
    navItems = [
      { id: 'recycler-dashboard', icon: Home, labelKey: 'nav.home' },
      { id: 'incoming-lots', icon: Package, labelKey: 'nav.incoming' },
      { id: 'material-offers', icon: FileText, labelKey: 'nav.offers' },
      { id: 'recycler-transactions', icon: Clock, labelKey: 'nav.history' },
    ];
  } else if (currentUser?.role === 'admin') {
    navItems = [
      { id: 'admin-dashboard', icon: Home, labelKey: 'nav.admin' },
      { id: 'verify-recyclers', icon: ShieldCheck, labelKey: 'nav.verify' },
      { id: 'analytics', icon: BarChart, labelKey: 'nav.data' },
      { id: 'settings', icon: Settings, labelKey: 'nav.settings' },
    ];
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[12px] font-semibold">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


// --- AUTH PAGES ---
const LoginPage = ({ onNavigate }) => {
  const { login, guestLogin, loading } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    try {
      await login(email, password);
      onNavigate('dashboard'); 
    } catch (err) {
      setError(err.message);
    }
  };

  const fillDemo = async (role) => {
    try {
      await login(`${role}@demo.com`, 'demo123');
      onNavigate('dashboard');
    } catch(err) { setError(err.message); }
  };

  const handleGuestLogin = async (role) => {
    setError('');
    try {
      await guestLogin(role);
      onNavigate(role === 'recycler' ? 'recycler-dashboard' : 'dashboard'); 
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center border border-gray-700 mb-4">
            <LogIn className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">{t('login.title')}</h2>
          <p className="mt-2 text-gray-400">{t('login.sub')}</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm text-center">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('login.email')}</label>
              <input type="email" required className="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors" placeholder="user@demo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('login.pass')}</label>
              <input type="password" required className="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={loading}>{t('login.btn')}</Button>
        </form>

        <div className="mt-8 border-t border-gray-700 pt-6">
          <p className="text-sm text-gray-400 text-center mb-4">{t('login.or')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button onClick={() => handleGuestLogin('collector')} className="px-4 py-3 bg-gray-900 border border-emerald-900/50 hover:border-emerald-500 rounded-xl text-sm font-medium text-emerald-400 transition-colors flex items-center justify-center gap-2">
              <UserPlus className="h-5 w-5" /> {t('login.guestC')}
            </button>
            <button onClick={() => handleGuestLogin('recycler')} className="px-4 py-3 bg-gray-900 border border-amber-900/50 hover:border-amber-500 rounded-xl text-sm font-medium text-amber-400 transition-colors flex items-center justify-center gap-2">
              <Building2 className="h-5 w-5" /> {t('login.guestR')}
            </button>
          </div>
          <div className="flex justify-center">
            <button onClick={() => fillDemo('admin')} className="text-xs text-gray-500 hover:text-purple-400 transition-colors underline">Admin Demo Login</button>
          </div>
        </div>
        
        <p className="text-center text-sm text-gray-400 mt-6">
          {t('login.noAcc')}{' '}
          <button onClick={() => onNavigate('register')} className="font-medium text-emerald-400 hover:text-emerald-300">
            {t('login.signup')}
          </button>
        </p>
      </div>
    </div>
  );
};

const RegisterPage = ({ onNavigate }) => {
  const { register, loading } = useAuth();
  const [role, setRole] = useState('collector');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', language: 'hi', location: '', orgName: '', contact: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = { role, email: formData.email, location: formData.location };
      if (role === 'collector') Object.assign(dataToSave, { name: formData.name, language: formData.language, earningsToday: 0 });
      else Object.assign(dataToSave, { orgName: formData.orgName, contact: formData.contact, status: 'Pending Verification' });
      await register(dataToSave);
      onNavigate(role === 'recycler' ? 'recycler-dashboard' : 'dashboard');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl mb-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center border border-gray-700 mb-4"><UserPlus className="h-8 w-8 text-emerald-400" /></div>
          <h2 className="text-3xl font-extrabold text-white">Create Account</h2>
        </div>
        <div className="flex p-1 bg-gray-900 rounded-xl mb-6">
          <button type="button" onClick={() => setRole('collector')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'collector' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Collector</button>
          <button type="button" onClick={() => setRole('recycler')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'recycler' ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Recycler</button>
        </div>
        <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border border-gray-700 bg-gray-900 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 border border-gray-700 bg-gray-900 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          {role === 'collector' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name (Optional)</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-700 bg-gray-900 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Operating Location</label>
                <input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 border border-gray-700 bg-gray-900 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Organization Name</label>
                <input type="text" required value={formData.orgName} onChange={e => setFormData({...formData, orgName: e.target.value})} className="w-full px-4 py-3 border border-gray-700 bg-gray-900 text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Facility Location</label>
                <input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 border border-gray-700 bg-gray-900 text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none" />
              </div>
            </>
          )}
          <Button type="submit" variant={role === 'collector' ? 'primary' : 'action'} className="w-full" isLoading={loading}>
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
};


// --- MAIN DASHBOARDS ---
const SignMaterials = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-[#EAB308]">
    <path d="M18.8 15l-3.3-5.7c-.5-.8-1.5-.8-2 0l-1.3 2.2 1.9 3.3h-4.3l-1.4 2.5h8.9c.7 0 1.2-.5 1.2-1.2v-1.1zM9.7 13.8L6.4 8c-.3-.5-.1-1.2.4-1.5.2-.1.4-.2.7-.2h6.7l-1.4 2.5H7.5l2.4 4.2-1.4 2.4c.5 1.1 1.7 1.4 2.8.8l1.3-2.3-2.9-4.8zM17.4 6H9.1l2.5-4.3c.5-.8 1.5-.8 2 0L18 9.3c.3.5.1 1.2-.4 1.5-.2.1-.5.2-.7.2h-3l1.4-2.5h2.1z"/>
  </svg>
);

const SignPrices = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#10B981]">
    <path d="M6 3h12M6 8h12M6 13h3.5c3.5 0 6-2 6-5s-2.5-5-6-5M9 13l6 8"/>
  </svg>
);

const SignRecycler = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#F87171]">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="rgba(248, 113, 113, 0.2)"/><circle cx="12" cy="10" r="3" fill="currentColor"/><path d="M12 23v-5"/>
  </svg>
);

const SignTransactions = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" strokeWidth="3"/>
  </svg>
);

const SignIdentify = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#22D3EE]">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3" fill="currentColor"/><path d="M19 10v.01" strokeWidth="3"/>
  </svg>
);

const SignSafety = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#FB7185]">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(251, 113, 133, 0.2)"/><path d="M12 8v4" /><path d="M12 16h.01" strokeWidth="4"/>
  </svg>
);


const CollectorDashboard = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const db = useDatabase();
  const { t } = useLanguage();
  
  const name = currentUser?.name || "Collector";
  const location = currentUser?.location || "Unknown Area";
  const earnings = db?.getCollectorEarnings ? db.getCollectorEarnings(currentUser?.uid) : 0;
  const activeLots = db?.getCollectorLots ? db.getCollectorLots(currentUser?.uid).filter(l => l.status !== 'Completed').length : 0;

  return (
    <div className="min-h-screen bg-[#121212] pb-40 font-sans">
      <div className="p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212]">
        <div className="flex justify-between items-start mb-6">
           <ConnectionIndicator onClick={() => onNavigate('sync-center')} />
           <div className="inline-flex items-center gap-2 bg-[#2D1A1A] text-red-400 px-3 py-1.5 rounded-full text-sm font-medium border border-[#4A2323]">
             <Bell className="h-4 w-4" /> {activeLots > 0 ? `${activeLots} Alerts` : '0 Alerts'}
           </div>
        </div>

        <div className="flex justify-between items-end mb-6">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-gray-400 text-sm mb-1">{t('dash.greeting')}</p>
              <h1 className="text-2xl font-bold text-white uppercase tracking-wide">{name}</h1>
            </div>
            <VoiceAssistant textKey="tts.welcome" />
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs tracking-widest uppercase mb-1">{t('dash.earnings')}</p>
            <p className="text-2xl font-bold text-[#EAB308]">₹{earnings.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="bg-[#24242B] text-white px-4 py-2 rounded-full text-sm font-medium border border-[#2A2A35] flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-500" /> {location}
          </button>
          <button onClick={() => onNavigate('language')} className="bg-[#24242B] text-gray-300 px-4 py-2 rounded-full text-sm font-medium border border-[#2A2A35] flex items-center gap-2 hover:bg-gray-800">
            <Globe className="h-4 w-4 text-cyan-500" /> Language
          </button>
        </div>
      </div>

      <div className="px-6 grid grid-cols-2 gap-4 mt-2">
        <DashboardCard icon={<SignMaterials />} imageUrl="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" title={t('dash.myMaterials')} subtitle={t('dash.myMaterials.sub')} onClick={() => onNavigate('materials')} />
        <DashboardCard icon={<SignPrices />} imageUrl="https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?auto=format&fit=crop&w=600&q=80" title={t('dash.prices')} subtitle={t('dash.prices.sub')} onClick={() => onNavigate('prices')} />
        <DashboardCard icon={<SignRecycler />} imageUrl="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80" title={t('dash.findRecycler')} subtitle={t('dash.findRecycler.sub')} onClick={() => onNavigate('recyclers')} />
        <DashboardCard icon={<SignTransactions />} imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" title={t('dash.transactions')} subtitle={t('dash.transactions.sub')} onClick={() => onNavigate('transactions')} />
      </div>

      <div className="px-6 mt-8">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <BrainCircuit className="text-emerald-400 h-5 w-5" /> AI Assistants
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
             <DashboardCard icon={<SignIdentify />} imageUrl="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80" title="SMART IDENTIFY" subtitle="AI Camera" onClick={() => onNavigate('smart-identify')} />
          </div>
          <div className="relative">
             <DashboardCard icon={<SignSafety />} imageUrl="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80" title="SAFETY GUIDE" subtitle="Safety Rules" onClick={() => onNavigate('safety-guide')} />
             <div className="absolute top-2 right-2"><VoiceAssistant textKey="tts.safety" /></div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-6 right-6 z-40">
         <Button variant="action" onClick={() => onNavigate('create-lot')} className="text-xl py-5 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
           {t('dash.weighAndSell')}
         </Button>
      </div>
    </div>
  );
};


const RecyclerDashboard = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const db = useDatabase();

  const orgName = currentUser?.orgName || "Partner Facility";
  const location = currentUser?.location || "Unknown Facility";
  const status = currentUser?.status || "Pending";
  const incomingLotsCount = db?.getRecyclerIncomingLots ? db.getRecyclerIncomingLots().length : 0;
  const totalWeight = db?.getRecyclerTotalWeight ? db.getRecyclerTotalWeight(currentUser?.uid) : 0;

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans">
      <div className="p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212]">
        <div className="flex justify-between items-start mb-6">
           <ConnectionIndicator onClick={() => onNavigate('sync-center')} />
           <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${status === 'Authorized' ? 'bg-[#1A2F2B] text-emerald-400 border-[#23453D]' : 'bg-[#2D2A1A] text-amber-400 border-[#4A4523]'}`}>
             <CheckCircle className="h-4 w-4" /> {status}
           </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-1">Welcome back,</p>
          <h1 className="text-2xl font-bold text-white tracking-wide">{orgName}</h1>
          <p className="text-gray-400 mt-1 flex items-center gap-1 text-sm"><Building2 className="h-4 w-4" /> {location}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Incoming Lots</p>
            <p className="text-2xl font-bold text-amber-500">{db?.dbLoading ? '...' : incomingLotsCount}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Weight Processed</p>
            <p className="text-2xl font-bold text-emerald-500">{db?.dbLoading ? '...' : totalWeight} <span className="text-sm text-gray-500">kg</span></p>
          </div>
        </div>
      </div>

      <div className="px-6 grid grid-cols-2 gap-4 mt-2">
        <DashboardCard icon={<Package className="text-amber-500 h-8 w-8" />} iconBg="bg-[#2D2A1A]" title="INCOMING LOTS" subtitle="Review handovers" onClick={() => onNavigate('incoming-lots')} />
        <DashboardCard icon={<LineChart className="text-emerald-500 h-8 w-8" />} iconBg="bg-[#1A2D2B]" title="MARKET RATES" subtitle="Check prices" onClick={() => onNavigate('prices')} />
        <DashboardCard icon={<Scale className="text-cyan-400 h-8 w-8" />} iconBg="bg-[#1A2D3A]" title="CONFIRM WEIGHT" subtitle="Scan & verify" onClick={() => onNavigate('handover-confirmation')} />
        <DashboardCard icon={<Clock className="text-gray-400 h-8 w-8" />} iconBg="bg-[#2A2A35]" title="HISTORY" subtitle="All transactions" onClick={() => onNavigate('recycler-transactions')} />
      </div>
    </div>
  );
};

const AdminDashboard = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const db = useDatabase();
  const name = currentUser?.name || "Admin";
  const stats = db?.getTotalStats ? db.getTotalStats() : { collectors: 0, recyclers: 0, totalLots: 0, transactions: 0 };

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans">
      <div className="p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212]">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <p className="text-gray-400 text-sm mb-1">System Administration</p>
            <h1 className="text-2xl font-bold text-white tracking-wide">Hello, {name}</h1>
          </div>
          <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center border border-purple-700">
             <ShieldCheck className="h-6 w-6 text-purple-400" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{db?.dbLoading ? '...' : stats.collectors}</p>
            <p className="text-[10px] text-gray-400 uppercase mt-1">Collectors</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{db?.dbLoading ? '...' : stats.recyclers}</p>
            <p className="text-[10px] text-gray-400 uppercase mt-1">Recyclers</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-cyan-400">{db?.dbLoading ? '...' : stats.totalLots}</p>
            <p className="text-[10px] text-gray-400 uppercase mt-1">Lots Created</p>
          </div>
        </div>
      </div>
      <div className="px-6 grid grid-cols-2 gap-4 mt-2">
        <DashboardCard icon={<ShieldCheck className="text-purple-400 h-8 w-8" />} iconBg="bg-[#2D1A3A]" title="VERIFY PARTNERS" subtitle="Pending Checks" onClick={() => onNavigate('verify-recyclers')} />
        <DashboardCard icon={<Users className="text-emerald-500 h-8 w-8" />} iconBg="bg-[#1A2D2B]" title="USER MANAGEMENT" subtitle="Network directory" onClick={() => onNavigate('user-management')} />
        <DashboardCard icon={<BarChart className="text-cyan-400 h-8 w-8" />} iconBg="bg-[#1A2D3A]" title="PLATFORM STATS" subtitle={`${stats.transactions} Transactions`} onClick={() => onNavigate('analytics')} />
        <DashboardCard icon={<Settings className="text-gray-400 h-8 w-8" />} iconBg="bg-[#2A2A35]" title="SYSTEM SETTINGS" subtitle="Configuration" onClick={() => onNavigate('settings')} />
      </div>
    </div>
  );
};

const PlaceholderPage = ({ title, onBack }) => (
  <div className="min-h-screen bg-[#121212] p-6 text-center flex flex-col items-center justify-center pb-24">
    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-700 shadow-lg">
      <Recycle className="h-10 w-10 text-emerald-500 opacity-50" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">{title} Page</h2>
    <p className="text-gray-400 mb-8 max-w-sm">This section is under development.</p>
    <Button onClick={onBack} variant="outline">Back to Dashboard</Button>
  </div>
);


// --- PRICE DISCOVERY SYSTEM ---
const CustomBarChart = ({ data, unit }) => {
  const max = Math.max(...data.map(d => d.price));
  const min = Math.min(...data.map(d => d.price));
  const range = max - min || 1; // Prevent div by 0
  
  return (
    <div className="flex items-end justify-between h-32 gap-2 mt-4 px-2">
      {data.map((d, i) => {
        const heightPct = 25 + ((d.price - min) / range) * 75; // 25% min height to make bars visible
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-2 group cursor-default">
            <div 
              className="w-full bg-gradient-to-t from-emerald-900/50 to-emerald-500/30 rounded-t-md group-hover:to-emerald-400/60 transition-all relative border-t border-emerald-500/50" 
              style={{ height: `${heightPct}%` }}
            >
               <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-gray-800 px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                 ₹{d.price}
               </span>
            </div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const PricesPage = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  
  // States
  const [selectedLocation, setSelectedLocation] = useState(
    PricingService.locations.includes(currentUser?.location) ? currentUser.location : 'Pune'
  );
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedMaterial, setExpandedMaterial] = useState(null);
  
  // Derived Data
  const categories = PricingService.getAllCategories();
  const allMaterials = PricingService.materials;
  
  const filteredMaterials = allMaterials.filter(m => 
    selectedCategory === 'All' || m.category === selectedCategory
  );

  const handleCardClick = (materialId) => {
    setExpandedMaterial(expandedMaterial === materialId ? null : materialId);
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212]/95 backdrop-blur border-b border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate(currentUser?.role === 'recycler' ? 'recycler-dashboard' : 'dashboard')} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 hover:bg-gray-700">
              <ArrowRight className="h-5 w-5 rotate-180 text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold">Market Prices</h1>
          </div>
          
          <div className="relative">
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="appearance-none bg-[#24242B] border border-[#2A2A35] text-emerald-400 font-semibold rounded-xl pl-10 pr-8 py-2 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              {PricingService.locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50' 
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-4">
        {filteredMaterials.map((material) => {
          const currentPrice = PricingService.getCurrentPrice(material.id, selectedLocation);
          const trend = PricingService.getTrendAnalysis(currentPrice, material.id, selectedLocation);
          const isExpanded = expandedMaterial === material.id;
          const TrendIcon = trend.icon;

          return (
            <div key={material.id} className="bg-[#24242B] border border-[#2A2A35] rounded-2xl overflow-hidden transition-all duration-300 shadow-sm">
              {/* Card Header (Always Visible) */}
              <div onClick={() => handleCardClick(material.id)} className="p-5 cursor-pointer hover:bg-[#2A2A35]/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{material.id}</h3>
                    <span className="text-xs text-gray-500 uppercase tracking-wider bg-gray-900 px-2 py-1 rounded-md border border-gray-800">
                      {material.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white flex items-end justify-end gap-1">
                      ₹{currentPrice} <span className="text-sm font-medium text-gray-500 mb-1">/ {material.unit}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800/50">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${trend.bg} ${trend.color}`}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    {trend.value}
                    <span className="font-normal opacity-80 ml-1 hidden sm:inline">{trend.text.replace(trend.value, '')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" /> Updated Today
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ml-1 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>

              {/* Expanded Details Section */}
              {isExpanded && (
                <div className="p-5 bg-[#1C1C22] border-t border-[#2A2A35] animate-in slide-in-from-top-2 duration-300">
                  
                  {/* Market Stats Row */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {(() => {
                      const stats = PricingService.getMarketStats(material.id, selectedLocation);
                      return (
                        <>
                          <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50 text-center">
                            <p className="text-[10px] text-gray-500 uppercase mb-1">Min Rate</p>
                            <p className="text-lg font-bold text-gray-300">₹{stats.min}</p>
                          </div>
                          <div className="bg-emerald-900/10 rounded-xl p-3 border border-emerald-900/30 text-center">
                            <p className="text-[10px] text-emerald-500/70 uppercase mb-1">Market Avg</p>
                            <p className="text-lg font-bold text-emerald-400">₹{stats.avg}</p>
                          </div>
                          <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50 text-center">
                            <p className="text-[10px] text-gray-500 uppercase mb-1">Max Rate</p>
                            <p className="text-lg font-bold text-gray-300">₹{stats.max}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Historical Chart */}
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-500" /> 7-Day Trend
                    </h4>
                    <CustomBarChart data={PricingService.getHistoricalPrices(material.id, selectedLocation)} unit={material.unit} />
                  </div>

                  {/* Recycler Offers Comparison */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                      <Search className="h-4 w-4 text-amber-500" /> Top Recycler Offers nearby
                    </h4>
                    <div className="space-y-3">
                      {PricingService.getRecyclerOffers(material.id, selectedLocation).map((offer, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-900 rounded-xl p-3 border border-gray-800">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-200">{offer.name}</span>
                              {offer.isVerified && <CheckCircle className="h-3.5 w-3.5 text-blue-400" />}
                            </div>
                            <div className="text-[11px] text-gray-500 flex gap-2">
                              <span>{offer.distance}</span> • <span>★ {offer.rating}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-bold text-emerald-400 mb-1">₹{offer.offer} <span className="text-xs text-gray-500 font-normal">/{material.unit}</span></div>
                            {currentUser?.role !== 'recycler' && (
                              <button className="text-[10px] font-bold uppercase tracking-wider text-white bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded transition-colors shadow-sm shadow-amber-500/20">
                                Sell Here
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- MATERIAL MANAGEMENT PAGES ---
const generateLotId = () => `KC-${new Date().getFullYear()}-${Math.floor(Math.random()*1000000).toString().padStart(6, '0')}`;

const CreateLotPage = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const db = useDatabase();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [preview, setPreview] = useState(null);

  // Default to first material category from PricingService
  const allMaterials = PricingService.getAllMaterials();
  const [formData, setFormData] = useState({
    image: null,
    category: allMaterials[0], 
    weight: '',
    condition: 'Mixed',
    description: '',
    source_type: 'Household',
    location: currentUser?.location || 'Pune'
  });

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, image: base64 }));
    }
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  // Dynamic estimate using the PricingService
  const calculateEstimate = () => {
    const currentPrice = PricingService.getCurrentPrice(formData.category, formData.location);
    return (parseFloat(formData.weight) || 0) * currentPrice;
  };

  const handleSubmit = async (isDraft = false) => {
    setLoading(true);
    try {
      const lotId = generateLotId();
      const estimate = calculateEstimate();
      const newLot = {
        lot_id: lotId,
        collector_id: currentUser.uid,
        ...formData,
        estimated_value: estimate,
        status: isDraft ? 'Draft' : 'Created',
      };
      await db.createDocument('lots', newLot);
      setSuccessData({ id: lotId, isDraft, estimate });
      setStep(5);
    } catch (err) {
      console.error("Failed to create lot:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{t('step.photo')}</h2>
              </div>
              <VoiceAssistant textKey="tts.photo" />
            </div>
            
            {!preview ? (
              <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-emerald-500/50 bg-emerald-900/10 rounded-3xl cursor-pointer hover:bg-emerald-900/20 transition-colors">
                <Camera className="h-16 w-16 text-emerald-400 mb-4" />
                <span className="text-emerald-400 font-bold text-xl">Tap to Open Camera</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            ) : (
              <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500">
                <img src={preview} alt="Upload preview" className="w-full h-64 object-cover" />
                <label className="absolute bottom-4 right-4 bg-gray-900/90 text-white px-5 py-3 rounded-2xl backdrop-blur cursor-pointer text-lg font-bold border border-gray-700 flex items-center gap-2 shadow-xl">
                  <ImageIcon className="h-6 w-6" /> Retake
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            )}
            <Button onClick={handleNext} disabled={!formData.image} className="w-full mt-6 py-4 text-xl">Continue <ChevronRight className="h-6 w-6"/></Button>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{t('step.category')}</h2>
              </div>
              <VoiceAssistant textKey="tts.category" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 h-72 overflow-y-auto pr-2 pb-10 scrollbar-hide">
              {allMaterials.map(cat => {
                const currentPrice = PricingService.getCurrentPrice(cat, formData.location);
                const matInfo = PricingService.getMaterialDetails(cat);
                return (
                  <button 
                    key={cat} 
                    onClick={() => setFormData({...formData, category: cat})} 
                    className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-center items-center text-center min-h-[110px] transition-all ${formData.category === cat ? 'bg-emerald-900/30 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#24242B] border-[#2A2A35] text-gray-400 hover:border-gray-500'}`}
                  >
                    <span className="font-bold text-lg leading-tight block mb-2">{cat}</span>
                    <span className="text-xs bg-gray-900 px-3 py-1 rounded-full border border-gray-700">₹{currentPrice}/{matInfo.unit}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 mt-6">
              <Button onClick={handleBack} variant="secondary" className="flex-1 py-4 text-lg"><ChevronLeft className="h-6 w-6"/> Back</Button>
              <Button onClick={handleNext} disabled={!formData.category} className="flex-[2] py-4 text-lg">Next <ChevronRight className="h-6 w-6"/></Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{t('step.weight')}</h2>
              </div>
              <VoiceAssistant textKey="tts.weight" />
            </div>
            
            <div className="relative">
              <input type="number" required value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="0.0" className="w-full px-6 py-6 border-2 border-gray-700 bg-gray-900 text-white rounded-3xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none text-4xl font-bold text-center" />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">{PricingService.getMaterialDetails(formData.category).unit}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full px-4 py-4 border border-gray-700 bg-[#24242B] text-white rounded-2xl focus:outline-none text-lg font-medium">
                <option value="Mixed">Mixed Scrap</option>
                <option value="Clean">Clean/Sorted</option>
                <option value="Damaged">Heavy Damage</option>
              </select>
              <select value={formData.source_type} onChange={e => setFormData({...formData, source_type: e.target.value})} className="w-full px-4 py-4 border border-gray-700 bg-[#24242B] text-white rounded-2xl focus:outline-none text-lg font-medium">
                <option value="Household">Household</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
              </select>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button onClick={handleBack} variant="secondary" className="flex-1 py-4 text-lg"><ChevronLeft className="h-6 w-6"/> Back</Button>
              <Button onClick={handleNext} disabled={!formData.weight} className="flex-[2] py-4 text-lg">Review <ChevronRight className="h-6 w-6"/></Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{t('step.price')}</h2>
              </div>
              <VoiceAssistant textKey="tts.price" />
            </div>

            <div className="text-center">
              <div className="text-5xl font-black text-[#EAB308] tracking-tighter mb-1">₹{calculateEstimate().toLocaleString()}</div>
              <p className="text-emerald-400 text-sm font-medium flex items-center justify-center gap-1">
                <Activity className="h-4 w-4" /> Live market rate applied
              </p>
            </div>

            <div className="bg-[#24242B] rounded-2xl p-5 border border-[#2A2A35]">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-700">
                {preview && <img src={preview} alt="Thumb" className="w-16 h-16 rounded-lg object-cover" />}
                <div>
                  <h3 className="text-lg font-bold text-white">{formData.category}</h3>
                  <p className="text-gray-400 text-sm">{formData.weight} {PricingService.getMaterialDetails(formData.category).unit} • {formData.condition}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Current Rate</span><span className="text-emerald-400 font-medium">₹{PricingService.getCurrentPrice(formData.category, formData.location)}/{PricingService.getMaterialDetails(formData.category).unit}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Location</span><span className="text-white font-medium">{formData.location}</span></div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => handleSubmit(false)} isLoading={loading} className="w-full py-4 text-lg bg-amber-500 hover:bg-amber-600 text-gray-900 shadow-amber-500/25">
                {t('step.publish')}
              </Button>
              <Button onClick={() => handleSubmit(true)} isLoading={loading} variant="secondary" className="w-full">
                Save as Draft
              </Button>
              <button onClick={handleBack} className="text-gray-400 text-sm py-2 hover:text-white transition-colors">Go Back and Edit</button>
            </div>
          </div>
        );

      case 5:
        const recommendations = successData ? MatchingService.getRecommendations(formData.category, formData.location, formData.weight) : [];

        return (
          <div className="py-2 animate-in zoom-in-95 duration-500">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/30">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {successData?.isDraft ? 'Draft Saved' : 'Lot Published!'}
              </h2>
              <p className="text-gray-400 text-sm">Lot ID: <span className="font-mono text-emerald-400">{successData?.id}</span></p>
            </div>
            
            {!successData?.isDraft && recommendations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                  <BrainCircuit className="h-5 w-5 text-emerald-400" /> Smart Recommendation Engine
                </h3>
                <div className="space-y-3">
                  {recommendations.map((match, idx) => (
                    <div key={match.recycler.id} className={`p-4 rounded-2xl border transition-all ${idx === 0 ? 'bg-amber-900/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-[#24242B] border-[#2A2A35]'}`}>
                      {idx === 0 && (
                        <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm mb-3">
                          🏆 Best Match
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-white text-lg">{match.recycler.name}</h4>
                          <div className="text-sm text-emerald-400 font-medium">₹{match.offerPrice} / {PricingService.getMaterialDetails(formData.category).unit}</div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${idx === 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-900/30 text-emerald-400 border-emerald-800'}`}>
                          Match Score: {match.score}%
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 mb-4">
                        {match.reasons.map((reason, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button onClick={() => onNavigate('recyclers')} variant={idx === 0 ? 'action' : 'secondary'} className="w-full py-2.5 text-sm">
                        {idx === 0 ? 'Connect Now' : 'View Profile'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4 border-t border-gray-800/50">
              <Button onClick={() => onNavigate('materials')} variant="outline">View My Materials</Button>
              <Button onClick={() => onNavigate('dashboard')} variant="secondary">Back to Dashboard</Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans">
      <div className="sticky top-0 bg-[#121212]/90 backdrop-blur z-10 px-6 py-4 flex items-center gap-4 border-b border-gray-800">
        {step < 5 && (
          <button onClick={() => onNavigate('dashboard')} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        )}
        <h1 className="text-xl font-bold text-white">Weigh & Sell</h1>
      </div>

      <div className="p-6 max-w-md mx-auto">
        {step < 5 && (
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${s <= step ? 'bg-emerald-500' : 'bg-gray-800'}`} />
            ))}
          </div>
        )}
        {renderStepContent()}
      </div>
    </div>
  );
};

const MyMaterialsPage = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const db = useDatabase();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const lots = db?.getCollectorLots ? db.getCollectorLots(currentUser?.uid) : [];

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Draft': return 'bg-gray-800 text-gray-400 border-gray-700';
      case 'Created': return 'bg-blue-900/30 text-blue-400 border-blue-800';
      case 'Matched': return 'bg-amber-900/30 text-amber-400 border-amber-800';
      case 'Accepted': return 'bg-orange-900/30 text-orange-400 border-orange-800';
      case 'Handed Over': return 'bg-purple-900/30 text-purple-400 border-purple-800';
      case 'Completed': return 'bg-emerald-900/30 text-emerald-400 border-emerald-800';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const filteredLots = lots.filter(lot => {
    const matchesSearch = (lot.lot_id?.toLowerCase().includes(search.toLowerCase()) || lot.category.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || lot.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans text-white">
      <div className="p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-2xl font-bold">My Materials</h1>
        </div>
        <div className="flex gap-3 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input type="text" placeholder="Search Lot ID or Category" className="w-full bg-[#24242B] border border-[#2A2A35] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[#24242B] border border-[#2A2A35] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500">
            <option value="All">All Status</option>
            <option value="Draft">Drafts</option>
            <option value="Created">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="px-6 space-y-4">
        {filteredLots.length === 0 ? (
          <div className="text-center py-12 bg-[#1A1A1A] rounded-2xl border border-gray-800">
            <Package className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-300">No lots found</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">Create your first material lot to start selling.</p>
            <Button onClick={() => onNavigate('create-lot')} variant="outline" className="mx-auto"><Plus className="h-4 w-4" /> Create Lot</Button>
          </div>
        ) : (
          filteredLots.map(lot => (
            <div key={lot.id} className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-4 active:scale-[0.98] transition-transform cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded-md">{lot.lot_id}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusStyle(lot.status)}`}>{lot.status}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center overflow-hidden shrink-0 border border-gray-700">
                  {lot.image ? <img src={`data:image/jpeg;base64,${lot.image}`} className="w-full h-full object-cover" alt={lot.category} /> : <Package className="h-6 w-6 text-gray-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg leading-tight mb-1">{lot.category}</h3>
                  <p className="text-gray-400 text-sm">{lot.weight} {PricingService.getMaterialDetails(lot.category).unit} • {lot.condition}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Est. Value</p>
                  <p className="font-bold text-amber-500">₹{lot.estimated_value?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-20 right-6 z-40">
        <button onClick={() => onNavigate('create-lot')} className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors active:scale-95">
          <Plus className="h-6 w-6 text-gray-900" />
        </button>
      </div>
    </div>
  );
};

const RecyclerDetailPage = ({ recyclerId, onBack, onNavigate }) => {
  const recycler = RecyclerService.getById(recyclerId);
  const isAuth = recycler.status === 'Authorized';

  if (!recycler) return null;

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans text-white animate-in slide-in-from-bottom-8 duration-300">
      {/* Header Image & Profile Intro */}
      <div className="relative h-48 bg-gradient-to-br from-emerald-900/40 to-[#121212]">
        <button onClick={onBack} className="absolute top-6 left-6 w-10 h-10 rounded-full bg-gray-900/80 backdrop-blur flex items-center justify-center border border-gray-700 z-10 hover:bg-gray-800">
          <ArrowRight className="h-5 w-5 rotate-180" />
        </button>
        <div className="absolute -bottom-10 left-6 flex items-end gap-4">
          <div className="w-24 h-24 rounded-2xl bg-gray-800 border-4 border-[#121212] flex items-center justify-center shadow-xl">
            <Building2 className="w-10 h-10 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="px-6 pt-14 pb-4 border-b border-gray-800">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">{recycler.name}</h1>
            <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" /> {recycler.address}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1 text-amber-500 font-bold mb-1">
              <Star className="w-4 h-4 fill-amber-500" /> {recycler.performance.rating}
            </span>
            <span className="text-xs text-gray-500">{recycler.distance} km away</span>
          </div>
        </div>

        {/* Prominent Trust Indicators */}
        <div className="flex gap-2 mt-4">
          {isAuth ? (
            <div className="flex items-center gap-2 bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-sm font-semibold">
              <ShieldCheck className="w-4 h-4" /> Verified Authorized
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-900/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-sm font-semibold">
              <Info className="w-4 h-4" /> Pending Validation
            </div>
          )}
          {recycler.pickupAvailable && (
            <div className="flex items-center gap-2 bg-blue-900/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-sm font-semibold">
              <Truck className="w-4 h-4" /> Offers Pickup
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Authorization Details Card */}
        <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" /> License & Authorization
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">License No.</p>
              <p className="font-mono text-gray-200">{recycler.authDetails.licenseNo}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Valid Till</p>
              <p className="font-medium text-gray-200">{recycler.authDetails.validTill}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500 mb-1">Issuing Authority</p>
              <p className="font-medium text-gray-200">{recycler.authDetails.body}</p>
            </div>
          </div>
        </div>

        {/* Accepted Materials & Customized Rates Card */}
        <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-500" /> Accepted Materials & Rates
            </h3>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded border border-gray-700">Live Prices</span>
          </div>
          
          <div className="space-y-3">
            {recycler.materials.map(mat => {
              const basePrice = PricingService.getCurrentPrice(mat, recycler.location);
              const offeredPrice = Math.round(basePrice * recycler.priceMultiplier);
              const unit = PricingService.getMaterialDetails(mat).unit;
              
              return (
                <div key={mat} className="flex justify-between items-center py-2 border-b border-gray-800/50 last:border-0">
                  <span className="text-gray-300">{mat}</span>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold">₹{offeredPrice}</span>
                    <span className="text-xs text-gray-500">/{unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance & Logistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-4 text-center">
            <Clock className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Avg Response</p>
            <p className="font-bold text-gray-200">{recycler.performance.responseTime}</p>
          </div>
          <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-4 text-center">
            <Scale className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Completed Lots</p>
            <p className="font-bold text-gray-200">{recycler.performance.completedTrades}+</p>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl h-32 flex flex-col items-center justify-center relative overflow-hidden mt-4">
          <Map className="w-12 h-12 text-gray-700 absolute opacity-30 scale-[3]" />
          <Navigation className="w-6 h-6 text-emerald-500 mb-1 z-10" />
          <p className="text-xs text-gray-400 z-10 text-center px-4">Map View Engine Ready <br/> Lat: {recycler.coordinates.lat} Lng: {recycler.coordinates.lng}</p>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/95 backdrop-blur border-t border-gray-800 z-50 flex gap-3 pb-safe">
        <button className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl py-4 flex justify-center items-center gap-2 hover:bg-gray-700 transition">
          <Phone className="w-5 h-5" /> Contact
        </button>
        <Button variant="primary" className="flex-[2] py-4" onClick={() => onNavigate('create-lot')}>
          Sell to Recycler
        </Button>
      </div>
    </div>
  );
};

const RecyclersPage = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  
  // States
  const [selectedRecyclerId, setSelectedRecyclerId] = useState(null);
  const [search, setSearch] = useState('');
  const [materialFilter, setMaterialFilter] = useState('All');
  const [authFilter, setAuthFilter] = useState(false);
  const [pickupFilter, setPickupFilter] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Computed results
  const filteredRecyclers = RecyclerService.search({
    query: search,
    material: materialFilter,
    location: currentUser?.location || '', // Bias to user location if available
    authorizedOnly: authFilter,
    pickupOnly: pickupFilter,
    sortBy: sortBy
  });

  // Switch to Detail View
  if (selectedRecyclerId) {
    return <RecyclerDetailPage recyclerId={selectedRecyclerId} onBack={() => setSelectedRecyclerId(null)} onNavigate={onNavigate} />;
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212]/95 backdrop-blur border-b border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('dashboard')} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 hover:bg-gray-700 transition">
              <ArrowRight className="h-5 w-5 rotate-180 text-gray-300" />
            </button>
            <h1 className="text-2xl font-bold">Find Recyclers</h1>
          </div>
          
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="w-10 h-10 rounded-full bg-[#24242B] border border-[#2A2A35] flex items-center justify-center text-emerald-500"
          >
            {viewMode === 'list' ? <Map className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
          </button>
        </div>

        {/* Search & Filter Row */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by name or address..." 
              className="w-full bg-[#24242B] border border-[#2A2A35] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`w-12 rounded-xl flex items-center justify-center border transition-colors ${isFilterOpen || authFilter || pickupFilter || materialFilter !== 'All' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-[#24242B] border-[#2A2A35] text-gray-400'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterOpen && (
          <div className="p-4 bg-[#1C1C22] border border-[#2A2A35] rounded-xl mb-4 space-y-4 animate-in slide-in-from-top-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Material Type</label>
              <select value={materialFilter} onChange={e => setMaterialFilter(e.target.value)} className="w-full bg-[#24242B] border border-[#2A2A35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                {PricingService.getAllCategories().map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sort By</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full bg-[#24242B] border border-[#2A2A35] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                <option value="rating">Top Rated</option>
                <option value="distance">Nearest to me</option>
                <option value="price">Highest Prices Offered</option>
              </select>
            </div>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={authFilter} onChange={e => setAuthFilter(e.target.checked)} className="rounded text-emerald-500 bg-gray-900 border-gray-700 focus:ring-emerald-500 h-4 w-4" />
                Authorized Only
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={pickupFilter} onChange={e => setPickupFilter(e.target.checked)} className="rounded text-emerald-500 bg-gray-900 border-gray-700 focus:ring-emerald-500 h-4 w-4" />
                Pickup Available
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {viewMode === 'map' ? (
          /* Map View Mode (Mock) */
          <div className="bg-gray-800 border border-gray-700 rounded-2xl h-[60vh] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            <Map className="w-24 h-24 text-gray-700 absolute opacity-20 scale-[4]" />
            <Navigation className="w-10 h-10 text-emerald-500 mb-4 z-10" />
            <h3 className="text-xl font-bold text-white mb-2 z-10">Map View Mode</h3>
            <p className="text-sm text-gray-400 z-10 text-center max-w-xs mb-6">Interactive maps are currently disabled in this Sandbox. Displaying mock coordinates below.</p>
            <div className="flex flex-wrap gap-2 justify-center z-10 px-4">
               {filteredRecyclers.map(r => (
                 <div key={r.id} className="bg-gray-900/80 px-3 py-2 rounded-lg border border-gray-700 flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-300">{r.name}</span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500"/> {r.coordinates.lat.toFixed(3)}, {r.coordinates.lng.toFixed(3)}</span>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          /* List View Mode */
          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-medium">{filteredRecyclers.length} recyclers found</p>
            
            {filteredRecyclers.length === 0 ? (
              <div className="text-center py-12 bg-[#1A1A1A] rounded-2xl border border-gray-800">
                <Search className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-300">No matching recyclers</h3>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              filteredRecyclers.map(recycler => (
                <div 
                  key={recycler.id} 
                  onClick={() => setSelectedRecyclerId(recycler.id)}
                  className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-4 shadow-sm hover:border-emerald-500/50 cursor-pointer active:scale-[0.98] transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{recycler.name}</h3>
                    {recycler.status === 'Authorized' ? (
                       <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 shrink-0">
                         <ShieldCheck className="w-3 h-3"/> Authorized
                       </span>
                    ) : (
                       <span className="bg-amber-900/30 text-amber-400 border border-amber-500/30 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 shrink-0">
                         <Info className="w-3 h-3"/> Pending
                       </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-400 flex items-center gap-3 mb-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {recycler.distance} km</span>
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500"/> {recycler.performance.rating}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                     {recycler.materials.slice(0,3).map(m => (
                       <span key={m} className="bg-gray-800 text-gray-300 text-[10px] px-2 py-1 rounded-md border border-gray-700">{m}</span>
                     ))}
                     {recycler.materials.length > 3 && (
                       <span className="text-[10px] text-gray-500 flex items-center">+{recycler.materials.length - 3} more</span>
                     )}
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-800/60 pt-3">
                     <div className="flex items-center gap-2 text-xs">
                       {recycler.pickupAvailable ? (
                         <span className="text-blue-400 bg-blue-900/10 px-2 py-1 rounded flex items-center gap-1 border border-blue-900/30">
                           <Truck className="w-3.5 h-3.5"/> Pickup Available
                         </span>
                       ) : (
                         <span className="text-gray-500">Drop-off only</span>
                       )}
                     </div>
                     <span className="text-emerald-500 font-semibold text-xs flex items-center gap-1 group-hover:underline">
                       View Profile <ExternalLink className="w-3 h-3" />
                     </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- TRACEABILITY & HANDOVER SYSTEM ---

const MockQRCode = ({ value }) => (
  <div className="relative w-32 h-32 bg-white rounded-xl p-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] border-2 border-emerald-500/50 flex items-center justify-center overflow-hidden">
    {/* Minimalistic artistic representation of a QR Code for demo purposes */}
    <div className="grid grid-cols-5 grid-rows-5 gap-1 w-full h-full opacity-80 mix-blend-multiply">
       {[...Array(25)].map((_, i) => (
         <div key={i} className={`rounded-sm ${[0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24].includes(i) ? 'bg-gray-900' : (Math.random() > 0.5 ? 'bg-gray-900' : 'bg-transparent')}`}>
           {([0,4,20,24].includes(i)) && <div className="w-full h-full border-2 border-white"></div>}
         </div>
       ))}
    </div>
    <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/0 via-emerald-400/20 to-emerald-400/0 animate-scan"></div>
  </div>
);

const TraceabilityTimeline = ({ transaction, onBack }) => {
  if (!transaction) return null;

  const timelineSteps = [
    { key: 'Created', label: 'Lot Created', icon: Package },
    { key: 'Matched', label: 'Recycler Matched', icon: Search },
    { key: 'Accepted', label: 'Offer Accepted', icon: CheckCircle },
    { key: 'Handed Over', label: 'Material Handed Over', icon: Truck },
    { key: 'Completed', label: 'Payment Completed', icon: Wallet }
  ];

  const currentStepIndex = timelineSteps.findIndex(s => s.key === transaction.transaction_status);
  const activeIndex = currentStepIndex === -1 && transaction.transaction_status === 'Completed' ? 4 
                    : (transaction.transaction_status === 'Pending Handover' ? 2 : currentStepIndex);

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans text-white animate-in fade-in duration-300">
      <div className="sticky top-0 bg-[#121212]/90 backdrop-blur z-20 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-xl font-bold">Traceability Journey</h1>
        </div>
        <div className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          Verified
        </div>
      </div>

      <div className="p-6">
        {/* Digital Handover Record Card */}
        <div className="bg-gradient-to-br from-[#24242B] to-[#1a1a24] border border-[#2A2A35] rounded-3xl p-6 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Handover Reference</p>
              <h2 className="text-2xl font-mono font-bold text-emerald-400">{transaction.tx_ref}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-xs text-gray-300 font-mono">Lot: {transaction.lot_id}</span>
              </div>
            </div>
            <MockQRCode value={transaction.tx_ref} />
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-gray-800/60 pt-6">
             <div>
               <p className="text-gray-500 text-xs mb-1">Material Category</p>
               <p className="font-semibold">{transaction.category}</p>
             </div>
             <div>
               <p className="text-gray-500 text-xs mb-1">Recycler Partner</p>
               <p className="font-semibold flex items-center gap-1"><Building2 className="w-3 h-3 text-amber-500"/> {transaction.recycler_name}</p>
             </div>
             <div>
               <p className="text-gray-500 text-xs mb-1">Est. Weight</p>
               <p className="font-semibold">{transaction.initial_weight} kg</p>
             </div>
             <div>
               <p className="text-gray-500 text-xs mb-1">Final Weight</p>
               <p className={`font-semibold ${transaction.final_weight ? 'text-emerald-400' : 'text-gray-600'}`}>{transaction.final_weight ? `${transaction.final_weight} kg` : 'Pending'}</p>
             </div>
             <div className="col-span-2 bg-gray-900/50 rounded-xl p-4 border border-gray-800 mt-2 flex justify-between items-center">
               <div>
                 <p className="text-gray-500 text-xs mb-1">Final Settlement</p>
                 <p className={`text-2xl font-black ${transaction.final_price ? 'text-[#EAB308]' : 'text-gray-600'}`}>
                   {transaction.final_price ? `₹${transaction.final_price.toLocaleString()}` : 'Pending'}
                 </p>
               </div>
               {transaction.final_price && <ShieldCheck className="w-8 h-8 text-emerald-500 opacity-80" />}
             </div>
          </div>
        </div>

        {/* Visual Timeline */}
        <h3 className="font-bold text-gray-300 mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
          <Clock className="w-4 h-4 text-emerald-500" /> Journey Timeline
        </h3>
        
        <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[35px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-800">
          {timelineSteps.map((step, idx) => {
            const historyEvent = transaction.timeline.find(t => t.status === step.key);
            const isCompleted = !!historyEvent;
            const isLastCompleted = transaction.timeline[transaction.timeline.length - 1]?.status === step.key;
            const Icon = step.icon;

            return (
              <div key={step.key} className="relative flex items-start gap-6">
                {/* Timeline Node */}
                <div className={`absolute -left-[27px] w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#121212] z-10 transition-colors duration-500 ${
                  isCompleted ? 'bg-emerald-500 text-gray-900 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-gray-800 text-gray-500'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                {/* Connecting glowing line segment if completed */}
                {isCompleted && idx < timelineSteps.length - 1 && transaction.timeline.find(t => t.status === timelineSteps[idx+1].key) && (
                  <div className="absolute -left-[8px] top-8 w-0.5 h-[calc(100%+32px)] bg-emerald-500 z-0 opacity-50 shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
                )}

                {/* Content */}
                <div className={`flex-1 pt-1 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`font-bold ${isCompleted ? 'text-white' : 'text-gray-500'}`}>{step.label}</h4>
                    {isCompleted && <span className="text-[10px] text-gray-400 font-mono">{new Date(historyEvent.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                  </div>
                  {isCompleted ? (
                    <p className="text-sm text-gray-400 leading-snug">{historyEvent.note}</p>
                  ) : (
                    <p className="text-sm text-gray-600 leading-snug">Awaiting step completion</p>
                  )}
                  {isLastCompleted && !['Completed'].includes(step.key) && (
                     <div className="mt-3 inline-flex items-center gap-2 bg-emerald-900/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/20 animate-pulse">
                       <Loader2 className="w-3 h-3 animate-spin" /> In Progress
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const LedgerChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div className="flex items-end justify-between h-40 gap-2 mt-4 px-2">
      {data.map((d, i) => {
        const heightPct = Math.max(10, (d.amount / max) * 100);
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-2 group cursor-default">
            <div
              className="w-full bg-gradient-to-t from-emerald-900/50 to-emerald-500/50 rounded-t-md group-hover:to-emerald-400/80 transition-all relative border-t border-emerald-500/50"
              style={{ height: `${heightPct}%` }}
            >
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-gray-800 px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                 ₹{d.amount}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const RecyclerBreakdown = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.amount, 0) || 1;
  return (
    <div className="space-y-3 mt-4">
      {data.map((d, i) => (
         <div key={i} className="flex flex-col gap-1">
           <div className="flex justify-between text-sm">
             <span className="text-gray-300 font-medium">{d.name}</span>
             <span className="text-emerald-400 font-bold">₹{d.amount.toLocaleString()}</span>
           </div>
           <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(d.amount/total)*100}%` }}></div>
           </div>
         </div>
      ))}
    </div>
  );
};

// --- RECYCLER TRANSACTIONS PAGE ---
const RecyclerTransactionsPage = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const db = useDatabase();
  const [selectedTx, setSelectedTx] = useState(null);

  const transactions = db?.getRecyclerTransactions ? db.getRecyclerTransactions(currentUser?.uid) : [];
  
  const completedTxs = transactions.filter(t => t.transaction_status === 'Completed');
  const totalSpent = completedTxs.reduce((sum, tx) => sum + (Number(tx.final_price) || 0), 0);
  const totalWeight = completedTxs.reduce((sum, tx) => sum + (Number(tx.final_weight) || 0), 0);

  if (selectedTx) {
    return <TraceabilityTimeline transaction={selectedTx} onBack={() => setSelectedTx(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans text-white animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-b border-gray-800">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => onNavigate('recycler-dashboard')} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 hover:bg-gray-700 transition">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-2xl font-bold">Transaction History</h1>
        </div>

        {/* Recycler KPI Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-3 shadow-sm text-center">
             <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Spent</p>
             <p className="text-lg font-bold text-emerald-400">₹{totalSpent.toLocaleString()}</p>
          </div>
          <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-3 shadow-sm text-center">
             <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Weight</p>
             <p className="text-lg font-bold text-cyan-400">{totalWeight} kg</p>
          </div>
          <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-3 shadow-sm text-center">
             <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Lots</p>
             <p className="text-lg font-bold text-amber-400">{completedTxs.length}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-400 font-medium">{transactions.length} Records found</p>
        
        {/* Transaction List */}
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-[#1A1A1A] rounded-2xl border border-gray-800">
            <Clock className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-300">No history yet</h3>
            <p className="text-sm text-gray-500 mt-1">Completed handovers will appear here.</p>
          </div>
        ) : (
          transactions.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(tx => {
             let badgeStyle = "bg-gray-800 text-gray-400 border-gray-700";
             if (tx.transaction_status === 'Completed') badgeStyle = "bg-emerald-900/30 text-emerald-400 border-emerald-800";
             if (tx.transaction_status === 'Pending Handover') badgeStyle = "bg-amber-900/30 text-amber-400 border-amber-800";

             return (
              <div 
                key={tx.id} 
                onClick={() => setSelectedTx(tx)}
                className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-4 shadow-sm hover:border-emerald-500/50 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group"
              >
                {tx.transaction_status === 'Pending Handover' && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 blur-2xl rounded-full"></div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded-md border border-gray-800">{tx.tx_ref}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeStyle}`}>
                    {tx.transaction_status}
                  </span>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="font-bold text-lg leading-tight mb-1 text-white">{tx.category}</h3>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> {tx.final_weight || tx.initial_weight} kg
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    {tx.final_price ? (
                       <p className="text-xl font-bold text-[#EAB308] mb-1">₹{tx.final_price.toLocaleString()}</p>
                    ) : (
                       <p className="text-sm font-bold text-gray-500 mb-1">Pending Pay</p>
                    )}
                    <p className="font-bold text-emerald-500 flex items-center gap-1 justify-end text-xs group-hover:underline">
                      View Trace <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                </div>
              </div>
             );
          })
        )}
      </div>
    </div>
  );
};

const EarningsLedgerPage = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const db = useDatabase();
  const [selectedTx, setSelectedTx] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Ledger'

  const stats = db?.getLedgerStats ? db.getLedgerStats(currentUser?.uid) : { totalEarnings: 0, pendingPayments: 0, completedPayments: 0, totalLotsSold: 0 };
  const monthlyData = db?.getMonthlyEarnings ? db.getMonthlyEarnings(currentUser?.uid) : [];
  const recyclerData = db?.getRecyclerEarnings ? db.getRecyclerEarnings(currentUser?.uid) : [];
  const transactions = db?.getCollectorTransactions ? db.getCollectorTransactions(currentUser?.uid) : [];

  if (selectedTx) {
    return <TraceabilityTimeline transaction={selectedTx} onBack={() => setSelectedTx(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans text-white">
      <div className="p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-b border-gray-800">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => onNavigate('dashboard')} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-2xl font-bold">Earnings & Ledger</h1>
        </div>
        
        <div className="flex gap-2 bg-gray-900 p-1 rounded-xl">
          <button onClick={() => setActiveTab('Overview')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'Overview' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Financial Overview</button>
          <button onClick={() => setActiveTab('Ledger')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'Ledger' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Transaction Ledger</button>
        </div>
      </div>

      <div className="p-6">
         {activeTab === 'Overview' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
               {/* KPI Grid */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-4 shadow-sm">
                    <Wallet className="h-5 w-5 text-emerald-500 mb-2" />
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Earnings</p>
                    <p className="text-xl font-bold text-white">₹{stats.totalEarnings.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-4 shadow-sm">
                    <Clock className="h-5 w-5 text-amber-500 mb-2" />
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Pending Dues</p>
                    <p className="text-xl font-bold text-amber-500">₹{stats.pendingPayments.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-4 shadow-sm">
                    <CheckCircle className="h-5 w-5 text-blue-400 mb-2" />
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Received Pay</p>
                    <p className="text-xl font-bold text-gray-200">₹{stats.completedPayments.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-4 shadow-sm">
                    <Package className="h-5 w-5 text-purple-400 mb-2" />
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Lots Sold</p>
                    <p className="text-xl font-bold text-gray-200">{stats.totalLotsSold}</p>
                  </div>
               </div>

               {/* Monthly Chart */}
               <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-5 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-gray-200 flex items-center gap-2"><BarChart className="h-4 w-4 text-emerald-500" /> Monthly Earnings</h3>
                   <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-800">Verified</span>
                 </div>
                 <LedgerChart data={monthlyData} />
               </div>

               {/* Recycler Breakdown */}
               <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-5 shadow-sm">
                 <h3 className="font-bold text-gray-200 flex items-center gap-2 mb-2"><Building2 className="h-4 w-4 text-emerald-500" /> Top Recyclers</h3>
                 <RecyclerBreakdown data={recyclerData} />
               </div>
            </div>
         ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-400">{transactions.length} Records found</p>
                <div className="flex gap-2">
                   <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Cash</span>
                   <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Digital</span>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12 bg-[#1A1A1A] rounded-2xl border border-gray-800">
                  <Clock className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-300">No history yet</h3>
                </div>
              ) : (
                transactions.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(tx => {
                   let badgeStyle = "bg-gray-800 text-gray-400 border-gray-700";
                   if (tx.payment_status === 'Cash Received') badgeStyle = "bg-emerald-900/30 text-emerald-400 border-emerald-800";
                   if (tx.payment_status === 'Digital Payment') badgeStyle = "bg-blue-900/30 text-blue-400 border-blue-800";
                   if (tx.payment_status === 'Pending') badgeStyle = "bg-amber-900/30 text-amber-400 border-amber-800";

                   return (
                    <div 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-4 shadow-sm hover:border-emerald-500/50 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
                    >
                      {tx.transaction_status === 'Pending Handover' && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 blur-2xl rounded-full"></div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-mono text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded-md">{tx.tx_ref}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeStyle}`}>
                          {tx.payment_status || tx.transaction_status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 className="font-bold text-lg leading-tight mb-1">{tx.category}</h3>
                          <p className="text-gray-400 text-sm flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {tx.recycler_name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          {tx.final_price ? (
                             <p className="text-xl font-bold text-[#EAB308] mb-1">₹{tx.final_price.toLocaleString()}</p>
                          ) : (
                             <p className="text-sm font-bold text-gray-500 mb-1">Pending Valuation</p>
                          )}
                          <p className="font-bold text-white flex items-center gap-1 justify-end text-xs group-hover:underline">
                            View Trace <ChevronRight className="w-3 h-3 text-emerald-500" />
                          </p>
                        </div>
                      </div>
                    </div>
                   );
                })
              )}
            </div>
         )}
      </div>
    </div>
  );
};

const HandoverConfirmationPage = ({ onNavigate }) => {
  const db = useDatabase();
  const [refId, setRefId] = useState('TX-2026-9902'); // Pre-filled for demo
  const [scannedTx, setScannedTx] = useState(null);
  const [finalWeight, setFinalWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleScan = () => {
    // Mocking QR scan by looking up the Ref ID
    const tx = db.transactions.find(t => t.tx_ref === refId);
    if (tx && tx.transaction_status !== 'Completed') {
      setScannedTx(tx);
      setFinalWeight(tx.initial_weight.toString());
    } else {
      alert("Transaction not found or already completed.");
    }
  };

  const handleComplete = async () => {
    if (!scannedTx || !finalWeight) return;
    setLoading(true);
    try {
      await db.completeHandover(scannedTx.tx_ref, parseFloat(finalWeight));
      setSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-emerald-900/50 rounded-full flex items-center justify-center border-4 border-emerald-500/30 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
           <ShieldCheck className="h-12 w-12 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Handover Verified!</h2>
        <p className="text-gray-400 mb-8 max-w-sm">Material received and payment authorized. Digital traceability record updated.</p>
        <Button onClick={() => onNavigate('recycler-dashboard')} variant="primary" className="w-full max-w-xs py-4 text-lg">Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans text-white">
      <div className="p-6 bg-gradient-to-b from-[#1a1a1a] to-[#121212]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => onNavigate('recycler-dashboard')} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-2xl font-bold">Verify Handover</h1>
        </div>
      </div>

      <div className="px-6 space-y-6 max-w-md mx-auto">
        {!scannedTx ? (
          <div className="bg-[#24242B] border border-[#2A2A35] rounded-3xl p-6 shadow-lg text-center animate-in slide-in-from-bottom-4">
            <div className="w-20 h-20 bg-gray-900 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-gray-700">
              <Camera className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="font-bold text-lg mb-2">Scan QR Code</h3>
            <p className="text-sm text-gray-400 mb-6">Scan the collector's digital handover receipt or enter reference manually.</p>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
                placeholder="TX-REF-ID" 
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-center uppercase focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <Button onClick={handleScan} className="w-full">Simulate Scan</Button>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            {/* Scanned Details */}
            <div className="bg-[#24242B] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle className="w-24 h-24 text-emerald-500" /></div>
               <div className="inline-block bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                 Valid Reference
               </div>
               <h2 className="text-xl font-mono font-bold text-white mb-1">{scannedTx.tx_ref}</h2>
               <p className="text-gray-400 text-sm mb-6">Lot: {scannedTx.lot_id}</p>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-gray-500 text-xs mb-1">Material</p>
                   <p className="font-semibold text-white">{scannedTx.category}</p>
                 </div>
                 <div>
                   <p className="text-gray-500 text-xs mb-1">Estimated Weight</p>
                   <p className="font-semibold text-white">{scannedTx.initial_weight} kg</p>
                 </div>
               </div>
            </div>

            {/* Input Final Weight */}
            <div className="bg-[#24242B] border border-[#2A2A35] rounded-3xl p-6 shadow-lg">
               <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Scale className="w-5 h-5 text-emerald-500"/> Confirm Actual Weight</h3>
               <div className="relative mb-6">
                 <input 
                   type="number" 
                   value={finalWeight}
                   onChange={e => setFinalWeight(e.target.value)}
                   className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-2xl font-bold text-white pr-16 focus:border-emerald-500 focus:outline-none"
                 />
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">kg</span>
               </div>

               {finalWeight && (
                 <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-4 flex justify-between items-center mb-6">
                   <span className="text-gray-400 text-sm">Final Settlement</span>
                   <span className="text-2xl font-black text-[#EAB308]">₹{Math.round(parseFloat(finalWeight) * PricingService.getCurrentPrice(scannedTx.category, 'Pune')).toLocaleString()}</span>
                 </div>
               )}

               <Button onClick={handleComplete} isLoading={loading} variant="action" className="w-full py-4 text-lg">
                 Complete Handover & Pay
               </Button>
               <button onClick={() => setScannedTx(null)} className="w-full py-3 mt-2 text-gray-400 text-sm hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- REUSING EXISTING AI PAGES (No logic changed) ---
const SmartIdentifierPage = ({ onBack }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      const base64 = await fileToBase64(file);
      setImage({ data: base64, mimeType: file.type });
      setResult(null);
    }
  };

  const handleIdentify = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const apiKey = ""; 
      if(!apiKey) throw new Error("API key missing in sandbox.");
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{
          role: "user",
          parts: [
            { text: "You are an expert e-waste appraiser in India. Look at this image of e-waste and provide a very short, simple summary for an informal scrap collector. Structure your answer exactly like this: \n\n**Item:** [Name of item]\n**Valuable Materials:** [e.g., Copper, Gold, Aluminum]\n**Hazards:** [e.g., Lead glass, Lithium fire risk, or 'None']" },
            { inlineData: image }
          ]
        }]
      };
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        setResult(data.candidates[0].content.parts[0].text);
      } else {
        setResult("Could not identify the image. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setResult("Demo Mode: Image identified as Mixed Electronic Scrap. Contains copper wiring and standard PCB boards. Safe to handle with standard gloves.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] p-6 pb-24 text-white">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
           <ArrowRight className="h-5 w-5 rotate-180" />
        </button>
        <h1 className="text-xl font-bold">AI Smart Identify</h1>
      </div>

      <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-6 mb-6">
        {!preview ? (
          <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:bg-gray-800/50 transition-colors">
            <UploadCloud className="h-10 w-10 text-emerald-400 mb-3" />
            <span className="text-gray-300 font-medium">Take Photo or Upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        ) : (
          <div className="relative">
            <img src={preview} alt="Upload preview" className="w-full h-48 object-cover rounded-xl" />
            <label className="absolute bottom-2 right-2 bg-gray-900/80 p-2 rounded-lg backdrop-blur cursor-pointer text-sm font-medium">
              Change Image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
        )}
      </div>

      <Button onClick={handleIdentify} disabled={!image || loading} variant="primary" className="w-full mb-6 py-4 text-lg">
        {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Identify Value & Hazards"}
      </Button>

      {result && (
        <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-2xl p-6">
          <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" /> AI Analysis
          </h3>
          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

const SafetyGuidePage = ({ onBack }) => {
  const [query, setQuery] = useState("");
  const [guide, setGuide] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);

  const handleGetGuide = async () => {
    if (!query.trim()) return;
    setLoading(true); setGuide(""); setAudioUrl(null);
    try {
      const apiKey = ""; 
      if(!apiKey) throw new Error("API key missing");
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      const payload = { contents: [{ parts: [{ text: `You are an e-waste safety advisor for informal scrap workers in India. Provide a simple, 3-step guide on how to safely handle or dismantle this item: ${query}. Use simple English. Mention critical hazards (like toxic dust or shock). Keep it short.` }] }] };
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        setGuide(data.candidates[0].content.parts[0].text);
      }
    } catch (error) {
      setGuide("Demo Mode Fallback Guide:\n1. Wear heavy-duty gloves to avoid cuts from sharp metal edges.\n2. Do NOT break the screen glass, it may contain harmful chemicals.\n3. Keep the item dry and away from heat sources.");
    } finally {
      setLoading(false);
    }
  };

  const handleListen = async () => {
    if (!guide || audioLoading) return;
    setAudioLoading(true);
    try {
      const apiKey = "";
      if(!apiKey) throw new Error("API Key missing");
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: `Say clearly and firmly: ${guide}` }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } } } },
        model: "gemini-2.5-flash-preview-tts"
      };
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      const part = result?.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData?.data && part?.inlineData?.mimeType) {
        const rateMatch = part.inlineData.mimeType.match(/rate=(\d+)/);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
        const pcmData = base64ToArrayBuffer(part.inlineData.data);
        const pcm16 = new Int16Array(pcmData);
        const wavBlob = pcmToWav(pcm16, sampleRate);
        setAudioUrl(URL.createObjectURL(wavBlob));
      }
    } catch (error) {
      console.error("Audio generation failed", error);
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] p-6 pb-24 text-white">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
           <ArrowRight className="h-5 w-5 rotate-180" />
        </button>
        <h1 className="text-xl font-bold">AI Safety & Handling</h1>
      </div>

      <div className="bg-[#24242B] border border-[#2A2A35] rounded-2xl p-6 mb-6">
        <label className="block text-gray-400 text-sm mb-2">What do you want to dismantle?</label>
        <input 
          type="text" 
          placeholder="e.g. CRT Monitor, Fridge, Laptop Battery" 
          className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 mb-4"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={handleGetGuide} disabled={loading || !query} className="w-full">
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Get Safety Steps"}
        </Button>
      </div>

      {guide && (
        <div className="bg-[#3A1A20]/40 border border-rose-900/50 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-rose-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Safety Guidelines
            </h3>
            <button onClick={handleListen} disabled={audioLoading} className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full border border-gray-600 transition-colors">
              {audioLoading ? <Loader2 className="h-5 w-5 animate-spin text-emerald-400" /> : <Play className="h-5 w-5 text-emerald-400" />}
            </button>
          </div>
          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm mb-4">{guide}</div>
          {audioUrl && <audio src={audioUrl} controls autoPlay className="w-full h-10 rounded-lg outline-none" />}
        </div>
      )}
    </div>
  );
};

const LandingPage = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  
  const handlePrimaryAction = () => {
    if (currentUser) {
       if(currentUser.role === 'admin') return onNavigate('admin-dashboard');
       if(currentUser.role === 'recycler') return onNavigate('recycler-dashboard');
       return onNavigate('dashboard');
    }
    onNavigate('register');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-700 text-emerald-400 text-sm font-medium mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            {t('landing.badge')}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            {t('landing.title1')} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              {t('landing.title2')}
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 mb-10">
            {t('landing.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={handlePrimaryAction} variant="primary" className="text-lg px-8">
              {currentUser ? t('landing.btnDashboard') : t('landing.btnJoin')} <ArrowRight className="h-5 w-5" />
            </Button>
            {!currentUser && (
              <Button onClick={() => onNavigate('login')} variant="secondary" className="text-lg px-8">
                {t('landing.btnLogin')}
              </Button>
            )}
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/20 blur-3xl rounded-full pointer-events-none"></div>
      </section>

      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">{t('landing.how')}</h2>
            <p className="text-gray-400">{t('landing.howSub')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gray-700 z-0"></div>
            {[
              { step: 1, title: 'Collect Material', desc: 'Gather e-waste locally', icon: Package },
              { step: 2, title: 'Get Fair Price', desc: 'Check daily market rates', icon: IndianRupee },
              { step: 3, title: 'Find Recycler', desc: 'Locate verified partners', icon: Search },
              { step: 4, title: 'Handover', desc: 'Weigh and transfer', icon: Scale },
              { step: 5, title: 'Get Paid', desc: 'Instant, fair payment', icon: Wallet },
            ].map((item, index) => (
              <div key={index} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center mb-6 shadow-xl relative">
                  <item.icon className="h-10 w-10 text-emerald-400" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold border-2 border-gray-900">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};


const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const { currentUser } = useAuth();

  const navigateTo = (page) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  const renderPage = () => {
    if (currentPage === 'landing') return <LandingPage onNavigate={navigateTo} />;
    if (currentPage === 'login') return <LoginPage onNavigate={navigateTo} />;
    if (currentPage === 'register') return <RegisterPage onNavigate={navigateTo} />;
    if (currentPage === 'language') return <LanguageSelectionPage onNavigate={navigateTo} />;
    
    if (!currentUser) {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="h-16 w-16 text-rose-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">You must be logged in to access this page.</p>
          <Button onClick={() => navigateTo('login')} variant="primary">Go to Login</Button>
        </div>
      );
    }

    switch (currentPage) {
      // Collector Routes
      case 'dashboard': 
        if(currentUser.role !== 'collector') return navigateTo(currentUser.role === 'admin' ? 'admin-dashboard' : 'recycler-dashboard');
        return <CollectorDashboard onNavigate={navigateTo} />;
      case 'sync-center': return <SyncCenterPage onBack={() => navigateTo('dashboard')} />;
      case 'materials': return <MyMaterialsPage onNavigate={navigateTo} />;
      case 'prices': return <PricesPage onNavigate={navigateTo} />;
      case 'recyclers': return <RecyclersPage onNavigate={navigateTo} />;
      case 'transactions': return <EarningsLedgerPage onNavigate={navigateTo} />;
      case 'create-lot': return <CreateLotPage onNavigate={navigateTo} />;
      case 'smart-identify': return <SmartIdentifierPage onBack={() => navigateTo('dashboard')} />;
      case 'safety-guide': return <SafetyGuidePage onBack={() => navigateTo('dashboard')} />;

      // Recycler Routes
      case 'recycler-dashboard': 
        if(currentUser.role !== 'recycler') return navigateTo('dashboard');
        return <RecyclerDashboard onNavigate={navigateTo} />;
      case 'incoming-lots': return <PlaceholderPage title="Incoming Lots" onBack={() => navigateTo('recycler-dashboard')} />;
      case 'material-offers': return <PlaceholderPage title="Material Offers" onBack={() => navigateTo('recycler-dashboard')} />;
      case 'handover-confirmation': return <HandoverConfirmationPage onNavigate={navigateTo} />;
      case 'recycler-transactions': return <RecyclerTransactionsPage onNavigate={navigateTo} />;
      case 'update-rates': return <PlaceholderPage title="Update Market Rates" onBack={() => navigateTo('recycler-dashboard')} />;

      // Admin Routes
      case 'admin-dashboard':
        if(currentUser.role !== 'admin') return navigateTo('dashboard');
        return <AdminDashboard onNavigate={navigateTo} />;
      case 'verify-recyclers': return <PlaceholderPage title="Verify Recyclers" onBack={() => navigateTo('admin-dashboard')} />;
      case 'user-management': return <PlaceholderPage title="User Management" onBack={() => navigateTo('admin-dashboard')} />;
      case 'analytics': return <PlaceholderPage title="Platform Analytics" onBack={() => navigateTo('admin-dashboard')} />;
      case 'settings': return <PlaceholderPage title="System Settings" onBack={() => navigateTo('admin-dashboard')} />;

      default: return <LandingPage onNavigate={navigateTo} />;
    }
  };

  const isAppView = !['landing', 'login', 'register', 'language'].includes(currentPage);
  const hideNav = currentPage === 'language';

  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-900 min-h-screen flex flex-col">
      {!hideNav && <Navbar onNavigate={navigateTo} currentPage={currentPage} />}
      
      <main className="flex-grow">
        {renderPage()}
      </main>

      {isAppView && <MobileBottomNav onNavigate={navigateTo} currentPage={currentPage} />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}