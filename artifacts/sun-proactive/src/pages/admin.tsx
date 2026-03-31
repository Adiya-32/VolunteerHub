import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, Bell, CheckCircle, XCircle, Clock,
  Trash2, RefreshCw, Code2, Database, Route,
  ChevronDown, ChevronRight, Server, Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";

const ADMIN_EMAIL = "mikoplan23@gmail.com";
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const StatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  denied: "bg-red-100 text-red-800 border-red-200",
};
const StatusLabels: Record<string, string> = {
  pending: "Күтілуде",
  approved: "Бекітілді",
  denied: "Қабылданбады",
};

interface PendingAction {
  id: number;
  actionType: string;
  targetId: string;
  targetName: string;
  requestedByEmail: string;
  requestedByName: string;
  status: string;
  createdAt: string;
}

function safeDate(d: string) {
  try {
    return new Date(d).toLocaleString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return d; }
}

const APP_ROUTES = [
  { method: "GET",    path: "/api/healthz",                       desc: "Health check" },
  { method: "GET",    path: "/api/auth/me",                       desc: "Ағымдағы пайдаланушы сессиясы" },
  { method: "POST",   path: "/api/auth/signup",                   desc: "Тіркелу (name, email, password)" },
  { method: "POST",   path: "/api/auth/login",                    desc: "Жүйеге кіру" },
  { method: "POST",   path: "/api/auth/logout",                   desc: "Жүйеден шығу" },
  { method: "GET",    path: "/api/volunteers",                     desc: "Барлық еріктілерді алу" },
  { method: "POST",   path: "/api/volunteers",                     desc: "Жаңа еріктілер тіркеу" },
  { method: "GET",    path: "/api/volunteers/:id",                 desc: "Еріктіні ID бойынша алу" },
  { method: "PUT",    path: "/api/volunteers/:id",                 desc: "Еріктіні жаңарту" },
  { method: "DELETE", path: "/api/volunteers/:id",                 desc: "Еріктіні жою (тек әкімші)" },
  { method: "POST",   path: "/api/volunteers/:id/request-action",  desc: "Жою сұранысы жіберу (басқа пайдаланушылар)" },
  { method: "GET",    path: "/api/tasks",                          desc: "Барлық тапсырмаларды алу" },
  { method: "POST",   path: "/api/tasks",                          desc: "Жаңа тапсырма жасау" },
  { method: "GET",    path: "/api/tasks/:id",                      desc: "Тапсырманы ID бойынша алу" },
  { method: "GET",    path: "/api/tasks/:id/matches",              desc: "ЖИ негізіндегі сәйкестіктер" },
  { method: "GET",    path: "/api/matches",                        desc: "Тағайындалған сәйкестіктер тізімі" },
  { method: "POST",   path: "/api/matches",                        desc: "Жаңа сәйкестік жасау" },
  { method: "POST",   path: "/api/chat",                           desc: "ЖИ чатпен тапсырма жасау (Арай)" },
  { method: "GET",    path: "/api/pending-actions",                desc: "Күтілуде әрекеттер тізімі (тек әкімші)" },
  { method: "PATCH",  path: "/api/pending-actions/:id",            desc: "Сұранысты бекіту / қабылдамау" },
];

const DB_TABLES = [
  { name: "users",           desc: "Тіркелген пайдаланушылар (id, name, email, passwordHash, createdAt)" },
  { name: "volunteers",      desc: "Еріктілер (id, name, email, phone, skills[], availability, location, bio, totalHours, createdAt)" },
  { name: "tasks",           desc: "Тапсырмалар (id, title, description, status, date, location, volunteersNeeded, requiredSkills[], createdAt)" },
  { name: "matches",         desc: "Тағайындалған сәйкестіктер (id, taskId, volunteerId, matchScore, createdAt)" },
  { name: "pending_actions", desc: "Бекітуді күтетін әрекеттер (id, actionType, targetId, targetName, requestedByEmail, requestedByName, status, createdAt)" },
  { name: "sessions",        desc: "PostgreSQL сессия сақтау (connect-pg-simple арқылы)" },
];

