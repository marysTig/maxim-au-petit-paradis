import { createFileRoute } from "@tanstack/react-router";
import { Phone, MessageCircle, Facebook, Music2 } from "lucide-react";
import logo from "@/assets/logo-maxim.jpeg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maxim au Petit Paradis — Appelez, écrivez, suivez-nous" },
      { name: "description", content: "Tous les liens de la crèche Maxim au Petit Paradis : téléphone, WhatsApp, TikTok et Facebook." },
      { property: "og:title", content: "Maxim au Petit Paradis — Crèche" },
      { property: "og:description", content: "Appelez-nous, écrivez-nous ou suivez nos aventures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// Numéros à remplacer par les vrais (format local algérien)
const PHONES = ["0555 00 00 01", "0555 00 00 02"];
const WHATSAPP = ["0555 00 00 03", "0555 00 00 04"];
const toIntl = (n: string) => "213" + n.replace(/\D/g, "").replace(/^0/, "");

const bulbColors = [
  "bg-kid-blue text-kid-blue", "bg-kid-violet text-kid-violet", "bg-kid-green text-kid-green",
  "bg-kid-pink text-kid-pink", "bg-kid-orange text-kid-orange",
];

const bokehs = [
  { l: "8%", t: "20%", s: 60, c: "bg-kid-pink" }, { l: "80%", t: "15%", s: 90, c: "bg-kid-orange" },
  { l: "70%", t: "45%", s: 50, c: "bg-kid-violet" }, { l: "5%", t: "60%", s: 80, c: "bg-kid-blue" },
  { l: "85%", t: "75%", s: 40, c: "bg-kid-green" }, { l: "30%", t: "35%", s: 30, c: "bg-card" },
  { l: "52%", t: "9%", s: 44, c: "bg-kid-blue" }, { l: "18%", t: "82%", s: 70, c: "bg-kid-violet" },
  { l: "92%", t: "36%", s: 34, c: "bg-kid-pink" },
];
const sparkles = [
  { l: "14%", t: "72%", c: "bg-kid-orange text-kid-orange" },
  { l: "86%", t: "62%", c: "bg-kid-pink text-kid-pink" },
  { l: "44%", t: "84%", c: "bg-kid-blue text-kid-blue" },
  { l: "68%", t: "78%", c: "bg-kid-green text-kid-green" },
  { l: "26%", t: "56%", c: "bg-kid-violet text-kid-violet" },
  { l: "6%", t: "44%", c: "bg-kid-orange text-kid-orange" },
  { l: "94%", t: "88%", c: "bg-kid-violet text-kid-violet" },
];
const twinkles = [
  { l: "12%", t: "8%", s: 18, c: "text-kid-orange", d: 3.4, delay: "0s" },
  { l: "78%", t: "5%", s: 14, c: "text-kid-blue", d: 4.2, delay: "-1.2s" },
  { l: "42%", t: "13%", s: 12, c: "text-kid-pink", d: 2.8, delay: "-2s" },
  { l: "90%", t: "21%", s: 16, c: "text-kid-violet", d: 3.8, delay: "-0.6s" },
  { l: "26%", t: "25%", s: 10, c: "text-kid-green", d: 3.1, delay: "-2.6s" },
];
const clouds = [
  { t: "5%", w: 170, c: "text-card/85", d: 44, delay: "-8s" },
  { t: "14%", w: 110, c: "text-card/70", d: 66, delay: "-34s" },
  { t: "26%", w: 220, c: "text-card/80", d: 84, delay: "-55s" },
];
const balloons = [
  { l: "10%", w: 54, c: "text-kid-pink", d: 17, delay: "-2s" },
  { l: "74%", w: 66, c: "text-kid-blue", d: 22, delay: "-12s" },
  { l: "44%", w: 42, c: "text-kid-orange", d: 27, delay: "-19s" },
];
const notes = [
  { l: "16%", c: "text-kid-violet", s: 26, d: 11, delay: "-1s", g: "♪" },
  { l: "62%", c: "text-kid-pink", s: 20, d: 14, delay: "-6s", g: "♫" },
  { l: "86%", c: "text-kid-blue", s: 30, d: 12, delay: "-9s", g: "♪" },
  { l: "34%", c: "text-kid-green", s: 22, d: 16, delay: "-13s", g: "♫" },
];
const petals = [
  { l: "6%", c: "bg-kid-pink", d: 13, delay: "-2s" },
  { l: "22%", c: "bg-kid-orange", d: 17, delay: "-7s" },
  { l: "40%", c: "bg-kid-violet", d: 15, delay: "-11s" },
  { l: "58%", c: "bg-kid-blue", d: 19, delay: "-4s" },
  { l: "76%", c: "bg-kid-green", d: 14, delay: "-13s" },
  { l: "90%", c: "bg-kid-pink", d: 18, delay: "-9s" },
];
const butterflies = [
  { t: "36%", w: 30, c: "text-kid-violet", d: 26, delay: "-3s" },
  { t: "58%", w: 22, c: "text-kid-pink", d: 34, delay: "-18s" },
];
const flowers = [
  { l: "7%", b: 30, s: 36, c: "text-kid-pink", d: 4.6, delay: "0s" },
  { l: "20%", b: 14, s: 26, c: "text-kid-orange", d: 5.4, delay: "-1.4s" },
  { l: "37%", b: 38, s: 30, c: "text-kid-violet", d: 4.1, delay: "-2.2s" },
  { l: "55%", b: 12, s: 24, c: "text-kid-blue", d: 5.8, delay: "-0.8s" },
  { l: "70%", b: 34, s: 32, c: "text-kid-orange", d: 4.8, delay: "-3s" },
  { l: "88%", b: 18, s: 28, c: "text-kid-pink", d: 5.2, delay: "-1.9s" },
];

function LinkBtn({ href, color, icon, label, external }: { href: string; color: string; icon: React.ReactNode; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`kid-btn ${color}`}
    >
      <span className="relative z-10 flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/25">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
      </span>
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section-card">
      <h2 className="section-title">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`cloud ${className ?? ""}`} style={style}>
      <svg viewBox="0 0 100 40" fill="currentColor" className="h-full w-full" aria-hidden="true">
        <ellipse cx="28" cy="27" rx="26" ry="13" />
        <ellipse cx="52" cy="18" rx="24" ry="17" />
        <ellipse cx="76" cy="26" rx="20" ry="12" />
        <rect x="6" y="26" width="88" height="12" rx="6" />
      </svg>
    </span>
  );
}

