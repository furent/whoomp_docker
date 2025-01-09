Fork of https://github.com/jogolden/whoomp

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
