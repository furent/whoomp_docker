import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);


// Chart x axis
// Default 10 minutes
let timeLimitSeconds: number = 60 * 10;

/**
 * Displays a notification with customizable text for a few seconds.
 * @param {string} message - The notification message to display.
 */
export function showNotification(message: string): void {
    const notificationElement = document.getElementById("notification");
    if (notificationElement) {
        notificationElement.textContent = message;
        notificationElement.classList.remove("opacity-0", "pointer-events-none");
        notificationElement.classList.add("opacity-100");

        // Auto-hide the notification after 2.5 seconds
        setTimeout(() => {
            notificationElement.classList.remove("opacity-100");
            notificationElement.classList.add("opacity-0", "pointer-events-none");
        }, 2500);
    } else {
        console.error("Notification element not found");
    }
}

export function logToTerminal(message: string): void {
    const terminalCardElement = document.getElementById("terminalCard");
    const terminalLogElement = document.getElementById("terminalLog");

    if (terminalCardElement && terminalLogElement) {
        terminalCardElement.classList.remove("hidden");
        terminalLogElement.textContent += message;
    } else {
        console.error("Terminal elements not found");
    }
}

const elementIds: string[] = ["heartButton", "downloadButton", "deviceInfo", "utilityCard"];
export function hideElements(hide: boolean): void {
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.toggle("hidden", hide);
        } else {
            console.error(`Element with ID '${id}' not found`);
        }
    });
}

export function updateDeviceVersion(harvard: string, boylston: string): void {
    const versionElement = document.getElementById("deviceVersion");

    if (versionElement) {
        versionElement.textContent = `${harvard} ${boylston}`;
    } else {
        console.error("Version information UI element not found");
    }
}

export function updateWristStatus(isWorn: boolean): void {
    const wristStatusElement = document.getElementById("wristStatusValue");

    if (wristStatusElement) {
        wristStatusElement.textContent = isWorn ? "On" : "Off";

        // Reset colors first to avoid conflicts
        wristStatusElement.classList.remove("text-red-500", "text-green-500");

        // Apply green for "On" and red for "Off"
        if (isWorn) {
            wristStatusElement.classList.add("text-green-500");
        } else {
            wristStatusElement.classList.add("text-red-500");
        }
    } else {
        console.error("Wrist status UI element not found");
    }
}

export function updateChargingStatus(charging: boolean): void {
    const chargeStatusElement = document.getElementById("chargingStatusValue");

    if (chargeStatusElement) {
        chargeStatusElement.textContent = charging ? "Yes" : "No";

        // Reset colors first to avoid conflicts
        chargeStatusElement.classList.remove("text-red-500", "text-green-500");

        // Apply green for "Yes" and red for "No"
        if (charging) {
            chargeStatusElement.classList.add("text-green-500");
        } else {
            chargeStatusElement.classList.add("text-red-500");
        }
    } else {
        console.error("Charging status UI element not found");
    }
}

export function updateBattery(batteryLevel: number): void {
    const batteryLevelSpan = document.getElementById("batteryLevel");
    const progressBar = document.getElementById("progressBar");

    if (batteryLevelSpan && progressBar) {
        batteryLevelSpan.textContent = batteryLevel.toFixed(1);
        progressBar.style.width = `${batteryLevel}%`;

        if (batteryLevel < 20) {
            progressBar.classList.remove("bg-green-500", "bg-yellow-500");
            progressBar.classList.add("bg-red-500");
        } else if (batteryLevel < 50) {
            progressBar.classList.remove("bg-green-500", "bg-red-500");
            progressBar.classList.add("bg-yellow-500");
        } else {
            progressBar.classList.remove("bg-yellow-500", "bg-red-500");
            progressBar.classList.add("bg-green-500");
        }
    } else {
        console.error("Battery status UI elements not found");
    }
}

