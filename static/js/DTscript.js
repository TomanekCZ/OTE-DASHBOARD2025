// Aktualizace data a času
function updateDateTime() {
    const now = new Date();
    document.getElementById('dateTime').textContent = now.toLocaleString('cs-CZ', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

setInterval(updateDateTime, 1000);

// Funkce pro získání dat z API
async function fetchData() {
    const today = new Date().toISOString().split('T')[0]; // Získej dnešní datum ve formátu YYYY-MM-DD
    const url = `https://www.ote-cr.cz/cs/kratkodobe-trhy/elektrina/denni-trh/@@chart-data?report_date=`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Chyba při načítání dat z URL: ' + response.statusText);
        }
        const data = await response.json();
        console.log("Data úspěšně načtena z URL:", data);
        return data;
    } catch (error) {
        console.error("Chyba při načítání dat z URL:", error);
        return null;
    }
}

// Funkce pro aktualizaci metriky
function updateMetric(id, value) {
    document.getElementById(id).textContent = value !== undefined ? value : '---';
}

// Funkce pro vytvoření grafu
function createChart(canvasId, chartData) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Check if chart instance already exists and destroy it to prevent overlapping
    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Cena (EUR/MWh)',
                    data: chartData.cena,
                    borderColor: 'rgb(255, 99, 132)', // Line color
                    backgroundColor: 'rgba(255, 99, 132, 0.2)', // Transparent line color
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: 'white',
                    pointBorderColor: 'rgb(255, 99, 132)',
                    type: 'line', // Line chart type
                    yAxisID: 'y-axis-1'
                },
                {
                    label: 'Množství (MWh)',
                    data: chartData.mnozstvi,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)', // Bar color
                    borderColor: 'rgba(54, 162, 235, 1)', // Border color for bars
                    borderWidth: 2, // Border width for bars
                    type: 'bar', // Bar chart type
                    yAxisID: 'y-axis-2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Hodina',
                        color: '#333'
                    },
                    grid: {
                        display: true,
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#333'
                    }
                },
                'y-axis-1': {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Cena (EUR/MWh)',
                        color: '#333'
                    },
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#333'
                    }
                },
                'y-axis-2': {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Množství (MWh)',
                        color: '#333'
                    },
                    beginAtZero: true,
                    grid: {
                        display: false // Hide grid for the second axis
                    },
                    ticks: {
                        color: '#333'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#333',
                        boxWidth: 25,
                        boxHeight: 25,
                        padding: 25,
                        usePointStyle: false,
                        generateLabels: function (chart) {
                            const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            labels.forEach((label, index) => {
                                if (index === 0) { // "Cena (EUR/MWh)"
                                    label.fillStyle = 'rgba(255, 99, 132, 0.5)'; // Adjusted fill color
                                    label.strokeStyle = 'rgb(255, 99, 132)'; // Border color for "Cena"
                                    label.lineWidth = 2; // Border width
                                } else if (index === 1) { // "Množství (MWh)"
                                    label.fillStyle = 'rgba(54, 162, 235, 0.8)'; // Bar color
                                    label.strokeStyle = 'rgba(54, 162, 235, 1)'; // Border color for "Množství"
                                    label.lineWidth = 2; // Border width
                                }
                            });
                            return labels;
                        }
                    },
                    onClick: function (e, legendItem, legend) {
                        const index = legendItem.datasetIndex;
                        const ci = legend.chart;
                        const meta = ci.getDatasetMeta(index);

                        // Toggle hidden state
                        meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                        ci.update();
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Hlavní funkce pro aktualizaci dashboardu
async function updateDashboard() {
    const data = await fetchData();

    if (data) {
        const { dataLine } = data.data;
        const graphTitle = data.graph.title; // Získání názvu grafu s datem
        const dateMatch = graphTitle.match(/\d{2}\.\d{2}\.\d{4}/); // Extrakce data pomocí regulárního výrazu

        // Aktualizace data ve výsledcích trhu
        if (dateMatch) {
            document.getElementById('market-date').textContent = dateMatch[0];
        } else {
            document.getElementById('market-date').textContent = 'N/A';
        }

        if (dataLine && dataLine.length > 0) {
            // Extract data for chart
            const chartData = {
                labels: dataLine[0].point.map(p => p.x),  // Extract x values (hours)
                mnozstvi: dataLine[0].point.map(p => p.y), // Extract y values for 'Množství (MWh)'
                cena: dataLine[1].point.map(p => p.y)     // Extract y values for 'Cena (EUR/MWh)'
            };

            createChart('oteChart', chartData);

            // Aktualizace metrik (nahraďte skutečnými hodnotami, pokud jsou dostupné)
            updateMetric('base-value', '---'); // Nahraďte skutečnou hodnotou, pokud je dostupná
            updateMetric('peak-value', '---'); // Nahraďte skutečnou hodnotou, pokud je dostupná
            updateMetric('offpeak-value', '---'); // Nahraďte skutečnou hodnotou, pokud je dostupná
        }
    } else {
        console.error("Nepodařilo se načíst data z API.");
        document.getElementById('market-date').textContent = 'Chyba při načítání dat';
    }
}

// Inicializace
window.onload = function() {
    updateDashboard();
    updateDateTime();
    setInterval(updateDashboard, 5 * 60 * 1000); // Aktualizace každých 5 minut
};

let chart; // Přidáme globální proměnnou pro graf

async function fetchMarketData() {
    try {
        const response = await fetch('/api/electricity-data');
        const data = await response.json();
        
        // Find the relevant data points
        const baseLoad = data.find(item => 
            item.commodity === 'BASE LOAD' && item.currency === 'EUR/MWh');
        const peakLoad = data.find(item => 
            item.commodity === 'PEAK LOAD' && item.currency === 'EUR/MWh');
        const offpeakLoad = data.find(item => 
            item.commodity === 'OFFPEAK LOAD' && item.currency === 'EUR/MWh');

        // Update the UI
        document.getElementById('base-load').textContent = baseLoad?.price || '-';
        document.getElementById('peak-load').textContent = peakLoad?.price || '-';
        document.getElementById('offpeak-load').textContent = offpeakLoad?.price || '-';

        // Update the market date if available
        if (baseLoad?.date) {
            document.getElementById('market-date').textContent = baseLoad.date;
        }
    } catch (error) {
        console.error('Error fetching market data:', error);
    }
}

// Initial fetch
fetchMarketData();

// Refresh data every 5 minutes
setInterval(fetchMarketData, 300000);