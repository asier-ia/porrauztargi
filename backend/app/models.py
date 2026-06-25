from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    points_total = Column(Integer, default=0, nullable=False)
    points_groups = Column(Integer, default=0, nullable=False)
    points_scorers = Column(Integer, default=0, nullable=False)
    points_top4 = Column(Integer, default=0, nullable=False)
    rank = Column(Integer, nullable=True)

    prediction = relationship("Prediction", back_populates="participant", uselist=False, cascade="all, delete-orphan")
    jinxes = relationship("Jinx", back_populates="target", cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False, unique=True)
    
    group_predictions = Column(JSON, nullable=False)
    scorers_predictions = Column(JSON, nullable=False)
    top4_predictions = Column(JSON, nullable=False)

    participant = relationship("Participant", back_populates="prediction")

class RealWorldData(Base):
    __tablename__ = "real_world_data"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(JSON, nullable=False)

class Jinx(Base):
    __tablename__ = "jinxes"

    id = Column(Integer, primary_key=True, index=True)
    target_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    target = relationship("Participant", back_populates="jinxes")
