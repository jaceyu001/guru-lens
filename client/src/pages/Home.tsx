import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, TrendingUp, Users, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);



  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Navigate directly to ticker page
    setLocation(`/ticker/${searchQuery.toUpperCase()}`);
  };

  // Use query hook for search with proper dependency tracking
  const searchQuery_hook = trpc.tickers.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 1 }
  );

  // Update results when search query changes
  useMemo(() => {
    if (searchQuery_hook.data) {
      setSearchResults(searchQuery_hook.data);
    }
  }, [searchQuery_hook.data]);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
  };

  // Fetch personas list
  const personasQuery = trpc.personas.list.useQuery();

  const selectTicker = (symbol: string) => {
    setSearchQuery("");
    setSearchResults([]);
    setLocation(`/ticker/${symbol}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Invest Like the <span className="text-primary">Legends</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Analyze any US stock through the lens of legendary investors like Warren Buffett, Peter Lynch, and more. 
              Get AI-powered insights based on proven investment philosophies.
            </p>

            {/* Search Bar */}
            <div className="mt-10 relative">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter stock ticker (e.g., AAPL, MSFT, TSLA)"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                  
                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.symbol}
                          onClick={() => selectTicker(result.symbol)}
                          className="w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                        >
                          <div className="font-semibold text-foreground">{result.symbol}</div>
                          <div className="text-sm text-muted-foreground">{result.companyName}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button type="submit" size="lg" className="h-12 px-8">
                  Analyze
                </Button>
              </form>
              <p className="mt-3 text-sm text-muted-foreground">
                Try: AAPL, MSFT, GOOGL, NVDA, TSLA, JPM, JNJ, WMT, V, KO
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get comprehensive analysis from multiple legendary investor perspectives
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Search Any Stock</h3>
              <p className="text-sm text-muted-foreground">
                Enter any US stock ticker to begin your analysis
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Multiple Personas</h3>
              <p className="text-sm text-muted-foreground">
                See ratings from Buffett, Lynch, Graham, and more
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Detailed Criteria</h3>
              <p className="text-sm text-muted-foreground">
                Understand exactly why each persona rates the stock
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Daily Opportunities</h3>
              <p className="text-sm text-muted-foreground">
                Discover market-wide scans for each investment style
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Investment Personas</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Learn from the strategies of legendary investors
            </p>
          </div>

          {personasQuery.isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {personasQuery.data?.map((persona) => (
                <Card
                  key={persona.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setLocation(`/opportunities/${persona.personaId}`)}
                >
                  <h3 className="text-xl font-bold text-foreground mb-2">{persona.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{persona.description}</p>
                  <Button variant="outline" className="w-full">
                    View Opportunities
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <Card className="p-8 border-warning/50 bg-warning/5">
            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-warning flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Educational & Research Purpose Only</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Guru Lens provides educational analysis based on historical investment philosophies. 
                  This is not financial advice, and we make no guarantees about investment outcomes. 
                  All analysis is for research and learning purposes. Always conduct your own due diligence 
                  and consult with a qualified financial advisor before making investment decisions.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
