"""Point d'entree Flask de l'API RPG World Map."""

from flask import Flask
from flask_cors import CORS

from routes.area import area_bp
from routes.poi import poi_bp
from routes.world import world_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(poi_bp)
app.register_blueprint(area_bp)
app.register_blueprint(world_bp)

@app.get("/")
def home():
    """Retourne un statut minimal pour verifier que l'API repond."""
    return {"status": "ok"}

if __name__ == "__main__":
    app.run(debug=True, port=8001)
