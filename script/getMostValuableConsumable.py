import time
import requests
import threading
from concurrent.futures import ThreadPoolExecutor
from colorama import Fore, init
import math

# Inicializa o colorama (necessário para compatibilidade em Windows)
init(autoreset=True)

# Nome do arquivo que contém os dados
filename = 'C:/Users/RúbenOliveiraCiprian/Documents/Albion-Calculator-Project/src/data/consumables.txt'
url_base = 'http://localhost:3000/api/crafting_prices/'

# Função para ler o arquivo e obter os dados
def read_file(file):
    items = []
    with open(file, 'r') as f:
        lines = f.readlines()
        for line in lines:
            parts = line.strip().split(':')
            if len(parts) == 4:
                item = {
                    'id': parts[0],
                    'name': parts[1],  # Nome do item
                    'description': parts[2],
                    'quantity': int(parts[3])  # Convertendo a quantidade para inteiro
                }
                items.append(item)
    return items

# Função para fazer o pedido à API
def fetch_item_data(item):
    url = f"{url_base}{item['name']}?quantityItem={item['quantity']}&silverCost=0&returnRate=0"
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            profit_data = response.json()

            best_profit_city = profit_data.get("bestProfitCity", "")
            mostProfit = profit_data.get("mostProfit", 0.0)
            profit_margin = profit_data.get("bestProfit", -float('inf'))
            
            if best_profit_city:
                city_data = profit_data.get(best_profit_city, {})

                # Verifica se profit_margin é numérico e aplica a cor
                try:
                    profit_margin_float = float(profit_margin)

                    if profit_margin_float > 60:
                        profit_margin_colored = f"{Fore.GREEN}{profit_margin_float:.2f}%"
                    elif profit_margin_float < 0:
                        profit_margin_colored = f"{Fore.RED}{profit_margin_float:.2f}%"
                    else:
                        profit_margin_colored = f"{Fore.YELLOW}{profit_margin_float:.2f}%"  # Sem cor para valores entre 0 e 60


                    return item, profit_margin_float, profit_margin_colored, best_profit_city, mostProfit
                except ValueError:
                    profit_margin_colored = "0"  # Caso o valor de profit_margin não seja numérico
                    return item, None, profit_margin_colored, None, None
            else:
                return item, None, "Sem dados de lucro", None, None
        else:
            return item, None, f"Erro no pedido: {response.status_code}", None, None
    except Exception as e:
        return item, None, f"Erro no pedido: {str(e)}", None, None

# Função para enviar pedidos usando multithreading
def send_requests(items):
    results = []

    # Usando ThreadPoolExecutor para criar uma pool de threads (workers)
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_item = {executor.submit(fetch_item_data, item): item for item in items}
        for future in future_to_item:
            item, profit_margin_float, profit_margin_colored, best_profit_city, mostProfit = future.result()
            results.append((item, profit_margin_float, profit_margin_colored, best_profit_city, mostProfit))

            print(f"Finished Item: {item['name']}")

    # Ordena os resultados pela maior margem de lucro (do maior para o menor)
    results.sort(key=lambda x: x[1] if x[1] is not None else -float('inf'), reverse=True)

    results = results[0:100]

    for item, profit_margin_float, profit_margin_colored, best_profit_city, mostProfit in results:
        print(f"{item['name']} - {item['description']} [ {best_profit_city} ] [ {profit_margin_colored} ] [ {mostProfit:.2f} ]")

    print("Todos os pedidos foram enviados.")

# Lê o arquivo e envia os pedidos
items = read_file(filename)
send_requests(items)
