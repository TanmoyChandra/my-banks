import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Tab = "upi" | "cards" | "accounts";
type Stage = "splash-one" | "splash-two" | "entry" | "app";
type SetupMode = Tab | null;

type UpiEntry = {
  id: string;
  name: string;
  bank: string;
  upi: string;
};

type CardEntry = {
  id: string;
  type: "Debit" | "Credit";
  bank: string;
  holder: string;
  number: string;
  expiry: string;
  cvv: string;
};

type AccountEntry = {
  id: string;
  holder: string;
  bank: string;
  account: string;
  ifsc: string;
};

const initialUpis: UpiEntry[] = [
  { id: "upi-1", name: "Personal UPI", bank: "HDFC Bank", upi: "alex@hdfcbank" },
  { id: "upi-2", name: "Shopping QR", bank: "State Bank", upi: "alex.sbi@upi" },
];

const initialCards: CardEntry[] = [
  { id: "card-1", type: "Credit", bank: "Axis Bank", holder: "Alex Morgan", number: "5424 1012 3456 9012", expiry: "09/29", cvv: "482" },
  { id: "card-2", type: "Debit", bank: "SBI", holder: "Alex Morgan", number: "6521 8822 1090 3344", expiry: "03/28", cvv: "118" },
];

const initialAccounts: AccountEntry[] = [
  { id: "account-1", holder: "Alex Morgan", bank: "ICICI Bank", account: "009812345678", ifsc: "ICIC0000891" },
  { id: "account-2", holder: "Alex Morgan", bank: "Kotak Mahindra", account: "781200456712", ifsc: "KKBK0001412" },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function detectNetwork(number: string) {
  const compact = number.replace(/\D/g, "");
  if (compact.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(compact) || /^2[2-7]/.test(compact)) return "Mastercard";
  if (/^(60|65|81|82|508|353|356)/.test(compact)) return "RuPay";
  if (/^3[47]/.test(compact)) return "Amex";
  return "Card";
}

function maskNumber(value: string, visible = 4) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "****";
  return `${"*".repeat(Math.max(digits.length - visible, 0))}${digits.slice(-visible)}`.replace(/(.{4})/g, "$1 ").trim();
}

