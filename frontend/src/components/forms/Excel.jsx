import React, { useState, useEffect } from "react";
import axios, { spread } from "axios";
import Spreadsheet from "react-spreadsheet";

const ExcelUploader = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [spreadsheetData, setSpreadsheetData] = useState([]);
    const [fileName, setFileName] = useState("");
    const [page, setPage] = useState(1);
    const [visibilityOfBox, setVisibilityOfBox] = useState("hidden");
    const [filterText, setFilterText] = useState("");
    const [filterButtonActive,setFilterButtonActive]=useState(false);
    const [evaluationResult, setEvaluationResult] = useState(null);
    const [history,setHistory]=useState([]);
    const [isSpreadSheetSaved, setIsSpreadSheetSaved]=useState(true);

    const addRow = () => {
        const newRow = new Array(spreadsheetData[0].length).fill({ value: "" });
        console.log(spreadsheetData)
        setSpreadsheetData([...spreadsheetData, newRow]);
    };

    const addRowWithHistory=()=>{
        saveCurrentSpreadsheet();
        addRow();
    };
    

    const addColumnWithHistory=()=>{
        saveCurrentSpreadsheet();
        addColumn();
    };
    
    const saveCurrentSpreadsheet=()=>{
         setHistory([...history,{data:[...spreadsheetData]}]);
    };
    
    const undoLastAction=()=>{
         if(history.length ===0) return;
    
         let lastEntry=[...history];
         let prevEntry=lastEntry.pop();
    
         setSpreadsheetData(prevEntry.data); 
         setHistory(lastEntry); 
    };

    const addColumn = () => {
        const newData = spreadsheetData.map(row => [...row, { value: "" }]);
        console.log(spreadsheetData)
        setSpreadsheetData(newData);
    };

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setFileName(event.target.files[0].name);
    };

    const handleUpload = async () => {
        if (spreadsheetData) {
            setSpreadsheetData([]);
            setPage(1);
            setIsSpreadSheetSaved(true);
        }

        if (!selectedFile) {
            alert("Please select a file first!");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await axios.post("http://127.0.0.1:8000/v1/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            alert(response.data.message);
        } catch (error) {
            alert("File upload failed: " + error.response?.data?.detail);
        }
        setVisibilityOfBox("visible")
        
    };

    const handleEvaluate = async () => {
        try {
            const response = await axios.post("http://127.0.0.1:8000/v1/evaluate", {
                data: spreadsheetData
            });
            setEvaluationResult(response.data.result);
        } catch (error) {
            alert("Evaluation failed: " + error.response?.data?.detail);
        }
    };

    const handleSumColumnBackend= async (columnToSum)=>{
        if (!fileName || !columnToSum) {
            alert("Please upload a file first and specify valid data!");
            return;
        }
 
        try {
            const response=await axios.get("http://127.0.0.1:8000/v1/sum-column",{
                params:{ filename:fileName,column_name :columnToSum }
            });
 
           setSumResult(response.data.sum);
 
        } catch(error){
          alert("Failed fetching or summing data:" + error.response?.data?.detail);
       }
  };

  const handleHeaderClick=(colIndex)=>{
    console.log("handling header click")
    if(spreadsheetData.length > 0){
        let selectedColumnHeader=spreadsheetData[0][colIndex].value;
        handleSumColumnBackend(selectedColumnHeader);
    }
};

const handleSortColumnBackend = async (columnToSort, order) => {
    if (!fileName || !columnToSort) {
        alert("Please upload a file first and specify a valid column!");
        return;
    }

    try {
        const response = await axios.get("http://127.0.0.1:8000/v1/sort-data", {
            params: { filename: fileName, column_name: columnToSort, order: order }
        });

        const headers = Object.keys(response.data.data[0]);
        const headerRow = headers.map(header => ({ value: header }));
        
        let formattedData = response.data.data.map(row =>
            headers.map(key => ({ value: row[key] }))
        );

        setSpreadsheetData([headerRow, ...formattedData]);
    } catch (error) {
        alert(`Failed fetching or sorting data: ${error} ` + error.response?.data?.detail);
    }
};

const handleHeaderSortClick = (colIndex, order) => {
    if (spreadsheetData.length > 0) {
        let selectedColumnHeader = spreadsheetData[0][colIndex].value;
        handleSortColumnBackend(selectedColumnHeader, order);
    }
};

    const fetchData = async (pageNumber) => {
        console.log("fetch data called");
        if (!fileName) {
            alert("Please upload a file first!");
            return;
        }
    
        try {
            const response = await axios.get("http://127.0.0.1:8000/v1/get-data", {
                params: {
                    filename: fileName,
                    page: pageNumber,
                    size: 10, // Adjust for performance
                },
            });
    
            
            const headers = Object.keys(response.data.data[0]);
            const headerRow = headers.map((header) => ({ value: header }));
    
        
            const formattedData = response.data.data.map((row) =>
                headers.map((key) => ({ value: row[key] }))
            );
    
            setSpreadsheetData((prevData) => 
                prevData.length === 0 
                    ? [headerRow, ...formattedData] 
                    : [...prevData, ...formattedData]
            );
    
            setPage(page + response.data.size / 10);
            setVisibilityOfBox("visible");
    
        } catch (error) {
            print(response)
            if(response.data.length > 0) {
                alert("No more data to load");
            }
            alert("Failed to fetch data: " + error.response?.data?.detail);
        }
    };
    
    const handleDownload = async () => {
        if (!fileName) {
            alert("Please upload a file first!");
            return;
        }

        try {
            const response = await axios.get(`http://127.0.0.1:8000/v1/download/${fileName}`, {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Download failed.");
        }
    };

    const handleSave = async () => {
        console.log(spreadsheetData)
        if (!fileName) {
            alert("Please upload a file first!");
            return;
        }


        try {
            const response = await axios.post(`http://127.0.0.1:8000/v1/save-data`, {
                data: spreadsheetData,
                filename: fileName
            });
            console.log(response)
            alert(response.data.message);
        } catch (error) {
            alert(`Save Failed ${error}`);
        }
        setPage(1);
        setSpreadsheetData(spreadsheetData);
        setIsSpreadSheetSaved(true);
    };

    


    const handleFilterChangeBackend = async () => {
        if (!fileName) {
            alert("Please upload a file first!");
            return;
        }
 
        try {
            const response = await axios.get("http://127.0.0.1:8000/v1/filter-data", {
                params: { filename: fileName , query : filterText },
            });
            
            if (!response.data || response.data.data.length === 0) {
                alert(`No matching records found. ` );
                return;
            }
            
           const headers= Object.keys(response.data.data[0]);
           
           const headerRow=headers.map(header=>({value :header}));
 
           let formattedData=response.data.data.map(row =>
               headers.map(key => ({ value :row[key]}))
             );
 
            setSpreadsheetData([headerRow,...formattedData]);
            setFilterButtonActive(true)
        } catch (error) {
          alert("Failed fetching or filtering data:" + error);
       }

  };

    return (
        <div>
            <h2>Excel File Upload & Display</h2>
            <div style={{display: "flex", width:"calc(fit-content + 1rem)"}}>
            <input style={{
                padding: "0.5rem",
                marginRight: "1rem",
                borderRadius: "10px",
                backgroundColor: "#f9f9f9",
                fontSize: "1rem",
                color: "#333",
                cursor: "pointer",
                outline: "none",
                transition: "all 0.3s ease",
                width: "90%",
                maxWidth: "50vw",
                textAlign: "center",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#e8f5e9")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#f9f9f9")}
            type="file" accept=".xls,.xlsx" onChange={handleFileChange} />
             <button onClick={handleUpload}>Upload</button>
            </div>
            <br />
            <div style={{ display: "flex", justifyContent: "space-around", width: "fit-content", paddingTop: "1rem" }}>
                <div>

                
                
                </div>

                <div style={{display: "flex", marginTop: "10px", visibility: visibilityOfBox, justifyContent: "space-between" }}>
                    <button style={{ marginLeft: "10px" }} onClick={handleDownload}>Download</button>
                    <button onClick={handleSave} style={{ marginLeft: "10px" }}>Save</button>
                    <button onClick={() => fetchData(page)} disabled={!isSpreadSheetSaved} >Load Data</button>
                    <hr style={{ margin: "10px" }} />
                    <button onClick={addRowWithHistory}>Add Row</button>
                    <button onClick={addColumnWithHistory} style={{ marginLeft: "10px" }}>Add Column</button>
                    {history.length >0 && (<button onClick={undoLastAction}>Undo</button>)}
                </div>
            </div>
            <div style={{display: "flex", visibility:visibilityOfBox, marginTop: "0.5rem"}}>
                <input 
                     type="text" 
                     placeholder="Enter text to filter..." 
                     value={filterText}
                     onChange={
                        (e)=> { setFilterText(e.target.value); setFilterButtonActive(false) } 
                    }
                     style={{
                        marginRight: "1rem",
                        borderRadius: "10px",
                        backgroundColor: "#f9f9f9",
                        fontSize: "1rem",
                        color: "#333",
                        cursor: "pointer",
                        outline: "none",
                        transition: "all 0.3s ease",
                        width: "90%",
                        maxWidth: "50vw",
                        textAlign: "center",
                    }}
                 />
                 <button onClick={handleFilterChangeBackend} disabled={filterButtonActive}>Apply Filter</button>
             </div>
            {spreadsheetData.length > 0 && (
            <div>
                <h3>Excel Data:</h3>
                <div style={{display:"flex", justifyContent: "center", margin: "1rem"}}>
                    <button onClick={() => handleHeaderSortClick(0, 'asc')}>Sort Asc</button>
                    <button onClick={() => handleHeaderSortClick(0, 'desc')}>Sort Desc</button>
                </div>
                
                <Spreadsheet 
                          data={spreadsheetData} 
                          onSelect={(cell) => {
                              if(cell.row === 0){ 
                                  handleHeaderClick(cell.column)
                              }
                          }}
                          onChange={(newData) => { 
                            setSpreadsheetData(newData);
                            setIsSpreadSheetSaved(false);
                        }}
                      />
                      <button onClick={handleEvaluate}>Evaluate</button>
                {evaluationResult !== null && <p>Result: {evaluationResult}</p>}
            </div>
            )}
            
        </div>
    );
};

export default ExcelUploader;
