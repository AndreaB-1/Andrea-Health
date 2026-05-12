from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class BiometricLog(Base):
    __tablename__ = "biometric_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    weight_kg = Column(Float, nullable=False)
    body_fat_pct = Column(Float)
    muscle_mass_kg = Column(Float)
    body_water_pct = Column(Float)
    bone_mass_kg = Column(Float)
    visceral_fat_index = Column(Float)
    bmi = Column(Float)
    notes = Column(Text)
    measured_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="biometric_logs")
