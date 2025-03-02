import { WeatherResult, WeatherReport } from "./types";

/**
 * За счет инверсии зависимостей и агрегации классов мы заменяем наследование на композицию
 * Выглядит немного громоздко, но наглядно
 * Тупо выносим специфичную логику или алгоритмы в отдельные сервисы
 * (если название сервису не удается придумать можно назвать просто Service),
 * которые передаем в конструктор
 * Service - сущность которая нужна для выноса какой-то логики
 **/

// АйвеазерСервис - чето там погодой занимается сервис, группа потребителей
// сервиса ждет что он будет им помогать с решением вопросов по погоде
interface IWeatherService {
  getTomorrowWeatherReport(city: string): Promise<WeatherResult>;
}

interface IReportMaker {
  makeReport(data: WeatherResult): WeatherReport;
}

interface IWeatherClient {
  getTomorrowReport(city: string): Promise<WeatherReport>;
}

interface IMakeReportAllower {
  canMakeReport(): boolean;
}

class WeatherClient implements IWeatherClient {
  private weatherService: IWeatherService;
  private reportMaker: IReportMaker;
  private makeReportAllower: IMakeReportAllower;

  constructor(
    weatherService: IWeatherService,
    reportMaker: IReportMaker,
    makeReportAllower: IMakeReportAllower
  ) {
    this.weatherService = weatherService;
    this.reportMaker = reportMaker;
    this.makeReportAllower = makeReportAllower;
  }

  // 🟢 Шаблонный метод
  public async getTomorrowReport(city: string) {
    // Шаг 0 - Проверяем, можем ли мы сделать отчёт
    if (!this.makeReportAllower.canMakeReport()) {
      throw new Error("Can't make report");
    }

    // Шаг 1 - Получаем данные о погоде на завтра
    const tomorrowData = await this.weatherService.getTomorrowWeatherReport(
      city
    );

    // Шаг 2 - Формируем отчёт о погоде на завтра
    return this.reportMaker.makeReport(tomorrowData);
  }
}

class OpenWeatherService implements IWeatherService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async getTomorrowWeatherReport(city: string): Promise<WeatherResult> {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${this.apiKey}&units=metric&lang=ru`
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
      time: item.dt_txt.slice(0, 16),
      temperature: parseFloat(item.main.temp.toFixed(1)),
    }));

    return { data: formattedForecast };
  }
}

class WeatherApiService implements IWeatherService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async getTomorrowWeatherReport(city: string): Promise<WeatherResult> {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${this.apiKey}&q=${city}&days=2&aqi=no&alerts=no&lang=ru`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Ошибка: ${data.error?.message || "Неизвестная ошибка"}`);
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
  }
}

class DefaultReportMaker implements IReportMaker {
  public makeReport(data: WeatherResult): WeatherReport {
    const temperatures = data.data.map(({ temperature }) => temperature);

    return {
      averageTemperature:
        temperatures.reduce((acc, temp) => acc + temp, 0) / temperatures.length,
      maxTemperature: Math.max(...temperatures),
      minTemperature: Math.min(...temperatures),
    };
  }
}

class MakeReportAllower implements IMakeReportAllower {
  public canMakeReport(): boolean {
    return true;
  }
}

const openWeatherService = new OpenWeatherService("some_api");
const weatherApiService = new WeatherApiService(
  "068c3f08632d468cb7a174620250203"
);
const makeReportAllower = new MakeReportAllower();
const reportMaker = new DefaultReportMaker();

const openWeatherClient = new WeatherClient(
  openWeatherService,
  reportMaker,
  makeReportAllower
);
const weatherApiClient = new WeatherClient(
  weatherApiService,
  reportMaker,
  makeReportAllower
);
