from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Campaign, Lead, Property, Deal

marketing_bp = Blueprint("marketing", __name__, url_prefix="/api/marketing")


@marketing_bp.route("/campaigns", methods=["GET"])
@jwt_required()
def get_campaigns():
    campaigns = Campaign.query.order_by(Campaign.created_at.desc()).all()
    return jsonify({"campaigns": [c.to_dict() for c in campaigns]}), 200


@marketing_bp.route("/campaigns", methods=["POST"])
@jwt_required()
def create_campaign():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    scheduled = None
    if data.get("scheduled_date"):
        scheduled = datetime.fromisoformat(data["scheduled_date"])

    campaign = Campaign(
        name=data["name"],
        type=data.get("type"),
        status=data.get("status", "draft"),
        subject=data.get("subject"),
        content=data.get("content"),
        target_audience=data.get("target_audience"),
        scheduled_date=scheduled,
        created_by=user_id,
    )
    db.session.add(campaign)
    db.session.commit()

    return jsonify({"campaign": campaign.to_dict()}), 201


@marketing_bp.route("/campaigns/<int:campaign_id>", methods=["PUT"])
@jwt_required()
def update_campaign(campaign_id):
    campaign = Campaign.query.get_or_404(campaign_id)
    data = request.get_json()

    for field in ("name", "type", "status", "subject", "content", "target_audience",
                  "sent_count", "opened_count", "clicked_count"):
        if field in data:
            setattr(campaign, field, data[field])

    if data.get("scheduled_date"):
        campaign.scheduled_date = datetime.fromisoformat(data["scheduled_date"])

    db.session.commit()
    return jsonify({"campaign": campaign.to_dict()}), 200


@marketing_bp.route("/campaigns/<int:campaign_id>", methods=["DELETE"])
@jwt_required()
def delete_campaign(campaign_id):
    campaign = Campaign.query.get_or_404(campaign_id)
    db.session.delete(campaign)
    db.session.commit()
    return jsonify({"message": "Campaign deleted"}), 200


@marketing_bp.route("/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    total_leads = Lead.query.count()
    total_properties = Property.query.count()
    total_campaigns = Campaign.query.count()
    total_deals = Deal.query.count()

    leads_by_status = {}
    for status in ("New", "Contacted", "Follow-up", "Closed"):
        count = Lead.query.filter_by(status=status).count()
        if count > 0:
            leads_by_status[status] = count

    properties_by_status = {}
    for status in ("Available", "Reserved", "Sold"):
        count = Property.query.filter_by(status=status).count()
        if count > 0:
            properties_by_status[status] = count

    pipeline_stages = {}
    for stage in ("Lead", "Presentation", "Site Visit", "Reservation", "Contracted"):
        count = Deal.query.filter_by(stage=stage).count()
        if count > 0:
            pipeline_stages[stage] = count

    return jsonify({
        "total_leads": total_leads,
        "total_properties": total_properties,
        "total_campaigns": total_campaigns,
        "total_deals": total_deals,
        "leads_by_status": leads_by_status,
        "properties_by_status": properties_by_status,
        "pipeline_stages": pipeline_stages,
    }), 200
