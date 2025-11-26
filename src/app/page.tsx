"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";

/* ===========================
   TYPES
=========================== */

interface CityResult {
  name: string;
  country?: string;
  lat: number;
  lon: number;
}

interface WeatherData {
  name: string;
  weather: { main: string; description: string; icon: string }[];
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
}

interface ForecastDay {
  date: string;
  temp: number;
  icon: string;
}

export default function Home() {
  const API = "3a40f0a8a0101b44f04f85b90ae56516";

  const [query, setQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<CityResult[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // فيديوهات الطقس المتاحة
  const weatherVideos: Record<string, string> = {
    Clear: "/video/Clear.mp4",
    Clouds: "/video/Clouds.mp4",
    Rain: "/video/Rain.mp4",
    Thunderstorm: "/video/Thunderstorm.mp4",
    Snow: "/video/Snow.mp4",
    Tornado: "/video/Tornado.mp4",
  };

  const [bgVideo, setBgVideo] = useState<string>(weatherVideos.Clear);

  /* ===========================
      FETCH WEATHER
  ============================ */
  async function getWeather(city: string, country: string) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${API}&units=metric`
      );
      const data: WeatherData = await res.json();
      setWeather(data);

      // تغيير الفيديو حسب الطقس
      const mainWeather = data.weather[0].main;
      if (weatherVideos[mainWeather]) {
        setBgVideo(weatherVideos[mainWeather]);
      } else {
        // اختيار أقرب حالة إذا لم تتطابق
        if (["Mist", "Haze", "Fog"].includes(mainWeather)) setBgVideo(weatherVideos.Clouds);
        else if (["Drizzle"].includes(mainWeather)) setBgVideo(weatherVideos.Rain);
        else setBgVideo(weatherVideos.Clear);
      }

      getForecast(city, country);
    } catch (err) {
      console.log("Weather Error:", err);
    }
  }

  /* ===========================
      FETCH FORECAST (30 DAYS)
  ============================ */
  async function getForecast(city: string, country: string) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city},${country}&appid=${API}&units=metric`
      );
      const data = await res.json();

      const filtered = data.list.filter((item: any) =>
        item.dt_txt.includes("12:00:00")
      );

      const next30Days: ForecastDay[] = filtered
        .slice(0, 30)
        .map((item: any) => ({
          date: item.dt_txt.split(" ")[0],
          temp: Math.round(item.main.temp),
          icon: item.weather[0].icon,
        }));

      setForecast(next30Days);
    } catch (err) {
      console.log("Forecast Error:", err);
    }
  }

  /* ===========================
      AUTO COMPLETE CITY SEARCH
  ============================ */
  async function searchCity(text: string) {
    setQuery(text);
    if (text.length < 1) {
      setSuggestions([]);
      return;
    }

    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${text}&limit=5&appid=${API}`
    );
    const data: CityResult[] = await res.json();
    const egyptCities = data.filter((c) => c.country === "EG");
    setSuggestions(egyptCities);
  }

  // Default Cairo
  useEffect(() => {
    getWeather("Cairo", "EG");
  }, []);

  return (
    <>
      {/* BACKGROUND VIDEO */}
      <video
        src={bgVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-0"></div>

      <div className="relative z-10 h-screen flex flex-col text-white">
        {/* SEARCH */}
        <div className="w-full flex flex-col items-center mt-6 relative">
          <div className="relative w-72">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => searchCity(e.target.value)}
              placeholder="Search Egyptian city..."
              className="w-full p-2 pl-10 rounded-xl bg-black/30 border border-gray-500 text-white outline-none"
            />
          </div>

          {suggestions.length > 0 && (
            <div className="w-72 bg-black/70 backdrop-blur-md mt-2 rounded-xl overflow-hidden border border-white/20 max-h-60 overflow-y-auto">
              {suggestions.map((city, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setQuery(city.name);
                    setSuggestions([]);
                    getWeather(city.name, "EG");
                  }}
                  className="px-4 py-2 hover:bg-white/20 cursor-pointer"
                >
                  {city.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MAIN CARD */}
        <div className="flex flex-1">
          <div className="w-1/3"></div>

          <div className="w-1/3 flex justify-center items-center">
            {weather && (
              <div className="w-64 h-[480px] rounded-3xl bg-gray-800/80 backdrop-blur-xl p-4 flex flex-col gap-4 shadow-2xl border border-white/10">
                {/* CITY & DATE */}
                <div className="flex justify-between items-center bg-white/5 rounded-xl px-3 h-14">
                  <div className="text-lg font-semibold">{weather.name}</div>
                  <div className="text-sm opacity-90">
                    {new Date().toDateString().slice(0, 10)}
                  </div>
                </div>

                {/* ICON + TEMP */}
                <div className="flex-1 flex items-center px-3 bg-white/5 rounded-xl">
                  <div className="w-1/2 flex justify-center">
                    <Image
                      src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                      width={80}
                      height={80}
                      alt="Weather Icon"
                    />
                  </div>
                  <div className="w-1/2">
                    <div className="text-4xl font-bold">
                      {Math.round(weather.main.temp)}
                      <sup>°</sup>C
                    </div>
                    <div className="text-sm opacity-90 mt-1">
                      {weather.weather[0].main}
                    </div>
                  </div>
                </div>

                {/* WIND + HUMIDITY */}
                <div className="bg-white/10 rounded-xl h-16 flex px-3 items-center">
                  <div className="w-1/2 flex items-center gap-2">
                    <Image
                      src="/images/Humidity.png"
                      width={32}
                      height={32}
                      alt="humidity"
                    />
                    <div>
                      <div className="text-xs opacity-70">Humidity</div>
                      <div className="text-sm font-semibold">
                        {weather.main.humidity}%
                      </div>
                    </div>
                  </div>
                  <div className="w-1/2 flex items-center gap-2">
                    <Image
                      src="/images/wind.png"
                      width={32}
                      height={32}
                      alt="wind"
                    />
                    <div>
                      <div className="text-xs opacity-70">Wind</div>
                      <div className="text-sm font-semibold">
                        {weather.wind.speed} m/s
                      </div>
                    </div>
                  </div>
                </div>

                {/* FORECAST SCROLL */}
                <div className="mt-2">
                  <div className="flex gap-3 overflow-x-auto px-2 scroll-smooth custom-scroll">
                    {forecast.map((day, i) => {
                      const dateObj = new Date(day.date);
                      const formattedDate = dateObj.toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        }
                      );
                      return (
                        <div
                          key={i}
                          className="flex-none w-24 h-32 bg-gray-700/80 rounded-xl p-2 flex flex-col items-center justify-between mx-1 hover:bg-gray-600/80 transition"
                        >
                          <div className="text-xs opacity-80">
                            {formattedDate}
                          </div>
                          <Image
                            src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                            width={40}
                            height={40}
                            alt="weather"
                          />
                          <div className="text-lg font-semibold">
                            {day.temp}°
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-1/3"></div>
        </div>
      </div>
    </>
  );
}
