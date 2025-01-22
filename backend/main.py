import logging
import os
import json
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Query

from starlette.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

from models.common import SaveDataRequest, SpreadsheetData

app = FastAPI()
log = logging.getLogger(__name__)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/v1/upload")
async def upload(request: Request, file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if file.content_type is None and ext not in [".xls", ".xlsx"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an Excel file.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, 'wb') as f:
            while contents := file.file.read(1024 * 1024):
                f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Something went wrong: {str(e)}")
    finally:
        await file.close()

    return JSONResponse(content={"message": f"Successfully uploaded {file.filename}"})


@app.get("/v1/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@app.post("/v1/save-data")
async def save_data(request: SaveDataRequest):
    file_path = os.path.join(UPLOAD_DIR, request.filename)
    try:
        extracted_data = [[d['value'] for d in row] for row in request.data]
        df = pd.DataFrame(extracted_data[1:], columns=extracted_data[0])
        df.to_excel(file_path, index=False)
        return {"message": "File saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/v1/get-data")
async def get_excel_data(filename: str, page: int = Query(..., ge=1), size: int = Query(..., le=10000)):
    try:
        page = int(page)
        size = int(size)
    except Exception as E:
        print("ERRORx ", E)

    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        data = await return_by_page(file_path, page, size)
        return {"page": page, "size": size, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def return_by_page(file_path, page, size):
    df = pd.read_excel(file_path, skiprows=(page - 1) * size, nrows=size).replace({np.nan: None})
    data = df.to_dict(orient="records")
    return data


@app.get("/v1/filter-data")
async def filter_data(filename: str, query: str):
    column, operator, value = query.split()
    value = float(value)

    try:
        df = pd.read_excel(f"./uploads/{filename}").replace({np.nan: None})
        # string check
        # mask = df.apply(lambda row: row.astype(str).str.contains(query, case=False).any(), axis=1)
        # filtered_df = df[mask]

        operators = {
            '>': df[column] > value,
            '<': df[column] < value,
            '>=': df[column] >= value,
            '<=': df[column] <= value,
            '==': df[column] == value,
            '!=': df[column] != value
        }

        if operator in operators:
            data = df[operators[operator]].to_dict(orient="records")
            return {"data": data}
        else:
            raise ValueError("Invalid operator in expression")

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/v1/sum-column")
async def sum_column(filename: str, column_name: str):
    try:
        df = pd.read_excel(f"./uploads/{filename}").replace({np.nan: None})
        if column_name not in df.columns:
            raise HTTPException(status_code=400, detail="Column not found.")
        total_sum = df[column_name].sum()
        return {"sum": total_sum}

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/v1/sort-data")
async def sort_data(
        filename: str = Query(..., description="Name of the uploaded file"),
        column_name: str = Query(..., description="Column to sort by"),
        order: str = Query("asc", description="Sorting order: 'asc' or 'desc'")
):
    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found!")

    try:
        df = pd.read_excel(file_path).replace({np.nan: None})
        if column_name not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{column_name}' not found!")
        ascending = order.lower() == "asc"
        df_sorted = df.sort_values(by=column_name, ascending=ascending)
        sorted_data = df_sorted.to_dict(orient="records")

        return JSONResponse(content={"data": sorted_data})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/evaluate")
def evaluate_spreadsheet(spreadsheet: SpreadsheetData):
    try:
        values = [[cell['value'] for cell in row] for row in spreadsheet.data]
        df = pd.DataFrame(values)

        def evaluator(cell):
            try:
                print(cell)
                if isinstance(cell, str) and cell.startswith("#EVAL:"):
                    print(cell[6:])
                    return eval(cell[6:], {"np": np})
                return cell
            except Exception:
                pass

        df = df.applymap(evaluator)

        result = df.values.tolist()
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing spreadsheet: {str(e)}")
