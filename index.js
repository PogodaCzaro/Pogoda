// === UTILS ===
function degreesToDirection(deg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.floor((deg / 22.5) + 0.5) % 16;
    return directions[index];
}

function weatherCodeToDescription(code) {
    const codes = {
        0: 'Czyste niebo', 1: 'Głównie słonecznie', 2: 'Częściowo pochmurno',
        3: 'Pochmurno', 45: 'Mgła', 48: 'Osadzanie szronu',
        51: 'Lekka mżawka', 53: 'Umiarkowana mżawka', 55: 'Gęsta mżawka',
        56: 'Lekki marznący deszcz mżawki', 57: 'Gęsty marznący deszcz mżawki',
        61: 'Lekki deszcz', 63: 'Umiarkowany deszcz', 65: 'Silny deszcz',
        66: 'Lekki marznący deszcz', 67: 'Silny marznący deszcz',
        71: 'Lekki śnieg', 73: 'Umiarkowany śnieg', 75: 'Silny śnieg',
        77: 'Płatki śniegu', 80: 'Przelotne opady deszczu',
        81: 'Umiarkowane przelotne opady deszczu', 82: 'Silne przelotne opady deszczu',
        85: 'Lekki śnieg z deszczem', 86: 'Silny śnieg z deszczem',
        95: 'Burza z gradem', 96: 'Burza z lekkim gradem', 99: 'Burza z silnym gradem'
    };
    return codes[code] || 'Nieznany stan pogody';
}

// === FETCH & DISPLAY ===
async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation,weathercode,snowfall&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Błąd sieci');
    return await res.json();
    console.log("Dane pogodowe zostały zaktualizowane:", data.hourly.time[0]);
}

function displayWeather(current) {
    document.getElementById('current-temperature').innerText = current.temperature + ' °C';
    document.getElementById('current-wind-speed').innerText = current.windspeed + ' km/h';
    document.getElementById('current-wind-direction').innerText = degreesToDirection(current.winddirection);
    document.getElementById('weather-description').innerText = weatherCodeToDescription(current.weathercode);
    document.getElementById('weather-timestamp').innerText = `Czas pomiaru: ${current.time}`;
}

async function updateWeatherIfNeeded() {
    if (!navigator.geolocation) {
        alert('Twoja przeglądarka nie wspiera geolokalizacji!');
        return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const now = Date.now();
        const lastUpdate = parseInt(localStorage.getItem('lastWeatherUpdate') || 0);
        const cachedWeather = localStorage.getItem('cachedWeather');

        if (cachedWeather && now - lastUpdate < 20 * 60 * 1000) {
            displayWeather(JSON.parse(cachedWeather));
        } else {
            try {
                const data = await fetchWeather(lat, lon);
                const current = data.current_weather;
                displayWeather(current);
                localStorage.setItem('lastWeatherUpdate', now.toString());
                localStorage.setItem('cachedWeather', JSON.stringify(current));
            } catch (err) {
                alert("Nie udało się pobrać danych pogodowych.");
            }
        }
    });
}

async function getWeatherAndNotify() {
    if (!navigator.geolocation) return;
    if (Notification.permission !== "granted") await Notification.requestPermission();

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation,weathercode,snowfall&timezone=auto`;
        const response = await fetch(url);
        const data = await response.json();

        const now = new Date();
        const hourly = data.hourly;
        let willRainOrSnow = false;
        let nextPrecipitationHour = null;

        for (let i = 0; i < hourly.time.length; i++) {
            let hourTime = new Date(hourly.time[i]);
            if (hourTime > now && hourTime <= new Date(now.getTime() + 12 * 60 * 60 * 1000)) {
                const rain = hourly.precipitation[i];
                const snow = hourly.snowfall ? hourly.snowfall[i] : 0;
                const code = hourly.weathercode[i];
                if (rain > 0 || snow > 0 || (code >= 61 && code <= 86)) {
                    willRainOrSnow = true;
                    nextPrecipitationHour = hourTime.toLocaleTimeString();
                    break;
                }
            }
        }

        if (willRainOrSnow && Notification.permission === "granted") {
            new Notification('⚠️ Pogoda ALERT ⚠️', {
                body: `Uwaga! Spodziewane opady o godz. ${nextPrecipitationHour}`
            });
        }
    });
}

async function loadHourlyForecast() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,weathercode,snowfall&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();

        const now = new Date();
        const target = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const hourly = data.hourly;

        let output = 'Brak danych';
        for (let i = 0; i < hourly.time.length; i++) {
            const t = new Date(hourly.time[i]);
            if (t.getHours() === target.getHours() && t.getDate() === target.getDate()) {
                output = `Za 2h: ${hourly.temperature_2m[i]}°C, ${weatherCodeToDescription(hourly.weathercode[i])}, opad: ${hourly.precipitation[i]}mm`;
                break;
            }
        }
        document.getElementById('forecast-in-2h').innerText = output;
    });
}

// === START ===
window.addEventListener('load', async () => {
    await updateWeatherIfNeeded();
    await getWeatherAndNotify();
    await loadHourlyForecast();
});
