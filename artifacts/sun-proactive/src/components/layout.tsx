import React from "react";
import { Link, useLocation } from "wouter";
import {
  Sun, Home, ListTodo, MessageSquarePlus,
  Users, UserPlus, LogOut, LogIn, ShieldCheck
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth";
import { toast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "mikoplan23@gmail.com";

const coordinatorItems = [
  { title: "Басты бет", url: "/", icon: Home },
  { title: "ЖИ Тапсырма жасаушы", url: "/coordinator/chat", icon: MessageSquarePlus },
  { title: "Тапсырмалар тақтасы", url: "/coordinator/tasks", icon: ListTodo },
];

const volunteerItems = [
  { title: "Еріктілер ретінде қосылу", url: "/volunteer/register", icon: UserPlus },
  { title: "Еріктілер каталогы", url: "/volunteer/directory", icon: Users },
];

function UserButton() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm" className="hidden sm:flex rounded-full border-primary/20 text-primary hover:bg-primary/5">
          <LogIn className="w-4 h-4 mr-2" />
          Кіру
        </Button>
      </Link>
    );
  }

  const initials = user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Сіз жүйеден шықтыңыз." });
      setLocation("/");
    } catch {
      toast({ variant: "destructive", title: "Шығу кезінде қате пайда болды." });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hidden sm:flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-border/40 hover:bg-muted/50 transition-colors">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground max-w-[100px] truncate">{user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Шығу
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <Sidebar variant="inset" className="border-r border-border/40 shadow-sm">
      <SidebarHeader className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}images/logo-sun.png`}
            alt="Sun Proactive Logo"
            className="w-7 h-7 object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg leading-tight text-foreground">Sun Proactive</span>
          <span className="text-xs font-medium text-muted-foreground">Қоғамдастықты байланыстыру</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
            Үйлестіруші құралдары
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coordinatorItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="rounded-lg mb-1">
                      <Link href={item.url} className={isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}>
                        <item.icon className={isActive ? "text-primary" : "text-muted-foreground"} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
            Еріктілер орталығы
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {volunteerItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className="rounded-lg mb-1">
                      <Link href={item.url} className={isActive ? "bg-secondary text-secondary-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}>
                        <item.icon className={isActive ? "text-secondary-foreground" : "text-muted-foreground"} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin-only section */}
        {isAdmin && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider text-amber-600/80 mb-2">
              Әкімші
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin"} tooltip="Админ панелі" className="rounded-lg mb-1">
                    <Link
                      href="/admin"
                      className={
                        location === "/admin"
                          ? "bg-amber-100 text-amber-800 font-medium"
                          : "text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                      }
                    >
                      <ShieldCheck className={location === "/admin" ? "text-amber-700" : "text-amber-600"} />
                      <span>Админ панелі</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background/50">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 px-6 backdrop-blur-md">
            <SidebarTrigger className="hover-elevate rounded-md" />
            <div className="flex-1" />
            <UserButton />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
