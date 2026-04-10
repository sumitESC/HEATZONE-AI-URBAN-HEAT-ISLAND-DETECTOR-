<p align="center">
  <img src="artifacts/heatzone-ai/public/images/logo-mark.png" alt="HeatZone AI Logo" width="80" />
</p>

<h1 align="center">HeatZone AI — Urban Heat Island Intelligence Platform</h1>

<p align="center">
  <b>A Real-Time Geospatial Analytics Platform for Monitoring, Predicting, and Mitigating Urban Heat Islands Across Uttar Pradesh, India</b>
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite_7-646CFF?logo=vite&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white" />
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white" />
  <img alt="Drizzle ORM" src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?logo=drizzle&logoColor=black" />
  <img alt="OpenWeather" src="https://img.shields.io/badge/OpenWeather_API-EB6E4B?logo=openweathermap&logoColor=white" />
</p>

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Problem Statement](#3-problem-statement)
4. [Literature & Background](#4-literature--background)
5. [System Architecture](#5-system-architecture)
6. [Data Model & Schema Design](#6-data-model--schema-design)
7. [Heat Risk Score — Algorithm & Methodology](#7-heat-risk-score--algorithm--methodology)
8. [AI-Driven Recommendation Engine](#8-ai-driven-recommendation-engine)
9. [Real-Time Weather Data Pipeline](#9-real-time-weather-data-pipeline)
10. [Frontend Modules & Visualization](#10-frontend-modules--visualization)
11. [Dataset — 24 Cities of Uttar Pradesh](#11-dataset--24-cities-of-uttar-pradesh)
12. [Technology Stack](#12-technology-stack)
13. [Installation & Setup](#13-installation--setup)
14. [Usage Guide](#14-usage-guide)
15. [API Reference](#15-api-reference)
16. [Future Scope](#16-future-scope)
17. [References](#17-references)
18. [License](#18-license)

---

## 1. Abstract

Urban Heat Islands (UHIs) represent one of the most pressing environmental challenges facing rapidly urbanizing regions. **HeatZone AI** is a full-stack, real-time geospatial intelligence platform designed to monitor, predict, and mitigate urban heat island effects across **24 major cities in Uttar Pradesh, India** — the country's most populous state.

The platform integrates **live meteorological data** from the OpenWeatherMap API with a rich dataset of urban infrastructure parameters (vehicle density, green cover ratio, built-up area, population density, industrial footprint) to compute a composite **Heat Risk Score (0–100)** using a weighted multi-factor algorithm. Cities are classified into four heat zones — **Cool (<20)**, **Moderate (20–30)**, **High (30–50)**, and **Extreme (>50)** — enabling decision-makers to prioritize interventions.

The system features an interactive geospatial map (Leaflet), comparative analytics (Recharts), per-city deep-dive dashboards with radar and time-series charts, and an **AI Heat Reduction Advisor** that generates context-aware, city-specific recommendations for cooling strategies.

---

## 2. Introduction


India's urban landscape is expanding at an unprecedented rate. According to the United Nations, India is projected to add 416 million urban dwellers between 2018 and 2050, making it the largest contributor to the global urban population increase. Uttar Pradesh, with a population exceeding 240 million, contains some of the most thermally stressed cities in the Indo-Gangetic plain.

**HeatZone AI** was developed to address this challenge by creating a centralized intelligence platform that:

- **Monitors** real-time weather conditions for 24 UP cities simultaneously
- **Predicts** heat risk using a composite, multi-variate scoring algorithm
- **Visualizes** heat patterns through interactive maps and comparative charts
- **Advises** urban planners with AI-generated, data-driven recommendations for heat mitigation

The platform serves as both a **decision-support system** for government agencies and urban planners, and a **research tool** for studying the interplay between urbanization parameters and thermal comfort in North Indian cities.

---

## 3. Problem Statement

The Urban Heat Island (UHI) effect causes urban areas to experience significantly higher temperatures than surrounding rural areas due to:

1. **Replacement of natural vegetation** with heat-absorbing materials (concrete, asphalt)
2. **Anthropogenic heat emissions** from vehicles, industries, and air conditioning
3. **Reduced evapotranspiration** due to loss of green cover and water bodies
4. **Urban canyon geometry** that traps heat and reduces wind flow
5. **High population density** contributing to concentrated heat generation

In Uttar Pradesh specifically:
- Cities like **Ghaziabad** (population density: 8,652/km²) and **Kanpur** (population density: 2,956/km²) face extreme heat stress
- Vehicle counts exceed **2.9 million** in Ghaziabad alone
- Green cover ratios in some cities fall below **10%** (e.g., Moradabad: 9.0%, Firozabad: 9.0%)
- Industrial areas in cities like Kanpur and Noida occupy **18–19%** of total land area

**There exists no unified, real-time platform** that aggregates meteorological, infrastructural, and demographic data to produce actionable heat intelligence for UP cities. HeatZone AI fills this gap.

---

## 4. Literature & Background

### 4.1 Urban Heat Island Effect

The UHI phenomenon was first documented by Luke Howard in 1818 for London. Modern research (Oke, 1982; Arnfield, 2003) has established that UHI intensity is governed by:

| Factor | Mechanism | Contribution |
|--------|-----------|-------------|
| **Surface albedo** | Dark surfaces absorb solar radiation | High |
| **Vegetation loss** | Reduced evapotranspiration cooling | High |
| **Anthropogenic heat** | Vehicles, industry, HVAC systems | Moderate–High |
| **Urban geometry** | Canyon effect reduces wind and traps radiation | Moderate |
| **Population density** | Metabolic heat and activity-based emissions | Moderate |
| **Water body deficit** | Loss of natural cooling sinks | Low–Moderate |

### 4.2 Relevant Indices

- **NDVI (Normalized Difference Vegetation Index)**: Measures vegetation health; values below 0.2 indicate sparse vegetation. Our dataset includes NDVI values for all 24 cities (range: 0.14–0.35).
- **Heat Index**: Combines temperature and humidity to determine perceived temperature.
- **Cooling Index**: Introduced in this platform as `greenCoverRatio × max(windSpeed, 0.5)` to quantify passive cooling potential.

### 4.3 Existing Systems

| System | Scope | Limitation |
|--------|-------|-----------|
| NASA ARSET | Global, satellite-based | Low temporal resolution, no city-level granularity |
| CPCB AQI Monitor | India-wide | Focuses on air quality, not heat |
| India-WRIS | Water resources | No heat integration |

HeatZone AI differentiates itself by combining **real-time weather APIs** with **static urban infrastructure data** in a specialized composite scoring algorithm.

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MONOREPO (pnpm workspace)                    │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐│
│  │  lib/db       │   │  lib/api-zod  │   │  lib/api-client-react   ││
│  │  (Drizzle ORM)│   │  (Zod Schema) │   │  (React Query Hooks)    ││
│  │  SQLite DB    │   │  Validation   │   │  Auto-generated API     ││
│  └──────┬───────┘   └──────┬───────┘   └──────────┬──────────────┘│
│         │                  │                       │                │
│  ┌──────┴──────────────────┴───────────────────────┴──────────────┐│
│  │                   API SERVER (Express.js)                       ││
│  │  ┌─────────────┐  ┌─────────────────┐  ┌───────────────────┐  ││
│  │  │ Weather      │  │ Heat Engine     │  │ Recommendation    │  ││
│  │  │ Service      │  │ (Scoring Algo)  │  │ Generator         │  ││
│  │  │ (OpenWeather)│  │                 │  │                   │  ││
│  │  └──────┬──────┘  └────────┬────────┘  └────────┬──────────┘  ││
│  │         │                  │                     │              ││
│  │         └──────────────────┴─────────────────────┘              ││
│  │                    REST API Endpoints                           ││
│  └────────────────────────────┬───────────────────────────────────┘│
│                               │                                    │
│  ┌────────────────────────────┴───────────────────────────────────┐│
│  │                  FRONTEND (React + Vite)                        ││
│  │  ┌───────────┐ ┌─────────┐ ┌───────────┐ ┌──────┐ ┌────────┐ ││
│  │  │ Dashboard  │ │ HeatMap │ │ Analytics │ │ City │ │Advisor │ ││
│  │  │           │ │(Leaflet)│ │(Recharts) │ │Detail│ │  (AI)  │ ││
│  │  └───────────┘ └─────────┘ └───────────┘ └──────┘ └────────┘ ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌───────────────┐                                                  │
│  │  scripts/      │  ← Seed data generator (24 cities)              │
│  └───────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────┘

                    External Data Source
          ┌──────────────────────────────────┐
          │   OpenWeatherMap API v2.5         │
          │   (Real-time weather for each    │
          │    city via HTTP GET)             │
          └──────────────────────────────────┘
```

### 5.1 Monorepo Structure

The project uses a **pnpm workspace** monorepo with the following packages:

| Package | Path | Purpose |
|---------|------|---------|
| `@workspace/db` | `lib/db/` | Database schema (Drizzle ORM) + SQLite connection |
| `@workspace/api-zod` | `lib/api-zod/` | Auto-generated Zod validation schemas for API contracts |
| `@workspace/api-client-react` | `lib/api-client-react/` | Auto-generated React Query hooks for API consumption |
| `@workspace/api-server` | `artifacts/api-server/` | Express.js REST API server |
| `@workspace/heatzone-ai` | `artifacts/heatzone-ai/` | React frontend application |
| `@workspace/scripts` | `scripts/` | Database seeding and utility scripts |

---

## 6. Data Model & Schema Design

The system uses **SQLite** with **Drizzle ORM** for type-safe database operations. The schema consists of four relational tables:

### 6.1 Entity-Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐
│     cities       │       │   weather_data    │
│─────────────────│       │──────────────────│
│ id (PK)         │──┐    │ id (PK)          │
│ name (UNIQUE)   │  │    │ city_id (FK)     │←─┐
│ latitude        │  │    │ temperature      │  │
│ longitude       │  │    │ feels_like       │  │
│ population      │  │    │ humidity         │  │
│ population_dens │  │    │ wind_speed       │  │
│ total_area      │  │    │ pressure         │  │
│ built_up_area   │  │    │ cloud_cover      │  │
│ industrial_area │  │    │ rainfall         │  │
│ residential_area│  │    │ weather_main     │  │
│ road_area       │  │    │ weather_desc     │  │
│ open_land       │  │    │ recorded_at      │  │
│ water_bodies    │  │    └──────────────────┘  │
│ forest_cover    │  │                          │
│ urban_green     │  ├────────────────────────────┤
│ tree_density    │  │                          │
│ ndvi            │  │    ┌──────────────────┐  │
│ total_vehicles  │  │    │heat_predictions  │  │
│ petrol_vehicles │  │    │──────────────────│  │
│ diesel_vehicles │  │    │ id (PK)          │  │
│ electric_vehic  │  ├───→│ city_id (FK)     │  │
│ cng_vehicles    │  │    │ heat_risk_score  │  │
│ created_at      │  │    │ heat_zone        │  │
│ updated_at      │  │    │ temperature      │  │
└─────────────────┘  │    │ humidity         │  │
                     │    │ vehicle_density  │  │
                     │    │ population_dens  │  │
                     │    │ green_cover_ratio│  │
                     │    │ built_up_ratio   │  │
                     │    │ cooling_index    │  │
                     │    │ traffic_heat_fac │  │
                     │    │ predicted_at     │  │
                     │    └──────────────────┘  │
                     │                          │
                     │    ┌──────────────────┐  │
                     │    │recommendations   │  │
                     │    │──────────────────│  │
                     └───→│ id (PK)          │  │
                          │ city_id (FK)     │  │
                          │ category         │  │
                          │ title            │  │
                          │ description      │  │
                          │ priority         │  │
                          │ impact           │  │
                          │ icon             │  │
                          │ created_at       │  │
                          └──────────────────┘  │
```

### 6.2 Cities Table — Urban Infrastructure Parameters

Each city record captures **21 parameters** spanning geography, demographics, land use, vegetation, and transportation:

| Parameter | Type | Description | Unit |
|-----------|------|-------------|------|
| `population` | Integer | Total urban population | count |
| `populationDensity` | Real | Population per square kilometer | persons/km² |
| `totalArea` | Real | Total administrative area | km² |
| `builtUpArea` | Real | Concrete/paved area | km² |
| `industrialArea` | Real | Industrial zone coverage | km² |
| `residentialArea` | Real | Residential zone coverage | km² |
| `roadArea` | Real | Road network coverage | km² |
| `openLand` | Real | Undeveloped/open land | km² |
| `waterBodiesArea` | Real | Lakes, rivers, ponds area | km² |
| `forestCover` | Real | Percentage of forest coverage | % |
| `urbanGreenSpace` | Real | Parks, gardens, green zones | % |
| `treeDensity` | Real | Trees per hectare | trees/ha |
| `ndvi` | Real | Normalized Difference Vegetation Index | 0.0–1.0 |
| `totalVehicles` | Integer | Total registered vehicles | count |
| `petrolVehicles` | Integer | Petrol-powered vehicles | count |
| `dieselVehicles` | Integer | Diesel-powered vehicles | count |
| `electricVehicles` | Integer | Electric vehicles | count |
| `cngVehicles` | Integer | CNG-powered vehicles | count |

---

## 7. Heat Risk Score — Algorithm & Methodology

### 7.1 Overview

The **Heat Risk Score** is a composite index ranging from **0 (no risk)** to **100 (extreme risk)**, computed from six weighted sub-scores and two corrective factors.

### 7.2 Input Variables

| Variable | Source | Symbol |
|----------|--------|--------|
| Temperature (°C) | OpenWeather API | T |
| Humidity (%) | OpenWeather API | H |
| Wind Speed (m/s) | OpenWeather API | W |
| Vehicle Density (vehicles/km²) | City database | V_d |
| Population Density (persons/km²) | City database | P_d |
| Green Cover Ratio | Derived: (forestCover + urbanGreenSpace) / 100 | G_r |
| Built-up Ratio | Derived: builtUpArea / totalArea | B_r |
| Cooling Index | Derived: G_r × max(W, 0.5) | C_i |
| Traffic Heat Factor | Derived: petrolVehicles + dieselVehicles | T_hf |

### 7.3 Normalization Function

All raw values are normalized to the range [0, 1] using min-max normalization:

```
normalize(value, min, max) = clamp((value - min) / (max - min), 0, 1)
```

### 7.4 Weighted Sub-Scores

| Sub-Score | Formula | Weight | Rationale |
|-----------|---------|--------|-----------|
| **Temperature Score** | normalize(T, 20, 48) × 30 | 30% | Primary thermal driver |
| **Humidity Score** | normalize(H, 20, 100) × 15 | 15% | Heat index amplifier |
| **Vehicle Score** | normalize(V_d, 50, 5000) × 20 | 20% | Anthropogenic heat source |
| **Population Score** | normalize(P_d, 500, 30000) × 10 | 10% | Metabolic heat load |
| **Built-up Score** | normalize(B_r, 0.2, 0.9) × 15 | 15% | Surface heat absorption |
| **Green Penalty** | (1 − normalize(G_r, 0, 0.5)) × 10 | 10% | Inverse: penalizes low greenery |

### 7.5 Corrective Factor

```
Cooling Bonus = normalize(C_i, 0, 0.5) × 5
```

The cooling bonus is **subtracted** from the total score, rewarding cities with good green cover and wind conditions.

### 7.6 Final Computation

```
Raw Score = TempScore + HumidityScore + VehicleScore + PopScore + BuiltUpScore + GreenPenalty
Final Score = clamp(Raw Score − Cooling Bonus, 0, 100)
```

### 7.7 Heat Zone Classification

| Zone | Score Range | Color Code | Interpretation |
|------|------------|------------|----------------|
| **Cool** | < 20 | 🟢 Green | Minimal heat risk; well-managed urban area |
| **Moderate** | 20 – 30 | 🟡 Yellow | Moderate risk; some urban heat effects present |
| **High** | 30 – 50 | 🟠 Orange | Significant risk; active mitigation recommended |
| **Extreme** | > 50 | 🔴 Red | Critical risk; immediate intervention required |

---

## 8. AI-Driven Recommendation Engine

### 8.1 Rule-Based Recommendation System

The platform generates **city-specific, context-aware recommendations** based on threshold analysis of urban indicators. Each recommendation includes a category, title, detailed description, priority level, and estimated impact.

### 8.2 Recommendation Triggers

| Trigger Condition | Category | Generated Recommendation | Priority Logic |
|-------------------|----------|-------------------------|----------------|
| Green Cover Ratio < 15% | Greenery | Urban Tree Plantation Drive | Critical if score > 70, else High |
| Vehicle Density > 1000/km² | Transportation | Odd-Even Vehicle Regulation | Critical if > 3000, else High |
| Fossil fuel vehicles > 70% | Transportation | EV Transition Incentive | Medium |
| Built-up Ratio > 60% | Infrastructure | Cool Roofs & Reflective Pavements | High if > 75%, else Medium |
| Cooling Index < 0.05 | Urban Planning | Green Urban Corridors | High |
| Industrial Area > 15% | Industrial | Heat Emission Controls | Medium |
| Population Density > 15,000 | Urban Planning | Decentralized Development | High if > 25,000 |
| Urban Green Space < 10% | Greenery | Urban Parks & Water Bodies | Medium |
| *(Always)* | Public Awareness | Heat Action Plan & Early Warning | High if score > 60 |

### 8.3 AI Advisor Module

The Advisor page provides a deeper analysis layer with:

- **Smart City Heat Score** (0–100, higher = better): Inverse of risk, computed from 5 weighted factors
- **Heat Contribution Analysis**: Percentage breakdown showing which factor contributes most to heat
- **AI Reduction Suggestions**: Conditional recommendations with **estimated cooling impact** in °C

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Vehicle Emissions | 35% | min(vehicleDensity / 5000, 1) × 35 |
| Low Green Cover | 30% | min(1 − greenRatio, 1) × 30 |
| Dense Construction | 25% | min(builtRatio, 1) × 25 |
| Population Density | 20% | min(popDensity / 15000, 1) × 20 |
| Water Deficit | 15% | min(1 − waterIndex, 1) × 15 |

---

## 9. Real-Time Weather Data Pipeline

### 9.1 Data Source

The platform integrates with the **OpenWeatherMap Current Weather API v2.5**:

```
GET https://api.openweathermap.org/data/2.5/weather
    ?q={city_name},IN
    &appid={API_KEY}
    &units=metric
```

### 9.2 Data Flow

```
[User clicks "Sync Data"] 
       │
       ▼
[POST /api/weather/refresh]
       │
       ▼
[For each of 24 cities]:
  ├── Fetch weather from OpenWeather API
  ├── Store raw weather in weather_data table
  ├── Run Heat Risk Algorithm → heat_predictions table
  ├── Delete old recommendations for city
  └── Generate new recommendations → recommendations table
       │
       ▼
[Frontend auto-refreshes via React Query invalidation]
```

### 9.3 Fallback Mechanism

If the `OPENWEATHER_API_KEY` is not configured or the API request fails, the system falls back to a **simulation engine** that generates realistic weather data using city-specific base temperatures with random variations. This ensures the platform remains functional for development and demonstration purposes.

### 9.4 Fetched Parameters

| Parameter | API Field | Storage Column |
|-----------|-----------|----------------|
| Temperature | `main.temp` | `temperature` |
| Feels Like | `main.feels_like` | `feels_like` |
| Humidity | `main.humidity` | `humidity` |
| Wind Speed | `wind.speed` | `wind_speed` |
| Pressure | `main.pressure` | `pressure` |
| Cloud Cover | `clouds.all` | `cloud_cover` |
| Rainfall | `rain.1h` or `rain.3h` | `rainfall` |
| Condition | `weather[0].main` | `weather_main` |
| Description | `weather[0].description` | `weather_description` |

---

## 10. Frontend Modules & Visualization

### 10.1 Module Overview

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/` | Platform overview with KPI cards, bar chart of city heat risk, and live feed |
| **Heat Map** | `/map` | Interactive Leaflet map with circle markers sized by risk score |
| **Analytics** | `/analytics` | Comparative charts: Green Cover vs Heat Risk, Vehicle Density, Urban Density |
| **City Detail** | `/city/:id` | Deep-dive with weather data, infrastructure metrics, radar chart, time-series, and AI recommendations |
| **AI Advisor** | `/advisor` | Select a city for AI-driven heat contribution analysis and reduction suggestions |

### 10.2 Dashboard — Platform Overview

- **4 KPI Cards**: Monitored Cities, Avg Heat Risk, Extreme Zones Count, Avg Temperature
- **City Heat Risk Index**: Bar chart with color-coded bars by heat zone
- **Live Feed**: Scrollable card list of all cities sorted by risk score

### 10.3 Heat Map — Geospatial Analysis

- Built on **React Leaflet** with CartoDB Dark Matter tiles
- Each city displays as a **CircleMarker** with:
  - Radius proportional to heat risk score (score / 3)
  - Color matching zone classification (green/yellow/orange/red)
- Click popup shows risk score, temperature, green cover, and link to city detail
- Legend overlay showing zone thresholds

### 10.4 Analytics — Comparative Analysis

Three interactive Recharts visualizations:
1. **Impact of Green Cover on Heat Risk**: Dual-axis line chart
2. **Vehicle Density Analysis**: Bar chart (vehicles in thousands)
3. **Urban Density & Heat Risk Correlation**: Grouped bar chart (built-up area % vs heat risk)

### 10.5 City Detail — Urban Profile

- **Header**: City name, heat zone badge, coordinates, overall heat risk score
- **Weather Panel**: Temperature, feels-like, humidity, wind speed
- **Infrastructure Panel**: Green cover %, built-up area %, total vehicles, population density
- **Heat Risk Trend**: Area chart showing risk score over last 10 data points
- **Radar Chart**: 5-axis visualization (Vehicle Density, Built-up Area, Population, Temperature Severity, Low Green Cover)
- **AI Interventions**: Top 3 recommendations with priority badges

### 10.6 AI Advisor — Intelligent Recommendations

- City selector dropdown
- **Smart City Heat Score**: Inverse risk rating (100 = best)
- **Key Urban Indicators**: Vehicle density, green cover ratio, water availability index, population density, built-up ratio
- **Heat Contribution Analysis**: Animated horizontal bars showing % contribution of each factor
- **AI Reduction Suggestions**: Contextual actions with estimated cooling impact (e.g., "Planting 20,000 trees → −1.2°C")

---

## 11. Dataset — 24 Cities of Uttar Pradesh

The platform monitors the following **24 cities** with real urban infrastructure data:

| # | City | Population | Density (/km²) | Total Vehicles | Green Cover (%) | NDVI | Built-up (km²) |
|---|------|-----------|----------------|----------------|----------------|------|----------------|
| 1 | Lucknow | 3,457,959 | 1,815 | 2,850,000 | 20.7 | 0.28 | 851 |
| 2 | Kanpur | 2,920,496 | 2,956 | 2,650,000 | 12.6 | 0.19 | 718 |
| 3 | Ghaziabad | 2,375,820 | 8,652 | 2,980,000 | 9.4 | 0.14 | 780 |
| 4 | Agra | 1,760,285 | 2,320 | 1,680,000 | 15.6 | 0.22 | 590 |
| 5 | Noida | 642,381 | 4,260 | 1,920,000 | 21.7 | 0.35 | 870 |
| 6 | Prayagraj | 1,536,211 | 1,760 | 1,520,000 | 23.4 | 0.33 | 640 |
| 7 | Varanasi | 1,432,280 | 2,395 | 1,380,000 | 20.9 | 0.31 | 502 |
| 8 | Meerut | 1,305,429 | 3,200 | 850,000 | 12.7 | 0.18 | 250 |
| 9 | Bareilly | 904,797 | 2,100 | 550,000 | 12.6 | 0.20 | 140 |
| 10 | Moradabad | 887,871 | 2,600 | 490,000 | 9.0 | 0.15 | 200 |
| 11 | Aligarh | 874,408 | 2,400 | 520,000 | 11.7 | 0.17 | 180 |
| 12 | Saharanpur | 705,478 | 2,200 | 410,000 | 15.2 | 0.21 | 150 |
| 13 | Gorakhpur | 673,446 | 1,800 | 420,000 | 15.0 | 0.22 | 160 |
| 14 | Noida | 642,381 | 4,260 | 1,920,000 | 21.7 | 0.35 | 870 |
| 15 | Firozabad | 604,214 | 2,500 | 320,000 | 9.0 | 0.14 | 130 |
| 16 | Jhansi | 505,693 | 1,500 | 350,000 | 18.7 | 0.25 | 120 |
| 17 | Muzaffarnagar | 495,000 | 1,900 | 280,000 | 10.2 | 0.16 | 110 |
| 18 | Mathura | 456,706 | 1,900 | 310,000 | 12.7 | 0.19 | 130 |
| 19 | Ayodhya | 350,000 | 1,200 | 200,000 | 21.0 | 0.28 | 90 |
| 20 | Rampur | 325,248 | 1,600 | 180,000 | 12.0 | 0.18 | 85 |
| 21 | Etawah | 256,838 | 1,400 | 140,000 | 14.7 | 0.22 | 75 |
| 22 | Hardoi | 197,046 | 1,300 | 105,000 | 13.0 | 0.19 | 65 |
| 23 | Rae Bareli | 191,316 | 1,200 | 110,000 | 13.6 | 0.20 | 60 |
| 24 | Sitapur | 177,234 | 1,100 | 95,000 | 14.5 | 0.21 | 55 |

> **Note**: Green Cover (%) = forestCover + urbanGreenSpace

---

## 12. Technology Stack

### 12.1 Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.1.0 | UI component framework |
| Vite | 7.3.x | Build tool and dev server |
| TypeScript | 5.9.x | Type-safe development |
| Tailwind CSS | 4.1.x | Utility-first styling |
| React Leaflet | — | Interactive map rendering |
| Recharts | — | Data visualization (Bar, Line, Area, Radar) |
| Framer Motion | 12.35.x | Animations and transitions |
| Wouter | — | Lightweight client-side routing |
| TanStack React Query | 5.90.x | Server state management and caching |
| Lucide React | 0.545.x | Icon library |
| date-fns | — | Date formatting utilities |

### 12.2 Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Express.js | — | REST API server |
| TSX | 4.21.x | TypeScript execution (replaces ts-node) |
| Drizzle ORM | 0.45.x | Type-safe SQL query builder |
| Better-SQLite3 | 12.8.x | SQLite database driver |
| Drizzle-Zod | 0.8.x | Schema-to-Zod validation generation |
| Zod | 3.25.x | Runtime type validation |

### 12.3 External APIs

| API | Provider | Usage |
|-----|----------|-------|
| Current Weather Data v2.5 | OpenWeatherMap | Real-time temperature, humidity, wind, pressure |

---

## 13. Installation & Setup

### 13.1 Prerequisites

- **Node.js** ≥ 18.x
- **pnpm** ≥ 8.x (package manager)
- **OpenWeatherMap API Key** (free tier: [https://openweathermap.org/api](https://openweathermap.org/api))

### 13.2 Clone & Install

```bash
git clone https://github.com/your-username/Heat-Zone-Intel.git
cd Heat-Zone-Intel
pnpm install
```

### 13.3 Environment Configuration

Create a `.env` file in the project root:

```env
OPENWEATHER_API_KEY=your_openweather_api_key_here
DATABASE_URL=./sqlite.db
```

Create `artifacts/heatzone-ai/.env.local` for the frontend:

```env
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### 13.4 Database Setup

Push the schema to SQLite and seed the database with 24 UP cities:

```bash
# Create database tables
pnpm --filter @workspace/db run push

# Seed initial data (24 cities + weather + predictions + recommendations)
pnpm --filter @workspace/scripts run seedData
```

### 13.5 Start Development Server

```bash
pnpm run dev
```

This starts **both** the API server (port 5000) and the Vite frontend (port 5173) in parallel.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Server | http://localhost:5000 |

---

## 14. Usage Guide

### 14.1 Dashboard

Navigate to the root URL to view the **Platform Overview** with KPI cards and a bar chart comparing heat risk across all cities.

### 14.2 Sync Live Weather Data

Click the **"Sync Data"** button in the header to fetch the latest weather from the OpenWeather API for all 24 cities. This triggers:
1. Weather data fetch for each city
2. Heat risk recalculation
3. Recommendation regeneration
4. Automatic UI refresh

### 14.3 Explore the Heat Map

Navigate to **Heat Map** to see an interactive Leaflet map centered on Uttar Pradesh. Circle sizes and colors indicate heat risk severity. Click any marker for detailed popup data.

### 14.4 Comparative Analytics

Visit **Analytics** for side-by-side visualizations comparing green cover impact, vehicle density, and urban density across cities.

### 14.5 City Deep-Dive

Click any city (from sidebar, search, map, or dashboard) to access its **City Detail** page with weather data, infrastructure metrics, heat risk trend chart, radar analysis, and AI recommendations.

### 14.6 AI Advisor

Navigate to **AI Advisor**, select a city, and receive an AI-generated analysis including heat contribution breakdown, smart city score, and specific reduction suggestions with estimated cooling impact.

### 14.7 Search

Use the **header search bar** to find cities by name (dropdown navigation) or the **sidebar filter** to narrow the city list.

---

## 15. API Reference

### 15.1 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cities` | List all 24 monitored cities |
| `GET` | `/api/heatzone/all` | All cities with latest heat predictions |
| `GET` | `/api/datasets/overview` | Dashboard overview (KPIs, aggregates) |
| `GET` | `/api/datasets/city/:id` | Full city profile (city + weather + prediction + recommendations + history) |
| `GET` | `/api/weather/current/:id` | Latest weather record for a city |
| `GET` | `/api/weather/history/:id` | Weather history (default: 20 records) |
| `POST` | `/api/weather/refresh` | Fetch live weather, recalculate all predictions |

### 15.2 Example Response — Dashboard Overview

```json
{
  "totalCities": 24,
  "avgHeatRisk": 37.2,
  "avgTemperature": 34.8,
  "extremeHeatCities": 1,
  "hottest": { "cityId": 6, "cityName": "Ghaziabad", "heatRiskScore": 54.8 },
  "coolest": { "cityId": 14, "cityName": "Ayodhya", "heatRiskScore": 31.9 }
}
```

---

## 16. Future Scope

1. **Satellite Imagery Integration**: Incorporate Landsat/Sentinel thermal bands for surface temperature mapping
2. **Machine Learning Models**: Replace rule-based scoring with trained ML models (Random Forest, XGBoost) on historical UHI data
3. **Temporal Forecasting**: Predict heat risk 24–72 hours ahead using weather forecast APIs
4. **Mobile Application**: PWA or React Native app for field officers
5. **Multi-State Expansion**: Extend coverage to Rajasthan, Bihar, Madhya Pradesh
6. **Public Health Correlation**: Integrate hospital admission data for heat-illness tracking
7. **NDVI Time-Series**: Track vegetation health changes over seasons using satellite data
8. **Carbon Emission Modeling**: Link vehicle density and fuel type data to CO₂ emission estimates
9. **Crowdsourced Data**: Allow citizens to report localized heat stress via mobile interface
10. **Policy Dashboard**: Export reports in PDF/CSV format for government stakeholders

---

## 17. References

1. Oke, T.R. (1982). "The energetic basis of the urban heat island." *Quarterly Journal of the Royal Meteorological Society*, 108(455), 1-24.
2. Arnfield, A.J. (2003). "Two decades of urban climate research." *International Journal of Climatology*, 23(1), 1-26.
3. Voogt, J.A. & Oke, T.R. (2003). "Thermal remote sensing of urban climates." *Remote Sensing of Environment*, 86(3), 370-384.
4. OpenWeatherMap API Documentation — [https://openweathermap.org/current](https://openweathermap.org/current)
5. Census of India (2011) — Urban population data for Uttar Pradesh
6. Ministry of Road Transport & Highways — Vehicle registration data
7. Forest Survey of India (2021) — State-level forest cover assessment
8. NDVI methodology — Tucker, C.J. (1979). "Red and photographic infrared linear combinations for monitoring vegetation." *Remote Sensing of Environment*, 8(2), 127-150.

---

## 18. License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <b>Built with ❤️ for a cooler, smarter Uttar Pradesh</b><br/>
  <sub>HeatZone AI — Urban Heat Island Intelligence Platform v1.0.0</sub>
</p>
