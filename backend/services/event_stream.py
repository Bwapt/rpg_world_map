"""Diffusion d'evenements serveur vers les clients connectes en SSE."""

import json
import queue
import time


_subscribers = set()


def subscribe():
    """Enregistre un client SSE et retourne sa file d'evenements."""
    subscriber = queue.Queue()
    _subscribers.add(subscriber)
    return subscriber


def unsubscribe(subscriber):
    """Retire un client SSE."""
    _subscribers.discard(subscriber)


def publish(event_type, payload):
    """Diffuse un evenement a tous les clients connectes."""
    event = {
        "type": event_type,
        "payload": payload,
        "timestamp": int(time.time()),
    }

    for subscriber in list(_subscribers):
        subscriber.put(event)


def format_sse(event):
    """Formate un evenement pour le protocole Server-Sent Events."""
    return f"event: {event['type']}\ndata: {json.dumps(event)}\n\n"
