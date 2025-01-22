# import requests
#
# url = 'http://127.0.0.1:8000/v1/upload'
# file = {'file': open('/Users/tosifhussainkhan/Downloads/sample_file.xlsx', 'rb')}
# resp = requests.post(url=url, files=file)
# print(resp.json())

from fastapi.testclient import TestClient
import os
import pytest
from fastapi.testclient import TestClient
from starlette.responses import FileResponse

from main import app
from main import UPLOAD_DIR


client = TestClient(app)


def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}


def test_download_file_not_found():
    non_existent_filename = "nonexistentfile.txt"
    response = client.get(f"/v1/download/{non_existent_filename}")
    assert response.status_code == 404


