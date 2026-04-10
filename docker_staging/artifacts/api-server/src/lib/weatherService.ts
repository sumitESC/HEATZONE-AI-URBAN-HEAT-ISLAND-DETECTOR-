const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

export interface OpenWeatherResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind: { speed: number };
  clouds: { all: number };
  weather: Array<{ main: string; description: string }>;
  rain?: { "1h"?: number; "3h"?: number };
}

export async function fetchCityWeather(cityName: string): Promise<{
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  cloudCover: number;
  rainfall: number;
  weatherMain: string;
  weatherDescription: string;
} | null> {
  if (!OPENWEATHER_API_KEY) {
    console.warn("OPENWEATHER_API_KEY not set, using simulated data");
    return simulateWeather(cityName);
  }

  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(cityName)},IN&appid=${OPENWEATHER_API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Weather API error for ${cityName}: ${response.status}`);
      return simulateWeather(cityName);
    }

    const data = (await response.json()) as OpenWeatherResponse;

    return {
      temperature: Math.round(data.main.temp * 10) / 10,
      feelsLike: Math.round(data.main.feels_like * 10) / 10,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 10) / 10,
      pressure: data.main.pressure,
      cloudCover: data.clouds.all,
      rainfall: data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0,
      weatherMain: data.weather[0]?.main ?? "Clear",
      weatherDescription: data.weather[0]?.description ?? "clear sky",
    };
  } catch (err) {
    console.error(`Failed to fetch weather for ${cityName}:`, err);
    return simulateWeather(cityName);
  }
}

function simulateWeather(cityName: string): {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  cloudCover: number;
  rainfall: number;
  weatherMain: string;
  weatherDescription: string;
} {
  const baseTemps: Record<string, number> = {
    Lucknow: 32,
    Kanpur: 34,
    Varanasi: 33,
    Prayagraj: 35,
    Agra: 36,
    Ghaziabad: 35,
    Noida: 34,
  };
  const base = baseTemps[cityName] ?? 33;
  const temp = base + (Math.random() * 4 - 2);
  const humidity = 55 + Math.floor(Math.random() * 30);
  const wind = 2 + Math.random() * 8;

  return {
    temperature: Math.round(temp * 10) / 10,
    feelsLike: Math.round((temp + 2) * 10) / 10,
    humidity,
    windSpeed: Math.round(wind * 10) / 10,
    pressure: 1000 + Math.floor(Math.random() * 20),
    cloudCover: Math.floor(Math.random() * 60),
    rainfall: 0,
    weatherMain: "Clear",
    weatherDescription: "clear sky",
  };
}
