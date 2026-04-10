import { Router, type IRouter, Request, Response } from "express";
import { db, citiesTable, weatherDataTable, heatPredictionsTable, recommendationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

// ─── Intent detection ───────────────────────────────────────────────────────
interface DetectedIntent {
  type: "map" | "chart" | "report" | "forecast" | "comparison" | "recommendations" | "heatzone" | "weather" | "overview" | "general";
  cityId?: number;
  cityName?: string;
  cityIds?: number[];
  cityNames?: string[];
}

let cachedCities: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 300000; // 5 minutes

async function detectIntent(userMessage: string, contextCityId?: number): Promise<DetectedIntent> {
  const msg = userMessage.toLowerCase();

  if (!cachedCities || (Date.now() - lastCacheTime > CACHE_TTL)) {
    cachedCities = await db.select().from(citiesTable);
    lastCacheTime = Date.now();
  }

  // Detect ALL cities mentioned in the text
  const matchedCities = (cachedCities || []).filter(c => c.name && msg.includes(c.name.toLowerCase()));

  const cityIds = matchedCities.map(c => c.id);
  const cityNames = matchedCities.map(c => c.name);

  const cityId = cityIds.length > 0 ? cityIds[0] : contextCityId ?? undefined;
  const cityName = cityNames.length > 0 ? cityNames[0] : undefined;

  const intentBase = { cityId, cityName, cityIds, cityNames };

  if (msg.match(/\b(report|full analysis|complete analytics|generate report|detailed report|full report)\b/)) return { type: "report", ...intentBase };
  if (msg.match(/\b(map|geospatial|location|satellite)\b/)) return { type: "map", ...intentBase };
  if (msg.match(/\b(compar|ranking|rank|versus|vs)\b/)) return { type: "comparison", ...intentBase };
  if (msg.match(/\b(forecast|5\.day|five\.day|next.*days|upcoming|rain|rainfall)\b/)) return { type: "forecast", ...intentBase };
  if (msg.match(/\b(trend|history|historical|past|graph|chart|temperature trend|temp trend)\b/)) return { type: "chart", ...intentBase };
  if (msg.match(/\b(recommend|suggestion|reduc|solution|cool|action|mitigation)\b/)) return { type: "recommendations", ...intentBase };
  if (msg.match(/\b(heat.*score|heat.*zone|heat.*risk|heat.*index|urban heat)\b/)) return { type: "heatzone", ...intentBase };
  if (msg.match(/\b(weather|temperature|humidity|wind|current)\b/)) return { type: "weather", ...intentBase };
  if (msg.match(/\b(overview|summary|all cities|platform|dashboard)\b/)) return { type: "overview", ...intentBase };

  return { type: "general", ...intentBase };
}

// ─── Data fetcher ───────────────────────────────────────────────────────────
async function fetchContextData(intent: DetectedIntent): Promise<{ data: any; renderTags: string[] }> {
  const renderTags: string[] = [];
  let data: any = {};

  try {
    const cityId = intent.cityId;
    let cityName = intent.cityName;

    if (cityId && !cityName) {
      const [lookedUpCity] = await db.select().from(citiesTable).where(eq(citiesTable.id, cityId));
      if (lookedUpCity) cityName = lookedUpCity.name;
    }

    switch (intent.type) {
      case "report": {
        if (cityId) {
          const [city] = await db.select().from(citiesTable).where(eq(citiesTable.id, cityId));
          if (city) {
            const [weather, prediction, recs, weatherHistory, heatHistory] = await Promise.all([
              db.select().from(weatherDataTable).where(eq(weatherDataTable.cityId, cityId)).orderBy(desc(weatherDataTable.recordedAt)).limit(1),
              db.select().from(heatPredictionsTable).where(eq(heatPredictionsTable.cityId, cityId)).orderBy(desc(heatPredictionsTable.predictedAt)).limit(1),
              db.select().from(recommendationsTable).where(eq(recommendationsTable.cityId, cityId)),
              db.select().from(weatherDataTable).where(eq(weatherDataTable.cityId, cityId)).orderBy(desc(weatherDataTable.recordedAt)).limit(15),
              db.select().from(heatPredictionsTable).where(eq(heatPredictionsTable.cityId, cityId)).orderBy(desc(heatPredictionsTable.predictedAt)).limit(15)
            ]);
            data.dataset = { city, latestWeather: weather[0], latestPrediction: prediction[0], recommendations: recs, weatherHistory, heatHistory };
            renderTags.push(`[RENDER_REPORT:${cityName || city.name}]`);
          }
        } else renderTags.push("[RENDER_NASA_MAP]");
        break;
      }
      case "map": {
        if (cityId) {
          const [pred] = await db.select().from(heatPredictionsTable).where(eq(heatPredictionsTable.cityId, cityId)).orderBy(desc(heatPredictionsTable.predictedAt)).limit(1);
          data.heatzone = pred;
          renderTags.push(`[RENDER_MAP:${cityName || 'India'}]`);
        } else {
          data.allHeatzones = await db.select().from(heatPredictionsTable).orderBy(desc(heatPredictionsTable.predictedAt));
          renderTags.push("[RENDER_NASA_MAP]");
        }
        break;
      }
      case "comparison": {
        const [allPredictionRows, allCities] = await Promise.all([
          db.select().from(heatPredictionsTable).orderBy(desc(heatPredictionsTable.predictedAt)),
          db.select().from(citiesTable)
        ]);

        if (intent.cityIds && intent.cityIds.length > 1) {
          data.allHeatzones = allPredictionRows.filter((p: any) => intent.cityIds?.includes(p.cityId));
        } else {
          data.allHeatzones = allPredictionRows;
        }

        let comparisonNames = "";
        if (intent.cityNames && intent.cityNames.length > 1) {
          comparisonNames = intent.cityNames.join(",");
        } else {
          comparisonNames = allCities.map((c: any) => c.name).slice(0, 4).join(",");
        }

        renderTags.push(`[RENDER_COMPARISON:${comparisonNames}]`);
        break;
      }
      case "forecast":
      case "chart": {
        if (cityName) {
          renderTags.push(`[RENDER_FORECAST:${cityName}]`);
        } else {
          renderTags.push("[RENDER_NASA_MAP]");
        }
        break;
      }
      case "recommendations": {
        if (cityId) {
          const [recs, pred] = await Promise.all([
            db.select().from(recommendationsTable).where(eq(recommendationsTable.cityId, cityId)),
            db.select().from(heatPredictionsTable).where(eq(heatPredictionsTable.cityId, cityId)).orderBy(desc(heatPredictionsTable.predictedAt)).limit(1)
          ]);
          data.recommendations = recs; data.heatzone = pred[0];
          renderTags.push(`[RENDER_CARD:weather:${cityName}]`);
        }
        break;
      }
      case "heatzone": {
        if (cityId) {
          const [pred] = await db.select().from(heatPredictionsTable).where(eq(heatPredictionsTable.cityId, cityId)).orderBy(desc(heatPredictionsTable.predictedAt)).limit(1);
          data.heatzone = pred;
          renderTags.push(`[RENDER_CARD:weather:${cityName}]`);
        } else renderTags.push("[RENDER_NASA_MAP]");
        break;
      }
      case "weather": {
        if (cityId) {
          const [weather, pred] = await Promise.all([
            db.select().from(weatherDataTable).where(eq(weatherDataTable.cityId, cityId)).orderBy(desc(weatherDataTable.recordedAt)).limit(1),
            db.select().from(heatPredictionsTable).where(eq(heatPredictionsTable.cityId, cityId)).orderBy(desc(heatPredictionsTable.predictedAt)).limit(1)
          ]);
          data.weather = weather[0]; data.heatzone = pred[0];
          renderTags.push(`[RENDER_CARD:weather:${cityName}]`);
          renderTags.push(`[RENDER_MAP:${cityName}]`);
        }
        break;
      }
      case "overview": {
        renderTags.push("[RENDER_NASA_MAP]");
        break;
      }
      default: {
        data.cities = await db.select().from(citiesTable);
        break;
      }
    }
  } catch (err) { console.error("[Data Fetch Error (Direct)]", err); }
  return { data, renderTags };
}

// ─── Human-readable data formatter ──────────────────────────────────────────
function formatDataForAI(fetchedData: any, intent: DetectedIntent): string {
  const parts: string[] = [];
  const today = new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const time = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });

  parts.push(`Current Knowledge Update: Today is **${today}**, time: **${time}**.`);

  try {
    if (fetchedData.weather) {
      const w = fetchedData.weather;
      parts.push(`Current weather: ${w.temperature}°C (feels like ${w.feelsLike}°C), ${w.weatherDescription}, humidity ${w.humidity}%, wind ${w.windSpeed} m/s, rainfall ${w.rainfall || 0} mm`);
    }
    if (fetchedData.heatzone) {
      const h = fetchedData.heatzone;
      parts.push(`Heat analysis for ${h.cityName}: Heat Risk Score ${h.heatRiskScore?.toFixed(1)}/100, Zone: ${h.heatZone?.toUpperCase()}, Temperature ${h.temperature?.toFixed(1)}°C, Humidity ${h.humidity?.toFixed(0)}%, Green Cover ${h.greenCoverRatio?.toFixed(1)}%`);
    }
    if (fetchedData.forecast?.forecast) {
      const fc = fetchedData.forecast;
      parts.push(`5-Day Forecast for ${fc.cityName}:`);
      for (const day of fc.forecast) {
        parts.push(`  ${day.date}: ${day.tempMin}°C – ${day.tempMax}°C, ${day.weatherDescription || day.weatherMain}, humidity ${day.humidity}%`);
      }
    }
    if (fetchedData.allHeatzones && Array.isArray(fetchedData.allHeatzones)) {
      parts.push(`Heat data for ${fetchedData.allHeatzones.length} cities:`);
      for (const c of fetchedData.allHeatzones.slice(0, 10)) {
        parts.push(`  ${c.cityName}: Score ${c.heatRiskScore?.toFixed(1)}/100 (${c.heatZone}), ${c.temperature?.toFixed(1)}°C, humidity ${c.humidity?.toFixed(0)}%`);
      }
    }
    if (fetchedData.dataset?.city) {
      const city = fetchedData.dataset.city;
      parts.push(`City profile for ${city.name}: Population ${city.population?.toLocaleString()}, Forest Cover ${city.forestCover?.toFixed(1)}%`);
    }
  } catch (err) { return JSON.stringify(fetchedData, null, 1); }
  return parts.length > 0 ? parts.join("\n") : JSON.stringify(fetchedData, null, 1);
}

