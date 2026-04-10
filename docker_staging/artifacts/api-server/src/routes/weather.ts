import { Router, type IRouter } from "express";
import { db, citiesTable, weatherDataTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { fetchCityWeather } from "../lib/weatherService.js";
import { computeHeatRisk, generateRecommendations } from "../lib/heatEngine.js";
import { heatPredictionsTable, recommendationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/weather/current/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const cityId = parseInt(raw, 10);
  if (isNaN(cityId)) {
    res.status(400).json({ error: "Invalid city id" });
    return;
  }

  const [city] = await db.select().from(citiesTable).where(eq(citiesTable.id, cityId));
  if (!city) {
    res.status(404).json({ error: "City not found" });
    return;
  }

  const [latest] = await db
    .select()
    .from(weatherDataTable)
    .where(eq(weatherDataTable.cityId, cityId))
    .orderBy(desc(weatherDataTable.recordedAt))
    .limit(1);

  if (!latest) {
    res.status(404).json({ error: "No weather data available" });
    return;
  }

  res.json({ ...latest, cityName: city.name });
});

router.get("/weather/history/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const cityId = parseInt(raw, 10);
  if (isNaN(cityId)) {
    res.status(400).json({ error: "Invalid city id" });
    return;
  }

  const limitRaw = req.query.limit;
  const limit = limitRaw ? parseInt(String(limitRaw), 10) : 20;

  const [city] = await db.select().from(citiesTable).where(eq(citiesTable.id, cityId));
  if (!city) {
    res.status(404).json({ error: "City not found" });
    return;
  }

  const history = await db
    .select()
    .from(weatherDataTable)
    .where(eq(weatherDataTable.cityId, cityId))
    .orderBy(desc(weatherDataTable.recordedAt))
    .limit(limit);

  res.json(history.map((w) => ({ ...w, cityName: city.name })));
});

router.post("/weather/refresh", async (_req, res): Promise<void> => {
  const cities = await db.select().from(citiesTable);
  let citiesUpdated = 0;

  for (const city of cities) {
    const weatherData = await fetchCityWeather(city.name);
    if (!weatherData) continue;

    const [inserted] = await db
      .insert(weatherDataTable)
      .values({ cityId: city.id, ...weatherData })
      .returning();

    if (!inserted) continue;
    citiesUpdated++;

    const heatResult = computeHeatRisk(city, inserted.temperature, inserted.humidity, inserted.windSpeed);

    await db.insert(heatPredictionsTable).values({
      cityId: city.id,
      heatRiskScore: heatResult.heatRiskScore,
      heatZone: heatResult.heatZone,
      temperature: inserted.temperature,
      humidity: inserted.humidity,
      vehicleDensity: heatResult.factors.vehicleDensity,
      populationDensity: heatResult.factors.populationDensity,
      greenCoverRatio: heatResult.factors.greenCoverRatio,
      builtUpRatio: heatResult.factors.builtUpRatio,
      coolingIndex: heatResult.factors.coolingIndex,
      trafficHeatFactor: heatResult.factors.trafficHeatFactor,
    });

    await db.delete(recommendationsTable).where(eq(recommendationsTable.cityId, city.id));
    const recs = generateRecommendations(city.id, city, heatResult.factors, heatResult.heatRiskScore);
    if (recs.length > 0) {
      await db.insert(recommendationsTable).values(recs);
    }
  }

  res.json({ success: true, citiesUpdated, message: `Weather and heat predictions updated for ${citiesUpdated} cities` });
});

export default router;