function Icon({ name, className = "h-5 w-5" }: { name: "menu" | "qr" | "card" | "bank" | "copy" | "share" | "plus" | "close" | "moon" | "sun" | "scan"; className?: string }) {
  const paths = {
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    qr: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-4v-2h2zM14 18h2v2h-2z" />,
    card: <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M7 15h4" />,
    bank: <path d="M4 10h16L12 5zM6 10v8M10 10v8M14 10v8M18 10v8M4 18h16" />,
    copy: <path d="M8 8h10v12H8zM6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />,
    share: <path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .17 1L8.9 8.6a3 3 0 1 0 0 6.8l6.27 3.6a3 3 0 1 0 .93-1.62L9.82 13.8a3 3 0 0 0 0-3.6l6.28-3.58A3 3 0 0 0 18 8Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    moon: <path d="M20 15.5A8 8 0 0 1 8.5 4 7 7 0 1 0 20 15.5Z" />,
    sun: <path d="M12 4V2M12 22v-2M4.93 4.93 3.5 3.5M20.5 20.5l-1.43-1.43M4 12H2M22 12h-2M4.93 19.07 3.5 20.5M20.5 3.5l-1.43 1.43M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />,
    scan: <path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M21 17v2a2 2 0 0 1-2 2h-2M8 12h8" />,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function AppLogo() {
  return <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-lime-300 text-black shadow-[0_14px_30px_rgba(190,242,100,.3)]"><Icon name="bank" className="h-6 w-6" /></div>;
}

export default function App() {
  const [stage, setStage] = useState<Stage>(() => (localStorage.getItem("my-banks-user") ? "app" : "splash-one"));
  const [name, setName] = useState(() => localStorage.getItem("my-banks-user") || "");
  const [dark, setDark] = useState(() => localStorage.getItem("my-banks-theme") === "dark");
  const [tab, setTab] = useState<Tab>("upi");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [setupMode, setSetupMode] = useState<SetupMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [welcomeVisible, setWelcomeVisible] = useState(() => !localStorage.getItem("my-banks-welcome-seen"));
  const [toast, setToast] = useState("");
  const [upis, setUpis] = useState<UpiEntry[]>(() => readStorage("my-banks-upis", initialUpis));
  const [cards, setCards] = useState<CardEntry[]>(() => readStorage("my-banks-cards", initialCards));
  const [accounts, setAccounts] = useState<AccountEntry[]>(() => readStorage("my-banks-accounts", initialAccounts));

  useEffect(() => localStorage.setItem("my-banks-upis", JSON.stringify(upis)), [upis]);
  useEffect(() => localStorage.setItem("my-banks-cards", JSON.stringify(cards)), [cards]);
  useEffect(() => localStorage.setItem("my-banks-accounts", JSON.stringify(accounts)), [accounts]);
  useEffect(() => localStorage.setItem("my-banks-theme", dark ? "dark" : "light"), [dark]);

  const openSetup = (mode: Tab, id?: string) => {
    setTab(mode);
    setSetupMode(mode);
    setEditingId(id || null);
    setDrawerOpen(false);
  };

  const copyValue = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} copied`);
    } catch {
      setToast(`${label}: ${value}`);
    }
    window.setTimeout(() => setToast(""), 1800);
  };

  const enterApp = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim() || "Guest";
    localStorage.setItem("my-banks-user", cleanName);
    setName(cleanName);
    setStage("app");
  };

  return (
    <main className={`${dark ? "dark" : ""} min-h-screen overflow-hidden bg-[#b8bbb2] text-zinc-950`}>
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_20%_10%,white_0_3px,transparent_4px),radial-gradient(circle_at_80%_25%,white_0_4px,transparent_5px),radial-gradient(circle_at_65%_80%,white_0_5px,transparent_6px)] [background-size:96px_96px,138px_138px,180px_180px]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-8 lg:gap-12">
        <motion.div className="hidden max-w-sm lg:block" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }}>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-700">Material Design 3 UI</p>
          <h1 className="mt-4 text-6xl font-black leading-[0.92] tracking-tight">My Banks</h1>
          <p className="mt-5 text-lg leading-7 text-zinc-700">A privacy-first digital wallet prototype for UPI IDs, payment cards, and bank accounts. Everything is local, quick to edit, and easy to copy.</p>
        </motion.div>

        <motion.div className="relative h-[812px] w-full max-w-[390px] rounded-[3.2rem] bg-black p-3 shadow-2xl shadow-black/35" initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 90, damping: 18 }}>
          <div className="absolute left-1/2 top-4 z-30 h-5 w-28 -translate-x-1/2 rounded-full bg-black" />
          <div className="relative h-full overflow-hidden rounded-[2.65rem] bg-[#fbfaf6] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
            <StatusBar dark={dark} />
            <AnimatePresence mode="wait">
              {stage !== "app" ? (
                <Onboarding key={stage} stage={stage} name={name} setName={setName} setStage={setStage} enterApp={enterApp} />
              ) : (
                <AppShell key="app" name={name} dark={dark} setDark={setDark} tab={tab} setTab={setTab} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} welcomeVisible={welcomeVisible} setWelcomeVisible={setWelcomeVisible} upis={upis} cards={cards} accounts={accounts} openSetup={openSetup} copyValue={copyValue} setUpis={setUpis} setCards={setCards} setAccounts={setAccounts} />
              )}
            </AnimatePresence>
            <AnimatePresence>{toast && <Toast text={toast} />}</AnimatePresence>
            <AnimatePresence>
              {setupMode && <SetupSheet mode={setupMode} editingId={editingId} upis={upis} cards={cards} accounts={accounts} setUpis={setUpis} setCards={setCards} setAccounts={setAccounts} onClose={() => { setSetupMode(null); setEditingId(null); }} />}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

function StatusBar({ dark }: { dark: boolean }) {
  return <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-7 pt-4 text-sm font-bold"><span>9:41</span><div className="flex items-center gap-1.5"><span className="h-3 w-4 rounded-sm border-2 border-current" /><span className={`h-3 w-5 rounded-[3px] border-2 ${dark ? "border-white" : "border-black"}`} /></div></div>;
}

