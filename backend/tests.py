import requests

url = 'http://127.0.0.1:8000/v1/upload'
file = {'file': open('/Users/tosifhussainkhan/Downloads/sample_file.xlsx', 'rb')}
resp = requests.post(url=url, files=file) 
print(resp.json())