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
];
const clouds = [
  { t: "14%", w: 150, h: 34, o: 0.55, d: "46s", delay: "-8s" },
  { t: "31%", w: 110, h: 26, o: 0.4, d: "62s", delay: "-30s" },
  { t: "52%", w: 190, h: 42, o: 0.3, d: "78s", delay: "-52s" },
  { t: "70%", w: 120, h: 28, o: 0.35, d: "54s", delay: "-16s" },
];
const sparkles = [
  { l: "14%", t: "72%", c: "bg-kid-orange text-kid-orange" },
  { l: "86%", t: "62%", c: "bg-kid-pink text-kid-pink" },
  { l: "44%", t: "84%", c: "bg-kid-blue text-kid-blue" },
  { l: "68%", t: "78%", c: "bg-kid-green text-kid-green" },
  { l: "26%", t: "56%", c: "bg-kid-violet text-kid-violet" },
];

function LinkBtn({ href, color, icon, label, external }: { href: string; color: string; icon: React.ReactNode; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`kid-btn flex items-center justify-center gap-3 rounded-full px-6 py-4 font-display text-lg font-semibold text-primary-foreground ${color}`}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-kid-violet">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function Index() {
  return (
    <div className="sky-bg relative min-h-screen overflow-hidden text-center">
      {/* Guirlande */}
      <svg className="absolute inset-x-0 top-0 h-16 w-full" preserveAspectRatio="none" viewBox="0 0 100 20">
        <path d="M0 2 Q25 16 50 6 T100 4" className="stroke-foreground/40" fill="none" strokeWidth="0.3" />
      </svg>
      <div className="absolute inset-x-0 top-2 flex justify-around px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={`bulb ${bulbColors[i % 5]}`} style={{ marginTop: `${Math.abs(Math.sin(i * 0.6)) * 28}px`, animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      <span className="sun-glow -left-24 -top-24 h-80 w-80" />
      {clouds.map((c, i) => (
        <span
          key={i}
          className="cloud"
          style={{ top: c.t, left: 0, width: c.w, height: c.h, opacity: c.o, animationDuration: c.d, animationDelay: c.delay }}
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
      {/* Collines */}
      <svg className="hill-back absolute inset-x-0 bottom-0 h-40 w-full" preserveAspectRatio="none" viewBox="0 0 100 30">
        <path d="M0 18 Q20 6 45 16 T100 12 V30 H0Z" className="fill-kid-green/60" />
      </svg>
      <svg className="hill-front absolute inset-x-0 bottom-0 h-40 w-full" preserveAspectRatio="none" viewBox="0 0 100 30">
        <path d="M0 24 Q30 14 60 22 T100 20 V30 H0Z" className="fill-kid-green" />
      </svg>

      <main className="relative mx-auto flex max-w-md flex-col gap-8 px-5 pb-28 pt-16">
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
