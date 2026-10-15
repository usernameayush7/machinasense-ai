"""WebSocket connection manager for real-time telemetry streaming and live alert pushes."""

import asyncio
from typing import Set, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect

from app.schemas.telemetry import TelemetryPacket
from app.schemas.alert import MaintenanceAlert


class WebSocketManager:
    """Manages active WebSocket subscribers for live plant telemetry and alerts."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new client connection."""
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        # Send initial welcome confirmation
        await websocket.send_json({
            "event": "connection_established",
            "message": "Connected to MachinaSense real-time telemetry stream.",
            "active_clients": len(self.active_connections),
        })

    async def disconnect(self, websocket: WebSocket) -> None:
        """Unregister a disconnected client."""
        async with self._lock:
            self.active_connections.discard(websocket)

    async def broadcast_json(self, payload: Dict[str, Any]) -> None:
        """Broadcast JSON message to all active clients with dead-connection pruning."""
        async with self._lock:
            clients = list(self.active_connections)

        dead_clients = []
        for ws in clients:
            try:
                await ws.send_json(payload)
            except (WebSocketDisconnect, RuntimeError, Exception):
                dead_clients.append(ws)

        if dead_clients:
            async with self._lock:
                for dead_ws in dead_clients:
                    self.active_connections.discard(dead_ws)

    async def broadcast_telemetry(self, packet: TelemetryPacket) -> None:
        """Broadcast live telemetry packet to frontend charts."""
        if not self.active_connections:
            return

        payload = {
            "event": "telemetry",
            "machine_id": packet.machine_id,
            "timestamp": packet.timestamp.isoformat(),
            "operating_mode": packet.operating_mode,
            "sensors": packet.sensors.model_dump(),
        }
        await self.broadcast_json(payload)

    async def broadcast_alert(self, alert: MaintenanceAlert) -> None:
        """Broadcast critical or warning alert to frontend toast notification system."""
        if not self.active_connections:
            return

        payload = {
            "event": "alert",
            "data": alert.model_dump(mode="json"),
        }
        await self.broadcast_json(payload)


# Global singleton instance for application use
ws_manager = WebSocketManager()
