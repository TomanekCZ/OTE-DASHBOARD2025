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
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Chyba při načítání dat z URL: ' + response.statusText);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Chyba při načítání dat z URL:", error);
        return null;
    }
}

// Funkce pro získání dat za posledních 30 dní
async function fetchLast30DaysData() {
    const currentDate = new Date();
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(currentDate.getMonth() - 1);

    const urls = [
        `https://www.ote-cr.cz/cs/kratkodobe-trhy/plyn/vnitrodenni-trh/@@chart-data?report_date=${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`,
        `https://www.ote-cr.cz/cs/kratkodobe-trhy/plyn/vnitrodenni-trh/@@chart-data?report_date=${lastMonthDate.getFullYear()}-${(lastMonthDate.getMonth() + 1).toString().padStart(2, '0')}-01`
    ];

    const dataPromises = urls.map(url => fetchData(url));
    const results = await Promise.all(dataPromises);

    const combinedData = [];
    results.forEach(data => {
        if (data && data.data && data.data.dataLine) {
            combinedData.push(data);
        }
    });

    return combinedData;
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
                        text: 'Datum',
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
    const combinedData = await fetchLast30DaysData();

    if (combinedData && combinedData.length > 0) {
        // Initialize empty arrays to hold combined values
        let labels = [];
        let mnozstvi = [];
        let prumerCena = [];
        let minCena = [];
        let maxCena = [];

        // Separate data by previous and current month
        let previousMonthData = [];
        let currentMonthData = [];
        const currentDate = new Date();

        combinedData.forEach(data => {
            const { dataLine } = data.data;

            if (dataLine && dataLine.length > 0) {
                const points = dataLine[0].point.filter(p => {
                    const date = new Date(p.x);
                    const differenceInDays = (currentDate - date) / (1000 * 60 * 60 * 24);
                    return differenceInDays >= 0 && differenceInDays <= 30; // Only include the last 30 days
                });

                points.forEach(point => {
                    const pointDate = new Date(point.x);
                    if (pointDate.getMonth() === currentDate.getMonth()) {
                        currentMonthData.push(point);
                    } else {
                        previousMonthData.push(point);
                    }
                });
            }
        });

        // Sort each month’s data by date
        previousMonthData.sort((a, b) => new Date(a.x) - new Date(b.x));
        currentMonthData.sort((a, b) => new Date(a.x) - new Date(b.x));

        // Concatenate the sorted data into the final lists
        const allData = previousMonthData.concat(currentMonthData);

        labels = allData.map(p => p.x.split(' ')[0]);
        mnozstvi = allData.map(p => p.y);

        prumerCena = getDataForChart(combinedData, 1);
        minCena = getDataForChart(combinedData, 2);
        maxCena = getDataForChart(combinedData, 3);

        const chartData = {
            labels: labels,
            mnozstvi: mnozstvi,
            prumerCena: prumerCena,
            minCena: minCena,
            maxCena: maxCena
        };

        createChart('oteChart', chartData);
    } else {
        console.error("Nepodařilo se načíst data z API.");
        document.getElementById('market-date').textContent = 'Chyba při načítání dat';
    }
}

// Helper function to get sorted data for a specific chart line
function getDataForChart(combinedData, lineIndex) {
    let previousMonthData = [];
    let currentMonthData = [];
    const currentDate = new Date();

    combinedData.forEach(data => {
        const { dataLine } = data.data;

        if (dataLine && dataLine.length > lineIndex) {
            const points = dataLine[lineIndex].point.filter(p => {
                const date = new Date(p.x);
                const differenceInDays = (currentDate - date) / (1000 * 60 * 60 * 24);
                return differenceInDays >= 0 && differenceInDays <= 30; // Only include the last 30 days
            });

            points.forEach(point => {
                const pointDate = new Date(point.x);
                if (pointDate.getMonth() === currentDate.getMonth()) {
                    currentMonthData.push(point);
                } else {
                    previousMonthData.push(point);
                }
            });
        }
    });

    previousMonthData.sort((a, b) => new Date(a.x) - new Date(b.x));
    currentMonthData.sort((a, b) => new Date(a.x) - new Date(b.x));

    return previousMonthData.concat(currentMonthData).map(p => p.y);
}

// Inicializace
window.onload = function() {
    updateDashboard();
    updateDateTime();
    setInterval(updateDashboard, 5 * 60 * 1000); 
};
