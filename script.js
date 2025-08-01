const langData = {
  en: {
    watchCommand: "Watch Command System",
    airAlert: "Air Alert",
    onNext: "Next on watch",
    onWatch: "On watch now"
  },
  ua: {
    watchCommand: "Вахтовий Командний Центр",
    airAlert: "Повітряна тривога",
    onNext: "Наступний на вахті",
    onWatch: "Зараз на вахті"
  }
};

let lang = localStorage.getItem('lang') || 'ua';

function setLang(l) {
  lang = l;
  localStorage.setItem('lang', lang);
  document.querySelector("select").value = lang;
  translate();
}

function translate() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = langData[lang] && langData[lang][key] ? langData[lang][key] : key;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setLang(lang);
});

function toggleTheme() {
  const theme = document.documentElement.getAttribute('data-theme');
  const newTheme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');

function updateDateTime() {
  const now = new Date();
  const daysUa = ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "Пʼятниця", "Субота"];
  const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const dayName = lang === 'en' ? daysEn[now.getDay()] : daysUa[now.getDay()];
  const date = now.toLocaleDateString(lang === 'en' ? 'en-GB' : 'uk-UA');
  const time = now.toLocaleTimeString(lang === 'en' ? 'en-GB' : 'uk-UA', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  document.getElementById("dateTime").innerHTML = `
    <h4>🕒 ${lang === 'en' ? 'Current Time' : 'Поточний час'}</h4>
    <div>📅 ${lang === 'en' ? 'Date' : 'Дата'}: ${date}</div>
    <div>📆 ${lang === 'en' ? 'Day' : 'День'}: ${dayName}</div>
    <div>⏰ ${lang === 'en' ? 'Time' : 'Час'}: ${time}</div>
  `;
}

function isNowInRange(shift, now) {
  const [start, end] = shift.time.split('-');
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const [year, month, day] = shift.date.split('-').map(Number);
  const startTime = new Date(year, month - 1, day, startH, startM, 0, 0);
  const endTime = new Date(year, month - 1, day, endH, endM, 0, 0);

  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  const shiftDate = new Date(year, month - 1, day);
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return shiftDate.getTime() === nowDate.getTime() && now >= startTime && now < endTime;
}

const shifts = {
  "2025-08-01": [
    { name: "Dan", shifts: [{ time: "09:00-12:00", date: "2025-08-01" }, { time: "21:00-00:00", date: "2025-08-01" }] },
    { name: "Yura", shifts: [{ time: "12:00-15:00", date: "2025-08-01" }, { time: "00:00-03:00", date: "2025-08-01" }] },
    { name: "Zhenya", shifts: [{ time: "15:00-18:00", date: "2025-08-01" }, { time: "03:00-06:00", date: "2025-08-01" }] },
    { name: "Denis", shifts: [{ time: "18:00-21:00", date: "2025-08-01" }, { time: "06:00-09:00", date: "2025-08-01" }] },
    { name: "Yarik", status: "off" },
    { name: "Gurikhanyan", status: "canteen" }
  ],
  "2025-08-02": [
    { name: "Denis", shifts: [{ time: "09:00-12:00", date: "2025-08-02" }, { time: "21:00-00:00", date: "2025-08-02" }] },
    { name: "Gurikhanyan", shifts: [{ time: "12:00-15:00", date: "2025-08-02" }, { time: "00:00-03:00", date: "2025-08-02" }] },
    { name: "Yura", shifts: [{ time: "15:00-18:00", date: "2025-08-02" }, { time: "03:00-06:00", date: "2025-08-02" }] },
    { name: "Yarik", shifts: [{ time: "18:00-21:00", date: "2025-08-02" }, { time: "06:00-09:00", date: "2025-08-02" }] },
    { name: "Dan", status: "off" },
    { name: "Zhenya", status: "canteen" }
  ]
};

function updateCurrentShift() {
  const now = new Date(); // Поточний час: 12:49 PM EEST, п'ятниця, 01 серпня 2025
  const dateStr = now.toISOString().split('T')[0]; // Формат дати: "2025-08-01"
  let shiftHTML = `<h3>${langData[lang].onWatch}:</h3>`;
  let nextWatch = null;
  let nextWatchTime = null;

  // Отримуємо список змін для поточної дати
  const currentDayShifts = shifts[dateStr] || [];
  let activePerson = null;

  // Перевірка змін поточного дня
  currentDayShifts.forEach(person => {
    let line = "";
    if (person.shifts) {
      const activeShift = person.shifts.find(shift => isNowInRange(shift, now));
      if (activeShift) {
        if (!activePerson) { // Дозволяємо тільки одну активну вахту
          activePerson = person.name;
          line += `<span class="dot"></span> ${person.name} <span class="online">${langData[lang].onWatch}</span> <small>(${activeShift.time})</small>`;
        }
      } else {
        line += `${person.name}`;
      }

      // Пошук наступної зміни
      for (let shift of person.shifts) {
        const [startH, startM] = shift.time.split('-')[0].split(":").map(Number);
        const shiftStart = new Date(now);
        const [year, month, day] = shift.date.split('-').map(Number);
        shiftStart.setFullYear(year, month - 1, day);
        shiftStart.setHours(startH, startM, 0, 0);

        if (shiftStart > now && (!nextWatchTime || shiftStart < nextWatchTime)) {
          nextWatch = person.name;
          nextWatchTime = shiftStart;
        }
      }
    } else if (person.status === "off") {
      line += `<span style="color:red">🔴</span> ${person.name} <span style="color:red">${lang === 'en' ? 'Off' : 'Вихідний'}</span>`;
    } else if (person.status === "canteen") {
      line += `🍴 ${person.name} <span style="color:orange">${lang === 'en' ? 'Canteen' : 'Столова'}</span>`;
    }
    shiftHTML += `<div>${line}</div>`;
  });

  // Якщо немає наступної зміни або час після останньої вахти
  const lastShiftEnd = new Date(now);
  lastShiftEnd.setFullYear(2025, 7, 2); // Останній день — субота
  lastShiftEnd.setHours(21, 0, 0, 0);   // Останній час вахти (21:00 суботи)
  if (!nextWatchTime || now >= lastShiftEnd) {
    shiftHTML += `<div><span style="color:gray">Вахти на сьогодні закінчилися</span></div>`;
  } else if (nextWatch && nextWatchTime) {
    const timeStr = nextWatchTime.toLocaleTimeString(lang === 'en' ? 'en-GB' : 'uk-UA', {
      hour: '2-digit', minute: '2-digit'
    });
    shiftHTML += `<div style="margin-top:1rem;"><strong>➡️ ${langData[lang].onNext}:</strong> ${nextWatch} <small>(${timeStr})</small></div>`;
  }

  document.getElementById("currentShift").innerHTML = shiftHTML;
}

function renderDailyEvents() {
  document.getElementById("events").innerHTML = `
    <h3>📅 ${lang === 'en' ? 'Daily Events' : 'Щоденні події'}</h3>
    <ul style="list-style: none; padding-left: 0;">
      <li>🚩 ${lang === 'en' ? 'Navy Flag Raising' : 'Підняття прапору ВМС'} – 08:00</li>
      <li>🧹 ${lang === 'en' ? 'Small Cleaning' : 'Мале прибирання'} – 08:30</li>
      <li>🕯 ${lang === 'en' ? 'Remembrance' : 'Вшанування полеглих'} – 09:00</li>
    </ul>`;
}


const ALERT_API_CONFIG = {

  primary: {
    // URL для запиту тривог по конкретному регіону
    url: 'https://api.alerts.in.ua/v1/alerts/active',
    // Токен винесено в окрему властивість для зручності
    token: '4526d87a4e6d58e6ebeb7743818488519f8041f2ab2203',
    region_id: 16 // ID Одеської області
  }
};

// Функція для виконання запиту з таймаутом
// Ця функція коректно обробляє помилки і прибирання таймауту
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    // Прибираємо таймаут, якщо запит успішний
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response;
  } catch (error) {
    // Прибираємо таймаут, якщо виникла помилка
    clearTimeout(timeoutId);
    throw error;
  }
}

