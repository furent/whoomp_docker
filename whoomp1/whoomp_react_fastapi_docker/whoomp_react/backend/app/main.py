from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from app.api.routes.hrv import router as hrv_router
from app.api.routes.packet import router as packet_router
from app.api.routes.parser import router as parser_router
from app.api.routes.plot import router as plot_router
from app.api.routes.whoop import router as whoop_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hrv_router, prefix="/hrv")
app.include_router(packet_router, prefix="/packet")
app.include_router(parser_router, prefix="/parser")
app.include_router(plot_router, prefix="/plot")
app.include_router(whoop_router, prefix="/whoop")

