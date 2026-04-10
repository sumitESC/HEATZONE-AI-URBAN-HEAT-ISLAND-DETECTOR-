import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { citiesTable } from "./cities";

export const heatPredictionsTable = sqliteTable("heat_predictions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cityId: integer("city_id").notNull().references(() => citiesTable.id),
  heatRiskScore: real("heat_risk_score").notNull(),
  heatZone: text("heat_zone").notNull(),
  temperature: real("temperature").notNull(),
  humidity: integer("humidity").notNull(),
  vehicleDensity: real("vehicle_density").notNull(),
  populationDensity: real("population_density").notNull(),
  greenCoverRatio: real("green_cover_ratio").notNull(),
  builtUpRatio: real("built_up_ratio").notNull(),
  coolingIndex: real("cooling_index").notNull(),
  trafficHeatFactor: real("traffic_heat_factor").notNull(),
  predictedAt: integer("predicted_at", { mode: 'timestamp' }).notNull().defaultNow(),
});

export const insertPredictionSchema = createInsertSchema(heatPredictionsTable).omit({ id: true, predictedAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type HeatPrediction = typeof heatPredictionsTable.$inferSelect;
