import { useState, useEffect } from "react";
import { useParams } from "wouter";

export default function TickerTest() {
  const { symbol } = useParams<{ symbol: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const encoded = encodeURIComponent(JSON.stringify({ json: { symbol: symbol.toUpperCase() } }));
        const response = await fetch(`/api/trpc/tickers.getFinancialData?input=${encoded}`);
        const result = await response.json();
        
        if (result.error) {
          setError(result.error.json?.message || "Unknown error");
        } else {
          setData(result.result?.data?.json);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-8">No data</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{symbol}</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Price Data:</h2>
        <pre className="text-sm overflow-auto">{JSON.stringify(data.price, null, 2)}</pre>
        
        <h2 className="font-bold mb-2 mt-4">Profile Data:</h2>
        <pre className="text-sm overflow-auto">{JSON.stringify(data.profile, null, 2)}</pre>
        
        <h2 className="font-bold mb-2 mt-4">Ratios Data:</h2>
        <pre className="text-sm overflow-auto">{JSON.stringify(data.ratios, null, 2)}</pre>
      </div>
    </div>
  );
}
