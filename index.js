// === UTILS ===
function degreesToDirection(deg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.floor((deg / 22.5) + 0.5) % 16];
}

function setWeatherBackground(code) {
    const el = document.querySelector('#weather-info');
    let bg = '';

    if ([95, 96, 99].includes(code)) {
        bg = 'IMGs/DynamicBG/V1/storm.jpg';
    } else if ([61, 63, 65, 80, 81, 82].includes(code)) {
        bg = 'IMGs/DynamicBG/V1/rain.jpg';
    } else if ([51, 53, 55].includes(code)) {
        bg = 'IMGs/DynamicBG/V1/drizzle.jpg';
    } else if ([0, 1].includes(code)) {
        bg = 'IMGs/DynamicBG/V1/sunny.jpg';
    } else if ([2, 3].includes(code)) {
        bg = 'IMGs/DynamicBG/V1/cloudy.jpg';
    } else if ([45, 48].includes(code)) {
        bg = 'IMGs/DynamicBG/V1/fog.jpg';
    } else {
        bg = 'rgba(0, 0, 0, 0)';
    }

    el.style.backgroundImage = `url('${bg}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
}

// --- Helper do formatowania godziny ---
function formatTime(dateStr) {
    const date = new Date(dateStr);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

// --- Sprawdza, czy dwie daty są tego samego dnia ---
function isSameDay(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

// --- Formatuje zakres czasu (godziny albo pełna data jeśli różne dni) ---
function formatRange(start, end) {
    if (isSameDay(start, end)) {
        return `${formatTime(start)} - ${formatTime(end)}`;
    } else {
        return `${start.replace('T', ' ')} - ${end.replace('T', ' ')}`;
    }
}

function weatherCodeToDescription(code) {
    const codes = {
        0: 'Czyste niebo',
        1: 'Głównie słonecznie',
        2: 'Częściowo pochmurno',
        3: 'Pochmurno',
        45: 'Mgła',
        48: 'Szron',
        51: 'Lekka mżawka',
        53: 'Umiarkowana mżawka',
        55: 'Gęsta mżawka',
        56: 'Marznąca mżawka',
        57: 'Silna marznąca mżawka',
        61: 'Lekki deszcz',
        63: 'Umiarkowany deszcz',
        65: 'Silny deszcz',
        66: 'Lekki marznący deszcz',
        67: 'Silny marznący deszcz',
        71: 'Lekki śnieg',
        73: 'Umiarkowany śnieg',
        75: 'Silny śnieg',
        77: 'Płatki śniegu',
        80: 'Przelotne opady deszczu',
        81: 'Umiarkowane przelotne opady deszczu',
        82: 'Silne przelotne opady deszczu',
        85: 'Śnieg z deszczem',
        86: 'Silny śnieg z deszczem',
        95: 'Burza',
        96: 'Burza z lekkim gradem',
        99: 'Burza z gradem'
    };
    return codes[code] || 'Nieznane warunki';
}

// === FETCH & DISPLAY ===
async function fetchWeather() {
    if (!navigator.geolocation) {
        alert('Twoja przeglądarka nie wspiera geolokalizacji!');
        return;
    }

    navigator.geolocation.getCurrentPosition(async pos => {
        const { latitude: lat, longitude: lon } = pos.coords;

        const today = new Date().toISOString().slice(0, 10); // "2025-06-08" np.

        const url = `https://api.open-meteo.com/v1/forecast?` +
            `latitude=${lat}&longitude=${lon}` +
            `&current_weather=true` +
            `&hourly=precipitation,weathercode` +
            `&start_date=${today}&end_date=${today}` +
            `&timezone=auto`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Serwer zwrócił ${res.status}`);
            const data = await res.json();

            // Aktualizacja current weather
            const cw = data.current_weather;
            if (!cw) throw new Error('Brak danych current_weather');

            document.getElementById('current-temperature').textContent =
                `${cw.temperature}°C`;
            document.getElementById('current-wind-speed').textContent =
                `${cw.windspeed} km/h`;
            document.getElementById('current-wind-direction').textContent =
                degreesToDirection(cw.winddirection);
            document.getElementById('weather-description').textContent =
                weatherCodeToDescription(cw.weathercode);
            const weatherBackgrounds = {
                0: 'sunny.jpg',
                1: 'mostly_sunny.webp',
                2: 'partly_cloudy.webp',
                3: 'cloudy.jpg',
                45: 'fog.jpg',
                48: 'frost.jpg',
                51: 'drizzle.jpg',
                61: 'light_rain.jpg',
                63: 'moderate_rain.jpg',
                65: 'heavy_rain.jpg',
                80: 'showers.jpg',
                95: 'storm.jpg',
                96: 'storm.jpg',
                99: 'storm.jpg'
            };
            const weatherSection = document.getElementById('weather-info');
            const defaultBg = 'rgba(0, 0, 0, 0)';
            const backgroundImg = weatherBackgrounds[cw.weathercode] || defaultBg;
            weatherSection.style.backgroundImage = `url('IMGs/DynamicBG/V1/${backgroundImg}')`;
            document.getElementById('weather-timestamp').textContent =
                cw.time.replace('T', ' ');

            // === OPADY ===
            const hourly = data.hourly;
            const times = hourly.time;
            const precipitations = hourly.precipitation;
            const weathercodes = hourly.weathercode;

            const rainHours = [];
            for (let i = 0; i < precipitations.length; i++) {
                if (precipitations[i] > 0) {
                    rainHours.push({
                        time: times[i],
                        amount: precipitations[i],
                        weathercode: weathercodes[i]
                    });
                }
            }

            let rainText = 'Dziś nie przewiduje się opadów.';
            if (rainHours.length > 0) {
                const start = rainHours[0].time;
                const end = rainHours[rainHours.length - 1].time;
                const totalAmount = rainHours.reduce((sum, h) => sum + h.amount, 0).toFixed(1);

                const hasStorm = rainHours.some(h => h.weathercode >= 95);
                const hasFreezingDrizzle = rainHours.some(h => h.weathercode === 56 || h.weathercode === 57);

                let extra = '';
                if (hasStorm) extra = ', możliwa burza';
                else if (hasFreezingDrizzle) extra = ', możliwa marznąca mżawka';

                rainText = `Opady od ${formatRange(start, end)}, łącznie ok. ${totalAmount} mm${extra}.`;
            }

            document.getElementById('rain-container').innerHTML = `
                <h2>Deszcz:</h2>
                <div style="margin-top: auto;">
                    <p>${rainText}</p>
                </div>
            `;

            console.log('Pogoda zaktualizowana, dane opadów:', rainHours);

        } catch (err) {
            console.error('Błąd pobierania pogody:', err);
            alert('Nie udało się pobrać danych pogodowych:\n' + err.message);
        }
    }, err => {
        console.error('Błąd geolokalizacji:', err);
        alert('Nie można uzyskać lokalizacji: ' + err.message);
    });
}

// === STARTUP ===
document.addEventListener('DOMContentLoaded', fetchWeather);
document.getElementById('weather-btn').addEventListener('click', fetchWeather);