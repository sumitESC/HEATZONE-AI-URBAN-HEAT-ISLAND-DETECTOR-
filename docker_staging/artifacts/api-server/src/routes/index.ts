import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import citiesRouter from "./cities.js";
import weatherRouter from "./weather.js";
import heatzoneRouter from "./heatzone.js";
import recommendationsRouter from "./recommendations.js";
import datasetsRouter from "./datasets.js";
import forecastRouter from "./forecast.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(citiesRouter);
router.use(weatherRouter);
router.use(heatzoneRouter);
router.use(recommendationsRouter);
router.use(datasetsRouter);
router.use(forecastRouter);

export default router;
