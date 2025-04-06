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
    const url = `https://www.ote-cr.cz/cs/kratkodobe-trhy/elektrina/vnitrodenni-trh/@@chart-data?report_date=&time_resolution=PT15M`;

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

// Funkce pro formátování časových intervalů
function formatTimeIntervals(index) {
    const startMinutes = index * 15;
    const endMinutes = startMinutes + 15;
    const startHour = Math.floor(startMinutes / 60);
    const startMinute = startMinutes % 60;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;

    // Formátování na HH:MM
    const formatTime = (hour, minute) => 
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    return `${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`;
}

// Funkce pro vytvoření grafu
function createChart(canvasId, chartData) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Zkontrolujte, zda instance grafu již existuje, a pokud ano, zničte ji, aby se zabránilo překrývání
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
                    label: 'Max. cena (EUR/MWh)',
                    data: chartData.maxCena,
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
                },
                {
                    label: 'Min. cena (EUR/MWh)',
                    data: chartData.minCena,
                    borderColor: 'rgba(54, 162, 235, 1)', 
                    backgroundColor: 'rgba(54, 162, 235, 0.5)', 
                    borderWidth: 2, 
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: 'rgba(54, 162, 235, 1)',
                    type: 'line', 
                    yAxisID: 'y-axis-1',
                    order: 2, 
                },
                {
                    label: 'Vážený průměr (EUR/MWh)',
                    data: chartData.prumerCena,
                    borderColor: 'rgba(255, 206, 86, 1)', 
                    backgroundColor: 'rgba(255, 206, 86, 0.5)', 
                    borderWidth: 2, 
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBackgroundColor: 'rgba(255, 206, 86, 1)',
                    pointBorderColor: 'rgba(255, 206, 86, 1)',
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
                        text: 'Časový interval',
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
                            family: 'Arial', 
                            weight: 'bold' 
                        },
                        padding: 10, 
                        maxRotation: 90, 
                        minRotation: 90, 
                        autoSkip: false 
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
                    beginAtZero: false,
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
                        display: false 
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
                        boxWidth: 30, 
                        boxHeight: 30, 
                        padding: 20,
                        generateLabels: function(chart) {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels;
                            const labelsOriginal = original.call(this, chart);

                            // Corrected color assignment for legend items
                            labelsOriginal.forEach((label, index) => {
                                const dataset = chart.data.datasets[index];
                                label.fillStyle = dataset.backgroundColor; 
                                label.strokeStyle = dataset.borderColor; 
                                label.lineWidth = 2; 
                            });

                            return labelsOriginal;
                        }
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
        const { dataLine } = data.data;
        const graphTitle = data.graph.title; 
        const dateMatch = graphTitle.match(/\d{2}\.\d{2}\.\d{4}/); 

        // Aktualizace data ve výsledcích trhu
        if (dateMatch) {
            document.getElementById('market-date').textContent = dateMatch[0];
        } else {
            document.getElementById('market-date').textContent = 'N/A';
        }

        if (dataLine && dataLine.length > 0) {
            // Filtruje a extrahuje data pro graf, kde jsou hodnoty definovány
            const validData = dataLine[0].point.filter(p => p.y !== null && p.y !== undefined);

            const chartData = {
                labels: validData.map((p, index) => formatTimeIntervals(index)),  
                mnozstvi: validData.map(p => p.y), 
                prumerCena: dataLine[1].point.filter(p => p.y !== null && p.y !== undefined).map(p => p.y),
                minCena: dataLine[2].point.filter(p => p.y !== null && p.y !== undefined).map(p => p.y),
                maxCena: dataLine[3].point.filter(p => p.y !== null && p.y !== undefined).map(p => p.y)
            };

            createChart('oteChart', chartData);
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
    setInterval(updateDashboard, 5 * 60 * 1000); 
};
