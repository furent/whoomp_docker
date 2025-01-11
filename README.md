Fork of https://github.com/jogolden/whoomp
![Screenshot 2025-01-11 at 04 46 30](https://github.com/user-attachments/assets/536a368a-82fe-48dc-9d40-920489473151)
![Screenshot 2025-01-11 at 04 54 39](https://github.com/user-attachments/assets/75a09dbb-d974-4a5f-b2fe-ee4fc5ae68fa)
![Screenshot 2025-01-11 at 04 58 50](https://github.com/user-attachments/assets/161b067f-d01d-4ca6-a673-d993357735f3)

# Start the application
Start the application using 
- ./scripts/build.sh : THIS DOES NOT WORK CURRENTLY. PLEASE START MANUALLY USING UVICORN AND NPM RUN DEV

This does work:

- cd backend
- python -m venv .venv
- source .venv/bin/activate
- uv sync # can be installed using pip install uv or via webpage uv package manager
- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
- cd ..
- npm install
- npm run dev

This is it. It should run at localhost:5173 now.

- If you could provide me with help of creating a script for starting it manually and with docker I would appreciate it very much.
