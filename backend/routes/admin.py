from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, PendingChange, Property, Lead

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def admin_required(f):
    """Decorator to restrict to admin users."""
    from functools import wraps

    @wraps(f)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)

    return wrapper


@admin_bp.route("/pending", methods=["GET"])
@admin_required
def get_pending_changes():
    status = request.args.get("status", "pending")
    changes = PendingChange.query.filter_by(status=status).order_by(PendingChange.created_at.desc()).all()
    return jsonify({"changes": [c.to_dict() for c in changes]}), 200


@admin_bp.route("/pending", methods=["POST"])
@jwt_required()
def submit_change():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    change = PendingChange(
        entity_type=data["entity_type"],
        entity_id=data["entity_id"],
        field_name=data.get("field_name"),
        old_value=str(data.get("old_value", "")),
        new_value=str(data.get("new_value", "")),
        submitted_by=user_id,
    )
    db.session.add(change)
    db.session.commit()

    return jsonify({"change": change.to_dict()}), 201


@admin_bp.route("/pending/<int:change_id>/approve", methods=["PUT"])
@admin_required
def approve_change(change_id):
    change = PendingChange.query.get_or_404(change_id)
    admin_id = int(get_jwt_identity())

    entity = None
    if change.entity_type == "property":
        entity = Property.query.get(change.entity_id)
    elif change.entity_type == "lead":
        entity = Lead.query.get(change.entity_id)

    if entity and change.field_name:
        if hasattr(entity, change.field_name):
            setattr(entity, change.field_name, change.new_value)
            db.session.commit()

    change.status = "approved"
    change.reviewed_by = admin_id
    change.reviewed_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({"change": change.to_dict()}), 200


@admin_bp.route("/pending/<int:change_id>/reject", methods=["PUT"])
@admin_required
def reject_change(change_id):
    change = PendingChange.query.get_or_404(change_id)
    admin_id = int(get_jwt_identity())
    data = request.get_json()

    change.status = "rejected"
    change.reviewed_by = admin_id
    change.review_note = data.get("review_note", "")
    change.reviewed_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({"change": change.to_dict()}), 200


@admin_bp.route("/users", methods=["GET"])
@admin_required
def manage_users():
    users = User.query.all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200
