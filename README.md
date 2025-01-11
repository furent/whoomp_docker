Fork of https://github.com/jogolden/whoomp
![2025-01-1107 33 02-ezgif com-optimize](https://github.com/user-attachments/assets/a5ea850d-ab91-44fb-93f5-3d9c282d63da)


# Start the application
- ./scripts/build.sh : THIS DOES NOT WORK CURRENTLY. PLEASE START MANUALLY USING UVICORN AND NPM RUN DEV

This does work:

- cd backend
- uv sync
- source .venv/bin/activate
- uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
- cd ..
- npm install
- npm run dev

This is it. It should run at localhost:5173 now.

- If you could provide me with help of creating a script for starting it manually and with docker I would appreciate it very much.
