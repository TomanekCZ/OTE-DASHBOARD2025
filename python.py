import requests
from bs4 import BeautifulSoup
from flask import Flask, render_template, url_for, jsonify
from flask_caching import Cache
import time
import logging

app = Flask(__name__)
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

# Nastavení loggeru na začátku souboru
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Funkce pro získání dat ze stránky OTE
@cache.memoize(timeout=300)  # Cache for 5 minutes
def scrape_ote_data():
    logger.debug("Starting scrape_ote_data function")
    url = 'https://www.ote-cr.cz/cs'
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        tab_container = soup.find('div', id='homepage-tabs')
        tab_content = tab_container.find('div', class_='tab-content') if tab_container else None

        data = []
        
        if tab_content:
            for tab_pane in tab_content.find_all('div', class_='tab-pane'):
                try:
                    # Vyčistit název záložky od přebytečných mezer a nových řádků
                    tab_name = tab_pane.find('h3').text.strip() if tab_pane.find('h3') else 'Unknown'
                    tab_name = ' '.join(tab_name.split())  # Odstranění vícenásobných mezer
                    
                    # Oddělení data od názvu záložky
                    if ' - ' in tab_name:
                        tab_parts = tab_name.split(' - ')
                        tab_name = tab_parts[0].strip()
                    
                    # Čistší získání data
                    date = tab_pane.find('h3').find('small')
                    date = date.text.strip() if date else ''
                    
                    table = tab_pane.find('table', class_='comodity-overview')
                    if table:
                        rows = table.find_all('tr')
                        for row in rows:
                            try:
                                columns = row.find_all('td')
                                if not columns:
                                    continue
                                    
                                commodity = columns[0].text.strip() if columns else ''
                                if not commodity:
                                    continue
                                
                                if "Systémová odchylka" in commodity and len(columns) >= 3:
                                    min_value = columns[1].text.strip().replace('MWh', '').strip()
                                    max_value = columns[2].text.strip().replace('MWh', '').strip()
                                    
                                    data.append({
                                        'tab': tab_name,
                                        'date': date,
                                        'commodity': commodity,
                                        'min': min_value,
                                        'max': max_value,
                                        'currency': 'MWh',
                                        'is_system_deviation': True,
                                        'is_special': True
                                    })
                                elif "Množství za měsíc" in commodity and len(columns) > 1:
                                    raw_amount = columns[1].text
                                    
                                    # Extra důkladné čištění - odstraníme veškerý whitespace a jednotky
                                    clean_amount = (raw_amount
                                                   .replace('EUR/MWh', '')
                                                   .replace('EUR', '')
                                                   .replace('MWh', '')
                                                   .replace('/', '')
                                                   .replace('\n', '')
                                                   .replace('\t', '')
                                                   .strip())
                                    
                                    # Debug výpis pro kontrolu
                                    print(f"Raw amount: '{raw_amount}'")
                                    print(f"Cleaned amount: '{clean_amount}'")
                                    
                                    data.append({
                                        'tab': tab_name,
                                        'date': date,
                                        'commodity': commodity,
                                        'amount': clean_amount,
                                        'currency': 'MWh',
                                        'is_special': True
                                    })
                                elif "Zúčtovací cena" in commodity and len(columns) >= 3:
                                    # Získání min a max hodnot
                                    min_value = columns[1].text.strip().replace('Kč/MWh', '').strip()
                                    max_value = columns[3].text.strip().replace('Kč/MWh', '').strip()
                                    
                                    data.append({
                                        'tab': tab_name,
                                        'date': date,
                                        'commodity': commodity,
                                        'min': min_value,
                                        'max': max_value,
                                        'currency': 'Kč/MWh',
                                        'is_special': False
                                    })
                                elif "Náklady na RE" in commodity and len(columns) > 1:
                                    raw_amount = columns[1].text.strip()
                                    clean_amount = (raw_amount
                                                   .replace('Kč', '')
                                                   .replace('MWh', '')
                                                   .replace('/', '')
                                                   .replace('\n', '')
                                                   .replace('\t', '')
                                                   .replace(' ', '')
                                                   .replace(',', '.')
                                                   .strip())
                                    
                                    data.append({
                                        'tab': tab_name,
                                        'date': date,
                                        'commodity': commodity,
                                        'amount': clean_amount,
                                        'currency': 'Kč',
                                        'is_special': True
                                    })
                                elif len(columns) >= 3:
                                    price_cell = columns[1]
                                    price = price_cell.contents[0].strip() if price_cell.contents else ''
                                    price = price.replace('EUR/MWh', '').strip()
                                    
                                    change = price_cell.find('small')
                                    change_text = change.text.strip() if change else ''
                                    amount = columns[-1].text.strip() if len(columns) > 2 else ''
                                    
                                    # Zjistíme směr změny
                                    change_direction = None
                                    change_arrow = row.find('td', class_='change-arrow')
                                    if change_arrow:
                                        if 'positive' in change_arrow.get('class', []):
                                            change_direction = 'positive'
                                        elif 'negative' in change_arrow.get('class', []):
                                            change_direction = 'negative'
                                    elif change_text:  # Pokud nemáme šipku, určíme směr podle změny
                                        change_direction = 'negative' if change_text.startswith('-') else 'positive'
                                    
                                    data.append({
                                        'tab': tab_name,
                                        'date': date,
                                        'commodity': commodity,
                                        'price': price,
                                        'change': change_text,
                                        'change_direction': change_direction,
                                        'amount': amount,
                                        'currency': 'EUR/MWh',
                                        'is_special': False
                                    })
                            except Exception as e:
                                logging.error(f"Error processing row: {str(e)}")
                                continue
                except Exception as e:
                    logging.error(f"Error processing tab: {str(e)}")
                    continue

        return data
    else:
        logging.error(f"Error fetching data: {response.status_code}")
        return []

