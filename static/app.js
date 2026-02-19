const tg = Telegram.WebApp;
tg.expand();
document.body.style.background = tg.themeParams.bg_color || "#0f172a";
let habits = [];
let dailyHistory = {}; // {YYYY-MM-DD: {completed: X, total: Y}}

// Fayllarni yuklash
function loadData() {
    const saved = localStorage.getItem("habits");
    const history = localStorage.getItem("dailyHistory");
    
    if (saved) {
        habits = JSON.parse(saved);
    }
    if (history) {
        dailyHistory = JSON.parse(history);
        
        // Penalties massivini chekla
        Object.keys(dailyHistory).forEach(date => {
            if (!dailyHistory[date].penalties) {
                dailyHistory[date].penalties = [];
            }
        });
    }
}

// Fayllarni saqlash
function saveData() {
    localStorage.setItem("habits", JSON.stringify(habits));
    localStorage.setItem("dailyHistory", JSON.stringify(dailyHistory));
}

function addHabit() {
    const input = document.getElementById("habitInput");
    const name = input.value.trim();

    if (!name) return;

    const habit = {
        name: name,
        done: false
    };

    habits.push(habit);
    input.value = "";
    renderHabits();
}

function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const total = habits.length;
    const done = habits.filter(h => h.done).length;

    let percent = 0;
    if (total > 0) {
        percent = Math.round((done / total) * 100);
    }

    // Bugungi statistikani saqlash (jazolarni saqlab qolish)
    if (!dailyHistory[today]) {
        dailyHistory[today] = { completed: done, total: total, penalties: [] };
    } else {
        dailyHistory[today].completed = done;
        dailyHistory[today].total = total;
    }
    saveData();

    document.getElementById("percentText").innerText = percent + "%";
    document.getElementById("statsText").innerText =
        `${done} / ${total} odat`;

    // Dumaloq diagramani yangilash
    const circle = document.getElementById("progressCircle");
    const circumference = 565; // 2 * Math.PI * 90
    const offset = circumference - (percent / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;

    
    updateMonthlyStats();
   
    updateYearlyStats();

    updateWeeklyTrend();

    updatePenaltyList();
}

function updateMonthlyStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalCompleted = 0;
    let totalRecords = 0;

    Object.entries(dailyHistory).forEach(([date, data]) => {
        const d = new Date(date + "T00:00:00");
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            totalCompleted += data.completed;
            totalRecords += data.total;
        }
    });

    let monthlyPercent = 0;
    if (totalRecords > 0) {
        monthlyPercent = Math.round((totalCompleted / totalRecords) * 100);
    }

    document.getElementById("monthlyPercent").innerText = monthlyPercent + "%";
    document.getElementById("monthlyStats").innerText = 
        `${totalCompleted} / ${totalRecords} odat`;
}

function updateYearlyStats() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    let totalCompleted = 0;
    let totalRecords = 0;

    Object.entries(dailyHistory).forEach(([date, data]) => {
        const d = new Date(date + "T00:00:00");
        if (d.getFullYear() === currentYear) {
            totalCompleted += data.completed;
            totalRecords += data.total;
        }
    });

    let yearlyPercent = 0;
    if (totalRecords > 0) {
        yearlyPercent = Math.round((totalCompleted / totalRecords) * 100);
    }

    document.getElementById("yearlyPercent").innerText = yearlyPercent + "%";
    document.getElementById("yearlyStats").innerText = 
        `${totalCompleted} / ${totalRecords} odat`;
}

function updateWeeklyTrend() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }

    const trendContainer = document.getElementById("weekTrend");
    trendContainer.innerHTML = "";

    const maxPercent = 100;
    
    days.forEach((date, idx) => {
        const data = dailyHistory[date] || { completed: 0, total: 0 };
        const percent = data.total > 0 ? (data.completed / data.total) * 100 : 0;
        const height = (percent / maxPercent) * 100;
        
        const isToday = date === new Date().toISOString().split('T')[0];
        const color = isToday ? "#22c55e" : (percent > 50 ? "#3b82f6" : "#475569");

        const bar = document.createElement("div");
        bar.style.cssText = `
            width: 12px;
            background: ${color};
            border-radius: 2px;
            height: ${Math.max(5, height)}%;
            min-height: 3px;
            transition: background 0.3s ease;
            cursor: pointer;
        `;
        bar.title = `${date}: ${Math.round(percent)}%`;
        bar.onmouseover = () => bar.style.opacity = "0.8";
        bar.onmouseout = () => bar.style.opacity = "1";
        
        trendContainer.appendChild(bar);
    });
}

