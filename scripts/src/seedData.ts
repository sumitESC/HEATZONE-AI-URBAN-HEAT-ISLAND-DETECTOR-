import { db, citiesTable, weatherDataTable, heatPredictionsTable, recommendationsTable } from "@workspace/db";

const UP_CITIES = [
  {
    name: "Lucknow",
    latitude: 26.8467,
    longitude: 80.9462,
    population: 3457959,
    populationDensity: 1815,
    totalArea: 2528,
    builtUpArea: 851,
    industrialArea: 180,
    residentialArea: 500,
    roadArea: 95,
    openLand: 420,
    waterBodiesArea: 55,
    forestCover: 8.2,
    urbanGreenSpace: 12.5,
    treeDensity: 45,
    ndvi: 0.28,
    totalVehicles: 2850000,
    petrolVehicles: 1600000,
    dieselVehicles: 820000,
    electricVehicles: 95000,
    cngVehicles: 335000,
  },
  {
    name: "Kanpur",
    latitude: 26.4499,
    longitude: 80.3319,
    population: 2920496,
    populationDensity: 2956,
    totalArea: 1647,
    builtUpArea: 718,
    industrialArea: 310,
    residentialArea: 280,
    roadArea: 72,
    openLand: 182,
    waterBodiesArea: 35,
    forestCover: 5.4,
    urbanGreenSpace: 7.2,
    treeDensity: 28,
    ndvi: 0.19,
    totalVehicles: 2650000,
    petrolVehicles: 1480000,
    dieselVehicles: 910000,
    electricVehicles: 55000,
    cngVehicles: 205000,
  },
  {
    name: "Varanasi",
    latitude: 25.3176,
    longitude: 82.9739,
    population: 1432280,
    populationDensity: 2395,
    totalArea: 1535,
    builtUpArea: 502,
    industrialArea: 95,
    residentialArea: 280,
    roadArea: 60,
    openLand: 388,
    waterBodiesArea: 65,
    forestCover: 9.1,
    urbanGreenSpace: 11.8,
    treeDensity: 52,
    ndvi: 0.31,
    totalVehicles: 1380000,
    petrolVehicles: 750000,
    dieselVehicles: 430000,
    electricVehicles: 42000,
    cngVehicles: 158000,
  },
  {
    name: "Prayagraj",
    latitude: 25.4358,
    longitude: 81.8463,
    population: 1536211,
    populationDensity: 1760,
    totalArea: 2063,
    builtUpArea: 640,
    industrialArea: 140,
    residentialArea: 320,
    roadArea: 78,
    openLand: 520,
    waterBodiesArea: 80,
    forestCover: 10.3,
    urbanGreenSpace: 13.1,
    treeDensity: 58,
    ndvi: 0.33,
    totalVehicles: 1520000,
    petrolVehicles: 830000,
    dieselVehicles: 490000,
    electricVehicles: 48000,
    cngVehicles: 152000,
  },
  {
    name: "Agra",
    latitude: 27.1767,
    longitude: 78.0081,
    population: 1760285,
    populationDensity: 2320,
    totalArea: 1571,
    builtUpArea: 590,
    industrialArea: 175,
    residentialArea: 265,
    roadArea: 65,
    openLand: 278,
    waterBodiesArea: 40,
    forestCover: 6.2,
    urbanGreenSpace: 9.4,
    treeDensity: 38,
    ndvi: 0.22,
    totalVehicles: 1680000,
    petrolVehicles: 940000,
    dieselVehicles: 520000,
    electricVehicles: 62000,
    cngVehicles: 158000,
  },
  {
    name: "Ghaziabad",
    latitude: 28.6692,
    longitude: 77.4538,
    population: 2375820,
    populationDensity: 8652,
    totalArea: 1179,
    builtUpArea: 780,
    industrialArea: 210,
    residentialArea: 380,
    roadArea: 95,
    openLand: 95,
    waterBodiesArea: 15,
    forestCover: 3.8,
    urbanGreenSpace: 5.6,
    treeDensity: 18,
    ndvi: 0.14,
    totalVehicles: 2980000,
    petrolVehicles: 1680000,
    dieselVehicles: 870000,
    electricVehicles: 195000,
    cngVehicles: 235000,
  },
  {
    name: "Noida",
    latitude: 28.5355,
    longitude: 77.3910,
    population: 642381,
    populationDensity: 4260,
    totalArea: 2037,
    builtUpArea: 870,
    industrialArea: 380,
    residentialArea: 320,
    roadArea: 120,
    openLand: 240,
    waterBodiesArea: 18,
    forestCover: 7.5,
    urbanGreenSpace: 14.2,
    treeDensity: 62,
    ndvi: 0.35,
    totalVehicles: 1920000,
    petrolVehicles: 1050000,
    dieselVehicles: 560000,
    electricVehicles: 185000,
    cngVehicles: 125000,
  },
  {
    name: "Meerut", latitude: 28.9845, longitude: 77.7064, population: 1305429, populationDensity: 3200, totalArea: 408, builtUpArea: 250, industrialArea: 60, residentialArea: 150, roadArea: 35, openLand: 80, waterBodiesArea: 12, forestCover: 4.5, urbanGreenSpace: 8.2, treeDensity: 25, ndvi: 0.18, totalVehicles: 850000, petrolVehicles: 480000, dieselVehicles: 280000, electricVehicles: 30000, cngVehicles: 60000,
  },
  {
    name: "Bareilly", latitude: 28.3670, longitude: 79.4304, population: 904797, populationDensity: 2100, totalArea: 235, builtUpArea: 140, industrialArea: 40, residentialArea: 80, roadArea: 20, openLand: 60, waterBodiesArea: 8, forestCover: 5.1, urbanGreenSpace: 7.5, treeDensity: 22, ndvi: 0.20, totalVehicles: 550000, petrolVehicles: 320000, dieselVehicles: 180000, electricVehicles: 15000, cngVehicles: 35000,
  },
  {
    name: "Aligarh", latitude: 27.8974, longitude: 78.0880, population: 874408, populationDensity: 2400, totalArea: 345, builtUpArea: 180, industrialArea: 50, residentialArea: 100, roadArea: 25, openLand: 95, waterBodiesArea: 10, forestCover: 4.8, urbanGreenSpace: 6.9, treeDensity: 20, ndvi: 0.17, totalVehicles: 520000, petrolVehicles: 310000, dieselVehicles: 160000, electricVehicles: 12000, cngVehicles: 38000,
  },
  {
    name: "Moradabad", latitude: 28.8386, longitude: 78.7733, population: 887871, populationDensity: 2600, totalArea: 349, builtUpArea: 200, industrialArea: 45, residentialArea: 120, roadArea: 22, openLand: 85, waterBodiesArea: 15, forestCover: 3.5, urbanGreenSpace: 5.5, treeDensity: 15, ndvi: 0.15, totalVehicles: 490000, petrolVehicles: 280000, dieselVehicles: 170000, electricVehicles: 10000, cngVehicles: 30000,
  },
  {
    name: "Jhansi", latitude: 25.4484, longitude: 78.5685, population: 505693, populationDensity: 1500, totalArea: 315, builtUpArea: 120, industrialArea: 30, residentialArea: 70, roadArea: 18, openLand: 130, waterBodiesArea: 25, forestCover: 8.5, urbanGreenSpace: 10.2, treeDensity: 35, ndvi: 0.25, totalVehicles: 350000, petrolVehicles: 210000, dieselVehicles: 110000, electricVehicles: 8000, cngVehicles: 22000,
  },
  {
    name: "Gorakhpur", latitude: 26.7606, longitude: 83.3732, population: 673446, populationDensity: 1800, totalArea: 350, builtUpArea: 160, industrialArea: 25, residentialArea: 110, roadArea: 20, openLand: 120, waterBodiesArea: 40, forestCover: 6.5, urbanGreenSpace: 8.5, treeDensity: 28, ndvi: 0.22, totalVehicles: 420000, petrolVehicles: 250000, dieselVehicles: 140000, electricVehicles: 9000, cngVehicles: 21000,
  },
  {
    name: "Ayodhya", latitude: 26.7922, longitude: 82.1998, population: 350000, populationDensity: 1200, totalArea: 250, builtUpArea: 90, industrialArea: 10, residentialArea: 60, roadArea: 15, openLand: 100, waterBodiesArea: 35, forestCover: 9.0, urbanGreenSpace: 12.0, treeDensity: 40, ndvi: 0.28, totalVehicles: 200000, petrolVehicles: 120000, dieselVehicles: 60000, electricVehicles: 15000, cngVehicles: 5000,
  },
  {
    name: "Mathura", latitude: 27.4924, longitude: 77.6737, population: 456706, populationDensity: 1900, totalArea: 280, builtUpArea: 130, industrialArea: 35, residentialArea: 75, roadArea: 18, openLand: 110, waterBodiesArea: 20, forestCover: 5.5, urbanGreenSpace: 7.2, treeDensity: 22, ndvi: 0.19, totalVehicles: 310000, petrolVehicles: 190000, dieselVehicles: 100000, electricVehicles: 5000, cngVehicles: 15000,
  },
  {
    name: "Saharanpur", latitude: 29.9640, longitude: 77.5460, population: 705478, populationDensity: 2200, totalArea: 320, builtUpArea: 150, industrialArea: 40, residentialArea: 90, roadArea: 22, openLand: 120, waterBodiesArea: 12, forestCover: 6.8, urbanGreenSpace: 8.4, treeDensity: 26, ndvi: 0.21, totalVehicles: 410000, petrolVehicles: 240000, dieselVehicles: 130000, electricVehicles: 8000, cngVehicles: 32000,
  },
  {
    name: "Muzaffarnagar", latitude: 29.4727, longitude: 77.7085, population: 495000, populationDensity: 1900, totalArea: 250, builtUpArea: 110, industrialArea: 30, residentialArea: 65, roadArea: 15, openLand: 90, waterBodiesArea: 8, forestCover: 4.2, urbanGreenSpace: 6.0, treeDensity: 18, ndvi: 0.16, totalVehicles: 280000, petrolVehicles: 170000, dieselVehicles: 90000, electricVehicles: 5000, cngVehicles: 15000,
  },
  {
    name: "Firozabad", latitude: 27.1590, longitude: 78.3957, population: 604214, populationDensity: 2500, totalArea: 240, builtUpArea: 130, industrialArea: 45, residentialArea: 70, roadArea: 18, openLand: 75, waterBodiesArea: 6, forestCover: 3.8, urbanGreenSpace: 5.2, treeDensity: 15, ndvi: 0.14, totalVehicles: 320000, petrolVehicles: 190000, dieselVehicles: 110000, electricVehicles: 4000, cngVehicles: 16000,
  },
  {
    name: "Rampur", latitude: 28.8154, longitude: 79.0253, population: 325248, populationDensity: 1600, totalArea: 200, builtUpArea: 85, industrialArea: 20, residentialArea: 55, roadArea: 12, openLand: 80, waterBodiesArea: 10, forestCover: 5.0, urbanGreenSpace: 7.0, treeDensity: 20, ndvi: 0.18, totalVehicles: 180000, petrolVehicles: 110000, dieselVehicles: 60000, electricVehicles: 3000, cngVehicles: 7000,
  },
  {
    name: "Bijnor", latitude: 29.3724, longitude: 78.1358, population: 115000, populationDensity: 1300, totalArea: 120, builtUpArea: 40, industrialArea: 10, residentialArea: 25, roadArea: 8, openLand: 55, waterBodiesArea: 8, forestCover: 7.5, urbanGreenSpace: 9.0, treeDensity: 30, ndvi: 0.24, totalVehicles: 80000, petrolVehicles: 50000, dieselVehicles: 25000, electricVehicles: 2000, cngVehicles: 3000,
  },
  {
    name: "Etawah", latitude: 26.7658, longitude: 79.0150, population: 256838, populationDensity: 1400, totalArea: 180, builtUpArea: 75, industrialArea: 15, residentialArea: 50, roadArea: 12, openLand: 70, waterBodiesArea: 15, forestCover: 6.2, urbanGreenSpace: 8.5, treeDensity: 26, ndvi: 0.22, totalVehicles: 140000, petrolVehicles: 85000, dieselVehicles: 45000, electricVehicles: 3000, cngVehicles: 7000,
  },
  {
    name: "Rae Bareli", latitude: 26.2306, longitude: 81.2404, population: 191316, populationDensity: 1200, totalArea: 150, builtUpArea: 60, industrialArea: 15, residentialArea: 35, roadArea: 10, openLand: 65, waterBodiesArea: 8, forestCover: 5.8, urbanGreenSpace: 7.8, treeDensity: 24, ndvi: 0.20, totalVehicles: 110000, petrolVehicles: 65000, dieselVehicles: 35000, electricVehicles: 2000, cngVehicles: 8000,
  },
  {
    name: "Sitapur", latitude: 27.5684, longitude: 80.6789, population: 177234, populationDensity: 1100, totalArea: 160, builtUpArea: 55, industrialArea: 10, residentialArea: 35, roadArea: 10, openLand: 75, waterBodiesArea: 12, forestCover: 6.5, urbanGreenSpace: 8.0, treeDensity: 25, ndvi: 0.21, totalVehicles: 95000, petrolVehicles: 55000, dieselVehicles: 30000, electricVehicles: 2000, cngVehicles: 8000,
  },
  {
    name: "Hardoi", latitude: 27.3986, longitude: 80.1260, population: 197046, populationDensity: 1300, totalArea: 170, builtUpArea: 65, industrialArea: 12, residentialArea: 40, roadArea: 11, openLand: 70, waterBodiesArea: 10, forestCover: 5.5, urbanGreenSpace: 7.5, treeDensity: 22, ndvi: 0.19, totalVehicles: 105000, petrolVehicles: 60000, dieselVehicles: 35000, electricVehicles: 2000, cngVehicles: 8000,
  }
];

