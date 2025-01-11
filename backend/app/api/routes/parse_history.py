from fastapi import APIRouter, HTTPException, UploadFile, File
from pathlib import Path
import tempfile
import os
from .parser import parse_data

router = APIRouter()

@router.post("/parse-history")
async def parse_history_file(file: UploadFile = File(...)):
    try:
        # Create a temporary file to store the uploaded content
        with tempfile.NamedTemporaryFile(delete=False, suffix='.bin') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Parse the temporary file
        records = parse_data(temp_file_path)
        
        # Convert records to JSON-serializable format
        parsed_data = [{
            'timestamp': record.timestamp(),
            'heart_rate': record.heart_rate,
            'rr_intervals': record.rr
        } for record in records]

        # Clean up the temporary file
        os.unlink(temp_file_path)
        
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))