const FRONTEND_PAGES = [
  { path: "/",                           desc: "Басты бет (hero + admin панелі)" },
  { path: "/login",                      desc: "Жүйеге кіру" },
  { path: "/signup",                     desc: "Тіркелу" },
  { path: "/coordinator/chat",           desc: "ЖИ чатбот (Арай) арқылы тапсырма жасау" },
  { path: "/coordinator/tasks",          desc: "Тапсырмалар тақтасы" },
  { path: "/coordinator/tasks/:id/match","desc": "Тапсырмаға ЖИ сәйкестік нәтижелері" },
  { path: "/volunteer/register",         desc: "Еріктілер ретінде тіркелу" },
  { path: "/volunteer/directory",        desc: "Еріктілер каталогы (жою мүмкіндігімен)" },
  { path: "/admin",                      desc: "Әкімші панелі (тек mikoplan23@gmail.com)" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-green-100 text-green-700",
  PUT: "bg-yellow-100 text-yellow-700",
  PATCH: "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100 text-red-700",
};

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/pending-actions`, { credentials: "include" });
      if (!res.ok) return;
      setActions(await res.json());
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActions(); }, []);

  const handleDecision = async (id: number, decision: "approved" | "denied", targetName: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`${BASE}/api/pending-actions/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Қате");
      toast({
        title: decision === "approved" ? "Бекітілді" : "Қабылданбады",
        description: decision === "approved"
          ? `${targetName} еріктісін жою орындалды.`
          : `${targetName} жою сұранысы қабылданбады.`,
      });
      await fetchActions();
      if (decision === "approved") {
        await queryClient.invalidateQueries({ queryKey: ["/api/volunteers"] });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Қате", description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  if (!user || user.email !== ADMIN_EMAIL) {
    return <div className="py-20 text-center text-muted-foreground">Рұқсат жоқ.</div>;
  }

  const pending = actions.filter(a => a.status === "pending");
  const resolved = actions.filter(a => a.status !== "pending").slice(-10).reverse();

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Админ панелі</h1>
          <p className="text-muted-foreground mt-0.5">Сәлем, {user.name}. Сіз жүйе әкімшісісіз.</p>
        </div>
        {pending.length > 0 && (
          <Badge className="ml-auto bg-amber-500 text-white border-none rounded-full px-3 py-1 text-sm">
            {pending.length} жаңа сұраныс
          </Badge>
        )}
      </div>

      <Tabs defaultValue="requests">
        <TabsList className="rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bell className="w-4 h-4 mr-2" />
            Сұраныстар {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="routes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Route className="w-4 h-4 mr-2" />
            API маршруттары
          </TabsTrigger>
          <TabsTrigger value="schema" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Database className="w-4 h-4 mr-2" />
            Дерекқор
          </TabsTrigger>
          <TabsTrigger value="pages" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Layers className="w-4 h-4 mr-2" />
            Беттер
          </TabsTrigger>
        </TabsList>

        {/* ─── Pending Actions Tab ─── */}
        <TabsContent value="requests" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold">Бекітуді күтетін сұраныстар</h2>
            <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={fetchActions}>
              <RefreshCw className="w-4 h-4" />
              Жаңарту
            </Button>
          </div>

          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Жүктелуде...</p>
          ) : pending.length === 0 ? (
            <Card className="p-12 text-center border-dashed bg-transparent shadow-none">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-muted-foreground">Күтілуде сұраныстар жоқ.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pending.map(action => (
                <Card key={action.id} className="rounded-2xl border-amber-200 bg-amber-50/30">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">
                        Еріктіні жою: <span className="text-primary">{action.targetName}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Сұраныс: <span className="font-medium">{action.requestedByName}</span>{" "}
                        <span className="text-xs">({action.requestedByEmail})</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{safeDate(action.createdAt)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleDecision(action.id, "denied", action.targetName)}
                        disabled={processingId === action.id}
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-semibold"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Бас тарту
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDecision(action.id, "approved", action.targetName)}
                        disabled={processingId === action.id}
                        className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        {processingId === action.id ? "..." : "Бекіту"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Шешілгендер (соңғы 10)</h3>
              {resolved.map(action => (
                <div key={action.id} className="flex items-center justify-between bg-card rounded-xl border border-border/40 px-4 py-3 gap-3">
                  <p className="text-sm min-w-0 truncate">
                    <span className="font-medium text-foreground">{action.targetName}</span>
                    <span className="text-muted-foreground ml-1.5 text-xs">— {action.requestedByName}</span>
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">{safeDate(action.createdAt)}</span>
                    <Badge className={`text-[11px] border rounded-full px-2 py-0.5 ${StatusStyles[action.status]}`}>
                      {StatusLabels[action.status] ?? action.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── API Routes Tab ─── */}
        <TabsContent value="routes" className="mt-6">
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                API маршруттары — Express.js сервері (порт 8080)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {APP_ROUTES.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${METHOD_COLORS[r.method] ?? "bg-gray-100 text-gray-700"}`}>
                      {r.method}
                    </span>
                    <code className="text-sm font-mono text-foreground shrink-0">{r.path}</code>
                    <span className="text-sm text-muted-foreground ml-2">{r.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── DB Schema Tab ─── */}
        <TabsContent value="schema" className="mt-6">
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                Дерекқор кестелері — PostgreSQL (Drizzle ORM)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {DB_TABLES.map((t, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                    <code className="text-sm font-mono font-bold text-primary shrink-0 mt-0.5 min-w-[150px]">{t.name}</code>
                    <span className="text-sm text-muted-foreground">{t.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="mt-4 bg-muted/30 rounded-2xl border border-border/50 p-5">
            <p className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">{`Технология стек:
Frontend  →  React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui
Backend   →  Express.js + TypeScript + Pino (logging)
Database  →  PostgreSQL + Drizzle ORM + connect-pg-simple (sessions)
AI        →  OpenAI GPT (Replit AI Integrations) — chatbot "Арай"
Auth      →  express-session + bcryptjs + PostgreSQL session store
Hosting   →  Replit (pnpm monorepo workspace)`}</p>
          </div>
        </TabsContent>

        {/* ─── Frontend Pages Tab ─── */}
        <TabsContent value="pages" className="mt-6">
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Фронтенд беттері — React Router (wouter)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {FRONTEND_PAGES.map((p, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                    <code className="text-sm font-mono text-foreground shrink-0 min-w-[260px]">{p.path}</code>
                    <span className="text-sm text-muted-foreground">{p.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