const WEATHER_BASE: Record<string, { temp: number; humidity: number; wind: number }> = {
  Lucknow:    { temp: 32.8, humidity: 68, wind: 4.2 },
  Kanpur:     { temp: 34.5, humidity: 72, wind: 3.8 },
  Varanasi:   { temp: 33.1, humidity: 70, wind: 3.5 },
  Prayagraj:  { temp: 35.2, humidity: 65, wind: 4.0 },
  Agra:       { temp: 36.4, humidity: 58, wind: 5.1 },
  Ghaziabad:  { temp: 35.8, humidity: 74, wind: 3.2 },
  Noida:      { temp: 34.9, humidity: 71, wind: 3.6 },
  Meerut:     { temp: 33.5, humidity: 62, wind: 3.2 },
  Bareilly:   { temp: 34.1, humidity: 64, wind: 3.8 },
  Aligarh:    { temp: 35.5, humidity: 60, wind: 4.1 },
  Moradabad:  { temp: 33.8, humidity: 66, wind: 3.4 },
  Jhansi:     { temp: 38.2, humidity: 55, wind: 5.2 },
  Gorakhpur:  { temp: 34.0, humidity: 75, wind: 3.9 },
  Ayodhya:    { temp: 34.2, humidity: 69, wind: 3.7 },
  Mathura:    { temp: 37.1, humidity: 56, wind: 4.8 },
  Saharanpur: { temp: 33.0, humidity: 63, wind: 3.5 },
  Muzaffarnagar: { temp: 33.2, humidity: 65, wind: 3.3 },
  Firozabad:  { temp: 36.8, humidity: 57, wind: 5.0 },
  Rampur:     { temp: 34.5, humidity: 67, wind: 3.6 },
  Bijnor:     { temp: 33.8, humidity: 66, wind: 3.5 },
  Etawah:     { temp: 36.5, humidity: 59, wind: 4.6 },
  "Rae Bareli": { temp: 34.8, humidity: 65, wind: 4.0 },
  Sitapur:    { temp: 34.0, humidity: 70, wind: 3.8 },
  Hardoi:     { temp: 34.5, humidity: 68, wind: 4.1 },
};

