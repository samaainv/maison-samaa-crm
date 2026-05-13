from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db
from routes.auth import auth_bp
from routes.leads import leads_bp
from routes.properties import properties_bp
from routes.marketing import marketing_bp
from routes.pipeline import pipeline_bp
from routes.meta_webhook import meta_bp
from routes.admin import admin_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    db.init_app(app)

    with app.app_context():
        db.create_all()

    app.register_blueprint(auth_bp)
    app.register_blueprint(leads_bp)
    app.register_blueprint(properties_bp)
    app.register_blueprint(marketing_bp)
    app.register_blueprint(pipeline_bp)
    app.register_blueprint(meta_bp)
    app.register_blueprint(admin_bp)

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