# Funkce pro získání dat ze stránky OTE pro plyn
@cache.memoize(timeout=300)
def scrape_gas_data():
    logger.debug("Starting scrape_gas_data function")
    url = 'https://www.ote-cr.cz/cs'
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        data = []
        
        sections = [
            soup.find('div', id='plyn-vnitrodenni-trh'),
            soup.find('div', id='plyn-systemova-odchylka'),
            soup.find('div', id='plyn-trh-flexibilita')
        ]
        
        for section in sections:
            if not section:
                continue
                
            try:
                tab_name = section.find('h3').text.strip() if section.find('h3') else 'Unknown'
                tab_name = ' '.join(tab_name.split())
                
                if ' - ' in tab_name:
                    tab_parts = tab_name.split(' - ')
                    tab_name = tab_parts[0].strip()
                
                date = section.find('h3').find('small')
                date = date.text.strip() if date else ''
                
                tables = section.find_all('table', class_='gas-comodity-overview')
                for table in tables:
                    rows = table.find_all('tr')
                    for row in rows:
                        try:
                            columns = row.find_all('td')
                            if not columns:
                                continue
                                
                            commodity = columns[0].text.strip() if columns else ''
                            if not commodity:
                                continue
                            
                            # Zpracování všech typů řádků
                            if len(columns) >= 2:
                                if commodity == "Cena" or "Index OTE" in commodity:
                                    price_cell = columns[1]
                                    price = price_cell.contents[0].strip() if price_cell.contents else ''
                                    change = price_cell.find('small')
                                    change_text = change.text.strip() if change else ''
                                    
                                    # Zjistíme směr změny
                                    change_direction = None
                                    change_arrow = row.find('td', class_='change-arrow')
                                    if change_arrow:
                                        if 'positive' in change_arrow.get('class', []):
                                            change_direction = 'positive'
                                        elif 'negative' in change_arrow.get('class', []):
                                            change_direction = 'negative'
                                    elif change_text:  # Pokud nemáme šipku, určíme směr podle změny
                                        change_direction = 'negative' if '-' in change_text else 'positive'
                                    
                                    data.append({
                                        'tab': tab_name,
                                        'date': date,
                                        'commodity': commodity,
                                        'price': price,
                                        'change': change_text,
                                        'change_direction': change_direction,
                                        'currency': 'EUR/MWh',
                                        'is_special': False
                                    })
                                elif "Množství" in commodity:
                                    amount = columns[1].text.strip().replace('MWh', '').strip()
                                    data.append({
                                        'tab': tab_name,
                                        'date': date,
                                        'commodity': commodity,
                                        'amount': amount,
                                        'currency': 'MWh',
                                        'is_special': True
                                    })
                                elif "vyrovnávací množství" in commodity.lower() and len(columns) >= 2:
                                    price_cell = columns[1]
                                    price = price_cell.contents[0].strip() if price_cell.contents else ''
                                    currency = 'Kč/MWh'
                                    price = price.replace(currency, '').strip()
                                    
                                    change = price_cell.find('small')
                                    change_text = change.text.strip() if change else ''
                                    
                                    data.append({
                                        'tab': tab_name,
                                        'date': date,
                                        'commodity': commodity,
                                        'price': price,
                                        'change': change_text,
                                        'currency': currency,
                                        'is_special': False
                                    })
                                elif "Systémová odchylka" in commodity and len(columns) >= 2:
                                    amount = columns[1].text.strip().replace('MWh', '').strip()
                                    
                                    data.append({
                                        'tab': tab_name,
                                        'date': date,
                                        'commodity': commodity,
                                        'amount': amount,
                                        'currency': 'MWh',
                                        'is_system_deviation': True,
                                        'is_special': True
                                    })
                                elif "Marginální cena" in commodity:
                                    if len(columns) > 1:
                                        price_cell = columns[1]
                                        price = price_cell.contents[0].strip() if price_cell.contents else ''
                                        currency = 'EUR/MWh' if 'EUR' in price_cell.text else 'Kč/MWh'
                                        price = price.replace(currency, '').strip()
                                        
                                        change = price_cell.find('small')
                                        change_text = change.text.strip() if change else ''
                                        
                                        data.append({
                                            'tab': tab_name,
                                            'date': date,
                                            'commodity': commodity,
                                            'price': price,
                                            'change': change_text,
                                            'currency': currency,
                                            'is_special': False
                                        })
                                elif "flexibilit" in commodity.lower():
                                    if len(columns) > 1:
                                        amount = columns[1].text.strip().replace('MWh', '').strip()
                                        
                                        data.append({
                                            'tab': tab_name,
                                            'date': date,
                                            'commodity': commodity,
                                            'amount': amount,
                                            'currency': 'MWh',
                                            'is_special': True
                                        })
                        except Exception as e:
                            logging.error(f"Error processing gas row: {str(e)}")
                            continue
                            
            except Exception as e:
                logging.error(f"Error processing gas tab: {str(e)}")
                continue

        return data
    else:
        logging.error(f"Error fetching gas data: {response.status_code}")
        return []

