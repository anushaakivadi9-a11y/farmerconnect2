import axios from "axios";
import { redisClient } from "../config/redis.js"; // your existing redis setup

const buildInsight = (condition, tempC) => {
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("storm") || c.includes("thunder")) {
    return "Heavy weather in the region — deliveries may run a day behind.";
  }
  if (c.includes("clear") || c.includes("sun")) {
    return "Clear skies — fresh harvest is moving on schedule.";
  }
  if (tempC >= 35) {
    return "High heat in growing regions — expect faster ripening on perishables.";
  }
  return "Normal conditions — no delivery impact expected.";
};

export const getWeather = async (req, res) => {
  const city = req.query.city || "Chennai";
  const cacheKey = `weather:${city.toLowerCase()}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const { data } = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
    params: { q: city, appid: process.env.OPENWEATHER_KEY, units: "metric" },
  });

  const payload = {
    city: data.name,
    tempC: Math.round(data.main.temp),
    condition: data.weather[0].main,
    icon: data.weather[0].icon,
    insight: buildInsight(data.weather[0].main, data.main.temp),
  };

  await redisClient.set(cacheKey, JSON.stringify(payload), { EX: 1800 }); // 30 min TTL
  res.json(payload);
};