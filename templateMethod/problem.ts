/**
 * Шаблонный метод *Template Method*
 * Нужен для выполнения принципа DRY, увеличения переиспользуемости, читаемости и поддерживаемости кода
 * Когда есть несколько классов, которые имеют похожие по логике методы, но немного отличаются реализацией
 * Тогда мы можем выделить общую логику в единый шаблонный метод, логику которая реализовывалась в нём разбить на шаги
 * и при помощи механизма полиморфизма добиться необходимой вариативности в поведении схожих классов.
 */

import { WeatherResult, WeatherReport } from "./types";

// Проблемный причесанный код
class OpenWeatherClient {
  // 🟢 Шаблонный метод
  public async getTomorrowReport(city: string) {
    if (!this.canMakeReport()) {
      throw new Error("Can't make report");
    }

    // Шаг 1 - Получаем данные о погоде на завтра
    const tomorrowData = await this.getTomorrowWeatherReport(city);
    // Шаг 2 - Формируем отчёт о погоде на завтра
    return this.makeReport(tomorrowData);
  }

  // Hook, или метод, который способен изменить поведение шаблонного метода
  // В целом хук может вызываться когда угодно, это просто те же шаги
  private canMakeReport(): boolean {
    return true;
  }

  //👁️ Дублирование кода
  private makeReport(data: WeatherResult): WeatherReport {
    const temperatures = data.data.map(({ temperature }) => temperature);

    return {
      averageTemperature:
        temperatures.reduce((acc, temp) => acc + temp, 0) / temperatures.length,
      maxTemperature: Math.max(...temperatures),
      minTemperature: Math.min(...temperatures),
    };
  }

  private getCredentials() {
    return {
      apiKey: "some_api",
    };
  }

  private async getTomorrowWeatherReport(city: string): Promise<WeatherResult> {
    const { apiKey } = this.getCredentials();

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=ru`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Ошибка: ${data.message || "Неизвестная ошибка"}`);
      }

      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);

      const forecast = data.list.filter((item: any) => {
        const forecastDate = new Date(item.dt * 1000);
        return forecastDate.getDate() === tomorrow.getDate();
      });

      const formattedForecast = forecast.map((item: any) => ({
        time: item.dt_txt.slice(0, 16), // Убираем секунды
        temperature: parseFloat(item.main.temp.toFixed(1)), // Округляем до 1 знака после запятой
      }));

      return { data: formattedForecast };
    } catch (error) {
      throw new Error("Failed to fetch weather data");
    }
  }
}

class WeatherApiClient {
  // 🟢 Шаблонный метод
  public async getTomorrowReport(city: string) {
    // Шаг 0 - Проверяем, можем ли мы сделать отчёт
    if (!this.canMakeReport()) {
      throw new Error("Can't make report");
    }

    // Шаг 1 - Получаем данные о погоде на завтра
    const tomorrowData = await this.getTomorrowWeatherReport(city);
    // Шаг 2 - Формируем отчёт о погоде на завтра
    return this.makeReport(tomorrowData);
  }

  // Hook, или метод, который способен изменить поведение шаблонного метода
  // В целом хук может вызываться когда угодно, это просто те же шаги
  private canMakeReport(): boolean {
    return true;
  }

  //👁️ Дублирование кода
  private makeReport(data: WeatherResult): WeatherReport {
    const temperatures = data.data.map(({ temperature }) => temperature);

    return {
      averageTemperature:
        temperatures.reduce((acc, temp) => acc + temp, 0) / temperatures.length,
      maxTemperature: Math.max(...temperatures),
      minTemperature: Math.min(...temperatures),
    };
  }

  private getCredentials() {
    return {
      apiKey: "068c3f08632d468cb7a174620250203",
    };
  }

  private async getTomorrowWeatherReport(city: string): Promise<WeatherResult> {
    const { apiKey } = this.getCredentials();

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=2&aqi=no&alerts=no&lang=ru`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Ошибка: ${data.error?.message || "Неизвестная ошибка"}`
        );
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateStr = tomorrow.toISOString().split("T")[0];

      const forecast = data.forecast.forecastday.find(
        (day) => day.date === tomorrowDateStr
      );

      const formattedForecast =
        forecast?.hour.map((item: any) => ({
          time: item.time,
          temperature: item.temp_c,
        })) || [];

      return { data: formattedForecast };
    } catch (error) {
      throw new Error("Failed to fetch weather data");
    }
  }
}
