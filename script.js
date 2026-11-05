
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
    const currentSeconds = current * 60 + second;

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
    let nextLesson = -1;

    schedule.forEach((item, i) => {
        const start = minutes(item[1]);
        const end = minutes(item[2]);

        if (start <= current && current < end) {
            active = i;
        }

        if (start * 60 > currentSeconds) {
            if (nextChange === null || start < nextChange) {
                nextChange = start;
                nextLesson = i;
            }
        }
    });

    let status = "OCZEKIWANIE";
    let lesson = "OCZEKIWANIE";
    let state = "before";
    let countdown = "--:--:--";

    if (isWeekend) {
        status = "DZIEŃ WOLNY";
        lesson = "WEEKEND";
        state = "weekend";
        countdown = "BRAK LEKCJI";

    } else if (active !== -1) {
        status = "TRWA LEKCJA";
        lesson = schedule[active][0].toUpperCase();
        state = "lesson";

        nextChange = minutes(schedule[active][2]);

    } else if (currentSeconds < minutes("08:00") * 60) {
        status = "PRZED LEKCJAMI";
        lesson = "OCZEKIWANIE";
        state = "before";

    } else if (currentSeconds >= minutes("15:05") * 60) {
        status = "GODZINY POZALEKCYJNE";
        lesson = "KONIEC ZAJĘĆ";
        state = "after";
        countdown = "KONIEC PLANU";

    } else {
        status = "TRWA PRZERWA";
        lesson = "PRZERWA";
        state = "break";

        if (nextChange !== null) {
            const remaining = nextChange * 60 - currentSeconds;

            if (remaining > 0 && remaining <= 120) {
                status = "KONIEC PRZERWY";
                lesson = "ZA CHWILĘ DZWONEK!";
                state = "break-ending";
            }
        }
    }

    if (!isWeekend && nextChange !== null &&
        state !== "after") {
        const remaining = nextChange * 60 - currentSeconds;
        countdown = formatTime(Math.max(0, remaining));
    }

    // Aktualizacja kolorów zegara i statusu
    $("app").dataset.state = state;
    $("clock-card").dataset.state = state;

    $("status").textContent = status;
    $("lesson").textContent = lesson;
    $("countdown").textContent = countdown;

    // Aktualizacja harmonogramu
    schedule.forEach((item, i) => {
        const start = minutes(item[1]);
        const end = minutes(item[2]);

        const row = $("lesson-" + i);
        const stateLabel = $("state-" + i);

        const isFinished = current >= end;

        row.classList.toggle(
            "active",
            !isWeekend && active === i
        );

        row.classList.toggle(
            "finished",
            !isWeekend && active !== i && isFinished
        );

        if (isWeekend) {
            stateLabel.textContent = "DZIEŃ WOLNY";
        } else if (active === i) {
            stateLabel.textContent = "● TERAZ";
        } else if (isFinished) {
            stateLabel.textContent = "ZAKOŃCZONA";
        } else {
            stateLabel.textContent = "PLANOWANA";
        }
    });
}

renderSchedule();

function startClock() {
    function tick() {
        update();

        const now = Date.now();
        const delay = 1000 - (now % 1000);

        setTimeout(tick, delay);
    }

    tick();
}

startClock();
