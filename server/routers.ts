import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { cacheRouter } from "./routers/cacheRouter";
import * as db from "./db";
import { getFinancialDataWithFallback, getFinancialDataBatchWithFallback } from './services/cacheFirstDataFetcher';
import * as aiAnalysisEngine from "./services/aiAnalysisEngine";
import * as fundamentalsAgent from "./services/fundamentalsAgent";
import * as valuationAgent from "./services/valuationAgent";
import type { AnalysisOutput, OpportunityOutput, TickerSnapshot, FundamentalsFindings, ValuationFindings } from "@shared/types";

export const appRouter = router({
  system: systemRouter,
  cache: cacheRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Persona operations
  personas: router({
    list: publicProcedure.query(async () => {
      return await db.getAllPersonas();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPersonaById(input.id);
      }),
  }),

  // Ticker operations
  tickers: router({
    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        // Search in database first
        const dbResults = await db.searchTickers(input.query);
        if (dbResults.length > 0) {
          return dbResults;
        }
        
        // Search in financial data service (using cache-first strategy)
        // For now, return empty array and suggest user enter known tickers
        // Full ticker search would require Alpha Vantage Symbol Search API
        const serviceResults: any[] = [];
        
        // Upsert found tickers to database
        for (const ticker of serviceResults) {
          await db.upsertTicker({
            symbol: ticker.symbol,
            companyName: ticker.name || null,
            sector: null,
            industry: null,
            marketCap: null,
            exchange: null,
            description: null,
            lastDataUpdate: new Date(),
            isActive: true,
          });
        }
        
        return serviceResults;
      }),
    
    getBySymbol: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        let ticker = await db.getTickerBySymbol(input.symbol);
        
        if (!ticker) {
          // Try to fetch from cache-first financial data service
          const cacheResult = await getFinancialDataWithFallback(input.symbol, true); // forceRefresh=true for live data
          if (!cacheResult.success || !cacheResult.data) {
            throw new Error(`Failed to fetch financial data for ${input.symbol}`);
          }
          const financialData = cacheResult.data;
          const snapshot = {
            symbol: input.symbol,
            companyName: input.symbol,
            sector: financialData.profile?.sector,
            industry: financialData.profile?.industry,
            price: financialData.price?.current,
            marketCap: 0,
            exchange: 'NASDAQ',
            lastDataUpdate: new Date()
          };
          if (snapshot) {
            const tickerId = await db.upsertTicker({
              symbol: snapshot.symbol,
              companyName: snapshot.companyName || null,
              sector: snapshot.sector || null,
              industry: snapshot.industry || null,
              marketCap: snapshot.marketCap?.toString() || null,
              exchange: snapshot.exchange || null,
              description: null,
              lastDataUpdate: new Date(),
              isActive: true,
            });
            ticker = await db.getTickerBySymbol(input.symbol);
          }
        }
        
        return ticker;
      }),
    
    getFinancialData: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        try {
          console.log(`[getFinancialData] Fetching data for ${input.symbol}`);
          const cacheResult = await getFinancialDataWithFallback(input.symbol, true); // forceRefresh=true for live data
          if (!cacheResult.success || !cacheResult.data) {
            throw new Error(`Failed to fetch financial data for ${input.symbol}`);
          }
          const financialData = cacheResult.data;
          console.log(`[getFinancialData] Success for ${input.symbol} (source: ${cacheResult.source})`);
          console.log(`[getFinancialData] Returning data:`, {
            quote: financialData.quote,
            ratios: financialData.ratios,
            profile: financialData.profile,
          });
          
          return financialData;
        } catch (error) {
          console.error(`[getFinancialData] Error for ${input.symbol}:`, error);
          throw error;
        }
      }),
  }),

  // Analysis operations
  analyses: router({
    runAnalysis: publicProcedure
      .input(z.object({
        symbol: z.string(),
        personaIds: z.array(z.number()).optional(),
        mode: z.enum(["quick", "deep"]).default("quick"),
      }))
      .mutation(async ({ input }) => {
        // Get or create ticker
        let ticker = await db.getTickerBySymbol(input.symbol);
        if (!ticker) {
          const cacheResult = await getFinancialDataWithFallback(input.symbol, true); // forceRefresh=true for live data
          if (!cacheResult.success || !cacheResult.data) {
            throw new Error(`Failed to fetch financial data for ${input.symbol}`);
          }
          const financialData = cacheResult.data;
          const snapshot = {
            symbol: input.symbol,
            companyName: input.symbol,
            sector: financialData.profile?.sector,
            industry: financialData.profile?.industry,
            price: financialData.price?.current,
            marketCap: 0,
            lastDataUpdate: new Date()
          };
          if (!snapshot) {
            throw new Error(`Ticker ${input.symbol} not found`);
          }
          const tickerId = await db.upsertTicker({
            symbol: snapshot.symbol,
            companyName: snapshot.companyName || null,
            sector: snapshot.sector || null,
            industry: snapshot.industry || null,
            marketCap: snapshot.marketCap?.toString() || null,
            exchange: null,
            description: null,
            lastDataUpdate: new Date(),
            isActive: true,
          });
          ticker = await db.getTickerBySymbol(input.symbol);
        }
        
        if (!ticker) throw new Error("Failed to create ticker");
        
        // Get financial data using API-first strategy for live analysis
        const cacheResult = await getFinancialDataWithFallback(input.symbol, true); // forceRefresh=true for live data
        if (!cacheResult.success || !cacheResult.data) {
          throw new Error(`No financial data available for ${input.symbol}`);
        }
        const financialData = cacheResult.data;
        console.log(`[analyzeTicker] Financial data for ${input.symbol}:`, {
          quote: financialData.quote,
          price: financialData.price,
          currentPrice: financialData.quote?.price || financialData.price?.current || 0,
        });
        
        // Get personas to analyze
        const personas = input.personaIds && input.personaIds.length > 0
          ? await Promise.all(input.personaIds.map(id => db.getPersonaById(id)))
          : await db.getAllPersonas();
        
        const validPersonas = personas.filter((p): p is NonNullable<typeof p> => p !== undefined);
        
        // Fetch agent findings in parallel
        console.log('[analyzeTicker] financialData.quote:', JSON.stringify(financialData.quote, null, 2));
        const [fundamentalsFindings, valuationFindings] = await Promise.all([
          fundamentalsAgent.analyzeFundamentals(financialData, financialData.dataQualityFlags || {}),
          valuationAgent.analyzeValuation({
            ticker: input.symbol,
            currentPrice: financialData.quote?.price || financialData.price?.current || 0,
            financialData,
            dataQualityFlags: financialData.dataQualityFlags || {},
          } as any),
        ]).catch(() => [undefined, undefined]);
        
        // PHASE 1 OPTIMIZATION: Pre-compute shared data (computed once, not per persona)
        const quote = financialData.quote!;
        const stockPrice = {
          symbol: input.symbol,
          current: quote.price,
          open: quote.price,
          high: quote.price,
          low: quote.price,
          close: quote.price,
          volume: quote.volume,
          previousClose: quote.price - quote.change,
          change: quote.change,
          changePercent: quote.changePercent,
          timestamp: quote.timestamp,
        };
        
        const profile = financialData.profile!;
        const companyProfile = {
          symbol: input.symbol,
          companyName: ticker.companyName || input.symbol,
          sector: profile.sector,
          industry: profile.industry,
          description: profile.description,
          employees: profile.employees,
          website: profile.website,
          marketCap: parseFloat(ticker.marketCap || "0"),
        };
        
        const ratios = financialData.ratios!;
        const roePercent = (ratios.roe || 0);
        const roaPercent = ((ratios.roe || 0) * 0.5);
        const roicPercent = (ratios.roic || 0);
        const netMarginPercent = (ratios.netMargin || 0);
        const operatingMarginPercent = (ratios.operatingMargin || 0);
        const grossMarginPercent = (ratios.grossMargin || 0);
        
        let pegRatio = 0;
        const peRatio = ratios.pe || 0;
        const earningsGrowth = ratios.earningsGrowth || 0;
        
        if (peRatio > 0 && earningsGrowth > 0) {
          pegRatio = peRatio / (earningsGrowth * 100);
        }
        
        const dataQualityFlags = {
          peNegative: peRatio < 0,
          pegUndefined: pegRatio === 0,
          earningsCollapse: earningsGrowth < -0.10,
          revenueDecline: (ratios.revenueGrowth || 0) < 0,
        };
        
        const keyRatios = {
          symbol: input.symbol,
          peRatio: peRatio,
          pbRatio: ratios.pb || 0,
          psRatio: ratios.ps || 0,
          pegRatio: pegRatio,
          dividendYield: 0,
          payoutRatio: 0,
          roe: roePercent,
          roa: roaPercent,
          roic: roicPercent,
          currentRatio: ratios.currentRatio || 0,
          quickRatio: (ratios.currentRatio || 0) * 0.8,
          debtToEquity: ratios.debtToEquity || 0,
          interestCoverage: 10,
          grossMargin: grossMarginPercent,
          operatingMargin: operatingMarginPercent,
          netMargin: netMarginPercent,
          assetTurnover: 1.0,
          inventoryTurnover: 8.0,
        };
        
        const financials = (Array.isArray(financialData.financials) ? financialData.financials : (financialData.financials?.annualReports || [])).map((f: any) => ({
          period: f.period,
          periodType: "quarterly" as const,
          fiscalYear: f.fiscalYear,
          revenue: f.revenue,
          costOfRevenue: f.revenue * 0.6,
          grossProfit: f.revenue * 0.4,
          operatingExpenses: f.revenue * 0.2,
          operatingIncome: f.revenue * 0.2,
          netIncome: f.netIncome,
          eps: f.eps,
          ebitda: f.revenue * 0.25,
          freeCashFlow: f.netIncome * 0.8,
          totalAssets: f.revenue * 3,
          totalLiabilities: f.revenue * 1.5,
          shareholderEquity: f.revenue * 1.5,
          cashAndEquivalents: f.revenue * 0.5,
          totalDebt: f.revenue * 0.8,
        }));
        
        // PHASE 1 OPTIMIZATION: Parallelize persona analysis with Promise.allSettled()
        const analysisPromises = validPersonas.map(async (persona) => {
          try {
            const analysisInput = {
              symbol: input.symbol,
              personaId: persona.personaId,
              personaName: persona.name,
              price: stockPrice,
              profile: companyProfile,
              financials,
              ratios: keyRatios,
              dataQualityFlags: financialData.dataQualityFlags,
              fundamentalsFindings,
              valuationFindings,
            };
            
            const result = await aiAnalysisEngine.analyzeStock(analysisInput);
            
            const runId = nanoid(16);
            
            // Map AI verdict to database verdict format
            const dbVerdict = result.verdict === "strong_fit" ? "Strong Fit" :
                             result.verdict === "moderate_fit" ? "Fit" :
                             result.verdict === "weak_fit" ? "Borderline" :
                             result.verdict === "poor_fit" ? "Not a Fit" : "Insufficient Data";
            
            // Create run metadata
            const runMetadata = {
              model: "manus-llm",
              version: "1.0",
              runTime: 0,
              inputsHash: nanoid(8),
              mode: input.mode,
            };
            
            // Convert dataUsed to DataSource array
            const dataUsed = [{
              source: result.dataUsed.sources[0] || "Financial Data API",
              endpoint: "/api/financial-data",
              timestamp: result.dataUsed.priceAsOf.getTime(),
            }];
            
            return {
              persona,
              result,
              dbVerdict,
              runMetadata,
              dataUsed,
              runId,
            };
          } catch (error) {
            console.error(`[runAnalysis] Error analyzing ${input.symbol} for persona ${persona.name}:`, error);
            return null;
          }
        });
        
        // Wait for all personas to complete analysis in parallel
        const analysisResults = await Promise.allSettled(analysisPromises);
        
        // Process results and prepare for batch database write
        const analysesToCreate = [];
        const analyses: AnalysisOutput[] = [];
        
        for (const result of analysisResults) {
          if (result.status === 'fulfilled' && result.value) {
            const { persona, result: aiResult, dbVerdict, runMetadata, dataUsed, runId } = result.value;
            
            analysesToCreate.push({
              tickerId: ticker.id,
              personaId: persona.id,
              runId,
              score: aiResult.score,
              verdict: dbVerdict as "Strong Fit" | "Fit" | "Borderline" | "Not a Fit" | "Insufficient Data",
              confidence: aiResult.confidence.toString(),
              summaryBullets: aiResult.summaryBullets,
              criteria: aiResult.criteria,
              keyRisks: aiResult.keyRisks,
              whatWouldChangeMind: aiResult.whatWouldChangeMind,
              dataUsed,
              citations: [],
              runMetadata,
              runTimestamp: new Date(),
            });
            
            analyses.push({
              id: 0,
              runId,
              ticker: input.symbol,
              personaId: persona.personaId,
              personaName: persona.name,
              score: aiResult.score,
              verdict: dbVerdict as "Strong Fit" | "Fit" | "Borderline" | "Not a Fit" | "Insufficient Data",
              confidence: aiResult.confidence,
              summaryBullets: aiResult.summaryBullets,
              criteria: aiResult.criteria,
              keyRisks: aiResult.keyRisks,
              whatWouldChangeMind: aiResult.whatWouldChangeMind,
              dataUsed,
              citations: [],
              runMetadata,
              runTimestamp: new Date(),
            });
          }
        }
        
        // PHASE 1 OPTIMIZATION: Batch insert all analyses at once
        if (analysesToCreate.length > 0) {
          const analysisIds = await db.createAnalysisMany(analysesToCreate);
          for (let i = 0; i < analyses.length; i++) {
            analyses[i].id = analysisIds[i];
          }
        }
        
        return { analyses, jobId: null };
      }),
    
    getLatestForTicker: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        const ticker = await db.getTickerBySymbol(input.symbol);
        if (!ticker) return [];
        
        const analyses = await db.getLatestAnalysesForTicker(ticker.id);
        const personas = await db.getAllPersonas();
        const personaMap = new Map(personas.map(p => [p.id, p]));
        
        return analyses.map(a => {
          const persona = personaMap.get(a.personaId);
          return {
            id: a.id,
            runId: a.runId,
            ticker: input.symbol,
            personaId: persona?.personaId || "",
            personaName: persona?.name || "",
            score: a.score,
            verdict: a.verdict,
            confidence: Number(a.confidence),
            summaryBullets: a.summaryBullets,
            criteria: a.criteria,
            keyRisks: a.keyRisks,
            whatWouldChangeMind: a.whatWouldChangeMind,
            dataUsed: a.dataUsed,
            citations: a.citations || [],
            runMetadata: a.runMetadata,
            runTimestamp: a.runTimestamp,
          } as AnalysisOutput;
        });
      }),
    
    getByRunId: publicProcedure
      .input(z.object({ runId: z.string() }))
      .query(async ({ input }) => {
        const analysis = await db.getAnalysisByRunId(input.runId);
        if (!analysis) return null;
        
        const persona = await db.getPersonaById(analysis.personaId);
        const ticker = await db.getTickerBySymbol("");
        
        return {
          id: analysis.id,
          runId: analysis.runId,
          ticker: ticker?.symbol || "",
          personaId: persona?.personaId || "",
          personaName: persona?.name || "",
          score: analysis.score,
          verdict: analysis.verdict,
          confidence: Number(analysis.confidence),
          summaryBullets: analysis.summaryBullets,
          criteria: analysis.criteria,
          keyRisks: analysis.keyRisks,
          whatWouldChangeMind: analysis.whatWouldChangeMind,
          dataUsed: analysis.dataUsed,
          citations: analysis.citations || [],
          runMetadata: analysis.runMetadata,
          runTimestamp: analysis.runTimestamp,
        } as AnalysisOutput;
      }),
  }),

  // Opportunity operations
  opportunities: router({
    getForPersona: publicProcedure
      .input(z.object({
        personaId: z.string(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        const persona = await db.getPersonaByPersonaId(input.personaId);
        if (!persona) return [];
        
        const opportunities = await db.getLatestOpportunitiesForPersona(persona.id, input.limit);
        
        return opportunities.map(opp => ({
          id: opp.id,
          personaId: persona.personaId,
          personaName: persona.name,
          ticker: {
            symbol: opp.ticker.symbol,
            companyName: opp.ticker.companyName || "",
            sector: opp.ticker.sector || undefined,
            industry: opp.ticker.industry || undefined,
            marketCap: opp.ticker.marketCap ? Number(opp.ticker.marketCap) : undefined,
            exchange: opp.ticker.exchange || undefined,
          },
          analysis: {
            id: opp.analysis.id,
            runId: opp.analysis.runId,
            ticker: opp.ticker.symbol,
            personaId: persona.personaId,
            personaName: persona.name,
            score: opp.analysis.score,
            verdict: opp.analysis.verdict,
            confidence: Number(opp.analysis.confidence),
            summaryBullets: opp.analysis.summaryBullets,
            criteria: opp.analysis.criteria,
            keyRisks: opp.analysis.keyRisks,
            whatWouldChangeMind: opp.analysis.whatWouldChangeMind,
            dataUsed: opp.analysis.dataUsed,
            citations: opp.analysis.citations || [],
            runMetadata: opp.analysis.runMetadata,
            runTimestamp: opp.analysis.runTimestamp,
          },
          rank: opp.rank,
          whyNow: opp.whyNow,
          keyMetrics: opp.keyMetrics,
          changeStatus: opp.changeStatus,
          previousScore: opp.previousScore || undefined,
          scanDate: opp.scanDate,
          scanTimestamp: opp.scanTimestamp,
        } as OpportunityOutput));
      }),
    
    generateDailyScan: publicProcedure
      .input(z.object({ personaId: z.string() }))
      .mutation(async ({ input }) => {
        // This would typically be a background job
        // For now, we'll generate a quick scan of available tickers
        const persona = await db.getPersonaByPersonaId(input.personaId);
        if (!persona) throw new Error("Persona not found");
        
        // Use stockUniverse from cache-first system
        const { getStockUniverse } = await import('./services/stockUniverse');
        const availableTickers = getStockUniverse().slice(0, 10); // Sample first 10 for quick scan
        const scanDate = new Date();
        scanDate.setHours(0, 0, 0, 0);
        
        // Analyze top 10 tickers
        const opportunities = [];
        for (let i = 0; i < Math.min(10, availableTickers.length); i++) {
          const symbol = availableTickers[i];
          const ticker = await db.getTickerBySymbol(symbol);
          if (!ticker) continue;
          
          const cacheResult = await getFinancialDataWithFallback(symbol);
          const financialData = cacheResult.success ? cacheResult.data : null;
          if (!financialData) continue;
          
          // Prepare analysis input (similar to runAnalysis)
          const price = financialData.price!;
          const stockPrice = {
            symbol,
            current: price.current,
            open: price.open,
            high: price.high,
            low: price.low,
            close: price.current,
            volume: price.volume,
            previousClose: price.current - price.change,
            change: price.change,
            changePercent: price.changePercent,
            timestamp: price.timestamp,
          };
          
          const profile = financialData.profile!;
          const companyProfile = {
            symbol,
            companyName: ticker.companyName || symbol,
            sector: profile.sector,
            industry: profile.industry,
            description: profile.description,
            employees: profile.employees,
            website: profile.website,
            marketCap: parseFloat(ticker.marketCap || "0"),
          };
          
          const ratios = financialData.ratios!;
          const keyRatios = {
            symbol,
            peRatio: ratios.pe || 0,
            pbRatio: ratios.pb || 0,
            psRatio: ratios.ps || 0,
            pegRatio: (ratios.pe || 0) / 15,
            dividendYield: 0,
            payoutRatio: 0,
            roe: ratios.roe || 0,
            roa: (ratios.roe || 0) * 0.5,
            roic: ratios.roic || 0,
            currentRatio: ratios.currentRatio || 0,
            quickRatio: (ratios.currentRatio || 0) * 0.8,
            debtToEquity: ratios.debtToEquity || 0,
            interestCoverage: 10,
            grossMargin: ratios.grossMargin || 0,
            operatingMargin: ratios.operatingMargin || 0,
            netMargin: ratios.netMargin || 0,
            assetTurnover: 1.0,
            inventoryTurnover: 8.0,
          };
          
          const financials = (Array.isArray(financialData.financials) ? financialData.financials : (financialData.financials?.annualReports || [])).map((f: any) => ({
            period: f.period,
            periodType: "quarterly" as const,
            fiscalYear: f.fiscalYear,
            revenue: f.revenue,
            costOfRevenue: f.revenue * 0.6,
            grossProfit: f.revenue * 0.4,
            operatingExpenses: f.revenue * 0.2,
            operatingIncome: f.revenue * 0.2,
            netIncome: f.netIncome,
            eps: f.eps,
            ebitda: f.revenue * 0.25,
            freeCashFlow: f.netIncome * 0.8,
            totalAssets: f.revenue * 3,
            totalLiabilities: f.revenue * 1.5,
            shareholderEquity: f.revenue * 1.5,
            cashAndEquivalents: f.revenue * 0.5,
            totalDebt: f.revenue * 0.8,
          }));
          
          const analysisInput = {
            symbol,
            personaId: persona.personaId,
            personaName: persona.name,
            price: stockPrice,
            profile: companyProfile,
            financials,
            ratios: keyRatios,
          };
          
          const analysis = await aiAnalysisEngine.analyzeStock(analysisInput);
          
          // Map AI verdict to database format
          const dbVerdict = analysis.verdict === "strong_fit" ? "Strong Fit" :
                           analysis.verdict === "moderate_fit" ? "Fit" :
                           analysis.verdict === "weak_fit" ? "Borderline" :
                           analysis.verdict === "poor_fit" ? "Not a Fit" : "Insufficient Data";
          
          const runMetadata = {
            model: "manus-llm",
            version: "1.0",
            runTime: 0,
            inputsHash: nanoid(8),
            mode: "quick" as const,
          };
          
          const dataUsed = [{
            source: analysis.dataUsed.sources[0] || "Financial Data API",
            endpoint: "/api/financial-data",
            timestamp: analysis.dataUsed.priceAsOf.getTime(),
          }];
          
          const runId = nanoid(16);
          const analysisId = await db.createAnalysis({
            tickerId: ticker.id,
            personaId: persona.id,
            runId,
            score: analysis.score,
            verdict: dbVerdict,
            confidence: analysis.confidence.toString(),
            summaryBullets: analysis.summaryBullets,
            criteria: analysis.criteria,
            keyRisks: analysis.keyRisks,
            whatWouldChangeMind: analysis.whatWouldChangeMind,
            dataUsed,
            citations: [],
            runMetadata,
            runTimestamp: new Date(),
          });
          
          if (analysis.score >= 60) {
            const oppId = await db.createOpportunity({
              personaId: persona.id,
              tickerId: ticker.id,
              analysisId,
              scanDate,
              rank: opportunities.length + 1,
              whyNow: [
                "Strong fundamentals align with persona criteria",
                "Recent price action creates favorable entry point",
                "Valuation metrics are attractive",
              ],
              keyMetrics: {
                score: analysis.score,
                confidence: analysis.confidence,
                verdict: analysis.verdict,
              },
              changeStatus: "new",
              previousScore: null,
              scanTimestamp: new Date(),
            });
            
            opportunities.push({ id: oppId, symbol, score: analysis.score });
          }
        }
        
        return { count: opportunities.length, opportunities };
      }),
  }),

  // Watchlist operations
  watchlist: router({
    getTickers: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserWatchlistTickers(ctx.user.id);
    }),
    
    addTicker: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ticker = await db.getTickerBySymbol(input.symbol);
        if (!ticker) throw new Error("Ticker not found");
        
        // Get latest analyses to calculate snapshot score
        const analyses = await db.getLatestAnalysesForTicker(ticker.id);
        const avgScore = analyses.length > 0
          ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length)
          : null;
        
        const id = await db.addTickerToWatchlist({
          userId: ctx.user.id,
          tickerId: ticker.id,
          snapshotScore: avgScore,
          snapshotData: {},
          notes: input.notes || null,
        });
        
        return { id, success: true };
      }),
    
    removeTicker: protectedProcedure
      .input(z.object({ tickerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeTickerFromWatchlist(ctx.user.id, input.tickerId);
        return { success: true };
      }),
    
    isInWatchlist: protectedProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ ctx, input }) => {
        const ticker = await db.getTickerBySymbol(input.symbol);
        if (!ticker) return false;
        return await db.isTickerInWatchlist(ctx.user.id, ticker.id);
      }),
  }),

  // Alert operations
  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAlerts(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        alertType: z.enum(["score_threshold", "new_opportunity"]),
        symbol: z.string().optional(),
        personaId: z.string().optional(),
        thresholdScore: z.number().optional(),
        thresholdDirection: z.enum(["above", "below"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let tickerId: number | null = null;
        let dbPersonaId: number | null = null;
        
        if (input.symbol) {
          const ticker = await db.getTickerBySymbol(input.symbol);
          if (ticker) tickerId = ticker.id;
        }
        
        if (input.personaId) {
          const persona = await db.getPersonaByPersonaId(input.personaId);
          if (persona) dbPersonaId = persona.id;
        }
        
        const id = await db.createAlert({
          userId: ctx.user.id,
          alertType: input.alertType,
          tickerId,
          personaId: dbPersonaId,
          thresholdScore: input.thresholdScore || null,
          thresholdDirection: input.thresholdDirection || null,
          isActive: true,
          lastTriggered: null,
        });
        
        return { id, success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteAlert(ctx.user.id, input.alertId);
        return { success: true };
      }),
  }),

  // Agent operations
  agents: router({
    fundamentals: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        const cacheResult = await getFinancialDataWithFallback(input.symbol, true); // forceRefresh=true for live data
        if (!cacheResult.success || !cacheResult.data) {
          throw new Error(`Failed to fetch financial data for ${input.symbol}`);
        }
        const financialData = cacheResult.data;
        const dataQualityFlags = financialData.dataQualityFlags || {};
        
        const findings = await fundamentalsAgent.analyzeFundamentals(
          financialData,
          dataQualityFlags
        );
        
        return findings;
      }),
    
    valuation: publicProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        const cacheResult = await getFinancialDataWithFallback(input.symbol, true); // forceRefresh=true for live data
        if (!cacheResult.success || !cacheResult.data) {
          throw new Error(`Failed to fetch financial data for ${input.symbol}`);
        }
        const financialData = cacheResult.data;
        const currentPrice = financialData.price?.current || 0;
        const dataQualityFlags = financialData.dataQualityFlags || {};
        
        const findings = await valuationAgent.analyzeValuation({
          ticker: input.symbol,
          currentPrice,
          financialData,
          dataQualityFlags,
        } as any);
        
        return findings;
      }),
  }),

  // Opportunity Scanning operations
  opportunityScanning: router({
    startScan: publicProcedure
      .input(z.object({ personaId: z.number(), testMode: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        const { createScanJob, startRefreshJobWithAdaptiveRateLimit, startTestScan } = await import('./services/opportunityScanningService');
        
        const scanJobId = await createScanJob(input.personaId);
        
        // Start scan in background
        if (input.testMode) {
          startTestScan(scanJobId, input.personaId).catch((error) => {
            console.error(`[Test Scan Job ${scanJobId}] Error:`, error);
          });
        } else {
          startRefreshJobWithAdaptiveRateLimit(scanJobId, input.personaId).catch((error) => {
            console.error(`[Scan Job ${scanJobId}] Error:`, error);
          });
        }
        
        return { scanJobId, status: 'pending', startedAt: new Date() };
      }),
    
    getScanProgress: publicProcedure
      .input(z.object({ scanJobId: z.number() }))
      .query(async ({ input }) => {
        const { getScanJobProgress } = await import('./services/opportunityScanningService');
        return await getScanJobProgress(input.scanJobId);
      }),
    
    getOpportunities: publicProcedure
      .input(z.object({ scanJobId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const { getOpportunitiesForScan } = await import('./services/opportunityScanningService');
        return await getOpportunitiesForScan(input.scanJobId, input.limit || 50);
      }),
    
    getOpportunityDetails: publicProcedure
      .input(z.object({ opportunityId: z.number() }))
      .query(async ({ input }) => {
        // TODO: Implement getOpportunityDetails
        return null;
      }),
    
    getDataStatus: publicProcedure
      .query(async () => {
        const { getDataStatus } = await import('./services/opportunityScanningService');
        return await getDataStatus();
      }),
    
    refreshData: publicProcedure
      .input(z.object({ scheduleForLater: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        const { createScanJob, startRefreshJobWithAdaptiveRateLimit } = await import('./services/opportunityScanningService');
              const refreshJobId = await createScanJob(1); // TODO: Get actual persona ID
        
        if (input.scheduleForLater) {
          // Schedule for 10 PM tonight
          console.log(`[Refresh Job ${refreshJobId}] Scheduled for 10 PM tonight`);
          // TODO: Implement scheduling logic
        } else {
          // Start immediately in background
          startRefreshJobWithAdaptiveRateLimit(refreshJobId, 1).catch((error: any) => {           console.error(`[Refresh Job ${refreshJobId}] Error:`, error);
          });
        }
        
        return { refreshJobId, estimatedDuration: '~8 hours' };
      }),
  }),
});

export type AppRouter = typeof appRouter;