function toggleHabit(index) {
    habits[index].done = !habits[index].done;

    if (habits[index].done) {
        Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }

    renderHabits();
}

function deleteHabit(index) {
    const habitName = habits[index].name;
    
    // Jazo dialog
    const penalty = prompt(
        `"${habitName}" ni o'chirmasdan JAZO qo'y:\n\n` +
        `1 - 10 ta arjimaniya\n` +
        `2 - 5 ta turnik\n` +
        `3 - 20 ta push-up\n` +
        `4 - 50 ta skip rope\n` +
        `0 - Bekorini qil\n\n` +
        `Raqamni kiriting:`,
        ""
    );

    if (!penalty || penalty === "0" || penalty === "") {
        return;
    }

    const penaltyMap = {
        "1": "💪 10 ta arjimaniya",
        "2": "🤸 5 ta turnik",
        "3": "🏋️ 20 ta push-up",
        "4": "🪢 50 ta skip rope"
    };

    if (!penaltyMap[penalty]) {
        alert("Noto'g'ri raqam! Qayta urinib ko'ring.");
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    if (!dailyHistory[today]) {
        dailyHistory[today] = { completed: 0, total: 0, penalties: [] };
    }

    if (!dailyHistory[today].penalties) {
        dailyHistory[today].penalties = [];
    }

    const penaltyRecord = {
        habit: habitName,
        type: penaltyMap[penalty],
        timestamp: new Date().toLocaleString()
    };

    dailyHistory[today].penalties.push(penaltyRecord);
    saveData();

    // Jazo qildini ko'rsat
    alert(` Jazo e'lon qilindi!\n\n${habitName}\n${penaltyMap[penalty]}\n\nCharchadizmi! 💪`);
    
    habits.splice(index, 1);
    renderHabits();
    updatePenaltyList();
}

function renderHabits() {
    const list = document.getElementById("habitList");
    list.innerHTML = "";

    habits.forEach((habit, index) => {
        const div = document.createElement("div");
        div.className = "habit";

        div.innerHTML = `
            <span style="${habit.done ? 'text-decoration: line-through;' : ''}">
                ${habit.name}
            </span>
            <div style="display:flex; gap:8px;">
                <button onclick="toggleHabit(${index})" style="background:#ef4444;">
                    ${habit.done ? "✅" : "✔"}
                </button>
                <button onclick="deleteHabit(${index})" style="background:#22c55e; padding:8px 10px;">
                    ❌
                </button>
            </div>
        `;

        list.appendChild(div);
    });

    updateDashboard();
}

loadData();
renderHabits();
updatePenaltyList();

function updatePenaltyList() {
    const today = new Date().toISOString().split('T')[0];
    const penaltyContainer = document.getElementById("penaltyList");
    
    const todayData = dailyHistory[today];
    const penalties = todayData && todayData.penalties ? todayData.penalties : [];

    if (penalties.length === 0) {
        penaltyContainer.innerHTML = '<div style="color:#64748b;">Jazo yo\'q 😊</div>';
        return;
    }

    let html = '';
    penalties.forEach((penalty, idx) => {
        html += `<div style="margin-bottom:8px; padding:8px; background:#1a1f35; border-radius:6px; border-left:3px solid #ef4444;">
            <div style="color:#f87171; font-weight:600;">${penalty.habit}</div>
            <div style="color:#cbd5e1; font-size:11px; margin-top:2px;">${penalty.type}</div>
            <div style="color:#64748b; font-size:10px; margin-top:2px;">${penalty.timestamp}</div>
        </div>`;
    });

    penaltyContainer.innerHTML = html;
}
