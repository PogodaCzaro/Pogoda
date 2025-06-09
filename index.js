const latitude = 52.2297;
const longitude = 21.0122;

// --- TOP BAR SETUP ---
const topBar = document.getElementById('top-bar');
window.addEventListener('scroll', () => {
    topBar.classList.toggle('show', window.scrollY > 50);
});
topBar.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.getElementById('top-settings').addEventListener('click', e => {
    e.stopPropagation();
    alert('Tu będą ustawienia 😉');
});
function updateTopBar(temp, description) {
    document.getElementById('top-temp').textContent = `${Math.round(temp)}°C`;
    document.getElementById('top-desc').textContent = description;
}

// --- HELPERS ---
function windDirectionToText(deg) {
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg/45) % 8];
}
function weatherCodeToDescription(code) {
    const m = {
        0: 'Bezchmurnie ☀️',
        1: 'Częściowo pochmurno 🌤️',
        2: 'Pochmurno ☁️',
        3: 'Zachmurzenie całe ☁️',
        45: 'Mgła 🌫️',
        48: 'Mgła lodowa 🌫️',
        51: 'Mżawka lekka 🌧️',
        53: 'Mżawka 🌧️',
        55: 'Mżawka intensywna 🌧️',
        61: 'Deszcz lekki 🌦️',
        63: 'Deszcz umiarkowany 🌧️',
        65: 'Deszcz intensywny 🌧️',
        80: 'Przelotne opady 🌦️',
        95: 'Burza ⛈️',
        99: 'Burza z gradem ⛈️'
    };
    return m[code] || 'Nieznana pogoda';
}
function weatherIcon(code) {
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if ([51,53,55,61,63,65,80].includes(code)) return '🌧️';
    if (code === 95 || code === 99) return '⛈️';
    return '❓';
}

// --- FETCH & RENDER ---
async function fetchWeatherData() {
    try {
        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&hourly=temperature_2m,weathercode,precipitation,uv_index,relativehumidity_2m,pressure_msl,dewpoint_2m,cloudcover,visibility,apparent_temperature,snowfall,is_day` +
            `&daily=uv_index_max&current_weather=true&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const weatherData = await res.json();

        const current = weatherData.current_weather;
        const now = new Date();
        const desc = weatherCodeToDescription(current.weathercode);

        // Główna sekcja
        document.getElementById('current-temperature').textContent = `${Math.round(current.temperature)}°C`;
        document.getElementById('current-wind-speed').textContent = `${Math.round(current.windspeed)} km/h`;
        document.getElementById('current-wind-direction').textContent = `(${windDirectionToText(current.winddirection)})`;
        document.getElementById('weather-description').textContent = desc;
        document.getElementById('weather-timestamp').textContent =
            `Aktualizacja: ${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;

        // Top bar
        updateTopBar(current.temperature, desc);

        // Tło
        setWeatherBackground(current.weathercode);

        // 24h forecast
        displayHourlyForecast(weatherData, now);

        // Extras
        displayCurrentExtras(weatherData, now);

        // UV max
        document.getElementById('uv-index').textContent =
            weatherData.daily.uv_index_max && weatherData.daily.uv_index_max.length
                ? weatherData.daily.uv_index_max[0].toFixed(1)
                : '--';

    } catch (e) {
        console.error('Fetch error:', e);
    }
}

// --- DISPLAY FUNCTIONS ---
function displayCurrentExtras(data, now) {
    const hr = data.hourly;
    let idx = hr.time.findIndex(t => new Date(t) >= now);
    if (idx < 0) idx = 0;

    // pobieramy i wstawiamy
    const vals = {
        'current-apparent-temp': hr.apparent_temperature[idx],
        'current-visibility': hr.visibility[idx],
        'current-pressure': hr.pressure_msl[idx],
        'current-dew-point': hr.dewpoint_2m[idx],
        'current-cloudcover': hr.cloudcover[idx],
        'current-snowfall': hr.snowfall[idx]
    };

    Object.entries(vals).forEach(([id, v]) => {
        const el = document.getElementById(id);
        if (v == null) {
            el.textContent = '--';
        } else if (id === 'current-visibility') {
            el.textContent = `${(v/1000).toFixed(1)} km`;
        } else if (id === 'current-snowfall') {
            el.textContent = `${v.toFixed(1)} mm`;
        } else if (id.includes('apparent')) {
            el.textContent = `${v.toFixed(1)}°C`;
        } else if (id.includes('pressure')) {
            el.textContent = `${v.toFixed(0)} hPa`;
        } else if (id.includes('dew-point')) {
            el.textContent = `${v.toFixed(1)}°C`;
        } else if (id.includes('cloudcover')) {
            el.textContent = `${v.toFixed(0)}%`;
        }
    });
}

function displayHourlyForecast(data, now) {
    const sc = document.getElementById('hourly-forecast-scroll');
    sc.innerHTML = '';
    const hr = data.hourly;
    let start = hr.time.findIndex(t => new Date(t) >= now);
    if (start < 0) start = 0;

    for (let i = start; i < start + 24 && i < hr.time.length; i++) {
        const dt = new Date(hr.time[i]);
        const box = document.createElement('div');
        box.className = 'hour-box';
        box.innerHTML = `
      <div class="hour">${dt.getHours().toString().padStart(2,'0')}:00</div>
      <div class="icon">${weatherIcon(hr.weathercode[i])}</div>
      <div class="temp">${hr.temperature_2m[i].toFixed(0)}°</div>
      <div class="precip">${hr.precipitation[i] > 0 ? hr.precipitation[i].toFixed(1) + ' mm' : '--'}</div>
    `;
        sc.appendChild(box);
    }
}

function setWeatherBackground(code) {
    const container = document.getElementById('app-container');
    let file = 'default.jpg';
    if (code === 0) file = 'sunny.jpg';
    else if (code === 1 || code === 2) file = 'partly-cloudy.webp';
    else if (code === 3) file = 'cloudy.jpg';
    else if (code === 45 || code === 48) file = 'fog.jpg';
    else if ([51,53,55,61,63,65,80].includes(code)) file = 'rain.jpg';
    else if ([95,99].includes(code)) file = 'storm.jpg';
    container.style.backgroundImage = `url('./IMGs/DynamicBG/V1/${file}')`;
}

// --- START ---
fetchWeatherData();
setInterval(fetchWeatherData, 10 * 60 * 1000);