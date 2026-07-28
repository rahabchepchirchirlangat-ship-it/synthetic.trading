// Local In-Memory Data Storage Architecture
const assetsData = {
    bitcoin: { name: "Bitcoin (BTC)", symbol: "btc", priceHistory: [64000, 64100, 64050, 64200, 64150, 64210] },
    ethereum: { name: "Ethereum (ETH)", symbol: "eth", priceHistory: [3400, 3420, 3410, 3435, 3425, 3440] },
    solana: { name: "Solana (SOL)", symbol: "sol", priceHistory: [140, 142, 141, 144, 143, 145] }
};

let currentAssetKey = "bitcoin";
let chartInstance = null;

// Initialize System Canvas Tracking Interface 
function initChart() {
    const ctx = document.getElementById('marketChart').getContext('2d');
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['10s ago', '8s ago', '6s ago', '4s ago', '2s ago', 'Current'],
            datasets: [{
                label: 'Asset Exchange Value (USD)',
                data: [...assetsData[currentAssetKey].priceHistory],
                borderColor: '#ff444f',
                backgroundColor: 'rgba(255, 68, 79, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: '#24262c' }, ticks: { color: '#999ea8' } },
                x: { grid: { color: '#24262c' }, ticks: { color: '#999ea8' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// Fetch Prices Dynamically From Public API Systems
async function streamMarketUpdates() {
    try {
        const res = await fetch("https://coingecko.com");
        if (!res.ok) throw new Error("API Restrict Rate Triggered");
        const data = await res.json();

        // Map live stream figures to internal dictionary arrays
        assetsData.bitcoin.priceHistory.push(data.bitcoin.usd);
        assetsData.ethereum.priceHistory.push(data.ethereum.usd);
        assetsData.solana.priceHistory.push(data.solana.usd);
    } catch (e) {
        // Mock fallback simulation values if API is unavailable
        Object.keys(assetsData).forEach(key => {
            const history = assetsData[key].priceHistory;
            const currentPrice = history[history.length - 1];
            const noise = (Math.random() - 0.5) * (currentPrice * 0.005);
            history.push(Number((currentPrice + noise).toFixed(2)));
        });
    }

    // Keep arrays limited to the last 6 values to maintain chart layout alignment
    Object.keys(assetsData).forEach(key => {
        if(assetsData[key].priceHistory.length > 6) assetsData[key].priceHistory.shift();
    });

    renderUI();
}

// Refresh UI Component Containers
function renderUI() {
    // Render the Sidebar List
    const listContainer = document.getElementById("assetList");
    const searchQuery = document.getElementById("assetSearch").value.toLowerCase();
    listContainer.innerHTML = "";

    Object.keys(assetsData).forEach(key => {
        const asset = assetsData[key];
        if (!asset.name.toLowerCase().includes(searchQuery)) return;

        const currentPrice = asset.priceHistory[asset.priceHistory.length - 1];
        const itemDiv = document.createElement("div");
        itemDiv.className = `asset-item ${key === currentAssetKey ? 'active' : ''}`;
        itemDiv.onclick = () => selectAsset(key);
        itemDiv.innerHTML = `<span>${asset.name}</span><strong>$${currentPrice.toLocaleString()}</strong>`;
        listContainer.appendChild(itemDiv);
    });

    // Update active visual panel data fields
    const activeHistory = assetsData[currentAssetKey].priceHistory;
    const latestPrice = activeHistory[activeHistory.length - 1];
    
    document.getElementById("selectedAssetTitle").innerText = assetsData[currentAssetKey].name;
    document.getElementById("dashboardPrice").innerText = `$${latestPrice.toLocaleString()}`;

    // Dynamic Chart Update Execution 
    if (chartInstance) {
        chartInstance.data.datasets[0].data = [...activeHistory];
        chartInstance.update();
    }
}

// Swap Currently Selected Financial Target Element
function selectAsset(key) {
    currentAssetKey = key;
    renderUI();
}

// Input Filter Mechanics Logic
function filterAssets() {
    renderUI();
}

// Order Simulator Logging Trigger Executions
function executeTrade(type) {
    const currentPrice = assetsData[currentAssetKey].priceHistory[assetsData[currentAssetKey].priceHistory.length - 1];
    const logEl = document.getElementById("tradeLog");
    logEl.innerText = `Order Executed: ${type} 1 unit of ${currentAssetKey.toUpperCase()} at $${currentPrice.toLocaleString()}`;
    logEl.style.color = type === 'BUY' ? 'var(--trend-green)' : 'var(--trend-red)';
}

// Dialog Window Control Triggers
function openModal() { document.getElementById("demoModal").style.display = "flex"; }
function closeModal() { document.getElementById("demoModal").style.display = "none"; }
function resetSimulation() {
    document.getElementById("tradeLog").innerText = "Simulation environment profile reset successfully.";
    document.getElementById("tradeLog").style.color = "var(--text-gray)";
    closeModal();
}

// System Boot sequences
window.onload = () => {
    initChart();
    renderUI();
    setInterval(streamMarketUpdates, 4000); // Poll fresh ticker changes every 4 seconds
};
