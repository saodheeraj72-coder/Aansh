import React, { useState, useMemo, useEffect, useRef, createContext, useContext } from 'react';
import {
  Scale, Landmark, Receipt, TrendingUp, PiggyBank, Tag,
  IndianRupee, Package, ChevronLeft, ChevronRight, Star, Trash2, Check, Wifi, BatteryFull,
} from 'lucide-react';

const C = {
  page: '#10130E',
  bezel: '#1C201A',
  bezelHi: '#2B3126',
  screen: '#F7F9F3',
  surface: '#FFFFFF',
  tint: '#EEF3EA',
  line: '#DEE6D9',
  green: '#0B5D3B',
  greenBright: '#1FA968',
  greenDeep: '#0A3323',
  gold: '#B4924C',
  goldLabel: '#8E6F35',
  ink: '#16231D',
  inkMuted: '#66766B',
};

const fmtINR = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtNum = (n, d = 2) => (n || 0).toLocaleString('en-IN', { maximumFractionDigits: d });

/* ---------- motion: fluid-interface primitives ---------- */
/**
 * Tracks the OS-level "reduce motion" accessibility setting live, so every
 * animated piece of the app can fall back to instant, transition-free state
 * changes when the person has asked their device for less motion.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setReduced(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else if (mq.removeListener) mq.removeListener(handler);
    };
  }, []);
  return reduced;
}

/**
 * One-shot imperative damped-spring runner — a real physics step
 * (stiffness/damping/mass), not a fixed-duration easing curve. Used
 * wherever a live gesture velocity needs to hand off into an animation:
 * screen pushes/pops and the edge-swipe-back gesture. Returns a cancel
 * function so an in-flight spring can be grabbed and interrupted mid-flight.
 */
function runSpring({ from, to, velocity = 0, stiffness = 230, damping = 24, mass = 1, precision = 0.5, onFrame, onDone }) {
  let value = from;
  let vel = velocity;
  let last = typeof performance !== 'undefined' ? performance.now() : Date.now();
  let raf = requestAnimationFrame(function tick(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    const displacement = value - to;
    const accel = (-stiffness * displacement - damping * vel) / mass;
    vel += accel * dt;
    value += vel * dt;
    onFrame && onFrame(value);
    if (Math.abs(displacement) < precision && Math.abs(vel) < precision) {
      onFrame && onFrame(to);
      onDone && onDone();
      return;
    }
    raf = requestAnimationFrame(tick);
  });
  return () => cancelAnimationFrame(raf);
}

/* ---------- language ---------- */
const STRINGS = {
  brandName: { hi: 'तराज़ू', en: 'Tarazu' },
  tagline: { hi: 'ऑल-इन-वन कैलकुलेटर', en: 'All-in-one calculator' },
  splashTag: { hi: 'रेट · EMI · GST · SIP', en: 'Rate · EMI · GST · SIP' },

  rateName: { hi: 'भाव', en: 'Rate' },
  rateDesc: { hi: 'रेट व मात्रा कैलकुलेटर', en: 'Rate & quantity calculator' },
  emiName: { hi: 'EMI कैलकुलेटर', en: 'EMI Calculator' },
  emiDesc: { hi: 'लोन की मासिक किस्त', en: 'Monthly loan installment' },
  gstName: { hi: 'GST कैलकुलेटर', en: 'GST Calculator' },
  gstDesc: { hi: 'टैक्स जोड़ें या घटाएं', en: 'Add or remove tax' },
  sipName: { hi: 'SIP कैलकुलेटर', en: 'SIP Calculator' },
  sipDesc: { hi: 'निवेश पर रिटर्न', en: 'Returns on investment' },
  fdName: { hi: 'FD / RD कैलकुलेटर', en: 'FD / RD Calculator' },
  fdDesc: { hi: 'जमा राशि पर ब्याज', en: 'Interest on deposits' },
  discountName: { hi: 'छूट कैलकुलेटर', en: 'Discount Calculator' },
  discountDesc: { hi: 'डिस्काउंट व असली कीमत', en: 'Discount & final price' },

  itemNamePlaceholder: { hi: 'सामान का नाम — वैकल्पिक', en: 'Item name — optional' },
  rateLabel: { hi: 'भाव (Rate)', en: 'Rate' },
  saveDone: { hi: 'सेव हुआ', en: 'Saved' },
  saveCta: { hi: 'सेव करो', en: 'Save' },
  unnamed: { hi: 'बिना नाम', en: 'Unnamed' },
  kgSolid: { hi: 'किलो (ठोस)', en: 'Kilo (solid)' },
  literLiquid: { hi: 'लीटर (तरल)', en: 'Liter (liquid)' },
  whatDoYouKnow: { hi: 'क्या मालूम है?', en: 'What do you know?' },
  enterMoney: { hi: 'पैसे डालो', en: 'Enter money' },
  enterQty: { hi: 'मात्रा डालो', en: 'Enter quantity' },
  howManyRupees: { hi: 'कितने रुपये का देना है?', en: 'How many rupees worth?' },
  howMuchQty: { hi: 'कितनी मात्रा देनी है?', en: 'How much quantity?' },
  willGetQty: { hi: 'मिलेगी इतनी मात्रा', en: "You'll get this much" },
  willPay: { hi: 'देने होंगे इतने पैसे', en: "You'll need to pay" },
  quickRateList: { hi: 'झटपट रेट सूची', en: 'Quick rate list' },
  unitKg: { hi: 'किलो', en: 'kg' },
  unitLiter: { hi: 'लीटर', en: 'liter' },
  unitGram: { hi: 'ग्राम', en: 'grams' },
  unitMl: { hi: 'मिली', en: 'ml' },
  perKg: { hi: '/किलो', en: '/kg' },
  perLiter: { hi: '/लीटर', en: '/liter' },

  loanAmount: { hi: 'लोन राशि (Principal)', en: 'Loan Amount (Principal)' },
  interestRateAnnual: { hi: 'ब्याज दर (सालाना %)', en: 'Interest Rate (Annual %)' },
  perYearSuffix: { hi: '% प्रति वर्ष', en: '% per year' },
  tenure: { hi: 'अवधि (Tenure)', en: 'Tenure' },
  years: { hi: 'साल', en: 'Years' },
  months: { hi: 'महीने', en: 'Months' },
  monthlyEmi: { hi: 'मासिक किस्त (EMI)', en: 'Monthly Installment (EMI)' },
  totalInterest: { hi: 'कुल ब्याज', en: 'Total Interest' },
  totalPayment: { hi: 'कुल भुगतान', en: 'Total Payment' },

  amountLabel: { hi: 'रकम (Amount)', en: 'Amount' },
  chooseGstRate: { hi: 'GST दर चुनो', en: 'Choose GST Rate' },
  customRateSuffix: { hi: '% कस्टम दर', en: '% custom rate' },
  whatToDo: { hi: 'क्या करना है?', en: 'What to do?' },
  addGst: { hi: 'GST जोड़ो', en: 'Add GST' },
  removeGst: { hi: 'GST हटाओ', en: 'Remove GST' },
  totalWithGst: { hi: 'कुल रकम (GST सहित)', en: 'Total (incl. GST)' },
  baseWithoutGst: { hi: 'मूल रकम (GST रहित)', en: 'Base Amount (excl. GST)' },
  totalGst: { hi: 'कुल GST', en: 'Total GST' },

  monthlySip: { hi: 'मासिक निवेश (Monthly SIP)', en: 'Monthly Investment (SIP)' },
  expectedReturn: { hi: 'अनुमानित सालाना रिटर्न', en: 'Expected Annual Return' },
  durationYears: { hi: 'अवधि (साल)', en: 'Duration (Years)' },
  yearsSuffix: { hi: 'साल', en: 'years' },
  maturityValue: { hi: 'कुल राशि (Maturity Value)', en: 'Total Amount (Maturity Value)' },
  totalInvested: { hi: 'कुल निवेश', en: 'Total Invested' },
  estReturns: { hi: 'अनुमानित रिटर्न', en: 'Estimated Returns' },

  depositType: { hi: 'जमा प्रकार', en: 'Deposit Type' },
  fdLumpsum: { hi: 'FD (एकमुश्त)', en: 'FD (Lumpsum)' },
  rdMonthly: { hi: 'RD (मासिक)', en: 'RD (Monthly)' },
  depositAmount: { hi: 'जमा राशि', en: 'Deposit Amount' },
  monthlyDepositAmount: { hi: 'मासिक जमा राशि', en: 'Monthly Deposit Amount' },
  maturityAmount: { hi: 'मैच्योरिटी राशि', en: 'Maturity Amount' },
  totalDeposited: { hi: 'कुल जमा', en: 'Total Deposited' },
  interestOnly: { hi: 'ब्याज', en: 'Interest' },

  mrp: { hi: 'असली कीमत (MRP)', en: 'Original Price (MRP)' },
  discountPctLabel: { hi: 'छूट (Discount %)', en: 'Discount %' },
  savings: { hi: 'बचत (Savings)', en: 'Savings' },
};

