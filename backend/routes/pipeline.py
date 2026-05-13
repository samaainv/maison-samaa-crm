from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Deal, Activity

pipeline_bp = Blueprint("pipeline", __name__, url_prefix="/api/pipeline")

STAGES = ["Lead", "Presentation", "Site Visit", "Reservation", "Contracted"]


@pipeline_bp.route("", methods=["GET"])
@jwt_required()
def get_pipeline():
    deals = Deal.query.order_by(Deal.stage_order).all()
    grouped = {s: [] for s in STAGES}
    for deal in deals:
        stage = deal.stage if deal.stage in STAGES else "Lead"
        grouped[stage].append(deal.to_dict())
    return jsonify({"pipeline": grouped, "stages": STAGES}), 200


@pipeline_bp.route("", methods=["POST"])
@jwt_required()
def create_deal():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    lead_id = data.get("lead_id")
    if not lead_id:
        return jsonify({"error": "lead_id is required"}), 400

    max_order = db.session.query(db.func.max(Deal.stage_order)).filter(
        Deal.stage == data.get("stage", "Lead")
    ).scalar() or 0

    deal = Deal(
        lead_id=lead_id,
        property_id=data.get("property_id"),
        stage=data.get("stage", "Lead"),
        stage_order=max_order + 1,
        value=data.get("value"),
        notes=data.get("notes"),
        assigned_to=data.get("assigned_to", user_id),
    )
    db.session.add(deal)
    db.session.commit()

    _log_deal_activity(deal.id, user_id, f"Deal added to {deal.stage} stage")
    return jsonify({"deal": deal.to_dict()}), 201


@pipeline_bp.route("/<int:deal_id>", methods=["PUT"])
@jwt_required()
def update_deal(deal_id):
    deal = Deal.query.get_or_404(deal_id)
    data = request.get_json()
    user_id = int(get_jwt_identity())

    old_stage = deal.stage

    for field in ("stage", "stage_order", "property_id", "value", "notes", "assigned_to"):
        if field in data:
            setattr(deal, field, data[field])

    db.session.commit()

    if deal.stage != old_stage:
        _log_deal_activity(deal.id, user_id, f"Moved from {old_stage} to {deal.stage}")
    else:
        _log_deal_activity(deal.id, user_id, "Deal updated")

    return jsonify({"deal": deal.to_dict()}), 200


@pipeline_bp.route("/<int:deal_id>", methods=["DELETE"])
@jwt_required()
def delete_deal(deal_id):
    deal = Deal.query.get_or_404(deal_id)
    db.session.delete(deal)
    db.session.commit()
    return jsonify({"message": "Deal removed from pipeline"}), 200


@pipeline_bp.route("/reorder", methods=["PUT"])
@jwt_required()
def reorder_pipeline():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    deals = data.get("deals", [])
    for item in deals:
        deal = Deal.query.get(item.get("id"))
        if deal:
            deal.stage = item.get("stage", deal.stage)
            deal.stage_order = item.get("stage_order", 0)
    db.session.commit()

    return jsonify({"message": "Pipeline reordered"}), 200


def _log_deal_activity(deal_id, user_id, description):
    activity = Activity(
        type="deal_updated",
        description=description,
        user_id=user_id,
    )
    db.session.add(activity)
    db.session.commit()
