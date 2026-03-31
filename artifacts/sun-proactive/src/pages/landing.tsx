import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, HeartHandshake, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import AdminPanel from "@/components/admin-panel";

const ADMIN_EMAIL = "mikoplan23@gmail.com";

export default function Landing() {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] py-12 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="mr-2 h-4 w-4" />
              Ақылды Қоғамдастық Сәйкестендіруі
            </div>
            <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.1] text-foreground">
              Қоғамдастығыңызға{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                нұр алып кел.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-[600px] leading-relaxed">
              Sun Proactive жасанды интеллектті пайдалана отырып, үйлестірушілердің идеяларын тапсырмаларға айналдырады және дағдылары мен мүмкіндіктеріне қарай ең қолайлы еріктілерді автоматты түрде іріктейді.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/coordinator/chat" className="w-full sm:w-auto">
              <Button size="lg" className="w-full rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 h-14 text-base font-semibold group">
                Тапсырма жасау
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/volunteer/register" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full rounded-xl h-14 text-base font-semibold border-2 border-primary/20 text-foreground hover:bg-primary/5">
                Еріктілер ретінде қосылу
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-border/50">
            <div>
              <div className="flex items-center gap-2 font-display font-semibold text-foreground mb-2">
                <Target className="w-5 h-5 text-secondary-foreground" />
                ЖИ Тапсырма жасау
              </div>
              <p className="text-sm text-muted-foreground">Күрделі еріктілік қажеттіліктерді бірден құрылымдау үшін ЖИ-мен сөйлесіңіз.</p>
            </div>
            <div>
              <div className="flex items-center gap-2 font-display font-semibold text-foreground mb-2">
                <HeartHandshake className="w-5 h-5 text-accent-foreground" />
                Ақылды Сәйкестендіру
              </div>
              <p className="text-sm text-muted-foreground">Алгоритмдер еріктілерді бағалап, ең қолайлысын табуға көмектеседі.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[2rem] blur-3xl -z-10 transform scale-90" />
          <img
            src={`${import.meta.env.BASE_URL}images/hero-sunny.png`}
            alt="Күн нұры қоғамдастық суреті"
            className="w-full h-auto rounded-[2rem] shadow-2xl border border-white/20 object-cover aspect-[4/3]"
          />

          <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl border border-border/50 flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-500">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-xl">98%</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Сәйкестік деңгейі</p>
              <p className="text-xs text-muted-foreground">Демалыс күнгі іс-шаралар үшін</p>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Admin Panel – only visible to mikoplan23@gmail.com */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-3xl w-full mt-16"
        >
          <AdminPanel />
        </motion.div>
      )}
    </div>
  );
}
