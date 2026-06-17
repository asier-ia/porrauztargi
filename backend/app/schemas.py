from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Optional

# Prediction Schemas
class PredictionBase(BaseModel):
    group_predictions: Dict[str, List[str]]
    scorers_predictions: List[str]
    top4_predictions: Dict[str, str]

class PredictionCreate(PredictionBase):
    pass

class PredictionResponse(PredictionBase):
    id: int
    participant_id: int

    model_config = ConfigDict(from_attributes=True)

# Participant Schemas
class ParticipantBase(BaseModel):
    name: str

class ParticipantCreate(ParticipantBase):
    prediction: PredictionCreate

class ParticipantResponse(ParticipantBase):
    id: int
    points_total: int
    points_groups: int
    points_scorers: int
    points_top4: int
    rank: Optional[int] = None
    prize: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)

class ScorerMatch(BaseModel):
    predicted_name: str
    real_name: Optional[str] = None
    goals: int = 0
    points: int = 0

class ParticipantDetailResponse(ParticipantResponse):
    prediction: Optional[PredictionResponse] = None
    scorer_matches: List[ScorerMatch] = []

    model_config = ConfigDict(from_attributes=True)

# RealWorldData Schemas
class RealWorldDataBase(BaseModel):
    key: str
    value: Dict | List

class RealWorldDataResponse(RealWorldDataBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
