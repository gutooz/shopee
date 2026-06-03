from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.common.security import decode_token
from app.websocket.manager import ws_manager
from app.database import get_database
from bson import ObjectId
import json

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")
    role = payload.get("role")
    seller_id = None

    db = get_database()
    if db is not None and role == "seller":
        seller = await db.sellers.find_one({"user_id": user_id})
        if seller:
            seller_id = str(seller["_id"])

    await ws_manager.connect(websocket, user_id, seller_id)

    try:
        await websocket.send_json({"event": "connected", "user_id": user_id})
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_json({"event": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id, seller_id)
