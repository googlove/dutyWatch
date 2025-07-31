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
    el.textContent = langData[lang][key];
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
  const [start, end] = shift.split('-');
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const startTime = new Date(now);
  startTime.setHours(startH, startM, 0, 0);

  const endTime = new Date(now);
  endTime.setHours(endH, endM, 0, 0);

  // Якщо кінець менше або дорівнює початку (тобто після півночі), додаємо день
  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }

  return now >= startTime && now < endTime;
}

const shifts = {
  "Tuesday": [
    { name: "Yarik", shifts: ["09:00-12:00", "21:00-00:00"] },
    { name: "Zhenya", shifts: ["12:00-15:00", "00:00-03:00"] },
    { name: "Dan", shifts: ["15:00-18:00", "03:00-06:00"] },
    { name: "Yura", shifts: ["18:00-21:00", "06:00-09:00"] },
    { name: "Gurikhanyan", status: "off" },
    { name: "Katran", status: "canteen" }
  ],
  "Wednesday": [
    { name: "Gurikhanyan", shifts: ["09:00-12:00", "21:00-00:00"] },
    { name: "Zhenya", shifts: ["12:00-15:00", "00:00-03:00"] },
    { name: "Dan", shifts: ["15:00-18:00", "03:00-06:00"] },
    { name: "Katran", shifts: ["18:00-21:00", "06:00-09:00"] },
    { name: "Yarik", status: "off" },
    { name: "Yura", status: "canteen" }
  ],
  "Thursday": [
    { name: "Gurikhanyan", shifts: ["09:00-12:00", "21:00-00:00"] },
    { name: "Yura", shifts: ["12:00-15:00", "00:00-03:00"] },
    { name: "Yarik", shifts: ["15:00-18:00", "03:00-06:00"] },
    { name: "Katran", shifts: ["18:00-21:00", "06:00-09:00"] },
    { name: "Zhenya", status: "off" },
    { name: "Dan", status: "canteen" }
  ],
  "Friday": [
    { name: "Dan", shifts: ["09:00-12:00", "21:00-00:00"] },
    { name: "Yura", shifts: ["12:00-15:00", "00:00-03:00"] },
    { name: "Zhenya", shifts: ["15:00-18:00", "03:00-06:00"] },
    { name: "Denis", shifts: ["18:00-21:00", "06:00-09:00"] },
    { name: "Yarik", status: "off" },
    { name: "Gurikhanyan", status: "canteen" }
  ]
};