// Функція для перевірки статусу тривоги в Одеській області
async function checkPrimaryAPI() {
  try {
    const config = ALERT_API_CONFIG.primary;
    // Формуємо URL з токеном та ID регіону
    const url = `${config.url}?token=${config.token}&region_id=${config.region_id}`;
    
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    // API повертає порожній масив, якщо тривог немає.
    // Тому просто перевіряємо, чи масив не порожній.
    return data.alerts.length > 0 ? data.alerts[0] : null;
  } catch (error) {
    console.warn("Primary API failed:", error.message);
    return null;
  }
}

// Головна функція для перевірки та оновлення DOM
async function checkAirAlert(lang = 'ua') {
  const alertEl = document.getElementById("airAlert");
  if (!alertEl) {
    console.error("Елемент з ID 'airAlert' не знайдено.");
    return;
  }

  // Об'єкт з локалізацією
  const langData = {
    ua: {
      airAlert: "Повітряна тривога",
      calm: "Все спокійно",
      error: "Не вдалося отримати статус тривоги"
    },
    en: {
      airAlert: "Air Alert",
      calm: "All clear",
      error: "Failed to get alert status"
    }
  };

  const messages = langData[lang];
  const regionName = "Одеській області";

  try {
    const alertData = await checkPrimaryAPI();

    if (alertData) {
      // Якщо є тривога
      alertEl.innerHTML = `🚨 **${messages.airAlert}** в ${regionName}`;
      alertEl.className = 'alert-danger';

      // Відправка сповіщення (якщо дозволено)
      if (Notification.permission === "granted") {
        new Notification(`${messages.airAlert}!`, {
          body: `${messages.airAlert} в ${regionName}`
        });
      }
    } else {
      // Якщо все спокійно
      alertEl.innerHTML = `✅ ${messages.calm} в ${regionName}`;
      alertEl.className = 'alert-calm';
    }
  } catch (e) {
    // Обробка помилок
    console.error("Alert check error:", e.message);
    alertEl.innerHTML = `⚠️ ${messages.error}`;
    alertEl.className = 'alert-error';
  }

  // Оновлюємо тайтл для відображення часу оновлення
  alertEl.title = `Оновлено: ${new Date().toLocaleTimeString()}`;
}


