import csv
import io
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Lead, Activity

leads_bp = Blueprint("leads", __name__, url_prefix="/api/leads")

VALID_STATUSES = ["New", "Contacted", "Follow-up", "Closed"]
VALID_SOURCES = ["Facebook", "Instagram", "Web", "Referral", "Walk-in", "Meta Lead Form"]


@leads_bp.route("", methods=["GET"])
@jwt_required()
def get_leads():
    status = request.args.get("status")
    source = request.args.get("source")
    project = request.args.get("project_interest")
    assigned = request.args.get("assigned_to")
    search = request.args.get("search")

    query = Lead.query

    if status:
        query = query.filter(Lead.status == status)
    if source:
        query = query.filter(Lead.source == source)
    if project:
        query = query.filter(Lead.project_interest == project)
    if assigned:
        query = query.filter(Lead.assigned_to == int(assigned))
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(Lead.name.ilike(like), Lead.phone.ilike(like), Lead.email.ilike(like))
        )

    leads = query.order_by(Lead.created_at.desc()).all()
    return jsonify({"leads": [l.to_dict() for l in leads]}), 200


@leads_bp.route("/<int:lead_id>", methods=["GET"])
@jwt_required()
def get_lead(lead_id):
    lead = Lead.query.get_or_404(lead_id)
    return jsonify({"lead": lead.to_dict()}), 200


@leads_bp.route("", methods=["POST"])
@jwt_required()
def create_lead():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    lead = Lead(
        name=data["name"],
        phone=data.get("phone"),
        email=data.get("email"),
        source=data.get("source"),
        project_interest=data.get("project_interest"),
        status=data.get("status", "New"),
        notes=data.get("notes"),
        imported_from=data.get("imported_from", "manual"),
        assigned_to=data.get("assigned_to", user_id),
    )
    db.session.add(lead)
    db.session.commit()

    _log_activity(lead.id, user_id, f"Lead {lead.name} was created")
    return jsonify({"lead": lead.to_dict()}), 201


@leads_bp.route("/<int:lead_id>", methods=["PUT"])
@jwt_required()
def update_lead(lead_id):
    lead = Lead.query.get_or_404(lead_id)
    data = request.get_json()
    user_id = int(get_jwt_identity())

    for field in ("name", "phone", "email", "source", "project_interest", "status", "notes", "assigned_to"):
        if field in data:
            setattr(lead, field, data[field])

    db.session.commit()
    _log_activity(lead.id, user_id, f"Lead {lead.name} was updated")
    return jsonify({"lead": lead.to_dict()}), 200


@leads_bp.route("/<int:lead_id>", methods=["DELETE"])
@jwt_required()
def delete_lead(lead_id):
    lead = Lead.query.get_or_404(lead_id)
    db.session.delete(lead)
    db.session.commit()
    return jsonify({"message": "Lead deleted"}), 200


@leads_bp.route("/import", methods=["POST"])
@jwt_required()
def import_leads():
    user_id = int(get_jwt_identity())
    file = request.files.get("file")

    if not file:
        return jsonify({"error": "No file provided"}), 400

    filename = file.filename.lower()
    is_excel = filename.endswith((".xls", ".xlsx"))
    is_csv = filename.endswith(".csv")

    if not (is_csv or is_excel):
        return jsonify({"error": "Only CSV and Excel files are supported"}), 400

    imported = 0
    errors = []

    if is_csv:
        stream = io.StringIO(file.stream.read().decode("utf-8-sig"))
        reader = csv.DictReader(stream)

        for i, row in enumerate(reader, start=1):
            try:
                lead = Lead(
                    name=row.get("name") or row.get("Name") or f"Lead #{i}",
                    phone=row.get("phone") or row.get("Phone") or row.get("mobile", ""),
                    email=row.get("email") or row.get("Email", ""),
                    source=_clean_value(row.get("source") or row.get("Source", ""), VALID_SOURCES),
                    project_interest=row.get("project_interest") or row.get("Project") or row.get("project", ""),
                    status=_clean_value(row.get("status") or row.get("Status", "New"), VALID_STATUSES),
                    notes=row.get("notes") or row.get("Notes", ""),
                    imported_from="csv",
                    assigned_to=user_id,
                )
                db.session.add(lead)
                imported += 1
            except Exception as e:
                errors.append({"row": i, "error": str(e)})
    else:
        return jsonify({"error": "Excel import requires openpyxl library. Install with: pip install openpyxl"}), 400

    db.session.commit()

    activity = Activity(
        type="import",
        description=f"Imported {imported} leads from {filename}",
        user_id=user_id,
    )
    db.session.add(activity)
    db.session.commit()

    return jsonify({
        "message": f"Imported {imported} leads",
        "imported": imported,
        "errors": errors,
    }), 201


@leads_bp.route("/<int:lead_id>/activities", methods=["GET"])
@jwt_required()
def get_lead_activities(lead_id):
    activities = Activity.query.filter_by(lead_id=lead_id).order_by(Activity.created_at.desc()).all()
    return jsonify({"activities": [a.to_dict() for a in activities]}), 200


@leads_bp.route("/<int:lead_id>/activities", methods=["POST"])
@jwt_required()
def add_lead_activity(lead_id):
    data = request.get_json()
    user_id = int(get_jwt_identity())

    activity = Activity(
        type=data.get("type", "note"),
        description=data["description"],
        lead_id=lead_id,
        user_id=user_id,
    )
    db.session.add(activity)
    db.session.commit()

    return jsonify({"activity": activity.to_dict()}), 201


def _log_activity(lead_id, user_id, description):
    activity = Activity(type="lead_updated", description=description, lead_id=lead_id, user_id=user_id)
    db.session.add(activity)
    db.session.commit()


def _clean_value(value, valid_list):
    v = value.strip().lower().title() if value else ""
    for valid in valid_list:
        if valid.lower() == v.lower():
            return valid
    return value.strip() if value else ""
