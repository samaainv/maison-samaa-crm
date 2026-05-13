import logging
from flask import Blueprint, request, jsonify
from models import db, Lead, Activity

meta_bp = Blueprint("meta", __name__, url_prefix="/api/meta")

META_APP_SECRET = "your-meta-app-secret"  # set via env var in production


@meta_bp.route("/lead", methods=["POST"])
def meta_lead_webhook():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data"}), 400

    logging.info(f"Meta webhook received: {data}")

    lead_data = data.get("leadgen", {}) or data

    field_data = lead_data.get("field_data", [])
    name = ""
    phone = ""
    email = ""

    for field in field_data:
        fname = field.get("name", "").lower()
        fval = field.get("values", [""])[0]
        if "full_name" in fname or "name" in fname:
            name = fval
        elif "phone" in fname:
            phone = fval
        elif "email" in fname:
            email = fval

    if not name and not phone:
        return jsonify({"error": "No identifiable lead data"}), 400

    status = "New"
    if phone:
        existing = Lead.query.filter_by(phone=phone).first()
        if existing:
            existing.source = "Meta Lead Form"
            existing.updated_at = db.func.now()
            db.session.commit()
            return jsonify({"message": "Lead already exists, updated source"}), 200

        status = "Contacted"

    lead = Lead(
        name=name or "Meta Lead",
        phone=phone,
        email=email,
        source="Meta Lead Form",
        status=status,
        imported_from="meta",
        notes=f"Imported from Meta Lead Form.\nRaw: {str(field_data)[:500]}",
    )
    db.session.add(lead)
    db.session.commit()

    activity = Activity(
        type="lead_created",
        description=f"Lead {lead.name} imported from Meta Lead Form",
        user_id=None,
        lead_id=lead.id,
    )
    db.session.add(activity)
    db.session.commit()

    return jsonify({"message": "Lead created", "lead_id": lead.id}), 201


@meta_bp.route("/verify", methods=["GET"])
def verify_webhook():
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")

    if mode == "subscribe" and token == "maison-samaa-meta-verify-2026":
        return challenge, 200

    return jsonify({"error": "Verification failed"}), 403
