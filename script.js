// Native Deriv API WebSocket Endpoint configuration
const DERIV_WS_URL = "wss://://derivws.com"; // Public student app ID
let wsConnection = null;

let currentSymbol = "R_100"; // Default Deriv Volatility 100 key identifier
let assetPriceHistory = [];
let chartInstance = null;
let demoBalance = 10000.00;

// Initialize Chart.js configuration
function initChart() {
    const ctx = document.getElementById('derivTickChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(20).fill(''),
            datasets: [{
                data: [],
                borderColor: '#ff444f', // Deriv signature red brand accent
                borderWidth: 2,
                pointRadius: 2,
                pointBackgroundColor: '#ff444f',
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: '#24262c' }, ticks: { color: '#999ea8' } },
                x: { display: false }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// Connect directly to the production Deriv API WebSockets cluster
function connectToDerivAPI() {
    // If a connection exists, close it clean before building a new frame
    if (wsConnection) {
        wsConnection.close();
    }

    wsConnection = new WebSocket(DERIV_WS_URL);

    // As soon as the network channel handshakes, request targeted symbol streaming subscriptions
    wsConnection.onopen = () => {
        console.log(`Connected to Deriv Core Cloud. Subscribing to: ${currentSymbol}`);
        const subscriptionRequest = {
            ticks: currentSymbol,
            subscribe: 1
        };
        wsConnection.send(JSON.stringify(subscriptionRequest)); // Dispatches JSON to cloud servers
    };

    // Listen for data packets incoming down the pipe line from Deriv
    wsConnection.onmessage = (msgEvent) => {
        const responseData = JSON.parse(msgEvent.data);

        // Filter and verify incoming package contains valid pricing ticks
        if (responseData.msg_type === "tick" && responseData.tick) {
            processIncomingTick(responseData.tick);
        }
    };

    wsConnection.onerror = (error) => {
        document.getElementById("navSpotPrice").innerText = "Network Error";
        console.error("Deriv API Exception:", error);
    };

    wsConnection.onclose = () => {
        console.log("Deriv WebSocket Connection Closed. Attempting recovery...");
        setTimeout(connectToDerivAPI, 5000); // Fail-safe auto recovery hook
    };
}

// Map real server telemetry coordinates into frontend UI components
function processIncomingTick(tickData) {
    const freshQuotePrice = tickData.quote; // The actual index exchange value
    const spotDisplayEl = document.getElementById("navSpotPrice");

    // Track historical pricing logs array arrays
    const historicalLimit = 20;
    const oldQuotePrice = assetPriceHistory[assetPriceHistory.length - 1] || freshQuotePrice;
    
    assetPriceHistory.push(freshQuotePrice);
    if (assetPriceHistory.length > historicalLimit) {
        assetPriceHistory.shift();
    }

    // Dynamic color text feedback loops indicating asset trends
    spotDisplayEl.innerText = freshQuotePrice.toLocaleString(undefined, { minimumFractionDigits: 2 });
    const statsEl = document.getElementById("priceTickChange");
    const netDifference = (freshQuotePrice - oldQuotePrice).toFixed(2);

    if (freshQuotePrice >= oldQuotePrice) {
        spotDisplayEl.style.color = "var(--deriv-green)";
        statsEl.innerHTML = `<span class="tick-up">▲ +${netDifference}</span>`;
    } else {
        spotDisplayEl.style.color = "var(--deriv-red)";
        statsEl.innerHTML = `<span class="tick-down">▼ ${netDifference}</span>`;
    }

    // Pump raw server variables into the chart array
    if (chartInstance) {
        chartInstance.data.labels = Array(assetPriceHistory.length).fill('');
        chartInstance.data.datasets[0].data = [...assetPriceHistory];
        chartInstance.update('none'); // Instant canvas render avoiding frame drops
    }
}

// Handle Asset Selection Dropdown Switches
function changeDerivAsset(symbolKey) {
    currentSymbol = symbolKey;
    assetPriceHistory = []; // Wipe past telemetry to accommodate new baseline indexes
    
    const displayTitles = {
        'R_100': "Volatility 100 Index",
        'R_75': "Volatility 75 Index",
        'R_10': "Volatility 10 Index"
    };

    document.getElementById("currentAssetDisplay").innerText = displayTitles[symbolKey];
    document.getElementById("chartAssetTitle").innerText = displayTitles[symbolKey];
    
    toggleAssetMenu();
    connectToDerivAPI(); // Restart subscription feeds targeting new symbols
}

// Simulated execution contract engines
function submitDerivContract(contractType) {
    const stake = parseFloat(document.getElementById("stakeValue").value);
    if (stake > demoBalance) { alert("Insufficient Credits."); return; }

    demoBalance -= stake;
    document.getElementById("walletBalance").innerText = `$${demoBalance.toLocaleString(undefined, {minimumFractionDigits: 2})} USD`;

    const entryPrice = assetPriceHistory[assetPriceHistory.length - 1];
    const logContainer = document.getElementById("positionsHistoryLog");

    if (logContainer.classList.contains("positions-empty-text")) {
        logContainer.innerHTML = "";
        logContainer.className = "positions-active-list";
    }

    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";
    logEntry.innerHTML = `
        <div><strong>${contractType} Contract Opened</strong><br>5 Ticks | Stake: $${stake}</div>
        <div style="text-align:right">Entry Spot:<br><strong>$${entryPrice}</strong></div>
    `;
    logContainer.insertBefore(logEntry, logContainer.firstChild);

    // Resolution engine matching contract timelines
    setTimeout(() => {
        const exitPrice = assetPriceHistory[assetPriceHistory.length - 1];
        let won = (contractType === 'RISE' && exitPrice > entryPrice) || (contractType === 'FALL' && exitPrice < entryPrice);

        if (won) {
            const profit = stake * 1.954;
            demoBalance += profit;
            logEntry.style.borderLeft = "3px solid var(--deriv-green)";
            logEntry.innerHTML += `<div style="color:var(--deriv-green); font-weight:bold; font-size:12px; margin-top:4px;">✓ WIN (+$${(profit - stake).toFixed(2)})</div>`;
        } else {
            logEntry.style.borderLeft = "3px solid var(--deriv-red)";
            logEntry.innerHTML += `<div style="color:var(--deriv-red); font-weight:bold; font-size:12px; margin-top:4px;">✗ LOSS (-$${stake.toFixed(2)})</div>`;
        }
        document.getElementById("walletBalance").innerText = `$${demoBalance.toLocaleString(undefined, {minimumFractionDigits: 2})} USD`;
    }, 5000); // Resolves cleanly over 5 ticks (approx 5 seconds)
}

// Basic Utility View Helpers
function toggleAssetMenu() {
    const menu = document.getElementById("assetDropdownMenu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

window.onload = () => {
    initChart();
    connectToDerivAPI();
};
