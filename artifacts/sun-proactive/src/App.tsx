import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { AuthProvider } from "@/context/auth";

// Pages
import Landing from "@/pages/landing";
import VolunteerRegister from "@/pages/volunteer/register";
import VolunteerDirectory from "@/pages/volunteer/directory";
import CoordinatorChat from "@/pages/coordinator/chat-create";
import TasksBoard from "@/pages/coordinator/tasks";
import TaskMatch from "@/pages/coordinator/task-match";
import LoginPage from "@/pages/auth/login";
import SignupPage from "@/pages/auth/signup";
import AdminPage from "@/pages/admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/volunteer/register" component={VolunteerRegister} />
            <Route path="/volunteer/directory" component={VolunteerDirectory} />
            <Route path="/coordinator/chat" component={CoordinatorChat} />
            <Route path="/coordinator/tasks" component={TasksBoard} />
            <Route path="/coordinator/tasks/:id/match" component={TaskMatch} />
            <Route path="/admin" component={AdminPage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
