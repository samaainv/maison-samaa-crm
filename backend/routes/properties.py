import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Property

properties_bp = Blueprint("properties", __name__, url_prefix="/api/properties")


def slugify(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


@properties_bp.route("", methods=["GET"])
@jwt_required(optional=True)
def get_properties():
    status = request.args.get("status")
    project = request.args.get("project_name")
    unit_type = request.args.get("unit_type")
    min_price = request.args.get("min_price")
    max_price = request.args.get("max_price")
    search = request.args.get("search")

    query = Property.query

    if status:
        query = query.filter(Property.status == status)
    if project:
        query = query.filter(Property.project_name == project)
    if unit_type:
        query = query.filter(Property.unit_type == unit_type)
    if min_price:
        query = query.filter(Property.price >= float(min_price))
    if max_price:
        query = query.filter(Property.price <= float(max_price))
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Property.title.ilike(like),
                Property.project_name.ilike(like),
                Property.location.ilike(like),
            )
        )

    properties = query.order_by(Property.created_at.desc()).all()
    return jsonify({"properties": [p.to_dict() for p in properties]}), 200


@properties_bp.route("/<int:prop_id>", methods=["GET"])
@jwt_required(optional=True)
def get_property(prop_id):
    prop = Property.query.get_or_404(prop_id)
    return jsonify({"property": prop.to_dict()}), 200


@properties_bp.route("", methods=["POST"])
@jwt_required()
def create_property():
    data = request.get_json()
    user_id = int(get_jwt_identity())

    title = data["title"]
    prop = Property(
        title=title,
        slug=slugify(title),
        project_name=data.get("project_name"),
        unit_type=data.get("unit_type"),
        property_type=data.get("property_type"),
        status=data.get("status", "Available"),
        price=data["price"],
        area_sqm=data.get("area_sqm"),
        bedrooms=data.get("bedrooms"),
        bathrooms=data.get("bathrooms"),
        location=data.get("location"),
        city=data.get("city"),
        description=data.get("description"),
        features=",".join(data.get("features", [])),
        images=",".join(data.get("images", [])),
        listed_by=user_id,
    )
    db.session.add(prop)
    db.session.commit()

    return jsonify({"property": prop.to_dict()}), 201


@properties_bp.route("/<int:prop_id>", methods=["PUT"])
@jwt_required()
def update_property(prop_id):
    prop = Property.query.get_or_404(prop_id)
    data = request.get_json()

    for field in ("title", "project_name", "unit_type", "property_type", "status",
                  "price", "area_sqm", "bedrooms", "bathrooms", "location", "city", "description"):
        if field in data:
            setattr(prop, field, data[field])

    if "features" in data:
        prop.features = ",".join(data["features"])
    if "images" in data:
        prop.images = ",".join(data["images"])
    if "title" in data:
        prop.slug = slugify(data["title"])

    db.session.commit()
    return jsonify({"property": prop.to_dict()}), 200


@properties_bp.route("/<int:prop_id>", methods=["DELETE"])
@jwt_required()
def delete_property(prop_id):
    prop = Property.query.get_or_404(prop_id)
    db.session.delete(prop)
    db.session.commit()
    return jsonify({"message": "Property deleted"}), 200
