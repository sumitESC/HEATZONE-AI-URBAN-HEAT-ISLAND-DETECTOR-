import { Router, type IRouter } from "express";
import { db, citiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { fetchCityForecast } from "../lib/forecastService.js";

const router: IRouter = Router();

// GET /api/forecast/all/compare — 5-day forecast summary for all cities (parallel)
router.get("/forecast/all/compare", async (_req, res): Promise<void> => {
  try {
    const cities = await db.select().from(citiesTable);

    const results = await Promise.all(
      cities.map(async (city) => {
        const forecast = await fetchCityForecast(city.name, city.latitude, city.longitude);
        return {
          cityId: city.id,
          cityName: city.name,
          forecast,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("Forecast all/compare error:", err);
    res.status(500).json({ error: "Failed to fetch forecasts" });
  }
});

// GET /api/forecast/:id — 5-day forecast for a specific city
router.get("/forecast/:id", async (req, res): Promise<void> => {
  try {
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

    const forecast = await fetchCityForecast(city.name, city.latitude, city.longitude);

    res.json({
      cityId: city.id,
      cityName: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      forecast,
    });
  } catch (err) {
    console.error("Forecast error:", err);
    res.status(500).json({ error: "Failed to fetch forecast" });
  }
});

export default router;
