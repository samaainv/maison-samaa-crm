import hashlib
import secrets
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(120))
    role = db.Column(db.String(20), default="agent")
    avatar = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    leads = db.relationship("Lead", backref="assigned_user", lazy="dynamic")
    properties = db.relationship("Property", backref="listed_by_user", lazy="dynamic")

    def set_password(self, password):
        salt = secrets.token_hex(16)
        h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 600000)
        self.password_hash = f"{salt}${h.hex()}"

    def check_password(self, password):
        salt, hsh = self.password_hash.split("$", 1)
        h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 600000)
        return h.hex() == hsh

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "avatar": self.avatar,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Lead(db.Model):
    __tablename__ = "leads"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    phone = db.Column(db.String(30))
    email = db.Column(db.String(120))
    source = db.Column(db.String(50))  # Facebook, Instagram, Web, Referral, Walk-in
    project_interest = db.Column(db.String(100))  # Zahw, Taj City, Origami, Other
    status = db.Column(db.String(30), default="New")
    notes = db.Column(db.Text)
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"))
    imported_from = db.Column(db.String(50))  # csv, excel, meta, manual
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    activities = db.relationship("Activity", backref="lead", lazy="dynamic")
    deals = db.relationship("Deal", backref="lead", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "source": self.source,
            "project_interest": self.project_interest,
            "status": self.status,
            "notes": self.notes,
            "assigned_to": self.assigned_to,
            "assigned_name": self.assigned_user.full_name if self.assigned_user else None,
            "imported_from": self.imported_from,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Property(db.Model):
    __tablename__ = "properties"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True)
    project_name = db.Column(db.String(100))  # Zahw, Taj City, Origami
    unit_type = db.Column(db.String(50))  # Studio, 1BR, 2BR, 3BR, Villa, Penthouse
    property_type = db.Column(db.String(50))
    status = db.Column(db.String(30), default="Available")  # Available, Reserved, Sold
    price = db.Column(db.Float, nullable=False)
    area_sqm = db.Column(db.Float)
    bedrooms = db.Column(db.Integer)
    bathrooms = db.Column(db.Integer)
    location = db.Column(db.String(200))
    city = db.Column(db.String(100))
    description = db.Column(db.Text)
    features = db.Column(db.Text)
    images = db.Column(db.Text)
    listed_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "project_name": self.project_name,
            "unit_type": self.unit_type,
            "property_type": self.property_type,
            "status": self.status,
            "price": self.price,
            "area_sqm": self.area_sqm,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "location": self.location,
            "city": self.city,
            "description": self.description,
            "features": self.features.split(",") if self.features else [],
            "images": self.images.split(",") if self.images else [],
            "listed_by": self.listed_by,
            "listed_by_name": self.listed_by_user.full_name if self.listed_by_user else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Deal(db.Model):
    __tablename__ = "deals"

    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("leads.id"), nullable=False)
    property_id = db.Column(db.Integer, db.ForeignKey("properties.id"))
    stage = db.Column(db.String(50), default="Lead")
    stage_order = db.Column(db.Integer, default=0)
    value = db.Column(db.Float)
    notes = db.Column(db.Text)
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    property = db.relationship("Property", foreign_keys=[property_id])
    assignee = db.relationship("User", foreign_keys=[assigned_to])

    def to_dict(self):
        return {
            "id": self.id,
            "lead_id": self.lead_id,
            "lead_name": self.lead.name if self.lead else None,
            "lead_phone": self.lead.phone if self.lead else None,
            "property_id": self.property_id,
            "property_title": self.property.title if self.property else None,
            "stage": self.stage,
            "stage_order": self.stage_order,
            "value": self.value,
            "notes": self.notes,
            "assigned_to": self.assigned_to,
            "assigned_name": self.assignee.full_name if self.assignee else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class PendingChange(db.Model):
    __tablename__ = "pending_changes"

    id = db.Column(db.Integer, primary_key=True)
    entity_type = db.Column(db.String(50), nullable=False)  # property, lead, deal
    entity_id = db.Column(db.Integer, nullable=False)
    field_name = db.Column(db.String(100))
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    status = db.Column(db.String(20), default="pending")  # pending, approved, rejected
    submitted_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    review_note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_at = db.Column(db.DateTime)

    submitter = db.relationship("User", foreign_keys=[submitted_by])
    reviewer = db.relationship("User", foreign_keys=[reviewed_by])

    def to_dict(self):
        return {
            "id": self.id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "field_name": self.field_name,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "status": self.status,
            "submitted_by": self.submitted_by,
            "submitted_name": self.submitter.full_name if self.submitter else None,
            "reviewed_by": self.reviewed_by,
            "reviewer_name": self.reviewer.full_name if self.reviewer else None,
            "review_note": self.review_note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
        }


class Campaign(db.Model):
    __tablename__ = "campaigns"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50))
    status = db.Column(db.String(30), default="draft")
    subject = db.Column(db.String(200))
    content = db.Column(db.Text)
    target_audience = db.Column(db.String(200))
    scheduled_date = db.Column(db.DateTime)
    sent_count = db.Column(db.Integer, default=0)
    opened_count = db.Column(db.Integer, default=0)
    clicked_count = db.Column(db.Integer, default=0)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "status": self.status,
            "subject": self.subject,
            "content": self.content,
            "target_audience": self.target_audience,
            "scheduled_date": self.scheduled_date.isoformat() if self.scheduled_date else None,
            "sent_count": self.sent_count,
            "opened_count": self.opened_count,
            "clicked_count": self.clicked_count,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Activity(db.Model):
    __tablename__ = "activities"

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50))
    description = db.Column(db.Text)
    lead_id = db.Column(db.Integer, db.ForeignKey("leads.id"))
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "description": self.description,
            "lead_id": self.lead_id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
