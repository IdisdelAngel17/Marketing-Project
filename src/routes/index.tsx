import { Link, createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Target,
  LayoutGrid,
  Activity,
  BarChart3,
  Users,
  MessageCircle,
  Check,
  Megaphone,
  Wallet,
  MousePointerClick,
  Sparkles,
  PenLine,
  Clapperboard,
} from "lucide-react";

import { LeadForm } from "@/components/leads/lead-form";
import heroBoard from "@/assets/hero-board.jpg";

const WHATSAPP_NUMBER = "6141829146";
const WHATSAPP_LINK =
  "https://wa.me/526141829146?text=" +
  encodeURIComponent("Hola, quiero información sobre el tablero de contenidos.");

export const Route = createFileRoute("/")({
  head: () => ({
      meta: [
        { title: "Community Manager IA - Tablero de contenidos y calendarios por red social" },
        {
          name: "description",
          content:
            "Centraliza planes de contenido, objetivos de conversión y calendarios editoriales de cada cliente por red social con Community Manager IA.",
        },
        { property: "og:title", content: "Community Manager IA - Tablero de contenidos y calendarios por red social" },
        {
          property: "og:description",
          content:
            "Gestiona flujos de trabajo en tiempo real, da seguimiento a publicaciones clave y mide la presencia de marca con Community Manager IA.",
        },
      ],
  }),
  component: Landing,
});

const features = [
  {
    icon: LayoutGrid,
    title: "Tablero interactivo",
    text: "Columnas por etapa: idea, producción, revisión, aprobado y programado. Arrastra y todo el equipo lo ve al instante.",
  },
  {
    icon: CalendarDays,
    title: "Calendario editorial",
    text: "Un calendario por cliente y por red social, con fechas, horarios y responsables siempre visibles.",
  },
  {
    icon: Target,
    title: "Objetivos de conversión",
    text: "Cada publicación se conecta a una meta concreta: alcance, leads, ventas o comunidad.",
  },
  {
    icon: Activity,
    title: "Flujos en tiempo real",
    text: "Cambios de estado, comentarios y aprobaciones sin cadenas de correos ni archivos sueltos.",
  },
  {
    icon: BarChart3,
    title: "Medición estructurada",
    text: "Presencia de marca por red, cumplimiento del plan y desempeño de las piezas clave.",
  },
  {
    icon: PenLine,
    title: "Copies con IA",
    text: "Genera variantes de copy por red, tono y objetivo, listas para publicar o aprobar.",
  },
  {
    icon: Clapperboard,
    title: "Guiones de video",
    text: "Estructura hooks, escenas y CTA para Reels, TikTok, Shorts y Stories.",
  },
  {
    icon: Users,
    title: "Multicliente",
    text: "Separa cuentas, marcas y equipos con permisos claros, sin mezclar información.",
  },
];

const steps = [
  {
    n: "01",
    title: "Cargamos tu plan",
    text: "Migramos clientes, redes, pilares de contenido y calendarios vigentes al tablero.",
  },
  {
    n: "02",
    title: "Definimos el flujo",
    text: "Etapas, responsables y reglas de aprobación adaptadas a la forma de trabajar del equipo.",
  },
  {
    n: "03",
    title: "Publicas y mides",
    text: "Seguimiento de publicaciones clave y reportes de presencia de marca cada periodo.",
  },
];

const plans = [
  {
    name: "Estudio",
    price: "$1,490",
    note: "MXN / mes",
    items: ["Hasta 3 clientes", "5 redes por cliente", "Calendario y tablero", "Soporte por WhatsApp"],
    featured: false,
  },
  {
    name: "Agencia",
    price: "$3,900",
    note: "MXN / mes",
    items: [
      "Hasta 15 clientes",
      "Redes ilimitadas",
      "Objetivos de conversión",
      "Reportes de presencia de marca",
      "Onboarding acompañado",
    ],
    featured: true,
  },
  {
    name: "A medida",
    price: "Cotización",
    note: "según alcance",
    items: ["Clientes ilimitados", "Flujos personalizados", "Integraciones", "Capacitación al equipo"],
    featured: false,
  },
];

const ads = [
  {
    icon: Megaphone,
    title: "Calendario de pautas",
    text: "Cada campaña pagada vive junto al contenido orgánico: fechas de inicio, cierre y piezas asociadas.",
  },
  {
    icon: Wallet,
    title: "Presupuesto por cliente",
    text: "Registra la inversión por red y por campaña para saber siempre cuánto se lleva gastado.",
  },
  {
    icon: MousePointerClick,
    title: "Anuncios y creativos",
    text: "Versiones, copies y públicos objetivo en una sola tarjeta, lista para aprobación del cliente.",
  },
  {
    icon: Sparkles,
    title: "Resultados a la vista",
    text: "Alcance, clics y conversiones de cada pauta resumidos junto al objetivo que se planteó.",
  },
];