function computeHeatScore(city: typeof UP_CITIES[0], temp: number, humidity: number, wind: number): {
  score: number;
  zone: string;
  vehicleDensity: number;
  greenCoverRatio: number;
  builtUpRatio: number;
  coolingIndex: number;
  trafficHeatFactor: number;
} {
  const vehicleDensity = city.totalVehicles / city.totalArea;
  const greenCoverRatio = (city.forestCover + city.urbanGreenSpace) / 100;
  const builtUpRatio = city.builtUpArea / city.totalArea;
  const trafficHeatFactor = city.petrolVehicles + city.dieselVehicles;
  const coolingIndex = greenCoverRatio * Math.max(wind, 0.5);

  const tempScore = Math.max(0, Math.min(1, (temp - 20) / 28)) * 30;
  const humidityScore = Math.max(0, Math.min(1, (humidity - 20) / 80)) * 15;
  const vehicleScore = Math.max(0, Math.min(1, (vehicleDensity - 50) / 4950)) * 20;
  const popDensScore = Math.max(0, Math.min(1, (city.populationDensity - 500) / 29500)) * 10;
  const builtUpScore = Math.max(0, Math.min(1, (builtUpRatio - 0.2) / 0.7)) * 15;
  const greenPenalty = (1 - Math.max(0, Math.min(1, greenCoverRatio / 0.5))) * 10;
  const coolingBonus = Math.max(0, Math.min(1, coolingIndex / 0.5)) * 5;

  const raw = tempScore + humidityScore + vehicleScore + popDensScore + builtUpScore + greenPenalty - coolingBonus;
  const score = Math.min(100, Math.max(0, Math.round(raw * 10) / 10));

  let zone = "cool";
  if (score > 50) zone = "extreme";
  else if (score >= 30) zone = "high";
  else if (score >= 20) zone = "moderate";

  return { score, zone, vehicleDensity, greenCoverRatio, builtUpRatio, coolingIndex, trafficHeatFactor };
}

