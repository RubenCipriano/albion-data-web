import os
import requests
from bs4 import BeautifulSoup
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed

# List of proxy servers (you can replace this with a dynamic list or a proxy service)
proxies_list = [
    "http://156.228.171.48:3128/",
    "http://156.228.79.154:3128/",
    "http://156.233.89.154:3128/",
    "http://154.213.193.14:3128/",
    "http://156.253.165.182:3128/",
    "http://104.207.35.176:3128/",
    "http://156.228.109.5:3128/",
    "http://156.253.171.74:3128/",
    "http://156.233.90.52:3128/",
    "http://104.207.48.132:3128/",
    "http://156.228.89.72:3128/",
    "http://156.228.103.215:3128/",
    "http://156.228.0.34:3128/",
    "http://156.228.99.56:3128/",
    "http://156.228.105.198:3128/",
    "http://156.228.171.128:3128/",
    "http://156.233.94.1:3128/",
    "http://156.233.75.77:3128/",
    "http://154.213.198.165:3128/",
    "http://156.228.181.154:3128/",
    "http://156.228.76.233:3128/",
    "http://156.253.172.194:3128/",
    "http://156.228.185.198:3128/",
    "http://156.228.117.31:3128/",
    "http://154.213.202.95:3128/",
    "http://156.253.177.4:3128/",
    "http://156.228.100.64:3128/",
    "http://156.253.172.41:3128/",
    "http://154.213.204.252:3128/",
    "http://104.207.40.193:3128/",
    "http://104.207.58.114:3128/",
    "http://156.228.103.187:3128/",
    "http://156.233.75.4:3128/",
    "http://156.228.78.208:3128/",
    "http://154.213.195.173:3128/",
    "http://104.207.49.105:3128/",
    "http://154.213.198.21:3128/",
    "http://104.207.63.79:3128/",
    "http://154.213.204.212:3128/",
    "http://156.253.173.25:3128/",
    "http://45.201.10.0:3128/",
    "http://104.207.63.172:3128/",
    "http://104.207.41.45:3128/",
    "http://154.213.202.92:3128/",
    "http://104.207.49.119:3128/",
    "http://156.228.79.134:3128/",
    "http://104.207.53.110:3128/",
    "http://156.249.137.86:3128/",
    "http://156.233.95.188:3128/",
    "http://104.207.45.83:3128/",
    "http://156.253.169.121:3128/",
    "http://154.213.202.232:3128/",
    "http://156.228.181.142:3128/",
    "http://156.228.124.169:3128/",
    "http://104.207.47.47:3128/",
    "http://104.167.26.49:3128/",
    "http://104.207.42.93:3128/",
    "http://45.202.79.234:3128/",
    "http://156.253.174.2:3128/",
    "http://156.228.189.54:3128/",
    "http://156.228.178.97:3128/",
    "http://156.228.98.146:3128/",
    "http://154.214.1.13:3128/",
    "http://156.228.89.2:3128/",
    "http://45.202.76.40:3128/",
    "http://104.207.39.99:3128/",
    "http://156.228.109.4:3128/",
    "http://104.207.53.99:3128/",
    "http://156.228.77.214:3128/",
    "http://104.207.42.41:3128/",
    "http://104.207.57.9:3128/",
    "http://156.228.85.247:3128/",
    "http://156.228.114.158:3128/",
    "http://156.233.94.61:3128/",
    "http://156.228.116.134:3128/",
    "http://156.228.83.133:3128/",
    "http://156.228.180.69:3128/",
    "http://104.207.35.94:3128/",
    "http://156.253.178.238:3128/",
    "http://156.228.116.255:3128/",
    "http://156.228.110.225:3128/",
    "http://156.228.105.66:3128/",
    "http://45.202.78.87:3128/",
    "http://104.207.45.118:3128/",
    "http://104.207.51.171:3128/",
    "http://156.228.175.1:3128/",
    "http://156.233.91.132:3128/",
    "http://156.228.96.142:3128/",
    "http://156.233.72.155:3128/",
    "http://156.228.95.20:3128/",
    "http://156.233.72.122:3128/",
    "http://104.207.44.212:3128/",
    "http://156.228.190.13:3128/",
    "http://156.253.166.44:3128/",
    "http://104.207.50.172:3128/",
    "http://156.253.169.189:3128/",
    "http://45.202.79.220:3128/",
    # Add as many proxies as you need
]