function Balloon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`balloon ${className ?? ""}`} style={style}>
      <span className="balloon-body">
        <svg viewBox="0 0 24 36" className="h-full w-full" aria-hidden="true">
          <ellipse cx="12" cy="11" rx="9" ry="11" fill="currentColor" />
          <ellipse cx="9" cy="7" rx="3" ry="4" className="fill-card" opacity=".45" />
          <path d="M12 22l2.4 3.4H9.6z" fill="currentColor" />
          <path d="M12 25.4c3 3 0 5 0 8" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".55" />
        </svg>
      </span>
    </span>
  );
}

function Butterfly({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`butterfly ${className ?? ""}`} style={style}>
      <svg viewBox="0 0 24 20" className="h-full w-full" aria-hidden="true">
        <path className="bfly-wing bfly-left" d="M11 10C4.5.5.5 2 1.5 8s6 6.5 9.5 2z" fill="currentColor" />
        <path className="bfly-wing bfly-right" d="M13 10c6.5-9.5 10.5-8 9.5-2s-6 6.5-9.5 2z" fill="currentColor" />
        <rect x="11.2" y="4.5" width="1.6" height="11" rx=".8" fill="currentColor" />
      </svg>
    </span>
  );
}

function Flower({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`flower ${className ?? ""}`} style={style}>
      <svg viewBox="0 0 20 34" className="h-full w-full" aria-hidden="true">
        <path d="M10 34V16" className="stroke-kid-green" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <g fill="currentColor">
          <circle cx="10" cy="7" r="4" />
          <circle cx="4" cy="12" r="4" />
          <circle cx="16" cy="12" r="4" />
          <circle cx="7" cy="18" r="4" />
          <circle cx="13" cy="18" r="4" />
        </g>
        <circle cx="10" cy="12.6" r="3" className="fill-kid-orange" />
      </svg>
    </span>
  );
}

