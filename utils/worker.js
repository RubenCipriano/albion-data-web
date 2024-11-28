const { parentPort, workerData } = require('worker_threads');
const { craftPriceCalculator } = require('./craft_price_util');

async function processChunk(chunk) {
    const results = [];
    let processedCount = 0;

    for (const item of chunk) {
        try {
            const itemProfit = await craftPriceCalculator(item);

            if (itemProfit?.bestProfitCity) {
                results.push({'item_name': item.item_name, 'item_profit': itemProfit});
            }
        } catch (error) {
            console.error('Error in worker thread:', error);
        }

        processedCount++;
    }

    // Send results back to the main thread
    if (processedCount > 0) {
        parentPort.postMessage({ type: 'results', data: results, processed: processedCount });
    }
}

// Run the processing and send results back to the main thread
processChunk(workerData);
