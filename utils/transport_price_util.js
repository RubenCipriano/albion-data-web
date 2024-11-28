const HttpsProxyAgent = require('https-proxy-agent');

// Lista de proxies
const proxiesList = [
    // Mantém os proxies aqui
    "156.228.171.48:3128", "156.228.79.154:3128", // Outros proxies...
];

// Função para escolher um proxy aleatório
function getRandomProxy() {
    const randomIndex = Math.floor(Math.random() * proxiesList.length);
    const proxyUrl = proxiesList[randomIndex];
    return `http://${proxyUrl}`;
}

// Função genérica para buscar dados com proxy
async function fetchWithProxy(url) {
    const proxyUrl = getRandomProxy();
    const agent = new HttpsProxyAgent.HttpsProxyAgent(proxyUrl);

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url, { agent });
        return response.ok ? response.json() : null;
    } catch (error) {
        console.error(`Error fetching data from ${url} using proxy ${proxyUrl}:`, error);
        return null;
    }
}

// Função principal para calcular o preço de crafting
async function transportPriceCalculator(itemRequest) {

    const urlPriceGet = `https://west.albion-online-data.com/api/v2/stats/prices/${req.params.item_name}`;
   
    try {
        const [priceResponse] = await Promise.all([
            fetchWithProxy(urlPriceGet)
        ]);

        if (!priceResponse) throw new Error("Failed to fetch necessary data.");

        const validPrices = priceResponse.filter(item => parseInt(item.sell_price_min) > 0);
        const locationBasedCraftingPrices = {};

        calculateCityPrices(validPrices, itemRequest.item_quatity, locationBasedCraftingPrices);

        const { lowestSellCity, highestSellCity } = findLowestAndHighestSellCity(locationBasedCraftingPrices);
        const buyPriceNat = locationBasedCraftingPrices[lowestSellCity].sellPrice + (locationBasedCraftingPrices[lowestSellCity].sellPrice * 0.025);
        const sellPriceNat = locationBasedCraftingPrices[highestSellCity].sellPrice - (locationBasedCraftingPrices[highestSellCity].sellPrice * 0.105);

        return {
            bestBuyCity: lowestSellCity, 
            bestSellCity: highestSellCity, 
            bestBuyCityPrice: buyPriceNat, 
            bestSellCityPrice: sellPriceNat,
            profit: sellPriceNat - buyPriceNat, // Corrigido aqui
            profit_margin: ((sellPriceNat - buyPriceNat) / buyPriceNat * 100).toFixed(2) // Margem de lucro entre preço de venda e preço de compra
        };

    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

// Calcula os preços baseados em cidades
function calculateCityPrices(validPrices, qtdItem, locationBasedCraftingPrices) {
    validPrices.forEach(priceData => {
        const city = priceData.city;
        if (!locationBasedCraftingPrices[city]) locationBasedCraftingPrices[city] = {};

        locationBasedCraftingPrices[city].sellPrice = priceData.sell_price_min * qtdItem;
        locationBasedCraftingPrices[city].buyPrice = priceData.buy_price_min * qtdItem;
    });
}

// Determina o melhor lucro por cidade
function findLowestAndHighestSellCity(locationBasedCraftingPrices) {
    let lowestSellCity = null;
    let highestSellCity = null;
    let lowestSellPrice = Infinity;
    let highestSellPrice = -Infinity;

    for (const sellCity in locationBasedCraftingPrices) {
        const sellPrice = locationBasedCraftingPrices[sellCity]?.sellPrice;

        if (sellPrice !== undefined) {
            // Verifica o menor preço de venda
            if (sellPrice < lowestSellPrice) {
                lowestSellPrice = sellPrice;
                lowestSellCity = sellCity;
            }

            // Verifica o maior preço de venda
            if (sellPrice > highestSellPrice) {
                highestSellPrice = sellPrice;
                highestSellCity = sellCity;
            }
        }
    }

    return {
        lowestSellCity,
        highestSellCity,
    };
}


module.exports = {
    transportPriceCalculator
};
