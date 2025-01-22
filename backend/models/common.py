from typing import List
from pydantic import BaseModel


class SaveDataRequest(BaseModel):
    filename: str
    data: list


class SpreadsheetData(BaseModel):
    data: List[List[dict]]
