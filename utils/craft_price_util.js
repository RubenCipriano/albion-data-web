const HttpsProxyAgent = require('https-proxy-agent');

// Lista de proxies
const proxiesList = [
    "156.228.171.48:3128",
    "156.233.89.154:3128",
    "154.213.193.14:3128",
    "156.253.165.182:3128",
    "104.207.35.176:3128",
    "104.207.48.132:3128",
    "156.228.89.72:3128",
    "156.228.103.215:3128",
    "156.228.0.34:3128",
    "156.228.171.128:3128",
    "156.233.94.1:3128",
    "156.233.75.77:3128",
    "154.213.198.165:3128",
    "156.228.181.154:3128",
    "156.228.76.233:3128",
    "156.253.172.194:3128",
    "156.228.117.31:3128",
    "156.253.177.4:3128",
    "156.228.100.64:3128",
    "156.253.172.41:3128",
    "104.207.58.114:3128",
    "156.228.103.187:3128",
    "156.233.75.4:3128",
    "156.228.78.208:3128",
    "154.213.195.173:3128",
    "154.213.198.21:3128",
    "154.213.204.212:3128",
    "156.253.173.25:3128",
    "45.201.10.0:3128",
    "104.207.41.45:3128",
    "154.213.202.92:3128",
    "156.228.103.153:3128",
    "156.228.79.134:3128",
    "104.207.53.110:3128",
    "156.249.137.86:3128",
    "156.233.95.188:3128",
    "156.228.174.82:3128",
    "156.253.169.121:3128",
    "154.213.202.232:3128",
    "156.228.124.169:3128",
    "104.167.26.49:3128",
    "104.207.42.93:3128",
    "45.202.79.234:3128",
    "156.253.174.2:3128",
    "156.228.189.54:3128",
    "156.228.178.97:3128",
    "156.228.89.2:3128",
    "45.202.76.40:3128",
    "104.207.39.99:3128",
    "156.228.77.214:3128",
    "104.207.42.41:3128",
    "104.207.57.9:3128",
    "156.228.85.247:3128",
    "156.228.114.158:3128",
    "156.228.116.134:3128",
    "156.228.83.133:3128",
    "104.207.35.94:3128",
    "156.253.178.238:3128",
    "156.228.116.255:3128",
    "156.228.105.66:3128",
    "45.202.78.87:3128",
    "104.207.45.118:3128",
    "104.207.51.171:3128",
    "156.233.91.132:3128",
    "156.228.184.167:3128",
    "156.233.72.155:3128",
    "156.228.95.20:3128",
    "156.233.72.122:3128",
    "104.207.44.212:3128",
    "156.253.166.44:3128",
    "104.207.50.172:3128",
    "156.253.169.189:3128",
    "45.202.79.220:3128"
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
async function craftPriceCalculator(itemRequest) {

    const urlPriceGet = `https://west.albion-online-data.com/api/v2/stats/prices/${itemRequest.item_name}`;
    const craftingGet = `https://gameinfo.albiononline.com/api/gameinfo/items/${itemRequest.item_name}/data`;

    try {
        const [priceResponse, itemResponse] = await Promise.all([
            fetchWithProxy(urlPriceGet),
            fetchWithProxy(craftingGet)
        ]);

        if (!priceResponse || !itemResponse) {
            return;
        }

        const validPrices = Object.values(
            priceResponse.reduce((acc, item) => {
                // If the city is not in the accumulator or the quality is lower, update it
                if (!acc[item.city] || item.quality < acc[item.city].quality) {
                    acc[item.city] = item;
                }
                return acc;
            }, {})
        )
        const locationBasedCraftingPrices = {};

        if (itemResponse.craftingRequirements) {
            await processCraftingRequirements(
                itemResponse.craftingRequirements,
                locationBasedCraftingPrices
            );
        } else {
            if (itemResponse.enchantments) {
                await processEnchantments(
                    itemResponse.enchantments.enchantments,
                    locationBasedCraftingPrices
                );
            }
        }

        removeFaultyLength(locationBasedCraftingPrices);

        calculateCityPrices(validPrices, itemRequest.item_quatity, locationBasedCraftingPrices);

        const { bestProfitCity, bestProfit, mostProfit, mostCost } = determineBestProfit(locationBasedCraftingPrices);

        locationBasedCraftingPrices.bestProfitCity = bestProfitCity;

        locationBasedCraftingPrices.bestProfit = bestProfit;
        
        locationBasedCraftingPrices.mostProfit = mostProfit;

        locationBasedCraftingPrices.mostCost = mostCost;

        locationBasedCraftingPrices.item_name = itemRequest.item_name;
        
        locationBasedCraftingPrices.name = itemRequest.name;

        locationBasedCraftingPrices.quantity_crafted = itemRequest.item_quatity;

        return locationBasedCraftingPrices;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

async function processCraftingRequirements(craftingRequirements, locationBasedCraftingPrices) {
    const fetchPromises = [];

    const filteredResources = craftingRequirements.craftResourceList.filter(
        resource => !resource.uniqueName.includes("ALCHEMY_EXTRACT_LEVEL") &&
                    !resource.uniqueName.includes("FISHSAUCE_LEVEL")
    );

    for (let resource of filteredResources) {
        const url = `https://west.albion-online-data.com/api/v2/stats/prices/${resource.uniqueName}`;
        fetchPromises.push(
            fetchWithProxy(url).then(response => {
                if (!response) return;
                response
                    .forEach(item => {
                        if (!locationBasedCraftingPrices[item.city]) 
                            locationBasedCraftingPrices[item.city] = { };

                        if (!locationBasedCraftingPrices[item.city].crafting) 
                            locationBasedCraftingPrices[item.city].crafting = [];

                        item.sell_price_min = item.sell_price_min > 0 ? item.sell_price_min : Infinity;
                        
                        if (!locationBasedCraftingPrices[item.city].crafting.some(existingItem => existingItem.item_id === item.item_id)) {
                            locationBasedCraftingPrices[item.city].crafting.push({
                                item_id: item.item_id,
                                sell_price_min: item.sell_price_min,
                                count_needed: resource.count,
                                total_sell_price: resource.count * item.sell_price_min
                            });
                        }
                    });
            })
        );
    }

    await Promise.all(fetchPromises);
}


// Processa os encantamentos
async function processEnchantments(enchantments, locationBasedCraftingPrices) {
    const fetchPromises = [];

    for (let enchantment of enchantments) {
        const filteredResources = enchantment.craftingRequirements.craftResourceList.filter(
            resource => !resource.uniqueName.includes("ALCHEMY_EXTRACT_LEVEL") &&
                        !resource.uniqueName.includes("FISHSAUCE_LEVEL")
        );

        for (let resource of filteredResources) {
            const url = `https://west.albion-online-data.com/api/v2/stats/prices/${resource.uniqueName}`;
            fetchPromises.push(
                fetchWithProxy(url).then(response => {
                    if (!response) return;
                    response
                        .forEach(item => {
                            if (!locationBasedCraftingPrices[item.city]) {
                                locationBasedCraftingPrices[item.city] = { };
                            }

                            if (!locationBasedCraftingPrices[item.city].crafting) {
                                locationBasedCraftingPrices[item.city].crafting = []
                            }

                            item.sell_price_min = item.sell_price_min > 0 ? item.sell_price_min : Infinity;
                            
                            if (!locationBasedCraftingPrices[item.city].crafting.some(existingItem => existingItem.item_id === item.item_id)) {
                                locationBasedCraftingPrices[item.city].crafting.push({
                                    item_id: item.item_id,
                                    sell_price_min: item.sell_price_min,
                                    count_needed: resource.count,
                                    total_sell_price: resource.count * item.sell_price_min
                                });
                            }
                        });
                })
            );
        }
    }

    await Promise.all(fetchPromises);
}

// Calcula os preços baseados em cidades
function calculateCityPrices(validPrices, qtdItem, locationBasedCraftingPrices) {
    
    validPrices.forEach(priceData => {
        const city = priceData.city;

        if(!locationBasedCraftingPrices[city]) {
            locationBasedCraftingPrices[city] = {}
        }

        locationBasedCraftingPrices[city].sellPrice = priceData.sell_price_min * qtdItem;

        locationBasedCraftingPrices[city].buyPrice = priceData.buy_price_min * qtdItem;
    });
}

function removeFaultyLength(locationBasedCraftingPrices) {
    let maximumLength = 0;

    for(var city in locationBasedCraftingPrices) {
        if(!locationBasedCraftingPrices[city].crafting) {
            delete locationBasedCraftingPrices[city];
        } else if(locationBasedCraftingPrices[city].crafting.length) {
            maximumLength = locationBasedCraftingPrices[city].crafting.length;
        } 
    }

    for (var city in locationBasedCraftingPrices) {
        // If the crafting array length is less than the maximum, delete the city
        if (maximumLength > locationBasedCraftingPrices[city].crafting.length) {
            delete locationBasedCraftingPrices[city];
        }
    }    
}

// Determina o melhor lucro por cidade
function determineBestProfit(locationBasedCraftingPrices) {
    let bestProfit = -Infinity;
    let mostProfit = -Infinity;
    let mostCost = Infinity;
    let bestProfitCity = null;

    for (let city in locationBasedCraftingPrices) {
        const craftingData = locationBasedCraftingPrices[city].crafting;

        if (!craftingData) continue;

        if (craftingData.length > 0) {
            const costSum = craftingData.reduce((sum, item) => sum + (item.total_sell_price || 0), 0);

            locationBasedCraftingPrices[city].costSizeFinal = costSum ;

            const sellPrice = locationBasedCraftingPrices[city].sellPrice || 0;

            locationBasedCraftingPrices[city].profitCityFinal = sellPrice - (costSum) - (sellPrice * 0.105);

            if (bestProfit < locationBasedCraftingPrices[city].profitCityFinal) {
                
                bestProfit = (locationBasedCraftingPrices[city].profitCityFinal / locationBasedCraftingPrices[city].costSizeFinal) * 100;
                
                bestProfitCity = city;

                mostProfit = locationBasedCraftingPrices[city].profitCityFinal;

                mostCost = costSum
            }

            locationBasedCraftingPrices[city].profitMargin = (
                (locationBasedCraftingPrices[city].profitCityFinal / locationBasedCraftingPrices[city].costSizeFinal) * 100
            ).toFixed(2);
        }
    }

    return { bestProfitCity, bestProfit, mostProfit, mostCost };
}

module.exports = {
    craftPriceCalculator
};
