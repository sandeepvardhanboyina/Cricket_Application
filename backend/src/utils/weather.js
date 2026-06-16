const WEATHER_CONDITIONS = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rain', 'Thunderstorm', 'Fog'];

const WEATHER_ICON_MAP = {
  Sunny: '☀️',
  'Partly Cloudy': '⛅',
  Cloudy: '☁️',
  Rain: '🌧',
  Thunderstorm: '⛈',
  Fog: '🌫',
};

const normalizeWeatherCondition = (value) => {
  if (typeof value !== 'string') return 'Sunny';
  const normalized = value.trim().toLowerCase();
  const matched = WEATHER_CONDITIONS.find((condition) => condition.toLowerCase() === normalized);
  return matched || 'Sunny';
};

const isValidWeatherCondition = (value) => WEATHER_CONDITIONS.includes(normalizeWeatherCondition(value));

const getWeatherIcon = (condition) => WEATHER_ICON_MAP[normalizeWeatherCondition(condition)] || '☀️';

const createMockWeather = (seed = new Date()) => {
  const date = new Date(seed);
  const daySeed = date.getUTCDate() + date.getUTCMonth() + date.getUTCFullYear();
  const condition = WEATHER_CONDITIONS[daySeed % WEATHER_CONDITIONS.length];
  const temperatureBase = 24 + (daySeed % 8);
  const rainChanceBase = (daySeed * 7) % 60;
  const windSpeedBase = 8 + (daySeed % 12);

  const adjustedRainChance =
    condition === 'Rain' ? Math.max(rainChanceBase, 70) : condition === 'Thunderstorm' ? Math.max(rainChanceBase, 80) : rainChanceBase;

  return {
    temperature: temperatureBase,
    condition,
    rainChance: adjustedRainChance,
    windSpeed: windSpeedBase,
    icon: getWeatherIcon(condition),
  };
};

const normalizeWeather = (weather, fallbackDate) => {
  if (!weather) return createMockWeather(fallbackDate);

  const condition = normalizeWeatherCondition(weather.condition);
  return {
    temperature:
      typeof weather.temperature === 'number' ? weather.temperature : createMockWeather(fallbackDate).temperature,
    condition,
    rainChance:
      typeof weather.rainChance === 'number' ? weather.rainChance : createMockWeather(fallbackDate).rainChance,
    windSpeed:
      typeof weather.windSpeed === 'number' ? weather.windSpeed : createMockWeather(fallbackDate).windSpeed,
    icon: weather.icon || getWeatherIcon(condition),
  };
};

module.exports = {
  WEATHER_CONDITIONS,
  getWeatherIcon,
  createMockWeather,
  normalizeWeather,
  isValidWeatherCondition,
  normalizeWeatherCondition,
};