function Onboarding({ stage, name, setName, setStage, enterApp }: { stage: Stage; name: string; setName: (value: string) => void; setStage: (stage: Stage) => void; enterApp: (event: FormEvent) => void }) {
  if (stage === "entry") {
    return (
      <motion.form className="flex h-full flex-col justify-between px-7 pb-8 pt-20" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} onSubmit={enterApp}>
        <div>
          <AppLogo />
          <h2 className="mt-8 text-4xl font-black tracking-tight">Welcome to My Banks</h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-300">Enter your name to personalize the app. No password, OTP, or account setup needed.</p>
          <label className="mt-10 block text-sm font-bold text-zinc-600 dark:text-zinc-300">Your name</label>
          <input className="mt-3 w-full rounded-3xl border-0 bg-white px-5 py-4 text-lg font-bold shadow-[0_14px_35px_rgba(0,0,0,.08)] outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-lime-300 dark:bg-zinc-900 dark:ring-white/10" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" />
        </div>
        <button className="rounded-3xl bg-lime-300 px-5 py-4 text-base font-black text-black shadow-[0_16px_35px_rgba(190,242,100,.35)]">Enter App</button>
      </motion.form>
    );
  }
  const first = stage === "splash-one";
  return (
    <motion.div className={`${first ? "bg-black text-white" : "bg-lime-300 text-black"} flex h-full flex-col justify-between px-7 pb-8 pt-20`} initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -26 }} transition={{ duration: 0.35 }}>
      <div className="flex items-center justify-between"><div className="text-xl font-black">My Banks</div>{!first && <button className="rounded-full bg-white/85 px-4 py-2 text-sm font-bold" onClick={() => setStage("entry")}>Skip</button>}</div>
      <div className="relative flex min-h-[330px] items-center justify-center"><motion.div className={`${first ? "bg-[#dbe2d5]" : "bg-black"} absolute h-64 w-64 rounded-full`} animate={{ scale: [1, 1.06, 1], rotate: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 6 }} />{first ? <WalletIllustration /> : <CardIllustration />}</div>
      <div>
        <h1 className="text-5xl font-black leading-[0.95] tracking-tight">{first ? "Store every bank detail safely" : "Copy, scan, and manage faster"}</h1>
        <p className={`${first ? "text-white/70" : "text-black/70"} mt-4 text-base leading-6`}>{first ? "Keep UPI IDs, QR codes, cards, and bank accounts organized on your device." : "Scan QR codes, mask sensitive card details, and access records with clean bottom navigation."}</p>
        <button className={`${first ? "bg-lime-300 text-black" : "bg-black text-white"} mt-7 w-full rounded-3xl px-5 py-4 font-black`} onClick={() => setStage(first ? "splash-two" : "entry")}>{first ? "Continue" : "Get Started"}</button>
      </div>
    </motion.div>
  );
}