function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="font-display text-lg font-bold tracking-tight">
            Community Manager <span className="text-primary">IA</span>
          </span>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#producto" className="transition-colors hover:text-foreground">
              Producto
            </a>
            <a href="#como-funciona" className="transition-colors hover:text-foreground">
              Cómo funciona
            </a>
            <a href="#pautas" className="transition-colors hover:text-foreground">
              Pautas
            </a>
            <a href="#planes" className="transition-colors hover:text-foreground">
              Planes
            </a>
            <a href="#contacto" className="transition-colors hover:text-foreground">
              Contacto
            </a>
            <Link to="/iniciar-sesion" className="transition-colors hover:text-foreground">
              Iniciar sesión
            </Link>
          </nav>
          <Link
            to="/registro"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Crear cuenta
          </Link>
        </div>
      </header>

      <main>
        <section className="hero-aura relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-5 pt-20 pb-14 md:pt-28">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
              Para agencias, community managers y equipos de marca
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl leading-[1.05] font-bold md:text-6xl">
              Todo el contenido de tus clientes, en un solo tablero vivo
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Centraliza planes de contenido, objetivos de conversión y calendarios editoriales por
              red social. Gestiona el flujo en tiempo real, da seguimiento a las publicaciones clave
              y mide la presencia de marca de forma estructurada.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/registro"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Registrarme gratis
              </Link>
              <Link
                to="/iniciar-sesion"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-medium text-foreground transition-colors hover:bg-surface-2"
              >
                Ya tengo cuenta
              </Link>
            </div>

            <div className="mt-14 overflow-hidden rounded-2xl border border-border glow-card">
              <img
                src={heroBoard}
                width={1408}
                height={1008}
                alt="Tablero interactivo con columnas de ideas, producción, revisión y publicaciones programadas por red social"
                className="w-full"
              />
            </div>
          </div>
        </section>

        <section id="producto" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-bold md:text-4xl">Qué resuelve la plataforma</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/40">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pautas" className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Megaphone className="h-3.5 w-3.5" />
              Pautas y anuncios
            </span>
            <h2 className="mt-5 max-w-2xl text-3xl font-bold md:text-4xl">
              Lo orgánico y lo pagado, en el mismo tablero
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Planea las campañas pagadas al lado del calendario editorial: presupuesto, creativos,
              públicos y resultados sin salir de la plataforma.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {ads.map((a) => (
                <article key={a.title} className="rounded-3xl bg-card p-6 shadow-sm">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/50">
                    <a.icon className="h-5 w-5 text-accent-foreground" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>


        <section id="como-funciona" className="border-y border-border bg-surface/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="text-3xl font-bold md:text-4xl">Cómo funciona</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n}>
                  <span className="font-display text-4xl font-bold text-primary/70">{s.n}</span>
                  <div className="rule-line my-4" />
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="planes" className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-bold md:text-4xl">Planes</h2>
          <p className="mt-3 text-muted-foreground">
            Sin permanencia. Puedes cambiar de plan cuando crezca tu cartera de clientes.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {plans.map((p) => (
              <article
                key={p.name}
                className={
                  p.featured
                    ? "rounded-2xl border border-primary/60 bg-surface-2 p-7"
                    : "rounded-2xl border border-border bg-surface p-7"
                }
              >
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-4 font-display text-3xl font-bold">{p.price}</p>
                <p className="text-sm text-muted-foreground">{p.note}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.items.map((i) => (
                    <li key={i} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{i}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contacto"
                  className={
                    p.featured
                      ? "mt-7 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                      : "mt-7 inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2"
                  }
                >
                  Solicitar este plan
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="contacto" className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">Hablemos de tus cuentas</h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Déjanos tus datos y te mostramos el tablero con el calendario de una de tus marcas.
                También puedes escribir por WhatsApp.
              </p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-3 rounded-full border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-surface-2"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp {WHATSAPP_NUMBER}
              </a>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-semibold">Solicitar demo</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Completa el formulario y llega directo al inbox de leads.
              </p>
              <LeadForm className="mt-5" defaultInterest="demo" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Community Manager IA</span>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            WhatsApp {WHATSAPP_NUMBER}
          </a>
        </div>
      </footer>
    </div>
  );
}
