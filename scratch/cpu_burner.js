// cpu_burner.js
// Intentionally burns CPU to trigger the Anomaly Engine and Recommendations
// WARNING: Only use this for controlled demo scenarios!

console.log("🔥 Initiating Controlled CPU Anomaly Scenario...");
console.log("Targeting CCTV Service...");
console.log("Starting infinite calculation loop...");

// A simple blocking loop that will peg the CPU to 100% on a single core
let x = 0;
while (true) {
    x += Math.random() * Math.random();
    if (x > Number.MAX_SAFE_INTEGER) {
        x = 0;
    }
}