function AppShell(props: { name: string; dark: boolean; setDark: (value: boolean) => void; tab: Tab; setTab: (tab: Tab) => void; drawerOpen: boolean; setDrawerOpen: (value: boolean) => void; welcomeVisible: boolean; setWelcomeVisible: (value: boolean) => void; upis: UpiEntry[]; cards: CardEntry[]; accounts: AccountEntry[]; openSetup: (mode: Tab, id?: string) => void; copyValue: (label: string, value: string) => void; setUpis: React.Dispatch<React.SetStateAction<UpiEntry[]>>; setCards: React.Dispatch<React.SetStateAction<CardEntry[]>>; setAccounts: React.Dispatch<React.SetStateAction<AccountEntry[]>> }) {
  const { tab, setTab, setDrawerOpen, drawerOpen, dark, setDark, welcomeVisible, setWelcomeVisible, name, upis, cards, accounts, openSetup, copyValue, setUpis, setCards, setAccounts } = props;
  const title = tab === "upi" ? "UPI / QR" : tab === "cards" ? "Cards" : "Accounts";
  return (
    <motion.div className="flex h-full flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="flex items-center justify-between px-5 pb-4 pt-14"><button className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm dark:bg-zinc-900" onClick={() => setDrawerOpen(true)}><Icon name="menu" /></button><div className="text-center"><p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">My Banks</p><h1 className="text-xl font-black tracking-tight">{title}</h1></div><button className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm dark:bg-zinc-900" onClick={() => setDark(!dark)}><Icon name={dark ? "sun" : "moon"} /></button></header>
      <div className="flex-1 overflow-y-auto px-5 pb-28">
        <AnimatePresence>{welcomeVisible && <motion.div className="mb-5 rounded-[2rem] bg-black p-5 text-white dark:bg-lime-300 dark:text-black" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-white/65 dark:text-black/60">Hello, {name}</p><h2 className="mt-1 text-2xl font-black tracking-tight">Your finance vault is ready.</h2></div><button onClick={() => { localStorage.setItem("my-banks-welcome-seen", "true"); setWelcomeVisible(false); }}><Icon name="close" /></button></div></motion.div>}</AnimatePresence>
        <AnimatePresence mode="wait">{tab === "upi" && <UpiScreen key="upi" upis={upis} openSetup={openSetup} copyValue={copyValue} setUpis={setUpis} />}{tab === "cards" && <CardsScreen key="cards" cards={cards} openSetup={openSetup} copyValue={copyValue} setCards={setCards} />}{tab === "accounts" && <AccountsScreen key="accounts" accounts={accounts} openSetup={openSetup} copyValue={copyValue} setAccounts={setAccounts} />}</AnimatePresence>
      </div>
      <BottomNav tab={tab} setTab={setTab} />
      <AnimatePresence>{drawerOpen && <Drawer onClose={() => setDrawerOpen(false)} openSetup={openSetup} />}</AnimatePresence>
    </motion.div>
  );
}

function UpiScreen({ upis, openSetup, copyValue, setUpis }: { upis: UpiEntry[]; openSetup: (mode: Tab, id?: string) => void; copyValue: (label: string, value: string) => void; setUpis: React.Dispatch<React.SetStateAction<UpiEntry[]>> }) {
  return <motion.div className="space-y-4" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}><SectionIntro icon="qr" title="Saved UPI identities" text="Scan, import, copy, or share payment addresses without searching through screenshots." action={() => openSetup("upi")} />{upis.map((item) => <article key={item.id} className="rounded-[2rem] bg-white p-5 shadow-[0_16px_34px_rgba(0,0,0,.07)] dark:bg-zinc-900"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-black">{item.name}</h3><p className="mt-1 text-sm font-semibold text-zinc-500">{item.bank}</p><p className="mt-4 rounded-2xl bg-lime-100 px-4 py-3 font-bold text-black dark:bg-lime-300">{item.upi}</p></div><div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-zinc-100 dark:bg-zinc-800"><Icon name="qr" className="h-8 w-8" /></div></div><ActionRow actions={[["Copy", () => copyValue("UPI ID", item.upi), "copy"], ["Share", () => copyValue("Share text", `${item.name} - ${item.upi}`), "share"], ["Edit", () => openSetup("upi", item.id), "plus"], ["Delete", () => setUpis((list) => list.filter((entry) => entry.id !== item.id)), "close"]]} /></article>)}</motion.div>;
}

function CardsScreen({ cards, openSetup, copyValue, setCards }: { cards: CardEntry[]; openSetup: (mode: Tab, id?: string) => void; copyValue: (label: string, value: string) => void; setCards: React.Dispatch<React.SetStateAction<CardEntry[]>> }) {
  const [visibleCvv, setVisibleCvv] = useState<string | null>(null);
  return <motion.div className="space-y-4" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}><SectionIntro icon="card" title="Payment cards" text="CVV stays masked until tapped. Each field has its own quick copy action." action={() => openSetup("cards")} />{cards.map((card, index) => <article key={card.id} className={`${index % 2 ? "bg-lime-300 text-black" : "bg-black text-white"} rounded-[2rem] p-5 shadow-[0_18px_35px_rgba(0,0,0,.18)]`}><div className="flex items-start justify-between"><div><p className="text-sm font-bold opacity-65">{card.type} card</p><h3 className="mt-1 text-xl font-black">{card.bank}</h3></div><span className="rounded-full bg-white/15 px-3 py-1 text-sm font-black">{detectNetwork(card.number)}</span></div><p className="mt-8 text-2xl font-black tracking-widest">{maskNumber(card.number)}</p><div className="mt-6 grid grid-cols-3 gap-3 text-sm"><FieldButton label="Name" value={card.holder} onCopy={() => copyValue("Cardholder name", card.holder)} /><FieldButton label="Expiry" value={card.expiry} onCopy={() => copyValue("Expiry", card.expiry)} /><button className="text-left" onClick={() => setVisibleCvv(visibleCvv === card.id ? null : card.id)}><span className="block opacity-60">CVV</span><span className="font-black">{visibleCvv === card.id ? card.cvv : "***"}</span></button></div><ActionRow actions={[["Number", () => copyValue("Card number", card.number), "copy"], ["CVV", () => copyValue("CVV", card.cvv), "copy"], ["Edit", () => openSetup("cards", card.id), "plus"], ["Delete", () => setCards((list) => list.filter((entry) => entry.id !== card.id)), "close"]]} inverse={index % 2 === 0} /></article>)}</motion.div>;
}

