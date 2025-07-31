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

function isNowInRange(rangeStr, now) {
  const [start, end] = rangeStr.split('-').map(t => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  });
  const current = now.getHours() * 60 + now.getMinutes();
  return end < start ? current >= start || current < end : current >= start && current < end;
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
    ]
  };


function updateCurrentShift() {
  const now = new Date();
  const day = now.toLocaleDateString('en', { weekday: 'long' });
  let shiftHTML = `<h3>${langData[lang].onWatch}:</h3>`;
  let nextWatch = null;
  let nextWatchTime = null;

  (shifts[day] || []).forEach(person => {
    let line = "";
    if (person.shifts) {
      const activeShift = person.shifts.find(shift => isNowInRange(shift, now));
      line += activeShift
        ? `<span class="dot"></span> ${person.name} <span class="online">${langData[lang].onWatch}</span> <small>(${activeShift})</small>`
        : `${person.name}`;

      for (let shift of person.shifts) {
        const [startH, startM] = shift.split('-')[0].split(":").map(Number);
        const shiftStart = new Date(now);
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

// Конфігурація API
const ALERT_API_CONFIG = {
  primary: {
    url: 'https://api.alerts.in.ua/v1/alerts/active.json',
    token: '4526d87a4e6d58e6ebeb7743818488519f8041f2ab2203'
  },
  backup: {
    url: 'https://alerts.com.ua/api/states',
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
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function checkPrimaryAPI() {
  try {
    const response = await fetchWithTimeout(
      `${ALERT_API_CONFIG.primary.url}?token=${ALERT_API_CONFIG.primary.token}`
    );
    const data = await response.json();
    
    // Обробка для api.alerts.in.ua
    return data.find(item => 
      item.location_oblast && 
      item.location_oblast.includes("Одеська")
    );
  } catch (error) {
    console.warn("Primary API failed, trying backup...", error);
    return null;
  }
}

async function checkBackupAPI() {
  try {
    const response = await fetchWithTimeout(ALERT_API_CONFIG.backup.url);
    const data = await response.json();
    
    // Обробка для alerts.com.ua
    const odessaState = data.states.find(s => s.name === "Одеська область");
    return odessaState && odessaState.alert ? odessaState : null;
  } catch (error) {
    console.warn("Backup API failed", error);
    return null;
  }
}

async function checkAirAlert() {
  const alertEl = document.getElementById("airAlert");
  
  try {
    // Спочатку пробуємо основне API
    let alertData = await checkPrimaryAPI();
    let apiSource = "основне";
    
    // Якщо основне не спрацювало - пробуємо резервне
    if (!alertData) {
      alertData = await checkBackupAPI();
      apiSource = "резервне";
    }
    
    console.log(`Дані отримані з ${apiSource} API:`, alertData);
    
    if (alertData) {
      const isAlertActive = alertData.alert_type === 'air' || alertData.alert === true;
      
      if (isAlertActive) {
        alertEl.textContent = `🚨 ${langData[lang].airAlert} (Одеська область)`;
        alertEl.style.color = "red";
        
        if (Notification.permission === "granted") {
          new Notification(`${langData[lang].airAlert}!`, { 
            body: "Одеська область!"
          });
        }
      } else {
        alertEl.textContent = `✅ ${lang === 'en' ? 'All clear in Odesa Oblast' : 'Все спокійно в Одеській області'}`;
        alertEl.style.color = "green";
      }
    } else {
      throw new Error("Не вдалося отримати дані з жодного API");
    }
  } catch (e) {
    console.error("Помилка при перевірці тривоги:", e);
    alertEl.textContent = `⚠️ ${lang === 'en' 
      ? 'Failed to get alert status' 
      : 'Не вдалося отримати статус тривоги'}`;
    alertEl.style.color = "orange";
  }
  
  // Додаємо час останнього оновлення
  const now = new Date();
  alertEl.title = `Останнє оновлення: ${now.toLocaleTimeString()}`;
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
setInterval(updateCurrentShift, 60000);
setInterval(loadWeather, 600000);
setInterval(checkAirAlert, 5 * 60 * 1000);

if (Notification.permission !== "denied") {
  Notification.requestPermission();
}