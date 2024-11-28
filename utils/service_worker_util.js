const { Worker } = require('worker_threads');

async function getItemsProfit(linesData, topProfitArray) {
    const numWorkers = 16; // Adjust based on your CPU cores
    const chunkSize = Math.ceil(linesData.length / numWorkers);
    const workerPromises = [];
    const tempArray = []

    for (let i = 0; i < numWorkers; i++) {
        const chunk = linesData.slice(i * chunkSize, (i + 1) * chunkSize);

        workerPromises.push(
            new Promise((resolve) => {
                const worker = new Worker('./utils/worker.js', {
                    workerData: chunk,
                });
                worker.on('message', (results) => {
                    // We only need to handle the 'results' message type to process data
                    results.data.forEach(item => tempArray.push(item.item_profit));
                    resolve();  // Resolve after processing
                });
                worker.on('error', (err) => {
                    console.error("Worker error:", err);
                    resolve();  // Resolve even on error to avoid hanging
                });
            })
        );
    }

    // Wait for all workers to complete
    await Promise.all(workerPromises);

    // Sort the array by profit after all workers are done
    tempArray.sort((a, b) => b.bestProfit - a.bestProfit);  // Sort in descending order

    // Slice the top 12 items
    tempArray.slice(0, 100).map((item) => topProfitArray.push(item));
}

module.exports = {
    getItemsProfit,
};
