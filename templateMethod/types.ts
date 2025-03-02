
export type WeatherTimeReport = {
  time: string;
  temperature: number;
};

export type WeatherResult = {
  data: WeatherTimeReport[];
};

export type WeatherReport = {
  averageTemperature: number;
  maxTemperature: number;
  minTemperature: number;
};

export type OpenWeatherResponse = {
  list: {
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      sea_level: number;
      grnd_level: number;
      humidity: number;
      temp_kf: number;
    };

    visibility: number;

    clouds: {
      all: number;
    };

    wind: {
      speed: number;
      deg: number;
      gust: number;
    };

    dt_txt: string;
  }[];
};