function updateCurrentShift() {
  const now = new Date(); // Поточний час: 12:41 AM EEST, п'ятниця, 01 серпня 2025
  const day = now.toLocaleDateString('en', { weekday: 'long' });
  let shiftHTML = `<h3>${langData[lang].onWatch}:</h3>`;
  let nextWatch = null;
  let nextWatchTime = null;

  // Отримуємо список змін для поточного дня
  const currentDayShifts = shifts[day] || [];
  const days = Object.keys(shifts);
  const currentDayIndex = days.indexOf(day);
  const nextDay = days[(currentDayIndex + 1) % days.length]; // "Saturday" (але в даних його немає, цикл йде до вівторка)

  // Перевірка змін поточного дня
  currentDayShifts.forEach(person => {
    let line = "";
    if (person.shifts) {
      const activeShift = person.shifts.find(shift => isNowInRange(shift, now));
      if (activeShift) {
        line += `<span class="dot"></span> ${person.name} <span class="online">${langData[lang].onWatch}</span> <small>(${activeShift})</small>`;
      } else {
        line += `${person.name}`;
      }

      // Пошук наступної зміни серед усіх змін поточного дня до 09:00 наступного дня
      for (let shift of person.shifts) {
        const [startH, startM] = shift.split('-')[0].split(":").map(Number);
        const shiftStart = new Date(now);
        shiftStart.setHours(startH, startM, 0, 0);
        const nextDay09 = new Date(now);
        nextDay09.setDate(nextDay09.getDate() + 1);
        nextDay09.setHours(9, 0, 0, 0);

        if (shiftStart > now && shiftStart < nextDay09 && (!nextWatchTime || shiftStart < nextWatchTime)) {
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

  // Якщо поточний час після 09:00 наступного дня або немає наступної зміни до 09:00, шукаємо 09:00 наступного дня
  const nextDay09 = new Date(now);
  nextDay09.setDate(nextDay09.getDate() + 1);
  nextDay09.setHours(9, 0, 0, 0);
  if (!nextWatchTime || now >= nextDay09) {
    const nextDayShifts = shifts[nextDay] || [];
    for (let person of nextDayShifts) {
      if (person.shifts && person.shifts.some(shift => shift.startsWith("09:00"))) {
        nextWatch = person.name;
        nextWatchTime = nextDay09;
        break;
      }
    }
  }

  if (nextWatch && nextWatchTime) {
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
    url: 'https://api.alerts.in.ua/v1/alerts/active.json',
    token: '4526d87a4e6d58e6ebeb7743818488519f8041f2ab2203'
  },
  backup: {
    url: 'https://alerts.in.ua/api/states',
    token: ''
  }
};

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function checkPrimaryAPI() {
  try {
    const url = `${ALERT_API_CONFIG.primary.url}?token=${ALERT_API_CONFIG.primary.token}`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    console.log("Primary API response:", data);

    // Find alert for Odesa Oblast
    return data.alerts.find(item =>
      item.location_title && item.location_title.includes("Одеська область")
    ) || null;
  } catch (error) {
    console.warn("Primary API failed:", error.message);
    return null;
  }
}

async function checkBackupAPI() {
  try {
    const response = await fetchWithTimeout(ALERT_API_CONFIG.backup.url);
    const data = await response.json();

    console.log("Backup API response:", data);

    // Find alert for Odesa Oblast
    return data.states.find(s => s.name === "Одеська область") || null;
  } catch (error) {
    console.warn("Backup API failed:", error.message);
    return null;
  }
}

async function checkAirAlert(lang = 'ua') {
  const alertEl = document.getElementById("airAlert");
  if (!alertEl) {
    console.error("Element with ID 'airAlert' not found");
    return;
  }

  const langData = {
    ua: {
      airAlert: "Повітряна тривога",
      artillery: "Артилерійська небезпека",
      urban: "Міські бої",
      chemical: "Хімічна загроза",
      nuclear: "Ядерна загроза",
      calm: "Все спокійно в Одеській області",
      error: "Не вдалося отримати статус тривоги",
      danger: "Небезпека"
    },
    en: {
      airAlert: "Air Alert",
      artillery: "Artillery Danger",
      urban: "Urban Fighting",
      chemical: "Chemical Threat",
      nuclear: "Nuclear Threat",
      calm: "All clear in Odesa Oblast",
      error: "Failed to get alert status",
      danger: "Danger"
    }
  };

  try {
    let alertData = await checkPrimaryAPI();
    let apiSource = "primary";

    if (!alertData) {
      alertData = await checkBackupAPI();
      apiSource = "backup";
    }

    console.log(`Data from ${apiSource} API:`, alertData);

    if (alertData && (alertData.alert_type || alertData.alert)) {
      const alertType = alertData.alert_type || (alertData.alert ? 'air' : null);
      let alertMessage;

      // Map alert_type to localized message
      switch (alertType) {
        case 'air':
          alertMessage = langData[lang].airAlert;
          break;
        case 'artillery':
          alertMessage = langData[lang].artillery;
          break;
        case 'urban':
          alertMessage = langData[lang].urban;
          break;
        case 'chemical':
          alertMessage = langData[lang].chemical;
          break;
        case 'nuclear':
          alertMessage = langData[lang].nuclear;
          break;
        default:
          alertMessage = langData[lang].danger;
      }

      alertEl.textContent = `🚨 ${alertMessage} (Одеська область)`;
      alertEl.style.color = "red";

      if (Notification.permission === "granted") {
        new Notification(`${alertMessage}!`, {
          body: `Одеська область: ${alertMessage}`
        });
      }
    } else {
      alertEl.textContent = `✅ ${langData[lang].calm}`;
      alertEl.style.color = "green";
    }
  } catch (e) {
    console.error("Alert check error:", e.message);
    alertEl.textContent = `⚠️ ${langData[lang].error}`;
    alertEl.style.color = "orange";
  }

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
checkAirAlert();
loadWeather();

setInterval(updateDateTime, 1000);
setInterval(updateCurrentShift, 60 * 1000);
setInterval(loadWeather, 600000);
setInterval(checkAirAlert, 20000);

if (Notification.permission !== "denied") {
  Notification.requestPermission();
}