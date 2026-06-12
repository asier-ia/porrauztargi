from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
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

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False, unique=True)
    
    # Store structured prediction data in JSON columns
    # Example format:
    # group_predictions: {"A": ["Spain", "Germany"], "B": ["Argentina", "Canada"], ...}
    group_predictions = Column(JSON, nullable=False)
    
    # Example format:
    # scorers_predictions: ["Mbappe", "Messi", "Haaland"]
    scorers_predictions = Column(JSON, nullable=False)
    
    # Example format:
    # top4_predictions: {"1": "Spain", "2": "France", "3": "Argentina", "4": "Brazil"}
    top4_predictions = Column(JSON, nullable=False)

    participant = relationship("Participant", back_populates="prediction")

class RealWorldData(Base):
    __tablename__ = "real_world_data"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False) # "standings", "scorers", "top4"
    value = Column(JSON, nullable=False)