export function updateClock(unixTimestamp: number): void {
    const clockElement = document.getElementById("clockValue");
    const clockContainer = document.getElementById("clockValueP");

    if (!clockElement || !clockContainer) {
        console.error("Clock elements not found");
        return;
    }

    // Convert the timestamp into a readable date and time
    const date = new Date(unixTimestamp * 1000); // Convert seconds to milliseconds
    const formattedDate = date.toLocaleString(); // Format for local display

    // Update the UI
    clockElement.textContent = formattedDate;
    clockContainer.classList.remove("hidden"); // Make it visible if hidden
}

let heartRateChart: Chart | undefined; // Declare the chart variable
const heartRateData = {
    labels: [] as string[], // Time labels for the x-axis
    datasets: [{
        label: 'Heart Rate (bpm)',
        data: [] as number[], // Heart rate values for the y-axis
        borderColor: 'blue',
        borderWidth: 2, // Line width
        pointRadius: 0, // Removes the circle markers
        pointStyle: 'line', // Prevents any point shape from showing
        fill: false, // Do not fill under the line
        tension: 0.2 // Adjust curve tension as needed

    }]
};

export function createHeartRateChart(): void {
    const ctx = (document.getElementById("heartRateChart") as HTMLCanvasElement)?.getContext("2d");
    if (ctx) {
        heartRateChart = new Chart(ctx, {
            type: 'line',
            data: heartRateData,
            options: {
                responsive: true,
                animation: false,
                plugins: {
                    tooltip: {
                        enabled: true,          // Enable tooltips on hover
                        mode: 'index',          // Show tooltip no matter where you hover
                        intersect: false,
                        callbacks: {
                            label: function (tooltipItem: any) {
                                return `Heart Rate: ${tooltipItem.raw} bpm`;
                            }
                        }
                    },
                    legend: {
                        display: false          // This hides the label at the top
                    }
                },
                hover: {
                    mode: 'index',              // Highlight nearest x-axis point
                    axis: 'x',
                    intersect: false
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Heart Rate (bpm)'
                        },
                        beginAtZero: false, // Don't force y-axis to start at 0
                        suggestedMin: 50, // Set a reasonable minimum
                        suggestedMax: 120, // Set a reasonable maximum
                    }
                }
            }
        });
    } else {
        console.error("Heart rate chart canvas element not found");
    }
}

export function updateHeartStatus(isRealtimeActive: boolean): void {
    const heartButton = document.getElementById("heartButton");
    const heartRateStatus = document.getElementById("heartRateStatus"); // Get the status div

    if (heartButton && heartRateStatus) {
        if (isRealtimeActive) {
            heartButton.textContent = "Stop Heart Rate";
            heartRateStatus.classList.remove("hidden"); // Show on start
        } else {
            heartButton.textContent = "Start Heart Rate";
            heartRateStatus.classList.add("hidden"); // Hide on stop
        }
    } else {
        console.error("Heart rate UI elements not found");
    }
}

export function updateHeartRate(heartRate: number): void {
    const heartRateDisplay = document.getElementById("heartRate");
    if (heartRateDisplay) {
        heartRateDisplay.textContent = heartRate.toString();

        // Update chart data
        const now = new Date();
        const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        heartRateData.labels.push(timeLabel);
        heartRateData.datasets[0].data.push(heartRate);

        // Limit the amount of data points shown
        if (heartRateData.labels.length > timeLimitSeconds) {
            heartRateData.labels.shift();
            heartRateData.datasets[0].data.shift();
        }

        // Adjust the y-axis max if data exceeds 120
        const maxValue = Math.max(...heartRateChart!.data.datasets[0].data as number[]);
        heartRateChart!.options.scales!.y!.suggestedMax = maxValue > 120 ? 200 : 120;

        heartRateChart!.update();
    } else {
        console.error("Heart rate UI elements not found");
    }
}

export function updateTime(event: Event): void {
    const target = event.target as HTMLInputElement;
    let userTimeLimit = parseInt(target.value);

    // Enforce min and max limits
    if (isNaN(userTimeLimit) || userTimeLimit < 1) {
        target.value = "1";
        userTimeLimit = 1;
    } else if (userTimeLimit > 60) {
        target.value = "60";
        userTimeLimit = 60;
    }

    // Convert to seconds and apply the new time limit
    timeLimitSeconds = userTimeLimit * 60;
}
