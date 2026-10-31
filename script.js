
const schedule = [
    ["Lekcja 1", "08:00", "08:45"],
    ["Lekcja 2", "08:55", "09:40"],
    ["Lekcja 3", "09:50", "10:35"],
    ["Lekcja 4", "10:45", "11:30"],
    ["Lekcja 5", "11:45", "12:30"],
    ["Lekcja 6", "12:35", "13:20"],
    ["Lekcja 7", "13:30", "14:15"],
    ["Lekcja 8", "14:20", "15:05"]
];

const $ = id => document.getElementById(id);

function minutes(value) {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return [h, m, s]
        .map(value => String(value).padStart(2, "0"))
        .join(":");
}

function renderSchedule() {
    $("schedule").innerHTML = schedule.map((item, i) => `
        <div class="lesson-row" id="lesson-${i}">
            <span class="lesson-name">${item[0]}</span>
            <span class="lesson-time">${item[1]} - ${item[2]}</span>
            <span class="lesson-state" id="state-${i}">PLANOWANA</span>
        </div>
    `).join("");
}

function update() {
    const now = new Date();

    const current = now.getHours() * 60 + now.getMinutes();
    const second = now.getSeconds();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    $("clock").textContent = now.toLocaleTimeString("pl-PL", {
        hour12: false
    });

    $("date").textContent = now.toLocaleDateString("pl-PL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    let active = -1;
    let nextChange = null;

    schedule.forEach((item, i) => {
        const start = minutes(item[1]);
        const end = minutes(item[2]);

        if (start <= current && current < end) {
            active = i;
        }

        if (start > current) {
            if (nextChange === null || start < nextChange) {
                nextChange = start;
            }
        }

        if (end > current) {
            if (nextChange === null || end < nextChange) {
                nextChange = end;
            }
        }
    });

    let status = "OCZEKIWANIE";
    let lesson = "OCZEKIWANIE";
    let statusColor = "var(--blue)";
    let countdown = "--:--:--";

    if (isWeekend) {
        status = "DZIEŃ WOLNY";
        lesson = "WEEKEND";
        statusColor = "var(--orange)";
        countdown = "BRAK LEKCJI";

    } else if (active !== -1) {
        status = "TRWA LEKCJA";
        lesson = schedule[active][0].toUpperCase();
        statusColor = "var(--green)";

    } else if (current < minutes("08:00")) {
        status = "PRZED LEKCJAMI";
        lesson = "OCZEKIWANIE";

    } else if (current >= minutes("15:05")) {
        status = "GODZINY POZALEKCYJNE";
        lesson = "KONIEC ZAJĘĆ";
        statusColor = "var(--orange)";
        countdown = "KONIEC PLANU";

    } else {
        status = "TRWA PRZERWA";
        lesson = "PRZERWA";
        statusColor = "var(--orange)";
    }

    if (!isWeekend && nextChange !== null) {
        const remaining = nextChange * 60 - (current * 60 + second);
        countdown = formatTime(Math.max(0, remaining));
    }

    $("status").textContent = status;
    $("status").style.color = statusColor;

    $("lesson").textContent = lesson;
    $("countdown").textContent = countdown;

    schedule.forEach((item, i) => {
        const start = minutes(item[1]);
        const end = minutes(item[2]);

        const row = $("lesson-" + i);
        const state = $("state-" + i);

        row.classList.toggle(
            "active",
            !isWeekend && active === i
        );

        row.classList.toggle(
            "finished",
            !isWeekend && current >= end
        );

        if (isWeekend) {
            state.textContent = "DZIEŃ WOLNY";
        } else if (active === i) {
            state.textContent = "● TERAZ";
        } else if (current >= end) {
            state.textContent = "ZAKOŃCZONA";
        } else {
            state.textContent = "PLANOWANA";
        }
    });
}

renderSchedule();
update();

// Synchronizacja zegara z początkiem każdej sekundy
function startClock() {
    update();

    const delay = 1000 - (Date.now() % 1000);

    setTimeout(() => {
        update();
        setInterval(update, 1000);
    }, delay);
}

startClock();
