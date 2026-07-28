// Deriv Synthetic Asset Pricing Matrices Configurations
const derivAssets = {
    v100: { name: "Volatility 100 (1s) Index", base: 12500.50, volatility: 4.5, history: [] },
    v75: { name: "Volatility 75 Index", base: 375200.10, volatility: 25.0, history: [] },
    bear: { name: "Bear Market Index", base: 240.25, volatility: 0.15, history: [] }
};

let currentAsset = "v100";
let durationMode = "Ticks";
let demoBalance = 10000.00;
let chartInstance = null;

// Seed data loop
function seedSyntheticData() {
    Object.keys(derivAssets).forEach(key => {
        let currentPrice = derivAssets[key].base;
        for (let i = 0; i < 20; i++) {
            let change = (Math.random() - 0.5) * derivAssets[key].volatility;
            if (key === 'bear') change -= 0.02; 
            currentPrice = Number((currentPrice + change).toFixed(2));
            derivAssets[key].history.push(currentPrice);
        }
    });
}

// Chart.js Configuration mapping Deriv's style elements
function initializeDerivChart() {
    const ctx = document.getElementById('derivTickChart').getContext('2d');
    const assetHistory = derivAssets[currentAsset].history;
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(assetHistory.length).fill(''),
            datasets: [{
                data: [...assetHistory],
                borderColor: '#ff444f', // Deriv Coral Red
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: '#24262c' }, ticks: { color: '#999ea8', font: { size: 11 } } },
                x: { display: false }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// Emulate live continuous calculations
function tickStreamingEngine() {
    const asset = derivAssets[currentAsset];
    const history = asset.history;
    const oldPrice = history[history.length - 1];
    
    let change = (Math.random() - 0.5) * asset.volatility;
    if (currentAsset === 'bear') change -= 0.02;
    
    const newPrice = Number((oldPrice + change).toFixed(2));
    history.push(newPrice);
    if (history.length > 25) history.shift();

    document.getElementById("navSpotPrice").innerText = newPrice.toLocaleString(undefined, {minimumFractionDigits: 2});
    
    const changeAmount = Number((newPrice - oldPrice).toFixed(2));
    const percentChange = ((changeAmount / oldPrice) * 100).toFixed(3);
    const statsEl = document.getElementById("priceTickChange");
    
    if (changeAmount >= 0) {
        statsEl.className = "tick-up";
        statsEl.innerText = `▲ +${changeAmount} (+${percentChange}%)`;
        document.getElementById("navSpotPrice").style.color = "var(--deriv-green)";
    } else {
        statsEl.className = "tick-down";
        statsEl.innerText = `▼ ${changeAmount} (${percentChange}%)`;
        document.getElementById("navSpotPrice").style.color = "var(--deriv-red)";
    }

    if (chartInstance) {
        chartInstance.data.labels = Array(history.length).fill('');
        chartInstance.data.datasets.data = [...history];
        chartInstance.update('none');
    }
}

// Trade Placement Handler
function submitDerivContract(contractType) {
    const stake = parseFloat(document.getElementById("stakeValue").value);
    if (stake > demoBalance) { alert("Insufficient credits."); return; }
    
    demoBalance -= stake;
    document.getElementById("walletBalance").innerText = `$${demoBalance.toLocaleString(undefined, {minimumFractionDigits: 2})} USD`;
    
    const entryPrice = derivAssets[currentAsset].history[derivAssets[currentAsset].history.length - 1];
    const logContainer = document.getElementById("positionsHistoryLog");
    
    if(logContainer.classList.contains("positions-empty-text")) {
        logContainer.innerHTML = "";
        logContainer.className = "positions-active-list";
    }

    const duration = document.getElementById("durationValue").value;
    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";
    logEntry.innerHTML = `
        <div><strong>${contractType} Placed</strong><br>${duration} ${durationMode} | Stake: $${stake}</div>
        <div style="text-align:right">Entry Spot:<br><strong>$${entryPrice}</strong></div>
    `;
    
    logContainer.insertBefore(logEntry, logContainer.firstChild);

    setTimeout(() => {
        const exitPrice = derivAssets[currentAsset].history[derivAssets[currentAsset].history.length - 1];
        let won = false;
        if (contractType === 'RISE' && exitPrice > entryPrice) won = true;
        if (contractType === 'FALL' && exitPrice < entryPrice) won = true;

        if (won) {
            const profit = stake * 1.954;
            demoBalance += profit;
            logEntry.style.borderLeft = "3px solid var(--deriv-green)";
            logEntry.innerHTML += `<div style="color:var(--deriv-green); font-weight:bold; font-size:12px; margin-top:4px; width:100%;">✓ WIN (+$${(profit - stake).toFixed(2)})</div>`;
        } else {
            logEntry.style.borderLeft = "3px solid var(--deriv-red)";
            logEntry.innerHTML += `<div style="color:var(--deriv-red); font-weight:bold; font-size:12px; margin-top:4px; width:100%;">✗ LOSS (-$${stake.toFixed(2)})</div>`;
        }
        document.getElementById("walletBalance").innerText = `$${demoBalance.toLocaleString(undefined, {minimumFractionDigits: 2})} USD`;
    }, 3000);
}

function toggleAssetMenu() {
    const menu = document.getElementById("assetDropdownMenu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function changeDerivAsset(key) {
    currentAsset = key;
    document.getElementById("currentAssetDisplay").innerText = derivAssets[key].name;
    document.getElementById("chartAssetTitle").innerText = derivAssets[key].name;
    toggleAssetMenu();
    if(chartInstance) {
        chartInstance.data.datasets.data = [...derivAssets[key].history];
        chartInstance.update();
    }
}

function setDurationMode(mode) {
    durationMode = mode;
    document.getElementById("btnTicks").classList.toggle("active", mode === "Ticks");
    document.getElementById("btnMinutes").classList.toggle("active", mode === "Minutes");
    document.getElementById("durationUnitLabel").innerText = mode;
    document.getElementById("durationValue").value = mode === "Ticks" ? 5 : 1;
}

function adjustValue(id, change) {
    const input = document.getElementById(id);
    let val = parseFloat(input.value) + change;
    if (val < 1) val = 1;
    input.value = val;
}

window.onclick = function(e) {
    if (!e.target.matches('.asset-selector-dropdown') && !e.target.matches('#currentAssetDisplay') && !e.target.matches('.dropdown-arrow')) {
        document.getElementById("assetDropdownMenu").style.display = "none";
    }
}

window.onload = () => {
    seedSyntheticData();
    initializeDerivChart();
    setInterval(tickStreamingEngine, 1000); // 1-second price ticks
};
