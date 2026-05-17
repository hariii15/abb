// memory_leaker.js
// Gradually consumes memory in a loop to trigger "Memory Leak" detection
// WARNING: Only use this for controlled demo scenarios!

console.log("💧 Initiating Controlled Memory Leak Scenario...");
console.log("Targeting Auth Service...");

const leak = [];
let totalMB = 0;

setInterval(() => {
    // Allocate ~50MB of data every 5 seconds
    const buffer = Buffer.alloc(50 * 1024 * 1024, 'x');
    leak.push(buffer);
    totalMB += 50;
    console.log(`Leaked approximately ${totalMB} MB...`);
    
    if (totalMB > 1500) {
        console.log("Safety limit reached. Clearing leak.");
        leak.length = 0;
        totalMB = 0;
    }
}, 5000);
