Fork of https://github.com/jogolden/whoomp

# Start the application
Start the application using 
- ./scripts/build.sh

or manually by creating a virtual environment for the backend and starting it using:
`uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

and starting the frontend: `npm run dev`
