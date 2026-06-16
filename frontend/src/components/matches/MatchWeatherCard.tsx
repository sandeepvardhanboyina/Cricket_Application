'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { MatchWeather } from '@/types';

const getWeatherFallbackIcon = (condition?: string) => {
  const normalized = (condition || '').trim().toLowerCase();
  if (normalized === 'partly cloudy') return '⛅';
  if (normalized === 'cloudy') return '☁️';
  if (normalized === 'rain') return '🌧';
  if (normalized === 'thunderstorm') return '⛈';
  if (normalized === 'fog') return '🌫';
  return '☀️';
};

export function MatchWeatherCard({
  weather,
  className,
}: {
  weather?: MatchWeather | null;
  className?: string;
}) {
  if (!weather) {
    return (
      <div title="Weather data unavailable">
        <Card className={cn('border-dashed border-gray-300 dark:border-gray-600', className)}>
        <CardBody className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Weather</p>
          <p className="text-sm text-gray-500">Weather data unavailable</p>
        </CardBody>
        </Card>
      </div>
    );
  }

  const icon = weather.icon || getWeatherFallbackIcon(weather.condition);

  return (
    <div
      title={`Weather Forecast\nTemperature: ${weather.temperature}°C\nRain Probability: ${weather.rainChance}%\nWind Speed: ${weather.windSpeed} km/h`}
    >
      <Card
        className={cn(
          'bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-800/70',
          className
        )}
      >
        <CardBody className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Weather</p>
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none" aria-hidden="true">
              {icon}
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-green-600 leading-none">{weather.temperature}°C</p>
              <p className="text-xs text-gray-500 mt-2">Rain Chance: {weather.rainChance}%</p>
              <p className="text-xs text-gray-500">Wind: {weather.windSpeed} km/h</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