async function loadWeather() {
  try {
    // 1. Поточна погода
    const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${45.4}&lon=${29.6}&appid=20a36f8e1152244bbbd9ac296d3640f2&units=metric`);
    const weatherData = await weatherResponse.json();

    const temp = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const wind = weatherData.wind.speed;
    const pressure = weatherData.main.pressure;
    const sunrise = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString();
    const sunset = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString();

    document.getElementById("weather").innerHTML = `
      🌡️ ${temp}°C<br>
      💧 ${humidity}%<br>
      🌬️ ${wind} м/с<br>
      🧭 ${pressure} гПа<br>
      🌅 ${sunrise} / 🌇 ${sunset}
    `;

    // 2. Радіаційний фон (Air Quality Index)
    const aqiResponse = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${45.4}&lon=${29.6}&appid=20a36f8e1152244bbbd9ac296d3640f2`);
    const aqiData = await aqiResponse.json();

    const aqi = aqiData.list[0].main.aqi;
    const meanings = lang === 'en' 
      ? ["Good", "Fair", "Moderate", "Poor", "Very Poor"] 
      : ["Добре", "Задовільно", "Помірно", "Погано", "Дуже погано"];

    document.getElementById("radiation").innerText = `☢️ AQI: ${aqi} (${meanings[aqi - 1]})`;
  } catch (error) {
    console.error("Weather loading error:", error);
    document.getElementById("weather").innerHTML = "⚠️ Weather data unavailable";
    document.getElementById("radiation").innerText = "⚠️ Radiation data unavailable";
  }
}

// Ініціалізація
updateDateTime();
updateCurrentShift();
renderDailyEvents();
loadWeather();

setInterval(updateDateTime, 1000);
setInterval(updateCurrentShift, 60 * 1000);
setInterval(loadWeather, 600000);

document.addEventListener('DOMContentLoaded', () => {
    checkAirAlert(); // Перший запуск
    setInterval(checkAirAlert, 60000); // Оновлюємо кожну хвилину
});


if (Notification.permission !== "granted" && Notification.permission !== "denied") {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") console.log("Notification permission granted");
  });
}