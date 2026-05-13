from app import create_app
from models import db, User, Lead, Property, Deal, Campaign

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    admin = User(
        username="admin",
        email="admin@maisonsamaa.com",
        full_name="Vlad Samaa",
        role="admin",
    )
    admin.set_password("admin123")
    db.session.add(admin)

    agent = User(
        username="agent1",
        email="agent@maisonsamaa.com",
        full_name="Sarah Agent",
        role="agent",
    )
    agent.set_password("agent123")
    db.session.add(agent)
    db.session.commit()

    leads = [
        Lead(name="Omar Hassan", phone="+971501234567", email="omar@example.com",
             source="Instagram", project_interest="Origami", status="New",
             notes="Interested in a penthouse with sea view", assigned_to=admin.id),
        Lead(name="Layla Mohammed", phone="+971502345678", email="layla@example.com",
             source="Facebook", project_interest="Zahw", status="Contacted",
             notes="Family with 3 kids, needs 4BR villa", assigned_to=agent.id),
        Lead(name="Ahmed Al Rashid", phone="+971503456789", email="ahmed@example.com",
             source="Web", project_interest="Taj City", status="Follow-up",
             notes="CEO looking for commercial office space", assigned_to=admin.id),
        Lead(name="Noor Saleh", phone="+971504567890", email="noor@example.com",
             source="Referral", project_interest="Origami", status="New",
             notes="First-time buyer, pre-approved for mortgage", assigned_to=agent.id),
        Lead(name="Khalid Amiri", phone="+971505678901", email="khalid@example.com",
             source="Facebook", project_interest="Zahw", status="Closed",
             notes="Purchased 2BR unit last month", assigned_to=admin.id),
        Lead(name="Mona Adel", phone="+971506789012", email="mona@example.com",
             source="Instagram", project_interest="Taj City", status="New",
             notes="Looking for studio apartment", assigned_to=agent.id),
    ]
    db.session.add_all(leads)
    db.session.commit()

    properties = [
        Property(title="Zahw — Crystal 2BR Suite", slug="zahw-crystal-2br",
                 project_name="Zahw", unit_type="2BR", property_type="Apartment",
                 status="Available", price=2800000, area_sqm=120, bedrooms=2, bathrooms=2,
                 location="Zahw District, Dubai", city="Dubai",
                 description="Modern 2-bedroom suite with panoramic skyline views in Zahw's premium Crystal tower.",
                 features="Pool,Gym,Concierge,Smart Home,Parking,Balcony",
                 images="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9", listed_by=admin.id),
        Property(title="Origami — Signature Villa 6BR", slug="origami-signature-villa",
                 project_name="Origami", unit_type="Villa", property_type="Villa",
                 status="Available", price=12000000, area_sqm=650, bedrooms=6, bathrooms=7,
                 location="Origami Residences, Dubai Hills", city="Dubai",
                 description="Stunning 6-bedroom villa with private infinity pool and golf course views.",
                 features="Pool,Garden,Golf View,Maids Room,Driver Room,Smart Home",
                 images="https://images.unsplash.com/photo-1600585154340-be6161a56a0c", listed_by=admin.id),
        Property(title="Taj City — Executive Penthouse", slug="taj-city-penthouse",
                 project_name="Taj City", unit_type="Penthouse", property_type="Apartment",
                 status="Available", price=8500000, area_sqm=320, bedrooms=4, bathrooms=5,
                 location="Taj City, Business Bay", city="Dubai",
                 description="Luxurious 4-bedroom penthouse with Burj Khalifa views and private rooftop pool.",
                 features="Burj View,Rooftop Pool,Private Elevator,Smart Home,Concierge",
                 images="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", listed_by=agent.id),
        Property(title="Zahw — Pearl Studio", slug="zahw-pearl-studio",
                 project_name="Zahw", unit_type="Studio", property_type="Apartment",
                 status="Reserved", price=950000, area_sqm=42, bedrooms=0, bathrooms=1,
                 location="Zahw District, Dubai", city="Dubai",
                 description="Cozy studio unit in Zahw's Pearl tower. Ideal for young professionals.",
                 features="Pool,Gym,Parking,Concierge",
                 images="https://images.unsplash.com/photo-1600573472550-8090b5e0745e", listed_by=agent.id),
        Property(title="Origami — Origami 3BR Garden Suite", slug="origami-3br-garden",
                 project_name="Origami", unit_type="3BR", property_type="Apartment",
                 status="Sold", price=4500000, area_sqm=185, bedrooms=3, bathrooms=3,
                 location="Origami Residences, Dubai Hills", city="Dubai",
                 description="Premium 3-bedroom garden suite with private terrace and landscaped views.",
                 features="Garden,Private Terrace,Parking,Pool,Gym",
                 images="https://images.unsplash.com/photo-1600566753086-00f18f6b0182", listed_by=admin.id),
    ]
    db.session.add_all(properties)
    db.session.commit()

    deals = [
        Deal(lead_id=1, property_id=1, stage="Presentation", stage_order=1,
             value=2800000, assigned_to=admin.id),
        Deal(lead_id=2, property_id=2, stage="Site Visit", stage_order=1,
             value=12000000, assigned_to=agent.id),
        Deal(lead_id=3, property_id=3, stage="Reservation", stage_order=1,
             value=8500000, assigned_to=admin.id),
        Deal(lead_id=4, property_id=4, stage="Lead", stage_order=1,
             value=950000, assigned_to=agent.id),
    ]
    db.session.add_all(deals)
    db.session.commit()

    campaigns = [
        Campaign(name="Zahw Launch Campaign", type="Email", status="Sent",
                 subject="Introducing Zahw — Dubai's Newest Gem",
                 content="Be among the first to own a piece of Zahw...",
                 target_audience="All Leads", sent_count=250, opened_count=180, clicked_count=65,
                 created_by=admin.id),
        Campaign(name="Origami Villa Open House", type="Social Media", status="Active",
                 subject="Experience Origami Living",
                 content="Join us for an exclusive tour of Origami Residences...",
                 target_audience="High-Value Leads",
                 created_by=admin.id),
    ]
    db.session.add_all(campaigns)
    db.session.commit()

    print("Database seeded successfully!")
    print(f"Users: admin/admin123 (Admin), agent1/agent123 (Agent)")
    print(f"Leads: {Lead.query.count()}, Properties: {Property.query.count()}")
    print(f"Deals: {Deal.query.count()}, Campaigns: {Campaign.query.count()}")