function AccountsScreen({ accounts, openSetup, copyValue, setAccounts }: { accounts: AccountEntry[]; openSetup: (mode: Tab, id?: string) => void; copyValue: (label: string, value: string) => void; setAccounts: React.Dispatch<React.SetStateAction<AccountEntry[]>> }) {
  return <motion.div className="space-y-4" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}><SectionIntro icon="bank" title="Bank accounts" text="Keep IFSC and account details easy to find while masking sensitive numbers." action={() => openSetup("accounts")} />{accounts.map((account) => <details key={account.id} className="group rounded-[2rem] bg-white p-5 shadow-[0_16px_34px_rgba(0,0,0,.07)] open:bg-lime-50 dark:bg-zinc-900 dark:open:bg-zinc-900"><summary className="flex cursor-pointer list-none items-center justify-between gap-4"><div><h3 className="text-lg font-black">{account.bank}</h3><p className="mt-1 text-sm font-semibold text-zinc-500">{account.holder}</p></div><div className="text-right"><p className="text-xs font-bold text-zinc-500">Account</p><p className="font-black">{maskNumber(account.account)}</p></div></summary><div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10"><div className="grid grid-cols-2 gap-3 text-sm"><Info label="IFSC" value={account.ifsc} /><Info label="Account" value={account.account} /></div><ActionRow actions={[["Copy IFSC", () => copyValue("IFSC", account.ifsc), "copy"], ["Copy A/C", () => copyValue("Account number", account.account), "copy"], ["Edit", () => openSetup("accounts", account.id), "plus"], ["Delete", () => setAccounts((list) => list.filter((entry) => entry.id !== account.id)), "close"]]} /></div></details>)}</motion.div>;
}

function SectionIntro({ icon, title, text, action }: { icon: "qr" | "card" | "bank"; title: string; text: string; action: () => void }) {
  return <div className="pb-1"><div className="flex items-center justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-lime-300 text-black"><Icon name={icon} /></div><button className="flex items-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-black" onClick={action}><Icon name="plus" className="h-4 w-4" /> Add</button></div><h2 className="mt-5 text-3xl font-black tracking-tight">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{text}</p></div>;
}

function ActionRow({ actions, inverse = false }: { actions: [string, () => void, "copy" | "share" | "plus" | "close"][]; inverse?: boolean }) {
  return <div className="mt-5 flex flex-wrap gap-2">{actions.map(([label, onClick, icon]) => <button key={label} className={`${inverse ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white"} flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black`} onClick={onClick}><Icon name={icon} className="h-3.5 w-3.5" /> {label}</button>)}</div>;
}

function FieldButton({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return <button className="text-left" onClick={onCopy}><span className="block opacity-60">{label}</span><span className="font-black">{value}</span></button>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white p-3 dark:bg-zinc-800"><p className="text-xs font-bold text-zinc-500">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const items: [Tab, "qr" | "card" | "bank", string][] = [["upi", "qr", "QR"], ["cards", "card", "Cards"], ["accounts", "bank", "Accounts"]];
  return <nav className="absolute bottom-0 left-0 right-0 z-10 bg-[#fbfaf6]/92 px-6 pb-6 pt-3 backdrop-blur-xl dark:bg-zinc-950/90"><div className="flex items-center justify-between rounded-[2rem] bg-white p-2 shadow-[0_-10px_30px_rgba(0,0,0,.08)] dark:bg-zinc-900">{items.map(([id, icon, label]) => <button key={id} className={`${tab === id ? "bg-lime-300 text-black" : "text-zinc-500"} flex min-w-24 flex-col items-center rounded-3xl px-4 py-3 text-xs font-black transition`} onClick={() => setTab(id)}><Icon name={icon} className="h-5 w-5" /><span className="mt-1">{label}</span></button>)}</div></nav>;
}

function Drawer({ onClose, openSetup }: { onClose: () => void; openSetup: (mode: Tab) => void }) {
  const items: [Tab, string, "qr" | "bank" | "card"][] = [["upi", "Setup QR Code", "qr"], ["accounts", "Setup Bank Account", "bank"], ["cards", "Setup Debit/Credit Card", "card"]];
  return <motion.div className="absolute inset-0 z-30 bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}><motion.aside className="h-full w-80 rounded-r-[2.5rem] bg-[#fbfaf6] p-6 pt-16 shadow-2xl dark:bg-zinc-950" initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: "spring", damping: 24, stiffness: 180 }} onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><AppLogo /><div><p className="text-sm text-zinc-500">Configuration</p><h2 className="text-2xl font-black">My Banks</h2></div></div><button onClick={onClose}><Icon name="close" /></button></div><div className="mt-10 space-y-3">{items.map(([mode, label, icon]) => <button key={mode} className="flex w-full items-center gap-4 rounded-[1.5rem] bg-white p-4 text-left font-black shadow-sm dark:bg-zinc-900" onClick={() => openSetup(mode)}><span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300 text-black"><Icon name={icon} /></span>{label}</button>)}</div><p className="mt-10 rounded-[1.5rem] bg-zinc-100 p-4 text-sm leading-6 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">All entries are persisted locally in this prototype, matching the AsyncStorage-first architecture of the mobile app.</p></motion.aside></motion.div>;
}

function SetupSheet(props: { mode: Tab; editingId: string | null; upis: UpiEntry[]; cards: CardEntry[]; accounts: AccountEntry[]; setUpis: React.Dispatch<React.SetStateAction<UpiEntry[]>>; setCards: React.Dispatch<React.SetStateAction<CardEntry[]>>; setAccounts: React.Dispatch<React.SetStateAction<AccountEntry[]>>; onClose: () => void }) {
  const { mode, editingId, upis, cards, accounts, setUpis, setCards, setAccounts, onClose } = props;
  const current = useMemo(() => {
    if (mode === "upi") return upis.find((item) => item.id === editingId);
    if (mode === "cards") return cards.find((item) => item.id === editingId);
    return accounts.find((item) => item.id === editingId);
  }, [accounts, cards, editingId, mode, upis]);
  const [form, setForm] = useState<Record<string, string>>(() => ({ ...(current || {}) }));
  const title = `${editingId ? "Edit" : "Add"} ${mode === "upi" ? "QR / UPI" : mode === "cards" ? "Card" : "Bank Account"}`;
  const fields = mode === "upi" ? [["name", "Name"], ["bank", "Bank Name"], ["upi", "UPI ID"]] : mode === "cards" ? [["type", "Card Type"], ["bank", "Bank Name"], ["holder", "Cardholder Name"], ["number", "Card Number"], ["expiry", "Valid Thru"], ["cvv", "CVV"]] : [["holder", "Account Holder Name"], ["bank", "Bank Name"], ["account", "Account Number"], ["ifsc", "IFSC Code"]];
  const save = (event: FormEvent) => {
    event.preventDefault();
    const id = editingId || `${mode}-${Date.now()}`;
    if (mode === "upi") {
      const next: UpiEntry = { id, name: form.name || "UPI Entry", bank: form.bank || "Bank", upi: form.upi || "name@upi" };
      setUpis((list) => (editingId ? list.map((item) => (item.id === id ? next : item)) : [next, ...list]));
    } else if (mode === "cards") {
      const next: CardEntry = { id, type: form.type === "Debit" ? "Debit" : "Credit", bank: form.bank || "Bank", holder: form.holder || "Cardholder", number: form.number || "4111 1111 1111 1111", expiry: form.expiry || "12/29", cvv: form.cvv || "123" };
      setCards((list) => (editingId ? list.map((item) => (item.id === id ? next : item)) : [next, ...list]));
    } else {
      const next: AccountEntry = { id, holder: form.holder || "Account Holder", bank: form.bank || "Bank", account: form.account || "000000000000", ifsc: form.ifsc || "BANK0000000" };
      setAccounts((list) => (editingId ? list.map((item) => (item.id === id ? next : item)) : [next, ...list]));
    }
    onClose();
  };
  return <motion.div className="absolute inset-0 z-40 flex items-end bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.form className="max-h-[82%] w-full overflow-y-auto rounded-t-[2.5rem] bg-[#fbfaf6] p-6 shadow-2xl dark:bg-zinc-950" initial={{ y: 420 }} animate={{ y: 0 }} exit={{ y: 420 }} transition={{ type: "spring", damping: 25, stiffness: 180 }} onSubmit={save}><div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black">{title}</h2><button type="button" onClick={onClose}><Icon name="close" /></button></div><div className="space-y-3">{fields.map(([key, label]) => <label key={key} className="block"><span className="text-sm font-bold text-zinc-500">{label}</span>{key === "type" ? <select className="mt-2 w-full rounded-2xl bg-white px-4 py-3 font-bold outline-none ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10" value={form[key] || "Credit"} onChange={(event) => setForm({ ...form, [key]: event.target.value })}><option>Credit</option><option>Debit</option></select> : <input className="mt-2 w-full rounded-2xl bg-white px-4 py-3 font-bold outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-lime-300 dark:bg-zinc-900 dark:ring-white/10" value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />}</label>)}</div>{mode === "upi" && <div className="mt-4 grid grid-cols-2 gap-3"><button type="button" className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-black dark:bg-zinc-900"><Icon name="scan" className="mr-2 inline h-4 w-4" />Scan QR</button><button type="button" className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-black dark:bg-zinc-900">Import Gallery</button></div>}<button className="mt-6 w-full rounded-3xl bg-lime-300 px-5 py-4 font-black text-black">Save</button></motion.form></motion.div>;
}

function Toast({ text }: { text: string }) {
  return <motion.div className="absolute bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-5 py-3 text-sm font-black text-white shadow-xl" initial={{ opacity: 0, y: 20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 20, x: "-50%" }}>{text}</motion.div>;
}

function WalletIllustration() {
  return <motion.div className="relative z-10 h-72 w-56" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4 }}><div className="absolute bottom-0 left-8 h-44 w-40 rounded-t-[5rem] bg-[#f7c9b7]" /><div className="absolute left-7 top-8 h-36 w-44 rounded-t-[6rem] rounded-bl-[4rem] bg-black" /><div className="absolute left-20 top-28 h-24 w-24 rounded-full bg-[#f0b19e]" /><div className="absolute left-16 top-44 h-28 w-32 rounded-t-[3rem] bg-[#f9e3d9]" /><div className="absolute left-20 top-52 h-16 w-24 rounded-2xl bg-black" /><div className="absolute left-4 top-36 h-9 w-14 -rotate-12 rounded-md bg-lime-300" /><div className="absolute right-0 top-52 h-9 w-14 rotate-12 rounded-md bg-black ring-2 ring-white" /></motion.div>;
}

function CardIllustration() {
  return <motion.div className="relative z-10 h-64 w-64" animate={{ rotate: [-3, 4, -3] }} transition={{ repeat: Infinity, duration: 5 }}><div className="absolute left-10 top-20 h-32 w-48 -rotate-12 rounded-3xl bg-black p-5 text-white shadow-2xl"><div className="h-9 w-11 rounded-lg bg-white/80" /><div className="mt-8 flex gap-2"><span className="h-2 w-10 rounded-full bg-lime-300" /><span className="h-2 w-7 rounded-full bg-lime-300" /></div></div><div className="absolute bottom-5 left-2 h-10 w-14 -rotate-12 rounded-md bg-black" /><div className="absolute right-8 top-6 h-10 w-14 rotate-12 rounded-md bg-white" /></motion.div>;
}