// ─── Master System Prompt ───────────────────────────────────────────────────
function buildSystemPrompt(fetchedData: any, intent: DetectedIntent): string {
  const dataContext = formatDataForAI(fetchedData, intent);
  return `### SYSTEM CONTEXT (INTERNAL)
You are **Aria** 💜 — the friendly, intelligent AI Climate Advisor for HeatZone Platform.

## LIVE DATA CONTEXT
${dataContext}

## HOW TO RESPOND
1. Share key insights naturally.
2. Add practical context (what do the numbers mean?).
3. Give actionable advice when relevant.
4. Keep it conversational. 

## CRITICAL RULES
- Use ONLY the real data provided above. Never invent or guess numbers.
- Do NOT output any [RENDER_...] tags. Visualizations are handled automatically.
- Do NOT use <think> tags.
- I'm Aria, your AI Climate Advisor! 💜`;
}

// ─── Main chat endpoint ─────────────────────────────────────────────────────
router.post("/chat", async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, context } = req.body;
    const userMessages = Array.isArray(messages) ? messages.filter((m: any) => m.role === "user") : [];
    const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : "";

    const contextCityId = context?.id ? parseInt(context.id, 10) : undefined;
    const intent = await detectIntent(lastUserMessage, contextCityId);

    const { data: fetchedData, renderTags } = await fetchContextData(intent);
    const systemPrompt = buildSystemPrompt(fetchedData, intent);

    const recentMessages = Array.isArray(messages) ? messages.slice(-6) : [];
    const formattedMessages = [{ role: "system", content: systemPrompt }, ...recentMessages];

    const ollamaResponse = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:1b",
        messages: formattedMessages,
        stream: true,
        options: { num_predict: 2000, temperature: 0.7, top_p: 0.9, repeat_penalty: 1.1 }
      })
    });

    if (!ollamaResponse.ok) throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.write(" ");

    const reader = ollamaResponse.body!.getReader();
    const decoder = new TextDecoder("utf-8");
    let lineBuffer = "";
    let insideThink = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      lineBuffer += decoder.decode(value, { stream: true });
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          let token = parsed.message?.content || parsed.response || "";

          if (insideThink) {
            if (token.includes("</think>")) { insideThink = false; token = token.split("</think>").slice(1).join(""); }
            else continue;
          } else if (token.includes("<think>")) {
            const parts = token.split("<think>");
            const before = parts[0]; const after = parts.slice(1).join("<think>");
            if (after.includes("</think>")) { insideThink = false; token = before + after.split("</think>").slice(1).join(""); }
            else { insideThink = true; token = before; }
          }
          token = token.replace(/\[RENDER_(?:MAP|CHART|CARD|REPORT|FORECAST|NASA_MAP|COMPARISON)[^\]]*\]/g, "");
          if (token) res.write(token);
        } catch (err) { }
      }
    }

    if (renderTags.length > 0) res.write("\n\n" + renderTags.join("\n"));
    res.end();
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: "Failed to communicate with AI Advisor" });
    else res.end("\n[Error: Connection Interrupted]");
  }
});

export default router;