const LangContext = createContext({ lang: 'hi', t: (k) => k, toggleLang: () => {} });
const useLang = () => useContext(LangContext);

function LangProvider({ children }) {
  const [lang, setLang] = useState('hi');
  const toggleLang = () => setLang((l) => (l === 'hi' ? 'en' : 'hi'));
  const t = (key) => (STRINGS[key] ? STRINGS[key][lang] : key);
  return <LangContext.Provider value={{ lang, t, toggleLang }}>{children}</LangContext.Provider>;
}

function LangToggle() {
  const { lang, toggleLang } = useLang();
  const idx = lang === 'hi' ? 0 : 1;
  return (
    <button
      onClick={toggleLang}
      className="press-feedback flex-shrink-0 relative flex items-center rounded-full text-[10px] font-semibold overflow-hidden"
      style={{ border: `1px solid ${C.line}` }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 bottom-0 rounded-full"
        style={{ width: '50%', left: 0, background: C.green, transform: `translateX(${idx * 100}%)`, transition: 'transform 0.34s cubic-bezier(0.32,0.72,0,1)' }}
      />
      <span className="relative px-2 py-1" style={{ color: lang === 'hi' ? '#FFFFFF' : C.inkMuted, transition: 'color 0.22s ease' }}>हिं</span>
      <span className="relative px-2 py-1" style={{ color: lang === 'en' ? '#FFFFFF' : C.inkMuted, transition: 'color 0.22s ease' }}>EN</span>
    </button>
  );
}

/* ---------- shared UI pieces ---------- */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,600;6..72,700&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
      .bhaav-input { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
      .bhaav-input:focus { outline: none; border-color: ${C.green}; box-shadow: 0 0 0 3px rgba(11,93,59,0.14); }
      .chip { transition: background-color 0.22s cubic-bezier(0.32,0.72,0,1), color 0.22s cubic-bezier(0.32,0.72,0,1), border-color 0.22s cubic-bezier(0.32,0.72,0,1), transform 0.12s cubic-bezier(0.32,0.72,0,1); touch-action: manipulation; }
      .chip-active { background: ${C.green}; color: #FFFFFF; }
      .card-tap { transition: transform 0.12s cubic-bezier(0.32,0.72,0,1), box-shadow 0.22s ease; touch-action: manipulation; }
      .press-feedback { transition: transform 0.12s cubic-bezier(0.32,0.72,0,1); touch-action: manipulation; }
      .chip:active, .card-tap:active, .press-feedback:active { transform: scale(0.95); transition-duration: 0.08s; }
      .fulcrum-line { height: 1px; background: linear-gradient(90deg, transparent, ${C.line}, transparent); position: relative; }
      .fulcrum-dot { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 6px; height: 6px; border-radius: 999px; background: ${C.gold}; box-shadow: 0 0 6px 1px rgba(180,146,76,0.4); }
      .scrollbar-thin::-webkit-scrollbar { width: 3px; }
      .scrollbar-thin::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 4px; }
      @keyframes resultPop { 0% { transform: scale(0.985); opacity: 0.75; } 100% { transform: scale(1); opacity: 1; } }
      .result-pop { animation: resultPop 0.32s cubic-bezier(0.32,0.72,0,1); }
      @keyframes splashLogoIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes splashTextIn { 0% { transform: translateY(8px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      .splash-logo-in { animation: splashLogoIn 0.62s cubic-bezier(0.34,1.56,0.64,1) both; }
      .splash-text-in { animation: splashTextIn 0.5s cubic-bezier(0.32,0.72,0,1) both; animation-delay: 0.16s; }
      .splash-overlay { transition: opacity 0.38s ease; }
      @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
    `}</style>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider block mb-2" style={{ color: C.goldLabel, letterSpacing: '0.08em', fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, prefix, suffix, placeholder = '0' }) {
  return (
    <div className="flex items-center rounded-2xl px-4 py-3 gap-2 bhaav-input" style={{ background: C.tint, border: `1px solid ${C.line}` }}>
      {prefix}
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent w-full text-lg outline-none"
        style={{ color: C.ink, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
        placeholder={placeholder}
      />
      {suffix && <span className="text-sm flex-shrink-0" style={{ color: C.inkMuted }}>{suffix}</span>}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const n = options.length;
  return (
    <div className="rounded-xl p-1" style={{ background: C.tint, border: `1px solid ${C.line}` }}>
      <div className="relative flex">
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 rounded-lg"
          style={{ width: `${100 / n}%`, left: 0, background: C.green, transform: `translateX(${idx * 100}%)`, transition: 'transform 0.38s cubic-bezier(0.32,0.72,0,1)' }}
        />
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="press-feedback relative flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ color: value === opt.value ? '#FFFFFF' : C.inkMuted, transition: 'color 0.24s ease' }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ rows, primaryLabel, primaryValue }) {
  return (
    <div className="rounded-2xl px-5 py-5 flex flex-col items-center gap-3" style={{ background: `linear-gradient(160deg, ${C.green} 0%, ${C.greenDeep} 100%)`, border: `1px solid ${C.gold}` }}>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em' }}>{primaryLabel}</span>
        <div key={primaryValue} className="result-pop text-3xl text-center" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, background: `linear-gradient(180deg, #E9D8A8, ${C.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {primaryValue}
        </div>
      </div>
      {rows && rows.length > 0 && (
        <div className="w-full pt-2 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{row.label}</span>
              <span className="text-sm" style={{ color: '#FFFFFF', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScreenHeader({ title, subtitle, icon, onBack }) {
  return (
    <div className="px-6 pt-5 pb-5 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.line}` }}>
      <button onClick={onBack} className="press-feedback w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.tint, border: `1px solid ${C.line}` }}>
        <ChevronLeft size={16} color={C.ink} />
      </button>
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.greenDeep, border: `1px solid ${C.gold}` }}>
        {icon}
      </div>
      <div className="flex-1">
        <h1 className="text-lg leading-none" style={{ fontFamily: "'Newsreader', serif", fontWeight: 600, color: C.ink }}>{title}</h1>
        <p className="text-[11px] mt-1" style={{ color: C.inkMuted, letterSpacing: '0.03em' }}>{subtitle}</p>
      </div>
      <LangToggle />
    </div>
  );
}

/* ---------- Home screen ---------- */
const CALCULATORS = [
  { id: 'rate', nameKey: 'rateName', descKey: 'rateDesc', icon: Scale },
  { id: 'emi', nameKey: 'emiName', descKey: 'emiDesc', icon: Landmark },
  { id: 'gst', nameKey: 'gstName', descKey: 'gstDesc', icon: Receipt },
  { id: 'sip', nameKey: 'sipName', descKey: 'sipDesc', icon: TrendingUp },
  { id: 'fd', nameKey: 'fdName', descKey: 'fdDesc', icon: PiggyBank },
  { id: 'discount', nameKey: 'discountName', descKey: 'discountDesc', icon: Tag },
];

function HomeScreen({ onOpen }) {
  const { t } = useLang();
  return (
    <div>
      <div className="px-6 pt-5 pb-5 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.greenDeep, border: `1px solid ${C.gold}` }}>
            <Scale size={17} color={C.gold} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl leading-none" style={{ fontFamily: "'Newsreader', serif", fontWeight: 600, color: C.ink }}>{t('brandName')}</h1>
            <p className="text-[11px] mt-1" style={{ color: C.inkMuted, letterSpacing: '0.04em' }}>{t('tagline')}</p>
          </div>
        </div>
        <LangToggle />
      </div>
      <div className="px-5 py-5 flex flex-col gap-2.5">
        {CALCULATORS.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => onOpen(c.id)}
              className="card-tap flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left"
              style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: '0 1px 2px rgba(22,35,29,0.04)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.greenDeep, border: `1px solid ${C.gold}` }}>
                <Icon size={18} color={C.gold} strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <div className="text-[15px]" style={{ color: C.ink, fontFamily: "'Newsreader', serif", fontWeight: 600 }}>{t(c.nameKey)}</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.inkMuted }}>{t(c.descKey)}</div>
              </div>
              <ChevronRight size={16} color={C.inkMuted} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Rate calculator (भाव) ---------- */
const UNIT_LABELS = {
  kg: { baseKey: 'unitKg', smallKey: 'unitGram', perKey: 'perKg', factor: 1000 },
  liter: { baseKey: 'unitLiter', smallKey: 'unitMl', perKey: 'perLiter', factor: 1000 },
};
const MONEY_CHIPS = [10, 20, 50, 100, 200];
const QTY_CHIPS_SMALL = [50, 100, 250, 500];
const REF_ROWS = [100, 250, 500, 1000];

function RateScreen({ onBack }) {
  const { t } = useLang();
  const [rate, setRate] = useState('108');
  const [baseUnit, setBaseUnit] = useState('kg');
  const [mode, setMode] = useState('money');
  const [money, setMoney] = useState('20');
  const [qty, setQty] = useState('500');
  const [qtyIsSmall, setQtyIsSmall] = useState(true);
  const [itemName, setItemName] = useState('');
  const [saved, setSaved] = useState([]);
  const [justSaved, setJustSaved] = useState(false);

  const uRaw = UNIT_LABELS[baseUnit];
  const u = { base: t(uRaw.baseKey), small: t(uRaw.smallKey), per: t(uRaw.perKey), factor: uRaw.factor };
  const r = parseFloat(rate) || 0;

  const result = useMemo(() => {
    if (mode === 'money') {
      const m = parseFloat(money) || 0;
      if (r === 0) return null;
      return { kind: 'quantity', smallQty: (m / r) * u.factor };
    } else {
      const q = parseFloat(qty) || 0;
      const baseQty = qtyIsSmall ? q / u.factor : q;
      return { kind: 'money', amount: baseQty * r };
    }
  }, [rate, baseUnit, mode, money, qty, qtyIsSmall, u.factor, r]);

  const formatQty = (smallQty) => (smallQty >= u.factor
    ? `${fmtNum(smallQty / u.factor)} ${u.base}`
    : `${fmtNum(smallQty, 1)} ${u.small}`);

  const handleSave = () => {
    if (!r) return;
    const entry = { id: Date.now(), name: itemName.trim(), rate: r, baseUnit };
    setSaved((prev) => [entry, ...prev.filter((s) => !(s.rate === r && s.baseUnit === baseUnit))].slice(0, 6));
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
  };
  const loadSaved = (s) => { setRate(String(s.rate)); setBaseUnit(s.baseUnit); setItemName(s.name || ''); };
  const removeSaved = (id, e) => { e.stopPropagation(); setSaved((prev) => prev.filter((s) => s.id !== id)); };

  return (
    <div>
      <ScreenHeader title={t('rateName')} subtitle={t('rateDesc')} icon={<Scale size={17} color={C.gold} strokeWidth={1.75} />} onBack={onBack} />
      <div className="px-6 py-6 flex flex-col gap-4">
        {saved.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
            {saved.map((s) => (
              <button key={s.id} onClick={() => loadSaved(s)} className="chip chip-mini flex-shrink-0 flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs" style={{ background: C.tint, border: `1px solid ${C.line}`, color: C.ink }}>
                <Star size={10} color={C.gold} fill={C.gold} />
                <span className="whitespace-nowrap">{s.name || t('unnamed')} · ₹{s.rate}</span>
                <span onClick={(e) => removeSaved(s.id, e)} className="ml-0.5 opacity-60"><Trash2 size={11} color={C.inkMuted} /></span>
              </button>
            ))}
          </div>
        )}
        <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder={t('itemNamePlaceholder')} className="bhaav-input bg-transparent text-sm rounded-xl px-3.5 py-2.5" style={{ background: C.tint, border: `1px solid ${C.line}`, color: C.ink }} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] uppercase tracking-wider" style={{ color: C.goldLabel, letterSpacing: '0.08em', fontWeight: 600 }}>{t('rateLabel')}</label>
            <button onClick={handleSave} className="press-feedback flex items-center gap-1 text-[11px] px-2 py-1 rounded-full" style={{ color: justSaved ? C.green : C.inkMuted, border: `1px solid ${C.line}`, transition: 'color 0.2s ease' }}>
              {justSaved ? <Check size={11} /> : <Star size={11} color={C.gold} />}{justSaved ? t('saveDone') : t('saveCta')}
            </button>
          </div>
          <NumInput value={rate} onChange={setRate} prefix={<IndianRupee size={16} color={C.green} strokeWidth={2} />} suffix={u.per} />
          <div className="flex gap-2 mt-2.5">
            {['kg', 'liter'].map((opt) => (
              <button key={opt} onClick={() => { setBaseUnit(opt); setQtyIsSmall(true); }} className={`chip flex-1 py-2 rounded-xl text-sm font-medium ${baseUnit === opt ? 'chip-active' : ''}`} style={baseUnit === opt ? {} : { background: 'transparent', color: C.inkMuted, border: `1px solid ${C.line}` }}>
                {opt === 'kg' ? t('kgSolid') : t('literLiquid')}
              </button>
            ))}
          </div>
        </div>

        <div className="fulcrum-line"><div className="fulcrum-dot" /></div>

        <Field label={t('whatDoYouKnow')}>
          <Segmented options={[{ value: 'money', label: t('enterMoney') }, { value: 'quantity', label: t('enterQty') }]} value={mode} onChange={setMode} />
        </Field>

        {mode === 'money' ? (
          <div>
            <Field label={t('howManyRupees')}>
              <NumInput value={money} onChange={setMoney} prefix={<IndianRupee size={16} color={C.green} strokeWidth={2} />} />
            </Field>
            <div className="flex gap-2 mt-2.5">
              {MONEY_CHIPS.map((v) => (
                <button key={v} onClick={() => setMoney(String(v))} className="chip chip-mini flex-1 py-1.5 rounded-lg text-xs font-medium" style={{ background: money === String(v) ? C.green : 'transparent', color: money === String(v) ? '#FFFFFF' : C.inkMuted, border: `1px solid ${money === String(v) ? C.green : C.line}` }}>₹{v}</button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <Field label={t('howMuchQty')}>
              <NumInput value={qty} onChange={setQty} prefix={<Package size={16} color={C.green} strokeWidth={2} />} />
            </Field>
            <div className="flex gap-2 mt-2.5">
              <button onClick={() => setQtyIsSmall(true)} className={`chip flex-1 py-2 rounded-xl text-sm font-medium ${qtyIsSmall ? 'chip-active' : ''}`} style={qtyIsSmall ? {} : { background: 'transparent', color: C.inkMuted, border: `1px solid ${C.line}` }}>{u.small}</button>
              <button onClick={() => setQtyIsSmall(false)} className={`chip flex-1 py-2 rounded-xl text-sm font-medium ${!qtyIsSmall ? 'chip-active' : ''}`} style={!qtyIsSmall ? {} : { background: 'transparent', color: C.inkMuted, border: `1px solid ${C.line}` }}>{u.base}</button>
            </div>
            {qtyIsSmall && (
              <div className="flex gap-2 mt-2.5">
                {QTY_CHIPS_SMALL.map((v) => (
                  <button key={v} onClick={() => setQty(String(v))} className="chip chip-mini flex-1 py-1.5 rounded-lg text-xs font-medium" style={{ background: qty === String(v) ? C.green : 'transparent', color: qty === String(v) ? '#FFFFFF' : C.inkMuted, border: `1px solid ${qty === String(v) ? C.green : C.line}` }}>{v}{baseUnit === 'kg' ? 'g' : 'ml'}</button>
                ))}
              </div>
            )}
          </div>
        )}

        <ResultCard
          primaryLabel={mode === 'money' ? t('willGetQty') : t('willPay')}
          primaryValue={result == null ? '—' : result.kind === 'quantity' ? formatQty(result.smallQty) : fmtINR(result.amount)}
        />

        {r > 0 && (
          <div>
            <div className="fulcrum-line mb-3"><div className="fulcrum-dot" /></div>
            <label className="text-[11px] uppercase tracking-wider block mb-2" style={{ color: C.goldLabel, letterSpacing: '0.08em', fontWeight: 600 }}>{t('quickRateList')}</label>
            <div className="grid grid-cols-2 gap-2">
              {REF_ROWS.map((g) => {
                const price = (g / u.factor) * r;
                const label = g >= 1000 ? `1 ${u.base}` : `${g} ${baseUnit === 'kg' ? 'g' : 'ml'}`;
                return (
                  <div key={g} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: C.tint, border: `1px solid ${C.line}` }}>
                    <span className="text-xs" style={{ color: C.inkMuted }}>{label}</span>
                    <span className="text-sm" style={{ color: C.green, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{fmtINR(price)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- EMI calculator ---------- */
function EmiScreen({ onBack }) {
  const { t } = useLang();
  const [principal, setPrincipal] = useState('500000');
  const [rate, setRate] = useState('9.5');
  const [tenureMode, setTenureMode] = useState('years');
  const [tenure, setTenure] = useState('5');

  const result = useMemo(() => {
    const P = parseFloat(principal) || 0;
    const annualRate = parseFloat(rate) || 0;
    const tYears = parseFloat(tenure) || 0;
    const n = tenureMode === 'years' ? tYears * 12 : tYears;
    const r = annualRate / 12 / 100;
    if (P <= 0 || n <= 0) return null;
    let emi;
    if (r === 0) emi = P / n;
    else emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;
    return { emi, totalPayment, totalInterest };
  }, [principal, rate, tenureMode, tenure]);

  return (
    <div>
      <ScreenHeader title={t('emiName')} subtitle={t('emiDesc')} icon={<Landmark size={17} color={C.gold} strokeWidth={1.75} />} onBack={onBack} />
      <div className="px-6 py-6 flex flex-col gap-4">
        <Field label={t('loanAmount')}>
          <NumInput value={principal} onChange={setPrincipal} prefix={<IndianRupee size={16} color={C.green} strokeWidth={2} />} />
        </Field>
        <Field label={t('interestRateAnnual')}>
          <NumInput value={rate} onChange={setRate} suffix={t('perYearSuffix')} />
        </Field>
        <Field label={t('tenure')}>
          <div className="flex gap-2">
            <div className="flex-1"><NumInput value={tenure} onChange={setTenure} /></div>
            <div className="w-32"><Segmented options={[{ value: 'years', label: t('years') }, { value: 'months', label: t('months') }]} value={tenureMode} onChange={setTenureMode} /></div>
          </div>
        </Field>
        <ResultCard
          primaryLabel={t('monthlyEmi')}
          primaryValue={result ? fmtINR(result.emi) : '—'}
          rows={result ? [
            { label: t('totalInterest'), value: fmtINR(result.totalInterest) },
            { label: t('totalPayment'), value: fmtINR(result.totalPayment) },
          ] : []}
        />
      </div>
    </div>
  );
}

/* ---------- GST calculator ---------- */
const GST_SLABS = [5, 12, 18, 28];
function GstScreen({ onBack }) {
  const { t } = useLang();
  const [amount, setAmount] = useState('1000');
  const [gstRate, setGstRate] = useState('18');
  const [direction, setDirection] = useState('add');

  const result = useMemo(() => {
    const a = parseFloat(amount) || 0;
    const rate = parseFloat(gstRate) || 0;
    let base, gstAmount, finalAmount;
    if (direction === 'add') {
      base = a;
      gstAmount = (a * rate) / 100;
      finalAmount = a + gstAmount;
    } else {
      finalAmount = a;
      base = a / (1 + rate / 100);
      gstAmount = a - base;
    }
    return { base, gstAmount, finalAmount, half: gstAmount / 2 };
  }, [amount, gstRate, direction]);

  return (
    <div>
      <ScreenHeader title={t('gstName')} subtitle={t('gstDesc')} icon={<Receipt size={17} color={C.gold} strokeWidth={1.75} />} onBack={onBack} />
      <div className="px-6 py-6 flex flex-col gap-4">
        <Field label={t('amountLabel')}>
          <NumInput value={amount} onChange={setAmount} prefix={<IndianRupee size={16} color={C.green} strokeWidth={2} />} />
        </Field>
        <Field label={t('chooseGstRate')}>
          <div className="flex gap-2">
            {GST_SLABS.map((s) => (
              <button key={s} onClick={() => setGstRate(String(s))} className="chip chip-mini flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: gstRate === String(s) ? C.green : 'transparent', color: gstRate === String(s) ? '#FFFFFF' : C.inkMuted, border: `1px solid ${gstRate === String(s) ? C.green : C.line}` }}>{s}%</button>
            ))}
          </div>
          <div className="mt-2.5"><NumInput value={gstRate} onChange={setGstRate} suffix={t('customRateSuffix')} /></div>
        </Field>
        <Field label={t('whatToDo')}>
          <Segmented options={[{ value: 'add', label: t('addGst') }, { value: 'remove', label: t('removeGst') }]} value={direction} onChange={setDirection} />
        </Field>
        <ResultCard
          primaryLabel={direction === 'add' ? t('totalWithGst') : t('baseWithoutGst')}
          primaryValue={result ? fmtINR(direction === 'add' ? result.finalAmount : result.base) : '—'}
          rows={result ? [
            { label: t('totalGst'), value: fmtINR(result.gstAmount) },
            { label: 'CGST (50%)', value: fmtINR(result.half) },
            { label: 'SGST (50%)', value: fmtINR(result.half) },
          ] : []}
        />
      </div>
    </div>
  );
}

/* ---------- SIP calculator ---------- */
function SipScreen({ onBack }) {
  const { t } = useLang();
  const [monthly, setMonthly] = useState('5000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');

  const result = useMemo(() => {
    const P = parseFloat(monthly) || 0;
    const annualRate = parseFloat(rate) || 0;
    const n = (parseFloat(years) || 0) * 12;
    const i = annualRate / 12 / 100;
    if (P <= 0 || n <= 0) return null;
    let futureValue;
    if (i === 0) futureValue = P * n;
    else futureValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const invested = P * n;
    const returns = futureValue - invested;
    return { futureValue, invested, returns };
  }, [monthly, rate, years]);

  return (
    <div>
      <ScreenHeader title={t('sipName')} subtitle={t('sipDesc')} icon={<TrendingUp size={17} color={C.gold} strokeWidth={1.75} />} onBack={onBack} />
      <div className="px-6 py-6 flex flex-col gap-4">
        <Field label={t('monthlySip')}>
          <NumInput value={monthly} onChange={setMonthly} prefix={<IndianRupee size={16} color={C.green} strokeWidth={2} />} />
        </Field>
        <Field label={t('expectedReturn')}>
          <NumInput value={rate} onChange={setRate} suffix={t('perYearSuffix')} />
        </Field>
        <Field label={t('durationYears')}>
          <NumInput value={years} onChange={setYears} suffix={t('yearsSuffix')} />
        </Field>
        <ResultCard
          primaryLabel={t('maturityValue')}
          primaryValue={result ? fmtINR(result.futureValue) : '—'}
          rows={result ? [
            { label: t('totalInvested'), value: fmtINR(result.invested) },
            { label: t('estReturns'), value: fmtINR(result.returns) },
          ] : []}
        />
      </div>
    </div>
  );
}

/* ---------- FD / RD calculator ---------- */
function FdScreen({ onBack }) {
  const { t } = useLang();
  const [depositType, setDepositType] = useState('fd');
  const [amount, setAmount] = useState('100000');
  const [rate, setRate] = useState('7');
  const [years, setYears] = useState('3');

  const result = useMemo(() => {
    const P = parseFloat(amount) || 0;
    const annualRate = parseFloat(rate) || 0;
    const tYears = parseFloat(years) || 0;
    if (P <= 0 || tYears <= 0) return null;
    if (depositType === 'fd') {
      const n = 4;
      const maturity = P * Math.pow(1 + annualRate / (n * 100), n * tYears);
      return { maturity, invested: P, interest: maturity - P };
    } else {
      const months = tYears * 12;
      const i = annualRate / 12 / 100;
      const maturity = i === 0 ? P * months : P * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
      const invested = P * months;
      return { maturity, invested, interest: maturity - invested };
    }
  }, [depositType, amount, rate, years]);

  return (
    <div>
      <ScreenHeader title={t('fdName')} subtitle={t('fdDesc')} icon={<PiggyBank size={17} color={C.gold} strokeWidth={1.75} />} onBack={onBack} />
      <div className="px-6 py-6 flex flex-col gap-4">
        <Field label={t('depositType')}>
          <Segmented options={[{ value: 'fd', label: t('fdLumpsum') }, { value: 'rd', label: t('rdMonthly') }]} value={depositType} onChange={setDepositType} />
        </Field>
        <Field label={depositType === 'fd' ? t('depositAmount') : t('monthlyDepositAmount')}>
          <NumInput value={amount} onChange={setAmount} prefix={<IndianRupee size={16} color={C.green} strokeWidth={2} />} />
        </Field>
        <Field label={t('interestRateAnnual')}>
          <NumInput value={rate} onChange={setRate} suffix={t('perYearSuffix')} />
        </Field>
        <Field label={t('durationYears')}>
          <NumInput value={years} onChange={setYears} suffix={t('yearsSuffix')} />
        </Field>
        <ResultCard
          primaryLabel={t('maturityAmount')}
          primaryValue={result ? fmtINR(result.maturity) : '—'}
          rows={result ? [
            { label: t('totalDeposited'), value: fmtINR(result.invested) },
            { label: t('interestOnly'), value: fmtINR(result.interest) },
          ] : []}
        />
      </div>
    </div>
  );
}

/* ---------- Discount calculator ---------- */
function DiscountScreen({ onBack }) {
  const { t } = useLang();
  const [price, setPrice] = useState('1000');
  const [discountPct, setDiscountPct] = useState('20');

  const result = useMemo(() => {
    const p = parseFloat(price) || 0;
    const d = parseFloat(discountPct) || 0;
    const saved = (p * d) / 100;
    const finalPrice = p - saved;
    return { saved, finalPrice };
  }, [price, discountPct]);

  return (
    <div>
      <ScreenHeader title={t('discountName')} subtitle={t('discountDesc')} icon={<Tag size={17} color={C.gold} strokeWidth={1.75} />} onBack={onBack} />
      <div className="px-6 py-6 flex flex-col gap-4">
        <Field label={t('mrp')}>
          <NumInput value={price} onChange={setPrice} prefix={<IndianRupee size={16} color={C.green} strokeWidth={2} />} />
        </Field>
        <Field label={t('discountPctLabel')}>
          <NumInput value={discountPct} onChange={setDiscountPct} suffix="%" />
          <div className="flex gap-2 mt-2.5">
            {[10, 20, 30, 50].map((v) => (
              <button key={v} onClick={() => setDiscountPct(String(v))} className="chip chip-mini flex-1 py-1.5 rounded-lg text-xs font-medium" style={{ background: discountPct === String(v) ? C.green : 'transparent', color: discountPct === String(v) ? '#FFFFFF' : C.inkMuted, border: `1px solid ${discountPct === String(v) ? C.green : C.line}` }}>{v}%</button>
            ))}
          </div>
        </Field>
        <ResultCard
          primaryLabel={t('willPay')}
          primaryValue={fmtINR(result.finalPrice)}
          rows={[{ label: t('savings'), value: fmtINR(result.saved) }]}
        />
      </div>
    </div>
  );
}

function SplashScreen() {
  const { t } = useLang();
  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center relative"
      style={{ background: `linear-gradient(155deg, ${C.greenBright} 0%, ${C.green} 55%, ${C.greenDeep} 100%)` }}
    >
      <div
        style={{
          position: 'absolute', top: '26%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46,209,138,0.35), transparent 70%)',
        }}
      />

      <div
        className="splash-logo-in relative flex items-center justify-center flex-shrink-0"
        style={{
          width: 108, height: 108, borderRadius: 26,
          background: `linear-gradient(155deg, ${C.greenBright}, ${C.green} 55%, ${C.greenDeep})`,
          border: '1.5px solid rgba(180,146,76,0.55)',
          boxShadow: '0 18px 40px -12px rgba(0,0,0,0.55)',
        }}
      >
        <div style={{ position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: 999, background: C.gold }} />
        <span style={{ fontFamily: "'Newsreader', serif", fontWeight: 600, fontSize: 52, lineHeight: 1, color: C.gold, marginTop: 2 }}>त</span>
        <div style={{ position: 'absolute', bottom: 23, left: '50%', transform: 'translateX(-50%)', width: 34, height: 1.5, background: C.gold, opacity: 0.75 }} />
      </div>

      <div className="splash-text-in mt-6 flex flex-col items-center flex-shrink-0">
        <span style={{ fontFamily: "'Newsreader', serif", fontWeight: 600, fontSize: 30, color: '#FFFFFF', letterSpacing: '0.02em' }}>{t('brandName')}</span>
        <span className="mt-2 text-[11px]" style={{ color: 'rgba(242,226,179,0.75)', letterSpacing: '0.16em', fontWeight: 600 }}>
          {t('splashTag')}
        </span>
      </div>
    </div>
  );
}

/* ---------- navigation shell: spring-driven push/pop + edge-swipe-back ---------- */
/**
 * Wraps one calculator screen. Plays a spring "push" transition in on mount,
 * a spring "pop" transition out when `open` is scripted to false (header
 * back button), and supports a genuine edge-swipe-back gesture: the screen
 * tracks the finger 1:1 while dragging, then hands off the release velocity
 * into a spring that either completes the close or springs back open. Any
 * of these — including a still-settling enter animation — can be grabbed
 * and reversed mid-flight by starting a new drag.
 */
function SwipeableScreen({ open, onRequestClose, onExited, onProgress, children }) {
  const elRef = useRef(null);
  const cancelSpringRef = useRef(null);
  const exitingRef = useRef(false);
  const widthRef = useRef(380);
  const currentXRef = useRef(380);
  const dragRef = useRef(null);
  const wasOpenRef = useRef(open);
  const reducedMotion = usePrefersReducedMotion();

  const setX = (px) => {
    currentXRef.current = px;
    if (elRef.current) elRef.current.style.transform = `translateX(${px}px)`;
    onProgress && onProgress(px, widthRef.current);
  };
  const stopSpring = () => {
    if (cancelSpringRef.current) { cancelSpringRef.current(); cancelSpringRef.current = null; }
  };

  // Push-in animation, played once right after mount.
  useEffect(() => {
    const rect = elRef.current ? elRef.current.getBoundingClientRect() : null;
    const width = rect && rect.width ? rect.width : 380;
    widthRef.current = width;
    if (reducedMotion) { setX(0); return; }
    setX(width);
    const raf = requestAnimationFrame(() => {
      cancelSpringRef.current = runSpring({
        from: width, to: 0, velocity: 0,
        onFrame: setX,
        onDone: () => { cancelSpringRef.current = null; },
      });
    });
    return () => { cancelAnimationFrame(raf); stopSpring(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scripted pop-out whenever `open` flips true -> false (header back button).
  // If a swipe-commit spring is already driving the close, this yields to it
  // rather than starting a second, conflicting animation — but if what's
  // in flight is something else (e.g. the enter animation, interrupted by a
  // very fast back-tap), it correctly grabs and reverses it instead.
  useEffect(() => {
    if (wasOpenRef.current && !open && !exitingRef.current) {
      stopSpring();
      exitingRef.current = true;
      const width = widthRef.current;
      if (reducedMotion) {
        setX(width);
        exitingRef.current = false;
        onExited && onExited();
      } else {
        cancelSpringRef.current = runSpring({
          from: currentXRef.current, to: width, velocity: 0,
          onFrame: setX,
          onDone: () => { cancelSpringRef.current = null; exitingRef.current = false; onExited && onExited(); },
        });
      }
    }
    wasOpenRef.current = open;
  }, [open, reducedMotion, onExited]);

  const onPointerDown = (e) => {
    if (reducedMotion || !open) return;
    const rect = elRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    if (localX > 16 || localY < 80) return; // only the left edge, below the header
    stopSpring();
    dragRef.current = {
      startX: e.clientX, startY: e.clientY, baseX: currentXRef.current,
      lastX: e.clientX, lastT: performance.now(), velocity: 0, decided: false, vertical: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.decided) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.decided = true;
      d.vertical = Math.abs(dy) > Math.abs(dx);
    }
    if (d.vertical) return; // let the page scroll natively
    const now = performance.now();
    const dt = Math.max(now - d.lastT, 1);
    d.velocity = ((e.clientX - d.lastX) / dt) * 1000;
    d.lastX = e.clientX; d.lastT = now;
    setX(Math.max(0, Math.min(d.baseX + dx, widthRef.current)));
  };
  const endDrag = (e) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || d.vertical) return;
    const width = widthRef.current;
    const dx = Math.max(0, Math.min(d.baseX + (e.clientX - d.startX), width));
    const flicked = dx - d.baseX;
    const commit = width > 0 && (dx / width >= 0.35 || (d.velocity >= 500 && flicked >= 10));
    if (commit) {
      exitingRef.current = true;
      cancelSpringRef.current = runSpring({
        from: dx, to: width, velocity: d.velocity,
        onFrame: setX,
        onDone: () => { cancelSpringRef.current = null; onExited && onExited(); },
      });
      onRequestClose && onRequestClose();
    } else {
      cancelSpringRef.current = runSpring({
        from: dx, to: 0, velocity: d.velocity,
        onFrame: setX,
        onDone: () => { cancelSpringRef.current = null; },
      });
    }
  };

  return (
    <div
      ref={elRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="absolute inset-0"
      style={{ willChange: 'transform', touchAction: 'pan-y', zIndex: 10 }}
    >
      {children}
    </div>
  );
}

/**
 * The splash screen as a fading overlay above Home (which is already
 * mounted underneath), so leaving splash reveals Home rather than
 * hard-cutting to it.
 */
function SplashOverlay({ visible, onSkip, onExited }) {
  const [phase, setPhase] = useState('in');
  const prevVisible = useRef(visible);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prevVisible.current && !visible) {
      setPhase('out');
      if (reducedMotion) {
        onExited && onExited();
      } else {
        const t = setTimeout(() => onExited && onExited(), 400);
        return () => clearTimeout(t);
      }
    }
    prevVisible.current = visible;
  }, [visible, reducedMotion, onExited]);

  return (
    <div
      className="absolute inset-0 splash-overlay"
      onClick={onSkip}
      style={{
        background: `linear-gradient(155deg, ${C.greenBright} 0%, ${C.green} 55%, ${C.greenDeep} 100%)`,
        opacity: phase === 'out' ? 0 : 1,
        zIndex: 30,
      }}
    >
      <SplashScreen />
    </div>
  );
}

/* ---------- App root with phone frame ---------- */
export default function BhaavCalculator() {
  const [screen, setScreen] = useState('splash');
  const [mountedCalcId, setMountedCalcId] = useState(null);
  const [splashMounted, setSplashMounted] = useState(true);
  const homeElRef = useRef(null);
  const homeDimRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setScreen('home'), 2200);
    return () => clearTimeout(timer);
  }, []);

  const screens = { rate: RateScreen, emi: EmiScreen, gst: GstScreen, sip: SipScreen, fd: FdScreen, discount: DiscountScreen };
  const ActiveScreenComponent = mountedCalcId ? screens[mountedCalcId] : null;
  const isSplash = screen === 'splash';
  const chromeColor = isSplash ? '#F2E2B3' : C.ink;
  const indicatorColor = isSplash ? '#FFFFFF' : C.ink;

  const openCalc = (id) => { setMountedCalcId(id); setScreen(id); };
  const goHome = () => setScreen('home');

  // Drives Home's subtle parallax recede + dim, in lockstep with the
  // calculator screen sliding over it — one continuous gesture across both
  // layers, the way iOS's own navigation stack behaves.
  const handleCalcProgress = (x, width) => {
    const t = width > 0 ? 1 - x / width : 0;
    if (homeElRef.current) homeElRef.current.style.transform = `translateX(${-t * 0.24 * width}px) scale(${1 - t * 0.035})`;
    if (homeDimRef.current) homeDimRef.current.style.opacity = String(t * 0.32);
  };

  return (
    <LangProvider>
      <div className="min-h-screen w-full flex items-center justify-center p-5" style={{ background: C.page, fontFamily: "'Inter', sans-serif" }}>
        <GlobalStyle />
        <div className="relative" style={{ width: 'min(380px, 90vw)', aspectRatio: '9 / 19.5', background: `linear-gradient(160deg, ${C.bezelHi}, ${C.bezel})`, borderRadius: 46, padding: '3.1%', boxShadow: '0 40px 90px -25px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05) inset' }}>
          <div
            style={{ position: 'absolute', top: '3.6%', left: '50%', transform: 'translateX(-50%)', width: 84, height: 22, background: C.bezel, borderRadius: 999, zIndex: 20 }}
          />
          <div className="relative flex flex-col w-full h-full overflow-hidden" style={{ background: isSplash ? C.greenDeep : C.screen, borderRadius: 34 }}>
            <div className="flex items-center justify-between px-7 pt-3.5 pb-1 flex-shrink-0">
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, color: chromeColor }}>9:41</span>
              <div className="flex items-center gap-1.5">
                <Wifi size={13} color={chromeColor} strokeWidth={2} />
                <BatteryFull size={15} color={chromeColor} strokeWidth={2} />
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div ref={homeElRef} className="absolute inset-0 overflow-y-auto scrollbar-thin" style={{ willChange: 'transform' }}>
                <HomeScreen onOpen={openCalc} />
              </div>
              <div ref={homeDimRef} className="absolute inset-0 pointer-events-none" style={{ background: '#000000', opacity: 0 }} />

              {mountedCalcId && (
                <SwipeableScreen
                  key={mountedCalcId}
                  open={screen === mountedCalcId}
                  onRequestClose={goHome}
                  onExited={() => setMountedCalcId(null)}
                  onProgress={handleCalcProgress}
                >
                  <div className="absolute inset-0 overflow-y-auto scrollbar-thin" style={{ background: C.screen }}>
                    <ActiveScreenComponent onBack={goHome} />
                  </div>
                </SwipeableScreen>
              )}

              {splashMounted && (
                <SplashOverlay
                  visible={isSplash}
                  onSkip={goHome}
                  onExited={() => setSplashMounted(false)}
                />
              )}
            </div>

            <div className="flex-shrink-0 flex justify-center pb-2 pt-1">
              <div style={{ width: 120, height: 5, borderRadius: 999, background: indicatorColor, opacity: isSplash ? 0.35 : 0.2 }} />
            </div>
          </div>
        </div>
      </div>
    </LangProvider>
  );
}

