import { useEffect, useState } from 'react';

interface WeatherState {
  temp: number;
}

interface WeatherResponse {
  current?: {
    temperature_2m?: number;
  };
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface IpLocationResponse {
  latitude?: number | string;
  longitude?: number | string;
}

const TIMEZONE_COORDS: Record<string, Coordinates> = {
  'Asia/Kolkata': { latitude: 12.9716, longitude: 77.5946 },
  'America/New_York': { latitude: 40.7128, longitude: -74.006 },
  'America/Chicago': { latitude: 41.8781, longitude: -87.6298 },
  'America/Denver': { latitude: 39.7392, longitude: -104.9903 },
  'America/Los_Angeles': { latitude: 34.0522, longitude: -118.2437 },
  'Europe/London': { latitude: 51.5072, longitude: -0.1276 },
};

const timezoneFallback = (): Coordinates => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return TIMEZONE_COORDS[timezone] ?? { latitude: 12.9716, longitude: 77.5946 };
};

const browserCoordinates = () =>
  new Promise<Coordinates>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation unavailable'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      reject,
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 3500 },
    );
  });

const ipCoordinates = async (signal: AbortSignal): Promise<Coordinates> => {
  const response = await fetch('https://ipapi.co/json/', { signal });
  if (!response.ok) throw new Error('IP location failed');

  const data = (await response.json()) as IpLocationResponse;
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('IP location missing');
  }

  return { latitude, longitude };
};

const resolveCoordinates = async (signal: AbortSignal): Promise<Coordinates> => {
  try {
    return await browserCoordinates();
  } catch {
    try {
      return await ipCoordinates(signal);
    } catch {
      return timezoneFallback();
    }
  }
};

const fetchWeather = async ({ latitude, longitude }: Coordinates, signal: AbortSignal): Promise<WeatherState> => {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: 'temperature_2m',
    timezone: 'auto',
    forecast_days: '1',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!response.ok) throw new Error('Weather request failed');

  const data = (await response.json()) as WeatherResponse;
  const current = data.current;
  if (current?.temperature_2m == null) {
    throw new Error('Weather data missing');
  }

  return {
    temp: current.temperature_2m,
  };
}

export function WeatherPill() {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const load = async () => {
      try {
        const coords = await resolveCoordinates(controller.signal);
        const nextWeather = await fetchWeather(coords, controller.signal);
        if (!mounted) return;
        setWeather(nextWeather);
        setStatus('ready');
      } catch {
        if (mounted && !controller.signal.aborted) setStatus('unavailable');
      }
    };

    void load();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="weather-pill" aria-label={status === 'ready' ? 'Current weather' : 'Weather unavailable'}>
      <img className="weather-pill__icon" src="/weather.png" alt="" draggable={false} />
      {status === 'ready' && weather ? (
        <div className="weather-pill__stats">
          <span>{Math.round(weather.temp)}°</span>
        </div>
      ) : (
        <div className="weather-pill__stats weather-pill__stats--muted">
          <span>{status === 'loading' ? '...' : '--°'}</span>
        </div>
      )}
    </div>
  );
}