def get_random_proxy():
    """Returns a random proxy from the list"""
    return random.choice(proxies_list)

def get_crafting_requirements(item_internal_name, retries=3, delay=1):
    url = f"https://albiononline2d.com/en/item/id/{item_internal_name}/craftingrequirements"
    
    for attempt in range(retries):
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            proxy = get_random_proxy()  # Select a random proxy
            proxies = {
                "http": proxy,
                "https": proxy
            }
            response = requests.get(url, headers=headers, proxies=proxies, timeout=10)
            response.raise_for_status()
            
            # Parsing HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Locate the table and extract the desired value
            table = soup.select_one('.table.table-striped')
            if table:
                rows = list(table.children)
                for row in rows:
                    columns = list(row.children)
                    if len(columns) > 1:
                        cellName = columns[0]
                        if cellName.text.lower() == "amountcrafted":
                            cell = columns[1]
                            print(f"Found cell {item_internal_name} Quantity: {cell.text.strip()}")
                            return cell.text.strip()
                        else:
                            print(f"Cell not found {item_internal_name}")
            else:                
                print(f"Table not found {item_internal_name}")
            return None
        except Exception as e:
            print(f"Error fetching crafting requirements for {item_internal_name}: {e}")
            if attempt < retries - 1:
                print("Retrying...")

        time.sleep(delay)  # Add a delay between retries

def process_line(line):
    """
    Process a line from the file and return the data as a dictionary.
    """
    line = line.strip()
    if not line:
        return None

    try:
        parts = line.split(":")
        if len(parts) < 2:
            raise ValueError("Invalid format.")

        item_number = parts[0].strip()
        item_internal_name = parts[1].strip()

        if "@" not in item_internal_name:
            item_description = parts[2].strip() if len(parts) > 2 else ""

            crafting_output = get_crafting_requirements(item_internal_name) or "1"

            return {
                "number": item_number,
                "internal_name": item_internal_name,
                "description": item_description,
                "crafting_output": crafting_output
            }
    
    except Exception as e:
        print(f"Error processing line: {line} - {e}")
        return None

def main():
    file_path = "./src/data/all_items.txt"
    output_path = "./src/data/items_with_quantities.txt"
    
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return

    items = []
    start_time = time.time()
    lines_processed = 0
    total_lines = sum(1 for line in open(file_path, "r", encoding="utf-8"))
    
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            # Using ThreadPoolExecutor to process lines concurrently
            with ThreadPoolExecutor(max_workers=8) as executor:
                futures = []
                for line in file:
                    future = executor.submit(process_line, line)
                    futures.append(future)

                # Wait for all futures to complete and process the results
                for future in as_completed(futures):
                    item_data = future.result()
                    if item_data:
                        items.append(item_data)

                    lines_processed += 1
                    
                    # Every 1 minute (60 seconds), calculate and display the average time and ETA
                    if time.time() - start_time >= 60:
                        elapsed_time = time.time() - start_time
                        avg_time_per_line = elapsed_time / lines_processed
                        remaining_lines = total_lines - lines_processed
                        eta = avg_time_per_line * remaining_lines

                        print(f"Processed {lines_processed}/{total_lines} lines.")
                        print(f"Average time per line: {avg_time_per_line:.2f} seconds.")
                        print(f"Estimated time remaining: {eta / 60:.2f} minutes.")

                        # Reset the timer for the next minute
                        start_time = time.time()

        # Save the formatted output to a new file
        with open(output_path, "w", encoding="utf-8") as output_file:
            for item in items:
                formatted_line = f"{item['number']}:{item['internal_name']}:{item['description']}:{item['crafting_output']}\n"
                output_file.write(formatted_line)

        print(f"Data processed and saved to: {output_path}")

    except Exception as e:
        print(f"An error occurred while processing the file: {e}")

if __name__ == "__main__":
    main()
