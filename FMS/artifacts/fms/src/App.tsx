import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/context/auth-context";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";

import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import MemberProfile from "@/pages/members/profile";
import Ranks from "@/pages/ranks";
import Departments from "@/pages/departments";
import PatrolLogs from "@/pages/patrol-logs";
import Applications from "@/pages/applications";
import Disciplinary from "@/pages/disciplinary";
import Activity from "@/pages/activity";
import Whitelist from "@/pages/whitelist";
import Careers from "@/pages/careers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function GuardedRoute({ path, component: Component }: { path: string; component: React.ComponentType }) {
  const { user, canAccess } = useAuth();
  const [location] = useLocation();

  if (!user) return <Redirect to="/login" />;
  if (!canAccess(location)) return <Redirect to="/" />;
  return <Route path={path} component={Component} />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/" /> : <Login />}
      </Route>

      <Route>
        {!user ? (
          <Redirect to="/login" />
        ) : (
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <GuardedRoute path="/members" component={Members} />
              <GuardedRoute path="/members/:id" component={MemberProfile} />
              <GuardedRoute path="/ranks" component={Ranks} />
              <GuardedRoute path="/departments" component={Departments} />
              <GuardedRoute path="/patrol-logs" component={PatrolLogs} />
              <GuardedRoute path="/applications" component={Applications} />
              <GuardedRoute path="/disciplinary" component={Disciplinary} />
              <GuardedRoute path="/activity" component={Activity} />
              <GuardedRoute path="/whitelist" component={Whitelist} />
              <GuardedRoute path="/careers" component={Careers} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
