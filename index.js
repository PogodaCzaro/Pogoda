function degreesToDirection(deg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.floor((deg / 22.5) + 0.5) % 16;
    return directions[index];
}

function weatherCodeToDescription(code) {
    const codes = {
        0: 'Czyste niebo',
        1: 'Głównie słonecznie',
        2: 'Częściowo pochmurno',
        3: 'Pochmurno',
        45: 'Mgła',
        48: 'Osadzanie szronu',
        51: 'Lekka mżawka',
        53: 'Umiarkowana mżawka',
        55: 'Gęsta mżawka',
        56: 'Lekki marznący deszcz mżawki',
        57: 'Gęsty marznący deszcz mżawki',
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
        85: 'Lekki śnieg z deszczem',
        86: 'Silny śnieg z deszczem',
        95: 'Burza z gradem',
        96: 'Burza z lekkim gradem',
        99: 'Burza z silnym gradem'
    };
    return codes[code] || 'Nieznany stan pogody';
}

async function getWeather() {
    if (!navigator.geolocation) {
        alert('Twoja przeglądarka nie wspiera geolokalizacji!');
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log("Lokalizacja OK", position);

        // Timestamp lokalnego urządzenia w ISO, jeśli chcesz go wysłać (choć Open-Meteo go nie wymaga)
        const now = new Date();
        const isoTimestamp = now.toISOString();

        // URL z parametrem time (możesz testować, ale API może ignorować ten parametr w current_weather)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&time=${encodeURIComponent(isoTimestamp)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Błąd sieci');
            const data = await response.json();

            const current = data.current_weather;
            document.getElementById('current-temperature').innerText = current.temperature + ' °C';
            document.getElementById('current-wind-speed').innerText = current.windspeed + ' km/h';
            document.getElementById('current-wind-direction').innerText = degreesToDirection(current.winddirection);
            document.getElementById('weather-description').innerText = weatherCodeToDescription(current.weathercode);
            document.getElementById('weather-timestamp').innerText = `Czas pomiaru: ${current.time}`;
        }
        catch (error) {
            console.error("Błąd geolokalizacji:", error);
            alert('Nie udało się pobrać pogody: ' + error.message);
        }
    }, () => {
        alert('Nie udało się pobrać lokalizacji');
    });
}

// Inicjuj UAParser
const parser = new UAParser();
const device = parser.getDevice();
const os = parser.getOS();
const browser = parser.getBrowser();

console.log('Device:', device);
console.log('OS:', os);
console.log('Browser:', browser);

// Przygotuj string do wysłania do GA
const deviceModel = device.model || 'Unknown model';
const deviceType = device.type || 'Unknown type';
const osName = os.name || 'Unknown OS';
const osVersion = os.version || '';
const browserName = browser.name || 'Unknown browser';

// Możesz złożyć ładny string:
const deviceInfo = `${deviceModel} (${deviceType}), OS: ${osName} ${osVersion}, Browser: ${browserName}`;