# Flask route pro hlavní stránku (index.html)
@app.route('/')
def index():
    try:
        ote_data = scrape_ote_data()
        ote_gas_data = scrape_gas_data()
        
        # Debug výpisy pro elektřinu
        print("\nElectricity data structure:")
        for item in ote_data:
            print(f"Tab: {item['tab']}")
            print(f"Date: {item['date']}")
            print(f"Commodity: {item['commodity']}")
            print(f"Price: {item.get('price', 'N/A')}")
            print(f"Amount: {item.get('amount', 'N/A')}")
            print(f"Is Special: {item.get('is_special', False)}")
            print("---")
            
        # Přidáme podrobnější debug výpisy pro plyn
        print("\nGas data structure (detailed):")
        for item in ote_gas_data:
            print(f"Tab: {item['tab']}")
            print(f"Date: {item['date']}")
            print(f"Commodity: {item['commodity']}")
            print(f"Price: {item.get('price', 'N/A')}")
            print(f"Amount: {item.get('amount', 'N/A')}")
            print(f"Change: {item.get('change', 'N/A')}")
            print(f"Change Direction: {item.get('change_direction', 'N/A')}")
            print(f"Currency: {item.get('currency', 'N/A')}")
            print(f"Is Special: {item.get('is_special', False)}")
            print("---")
        
        # Existující debug výpisy
        print("\nElectricity data count:", len(ote_data))
        print("Gas data count:", len(ote_gas_data))
        
        return render_template('index.html', 
                             ote_data=ote_data, 
                             ote_gas_data=ote_gas_data)
    except Exception as e:
        logging.error(f"Error in index route: {str(e)}")
        return f"An error occurred: {str(e)}", 500

# Flask route pro DT stránku
@app.route('/dt')
def dt():
    return render_template('DT.html')

# Flask route pro IDA1 stránku
@app.route('/ida1')
def ida1():
    return render_template('VDT-IDA1.html')

# Flask route pro VDT-KON stránku
@app.route('/vdt-kon')
def vdt_kon():
    return render_template('VDT - konti.html')

# Flask route pro další stránky dle potřeby
@app.route('/vdt-ida1')
def vdt_ida1():
    return render_template('VDT-IDA1.html')

@app.route('/vdt-p')
def vdt_p():
    return render_template('VDT-P.html')

# Adding routes for VDT-IDA2 and VDT-IDA3 pages
@app.route('/vdt-ida2')
def vdt_ida2():
    return render_template('VDT-IDA2.html')

@app.route('/vdt-ida3')
def vdt_ida3():
    return render_template('VDT-IDA3.html')

@app.route('/api/electricity-data')
@cache.cached(timeout=300)
def electricity_data():
    try:
        data = scrape_ote_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/gas-data')
@cache.cached(timeout=300)
def gas_data():
    try:
        data = scrape_gas_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
