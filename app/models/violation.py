from sqlalchemy import Column, String, Float, Boolean, DateTime, Integer
from app.database import Base

class Violation(Base):
    __tablename__ = "violations"

    id = Column(String(100), primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(String(500), nullable=True)
    vehicle_number = Column(String(100), nullable=True)
    vehicle_type = Column(String(100), nullable=True)
    description = Column(String(2000), nullable=True)
    violation_type = Column(String(1000), nullable=True)
    offence_code = Column(String(500), nullable=True)
    
    # Timestamps
    created_datetime = Column(DateTime(timezone=True), index=True, nullable=False)
    closed_datetime = Column(DateTime(timezone=True), nullable=True)
    modified_datetime = Column(DateTime(timezone=True), nullable=True)
    action_taken_timestamp = Column(DateTime(timezone=True), nullable=True)
    data_sent_to_scita_timestamp = Column(DateTime(timezone=True), nullable=True)
    validation_timestamp = Column(DateTime(timezone=True), nullable=True)
    
    # Identifiers & Metadata
    device_id = Column(String(100), nullable=True)
    created_by_id = Column(String(100), nullable=True)
    center_code = Column(String(50), nullable=True)
    police_station = Column(String(100), index=True, nullable=True)
    junction_name = Column(String(100), index=True, nullable=True)
    data_sent_to_scita = Column(Boolean, default=False, nullable=False)
    
    # Validations
    updated_vehicle_number = Column(String(100), nullable=True)
    updated_vehicle_type = Column(String(100), nullable=True)
    validation_status = Column(String(50), default="PENDING", nullable=False)
    
    # Engineered Time Features
    violation_hour = Column(Integer, nullable=True)
    violation_day_of_week = Column(Integer, nullable=True)
    is_weekend = Column(Integer, nullable=True)
    is_peak_hour = Column(Integer, nullable=True)
    month = Column(Integer, nullable=True)
    week_of_year = Column(Integer, nullable=True)
    violation_duration = Column(Float, nullable=True)
    action_delay = Column(Float, nullable=True)
    validation_delay = Column(Float, nullable=True)
    
    # Engineered Location Features
    hotspot_cluster_id = Column(Integer, nullable=True)
    location_repeat_frequency = Column(Integer, nullable=True)
    police_station_violation_rank = Column(Integer, nullable=True)
    junction_violation_rank = Column(Integer, nullable=True)
    
    # Engineered Vehicle Features
    is_repeat_vehicle = Column(Integer, nullable=True)
    vehicle_violation_count = Column(Integer, nullable=True)
    
    # Risk Engine Scores
    risk_score = Column(Float, index=True, nullable=True)
    risk_category = Column(String(50), nullable=True)
    risk_confidence_level = Column(String(50), nullable=True)
    risk_explanation = Column(String(500), nullable=True)
    
    # Risk Component Breakdowns
    component_density = Column(Float, nullable=True)
    component_repeat = Column(Float, nullable=True)
    component_severity = Column(Float, nullable=True)
    component_peak = Column(Float, nullable=True)
    component_delay = Column(Float, nullable=True)
    component_sensitivity = Column(Float, nullable=True)
