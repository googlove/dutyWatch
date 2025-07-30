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

async function checkAirAlert() {
  try {
    const response = await fetch('https://api.alerts.in.ua/v1/iot/active_air_raid_alerts_by_oblast.json', {
      headers: {
        'Authorization': Bearer '4526d87a4e6d58e6ebeb7743818488519f8041f2ab2203' // Замініть на ваш фактичний API ключ
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    const alertEl = document.getElementById("airAlert");

    // Перевірка статусу для Одеської області
    const odessaIndex = data.oblasts.indexOf("Одеська область");
    const odessaStatus = odessaIndex !== -1 ? data.statuses[odessaIndex] : 'N';

    if (odessaStatus === 'A' || odessaStatus === 'P') {
      alertEl.textContent = `🚨 ${langData[lang].airAlert} (Одеська область)`;
      alertEl.style.color = "red";
      if (Notification.permission === "granted") {
        new Notification(`${langData[lang].airAlert}!`, { body: "Одеська область!" });
      }
    } else {
      alertEl.textContent = `✅ ${lang === 'en' ? 'All clear in Odesa Oblast' : 'Все спокійно в Одеській області'}`;
      alertEl.style.color = "var(--accent)";
    }
  } catch (e) {
    console.error("Air alert error:", e);
    document.getElementById("airAlert").textContent = `⚠️ ${langData[lang].airAlert} недоступна`;
  }
}

async function loadWeather() {
  try {
    const res = await fetch("https://wttr.in/Odesa?format=j1");
    const data = await res.json();
    const current = data.current_condition[0];
    const sun = data.weather[0].astronomy[0];
    document.getElementById("weather").innerHTML = `
      <h3>🌤 ${lang === 'en' ? 'Weather in Odesa' : 'Погода в Одесі'}</h3>
      <div>🌡 ${current.temp_C}°C (Відчувається: ${current.FeelsLikeC}°C)</div>
      <div>💨 ${current.windspeedKmph} км/год (${current.winddir16Point})</div>
      <div>💧 ${current.humidity}%</div>
      <div>🔵 ${current.pressure} hPa</div>
      <div>🌅 ${lang === 'en' ? 'Sunrise' : 'Схід'}: ${sun.sunrise}</div>
      <div>🌇 ${lang === 'en' ? 'Sunset' : 'Захід'}: ${sun.sunset}</div>`;
  } catch {
    document.getElementById("weather").textContent = `⚠️ ${lang === 'en' ? 'Weather unavailable' : 'Погода недоступна'}`;
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
setInterval(checkAirAlert, 300000);

if (Notification.permission !== "denied") {
  Notification.requestPermission();
}