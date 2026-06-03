from fastapi import WebSocket
from typing import Dict, Set
import json
import asyncio


class ConnectionManager:
    def __init__(self):
        # seller_id -> set of websocket connections
        self.seller_connections: Dict[str, Set[WebSocket]] = {}
        # user_id -> set of websocket connections
        self.user_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, seller_id: str = None):
        await websocket.accept()
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

        if seller_id:
            if seller_id not in self.seller_connections:
                self.seller_connections[seller_id] = set()
            self.seller_connections[seller_id].add(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str, seller_id: str = None):
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        if seller_id and seller_id in self.seller_connections:
            self.seller_connections[seller_id].discard(websocket)
            if not self.seller_connections[seller_id]:
                del self.seller_connections[seller_id]

    async def send_to_user(self, user_id: str, data: dict):
        connections = self.user_connections.get(user_id, set()).copy()
        dead = []
        for ws in connections:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.user_connections.get(user_id, set()).discard(ws)

    async def broadcast_to_seller(self, seller_id: str, data: dict):
        connections = self.seller_connections.get(seller_id, set()).copy()
        dead = []
        for ws in connections:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.seller_connections.get(seller_id, set()).discard(ws)

    async def broadcast_all(self, data: dict):
        message = json.dumps(data)
        for connections in self.user_connections.values():
            for ws in connections.copy():
                try:
                    await ws.send_text(message)
                except Exception:
                    pass


ws_manager = ConnectionManager()
