import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Ticker from "./pages/Ticker";
import TickerTest from "./pages/TickerTest";
import Opportunities from "./pages/Opportunities";
import Watchlist from "./pages/Watchlist";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/ticker/:symbol"} component={Ticker} />
      <Route path={"/ticker-test/:symbol"} component={TickerTest} />
      <Route path={"/opportunities"} component={Opportunities} />
      <Route path={"/opportunities/:personaId"} component={Opportunities} />
      <Route path={"/watchlist"} component={Watchlist} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
