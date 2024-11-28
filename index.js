const cors = require('cors');
const express = require('express');
const chalk = require('chalk'); // Import chalk for styling logs
const app = express();
const fs = require('fs');
const { parseLine } = require('./utils/items');
const { craftPriceCalculator } = require('./utils/craft_price_util');
const { transportPriceCalculator } = require('./utils/transport_price_util');
const { getItemsProfit } = require('./utils/service_worker_util');
const itemsFilePath = "./src/data/items.txt";
const consumablesFilePath = "./src/data/consumables.txt";
app.use(cors());

let fileData = null;
let itemsData = [];
let consumablesData = [];
let profitArrayItems = []
let profitArrayConsumables = []


// Set up EJS as the template engine
app.set('views', './views'); // Base views folder
app.use(express.static('views'));

// Helper function for logging
function logRequest(req, elapsedTime, statusCode = 200) {
    const { method, originalUrl, params, query } = req;
    const paramString = JSON.stringify(params);
    const queryString = Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&');

    const logText = `[${method}] ${originalUrl} params: ${paramString} query: ${queryString} [ElapsedTime: ${elapsedTime.toFixed(3)}ms]`;

    // Determine log color based on status code
    if (statusCode >= 200 && statusCode < 300) {
        console.log(chalk.green(logText)); // Success: Green
    } else if(statusCode == 500) {
        console.log(chalk.red(logText)); // Error: Red
    } else {
        console.log(chalk.yellow(logText)); // Error: Red
    }
}

// Read and parse the items file
try {
    const startFileReadTime = Date.now();

    fileData = fs.readFileSync(consumablesFilePath, 'utf-8').split('\n');
    fileData.forEach(line => {
        if (line.trim()) { // Skip empty lines
            let parsedLine = parseLine(line);
            consumablesData.push(parsedLine);
        }
    });

    console.log(`Items file loaded and parsed in ${Date.now() - startFileReadTime}ms`);
} catch (err) {
    console.error("Error reading or parsing items:", err);
}

// Read and parse the items file
try {
    const startFileReadTime = Date.now();

    fileData = fs.readFileSync(itemsFilePath, 'utf-8').split('\n');
    fileData.forEach(line => {
        if (line.trim()) { // Skip empty lines
            let parsedLine = parseLine(line);
            itemsData.push(parsedLine);
        }
    });

    console.log(`Items file loaded and parsed in ${Date.now() - startFileReadTime}ms`);
} catch (err) {
    console.error("Error reading or parsing items:", err);
}

getItemsProfit(consumablesData, profitArrayConsumables).then(() => console.log("Best Consumables Deals Gotten!"))

getItemsProfit(itemsData, profitArrayItems).then(() => console.log("Best Items Deals Gotten!"))

// First interval runs every 5 minutes (300,000 milliseconds)
setInterval(() => {
    getItemsProfit(consumablesData, profitArrayConsumables).then(() => console.log("Best Consumable Deals Gotten!"))
}, 300000);

// Second interval runs every 1 hour (3,600,000 milliseconds)
setInterval(() => {
    getItemsProfit(itemsData, profitArrayItems).then(() => console.log("Best Items Deals Gotten!"))
}, 3600000);

// Home route
app.get("/", (req, res) => {
    const startTime = Date.now();

    res.render("index");

    logRequest(req, Date.now() - startTime); // Log as success (green)
});

// API route for crafting prices
app.get("/api/crafting_prices/:item_name", async (req, res) => {
    const startTime = Date.now();

    try {
        const itemFound = linesData.find(item => item.item_name == req.params.item_name);

        if(!itemFound) throw Error("Item Not Found")

        const response = await craftPriceCalculator(itemFound);

        if(response) {
            res.send(response);
            logRequest(req, Date.now() - startTime); // Log as success (green)
        } else {
            logRequest(req, Date.now() - startTime, 300)
        }
    } catch (error) {
        
        console.error(`Error processing crafting prices for ${req.params.item_name}:`, error);
        res.status(500).send("An error occurred");
        logRequest(req, Date.now() - startTime, 500); // Log as an error (red)
    }
});

app.get("/api/best_deals_items", async (req, res) => {
    const startTime = Date.now();

    try {

        if(profitArrayItems) {
            res.send(profitArrayItems);
            
            logRequest(req, Date.now() - startTime); // Log as success (green)
        } else {
            logRequest(req, Date.now() - startTime, 300)
        }
    } catch (error) {
        
        console.error(`Error processing crafting prices for ${req.params.item_name}:`, error);
        res.status(500).send("An error occurred");
        logRequest(req, Date.now() - startTime, 500); // Log as an error (red)
    }
});

app.get("/api/best_deals_consumables", async (req, res) => {
    const startTime = Date.now();

    try {

        if(profitArrayConsumables) {
            res.send(profitArrayConsumables);
            
            logRequest(req, Date.now() - startTime); // Log as success (green)
        } else {
            logRequest(req, Date.now() - startTime, 300)
        }
    } catch (error) {
        
        console.error(`Error processing crafting prices for ${req.params.item_name}:`, error);
        res.status(500).send("An error occurred");
        logRequest(req, Date.now() - startTime, 500); // Log as an error (red)
    }
});

// API route for crafting prices
app.get("/api/transportation/:item_name", async (req, res) => {
    const startTime = Date.now();

    try {
        const itemFound = linesData.find(item => item.item_name == req.params.item_name);

        if(!itemFound) throw Error("Item Not Found")

        const response = await transportPriceCalculator(itemFound);

        if(response) {
            res.send(response);

            logRequest(req, Date.now() - startTime); // Log as success (green)
        } else {
            logRequest(req, Date.now() - startTime, 300)
        }
    } catch (error) {
        console.error(`Error processing crafting prices for ${req.params.item_name}:`, error);
        res.status(500).send("An error occurred");
        logRequest(req, Date.now() - startTime, 500); // Log as an error (red)
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
