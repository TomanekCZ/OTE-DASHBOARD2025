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
    const url = `https://www.ote-cr.cz/cs/kratkodobe-trhy/elektrina/vnitrodenni-aukce-ida/@@chart-data?report_date=&ida_session=IDA1&time_resolution=PT15M`;

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

// Funkce pro formátování časových intervalů na hodiny 1 až 24
function formatHourLabels(dataPoints) {
    const labels = [];

    dataPoints.forEach((point, index) => {
        if (point % 4 === 0) {
            const hour = point / 4;
            labels.push(hour <= 24 ? hour.toString() : '');
        } else {
            labels.push('');
        }
    });

    return labels;
}

// Funkce pro vytvoření grafu
function createChart(canvasId, chartData) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Množství (MWh)',
                    data: chartData.mnozstvi,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)', 
                    borderColor: 'rgba(75, 192, 192, 0.8)', 
                    borderWidth: 2, 
                    type: 'bar', 
                    yAxisID: 'y-axis-2',
                    order: 1, 
                },
                {
                    label: 'Cena (EUR/MWh)',
                    data: chartData.prumerCena,
                    borderColor: 'rgba(255, 99, 132, 1)', 
                    backgroundColor: 'rgba(255, 99, 132, 0.5)', 
                    borderWidth: 2, 
                    pointRadius: 4, 
                    pointHoverRadius: 7, 
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)', 
                    pointBorderColor: 'rgba(255, 99, 132, 1)',
                    type: 'line', 
                    yAxisID: 'y-axis-1',
                    order: 2, 
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
                        color: '#333',
                        font: {
                            size: 12, 
                            family: 'Roboto',
                            weight: 'bold' 
                        },
                        padding: 10, 
                        maxRotation: 0, 
                        minRotation: 0, 
                        autoSkip: false,
                        callback: function(value, index) {
                            return chartData.labels[index]; // Only display hour labels
                        }
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
                    grid: {
                        display: true,
                        color: '#e0e0e0'
                    },
                    ticks: {
                        color: '#333',
                        autoSkip: true,
                    },
                },
                'y-axis-2': {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Množství (MWh)',
                        color: '#333'
                    },
                    grid: {
                        display: false 
                    },
                    ticks: {
                        color: '#333',
                        autoSkip: true,
                    },
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#333',
                        boxWidth: 30, 
                        boxHeight: 30, 
                        padding: 20,
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
            },
            elements: {
                line: {
                    tension: 0.4 
                }
            }
        }
    });
}

// Hlavní funkce pro aktualizaci dashboardu
async function updateDashboard() {
    const data = await fetchData();

    if (data) {
        const dataLines = data.data.dataLine;
        const graphTitle = data.graph.title;
        const dateMatch = graphTitle.match(/\d{2}\.\d{2}\.\d{4}/);

        if (dateMatch) {
            document.getElementById('market-date').textContent = dateMatch[0];
        } else {
            document.getElementById('market-date').textContent = 'N/A';
        }

        if (dataLines && dataLines.length > 0) {
            const quantityData = dataLines[0].point.map(p => ({
                x: parseInt(p.x, 10),
                y: p.y
            }));

            const priceData = dataLines[1].point.map(p => ({
                x: parseInt(p.x, 10),
                y: p.y
            }));

            const labels = formatHourLabels(quantityData.map(p => p.x));

            const chartData = {
                labels: labels,
                mnozstvi: quantityData.map(p => p.y),
                prumerCena: priceData.map(p => p.y)
            };

            createChart('oteChart', chartData);
        }
    } else {
        console.error("Nepodařilo se načíst data z API.");
        document.getElementById('market-date').textContent = 'Chyba při načítání dat';
    }
}

window.onload = function() {
    updateDashboard();
    updateDateTime();
    setInterval(updateDashboard, 5 * 60 * 1000); 
};