function Index() {
  return (
    <div className="sky-bg relative min-h-screen overflow-hidden text-center">
      {/* Fond animé : calé sur la fenêtre pour rester visible partout */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <span className="sky-wash" />
        <span className="sun-rays -left-44 -top-44 h-[36rem] w-[36rem]" />
        <span className="sun-glow -left-24 -top-24 h-80 w-80" />
        {clouds.map((c, i) => (
          <Cloud key={i} className={c.c} style={{ top: c.t, width: c.w, animationDuration: `${c.d}s`, animationDelay: c.delay }} />
        ))}
        {twinkles.map((t, i) => (
          <span
            key={i}
            className={`twinkle ${t.c}`}
            style={{ left: t.l, top: t.t, width: t.s, height: t.s, animationDuration: `${t.d}s`, animationDelay: t.delay }}
          />
        ))}
        {bokehs.map((b, i) => (
          <span key={i} className={`bokeh ${b.c}`} style={{ left: b.l, top: b.t, width: b.s, height: b.s, animationDelay: `${i}s` }} />
        ))}
        {sparkles.map((s, i) => (
          <span
            key={i}
            className={`sparkle ${s.c}`}
            style={{ left: s.l, top: s.t, animationDelay: `${i * 1.4}s`, animationDuration: `${6 + i}s` }}
          />
        ))}
        {balloons.map((b, i) => (
          <Balloon key={i} className={b.c} style={{ left: b.l, width: b.w, animationDuration: `${b.d}s`, animationDelay: b.delay }} />
        ))}
        {notes.map((n, i) => (
          <span
            key={i}
            className={`note ${n.c}`}
            style={{ left: n.l, fontSize: n.s, animationDuration: `${n.d}s`, animationDelay: n.delay }}
          >
            {n.g}
          </span>
        ))}
        {petals.map((p, i) => (
          <span key={i} className={`petal ${p.c}`} style={{ left: p.l, animationDuration: `${p.d}s`, animationDelay: p.delay }} />
        ))}
        {butterflies.map((b, i) => (
          <Butterfly key={i} className={b.c} style={{ top: b.t, width: b.w, animationDuration: `${b.d}s`, animationDelay: b.delay }} />
        ))}
      </div>

      {/* Guirlande */}
      <svg className="absolute inset-x-0 top-0 h-16 w-full" preserveAspectRatio="none" viewBox="0 0 100 20">
        <path d="M0 2 Q25 16 50 6 T100 4" className="stroke-foreground/40" fill="none" strokeWidth="0.3" />
      </svg>
      <div className="absolute inset-x-0 top-2 flex justify-around px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={`bulb ${bulbColors[i % 5]}`} style={{ marginTop: `${Math.abs(Math.sin(i * 0.6)) * 28}px`, animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>

      {/* Collines */}
      <svg className="hill-back absolute inset-x-0 bottom-0 h-40 w-full" preserveAspectRatio="none" viewBox="0 0 100 30">
        <path d="M0 18 Q20 6 45 16 T100 12 V30 H0Z" className="fill-kid-green/60" />
      </svg>
      <svg className="hill-front absolute inset-x-0 bottom-0 h-40 w-full" preserveAspectRatio="none" viewBox="0 0 100 30">
        <path d="M0 24 Q30 14 60 22 T100 20 V30 H0Z" className="fill-kid-green" />
      </svg>
      {flowers.map((f, i) => (
        <Flower
          key={i}
          className={f.c}
          style={{ left: f.l, bottom: f.b, width: f.s, height: f.s, animationDuration: `${f.d}s`, animationDelay: f.delay }}
        />
      ))}

      <main className="relative z-10 mx-auto flex max-w-md flex-col gap-8 px-5 pb-28 pt-16">
        <img src={logo.url} alt="Logo Maxim au Petit Paradis" className="mx-auto w-full max-w-xs rounded-[2rem] border-4 border-card shadow-xl" />
        <p className="font-display text-lg font-medium text-foreground">
          Bienvenue à la crèche ! Appelez-nous, écrivez-nous ou suivez nos aventures.
        </p>

        <Section title="Nous appeler">
          {PHONES.map((n, i) => (
            <LinkBtn key={n} href={`tel:+${toIntl(n)}`} color={i ? "bg-kid-violet" : "bg-kid-blue"} icon={<Phone className="size-5" />} label={n} />
          ))}
        </Section>

        <Section title="Nous écrire sur WhatsApp">
          {WHATSAPP.map((n) => (
            <LinkBtn key={n} external href={`https://wa.me/${toIntl(n)}`} color="bg-kid-green" icon={<MessageCircle className="size-5" />} label={n} />
          ))}
        </Section>

        <Section title="Nous suivre">
          <LinkBtn external href="https://www.tiktok.com/@crche.maxim?_r=1&_t=ZS-9AhP45qkZFs" color="bg-kid-pink" icon={<Music2 className="size-5" />} label="TikTok" />
          <LinkBtn external href="https://www.facebook.com/share/1CbWm954Qr/" color="bg-kid-orange" icon={<Facebook className="size-5" />} label="Facebook" />
        </Section>

      </main>
    </div>
  );
}