async function seed() {
  console.log("🌱 Seeding HeatZone AI database...");

  for (const cityData of UP_CITIES) {
    const [city] = await db.insert(citiesTable).values(cityData).returning();
    if (!city) continue;

    console.log(`  📍 Seeded city: ${city.name}`);

    const base = WEATHER_BASE[city.name]!;

    for (let i = 10; i >= 0; i--) {
      const offset = i * 30;
      const tempVariation = (Math.random() - 0.5) * 4;
      const humidVariation = Math.floor((Math.random() - 0.5) * 10);
      const windVariation = (Math.random() - 0.5) * 2;
      const temp = Math.round((base.temp + tempVariation) * 10) / 10;
      const humidity = Math.max(30, Math.min(98, base.humidity + humidVariation));
      const wind = Math.max(0.5, Math.round((base.wind + windVariation) * 10) / 10);

      const recordedAt = new Date(Date.now() - offset * 60 * 1000);

      const [weather] = await db.insert(weatherDataTable).values({
        cityId: city.id,
        temperature: temp,
        feelsLike: Math.round((temp + 2) * 10) / 10,
        humidity,
        windSpeed: wind,
        pressure: 1000 + Math.floor(Math.random() * 15),
        cloudCover: Math.floor(Math.random() * 50),
        rainfall: 0,
        weatherMain: temp > 35 ? "Haze" : "Clear",
        weatherDescription: temp > 35 ? "haze" : "clear sky",
      }).returning();

      if (!weather) continue;

      const heat = computeHeatScore(city, temp, humidity, wind);

      await db.insert(heatPredictionsTable).values({
        cityId: city.id,
        heatRiskScore: heat.score,
        heatZone: heat.zone,
        temperature: temp,
        humidity,
        vehicleDensity: heat.vehicleDensity,
        populationDensity: city.populationDensity,
        greenCoverRatio: heat.greenCoverRatio,
        builtUpRatio: heat.builtUpRatio,
        coolingIndex: heat.coolingIndex,
        trafficHeatFactor: heat.trafficHeatFactor,
      });
    }

    const latestHeat = computeHeatScore(city, base.temp, base.humidity, base.wind);
    const recs: Array<{
      cityId: number;
      category: string;
      title: string;
      description: string;
      priority: string;
      impact: string;
      icon: string;
    }> = [];

    if (latestHeat.greenCoverRatio < 0.15) {
      recs.push({
        cityId: city.id,
        category: "Greenery",
        title: "Urban Tree Plantation Drive",
        description: `${city.name}'s green cover ratio is critically low at ${(latestHeat.greenCoverRatio * 100).toFixed(1)}%. Launch a city-wide tree plantation program targeting 10,000+ trees in residential and commercial zones.`,
        priority: latestHeat.score > 70 ? "critical" : "high",
        impact: "Can reduce surface temperature by 3-5°C in planted zones",
        icon: "TreePine",
      });
    }

    if (latestHeat.vehicleDensity > 800) {
      recs.push({
        cityId: city.id,
        category: "Transportation",
        title: "Odd-Even Vehicle Regulation",
        description: `Vehicle density in ${city.name} is ${latestHeat.vehicleDensity.toFixed(0)} vehicles/km². Implement odd-even traffic regulations and promote CNG/electric vehicle adoption.`,
        priority: latestHeat.vehicleDensity > 2500 ? "critical" : "high",
        impact: "Reduce vehicular heat emissions by up to 25% in peak hours",
        icon: "Car",
      });
    }

    if (city.petrolVehicles + city.dieselVehicles > city.totalVehicles * 0.7) {
      recs.push({
        cityId: city.id,
        category: "Transportation",
        title: "Electric Vehicle Transition Incentive",
        description: `${city.name} has ${(((city.petrolVehicles + city.dieselVehicles) / city.totalVehicles) * 100).toFixed(0)}% fossil fuel vehicles. Subsidize EV purchases and expand CNG infrastructure.`,
        priority: "medium",
        impact: "Transitioning 30% of vehicles to EV/CNG can cut heat emissions by 20%",
        icon: "Zap",
      });
    }

    if (latestHeat.builtUpRatio > 0.55) {
      recs.push({
        cityId: city.id,
        category: "Urban Infrastructure",
        title: "Cool Roofs & Reflective Pavements",
        description: `${city.name}'s built-up ratio is ${(latestHeat.builtUpRatio * 100).toFixed(0)}%. Mandate cool roof coatings (reflectivity > 0.65) for new constructions and apply reflective materials on key roads.`,
        priority: latestHeat.builtUpRatio > 0.7 ? "high" : "medium",
        impact: "Cool roofs reduce indoor temperature by 2-4°C and urban air temp by 1-2°C",
        icon: "Building2",
      });
    }

    if (latestHeat.coolingIndex < 0.08) {
      recs.push({
        cityId: city.id,
        category: "Urban Planning",
        title: "Green Urban Corridors",
        description: `Low cooling index (${latestHeat.coolingIndex.toFixed(3)}) suggests poor airflow and minimal vegetation. Design green corridors along major roads.`,
        priority: "high",
        impact: "Green corridors improve urban cooling by 1.5-3°C in surrounding areas",
        icon: "Wind",
      });
    }

    recs.push({
      cityId: city.id,
      category: "Public Awareness",
      title: "Heat Action Plan & Early Warning System",
      description: `Establish a city-level heat action plan with early warning SMS alerts, cooling centers, and public health advisories during peak summer months.`,
      priority: latestHeat.score > 60 ? "high" : "medium",
      impact: "Early warning systems reduce heat-related mortality by up to 40%",
      icon: "Bell",
    });

    if (city.industrialArea / city.totalArea > 0.12) {
      recs.push({
        cityId: city.id,
        category: "Industrial",
        title: "Industrial Heat Emission Controls",
        description: `Industrial zones occupy ${((city.industrialArea / city.totalArea) * 100).toFixed(1)}% of ${city.name}. Enforce heat emission standards and require green buffer zones.`,
        priority: "medium",
        impact: "Reduce localized industrial heat contribution by 15-30%",
        icon: "Factory",
      });
    }

    if (recs.length > 0) {
      await db.insert(recommendationsTable).values(recs);
    }

    console.log(`    ✅ ${city.name}: heat score=${latestHeat.score}, zone=${latestHeat.zone}, recs=${recs.length}`);
  }

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
