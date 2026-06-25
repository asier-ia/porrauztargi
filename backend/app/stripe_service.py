import os
import stripe
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

router = APIRouter()

PRICES = {
    "cafe": {"amount": 150, "name": "Café", "description": "Invítame a un café"},
    "cana": {"amount": 300, "name": "Caña", "description": "Invítame a una caña"},
    "cena": {"amount": 1500, "name": "Cena", "description": "Invítame a una cena"},
    "jinx": {"amount": 100, "name": "Gafe", "description": "Gafar a un participante"},
}

class PaymentIntentRequest(BaseModel):
    product_id: str
    amount: Optional[int] = Field(None, ge=100, le=20000)
    payment_method_type: str = "card"  # "card" | "bizum"
    phone: Optional[str] = None
    target_id: Optional[int] = None

class PaymentIntentResponse(BaseModel):
    client_secret: str

@router.post("/api/create-payment-intent", response_model=PaymentIntentResponse)
def create_payment_intent(req: PaymentIntentRequest):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe no configurado")

    if req.product_id in PRICES:
        amount = PRICES[req.product_id]["amount"]
        description = PRICES[req.product_id]["description"]
    elif req.product_id in ("sueno", "popup"):
        if not req.amount:
            raise HTTPException(status_code=400, detail="Importe requerido para este producto")
        amount = req.amount
        description = "Sueño" if req.product_id == "sueno" else "Soborno al árbitro"
    else:
        raise HTTPException(status_code=400, detail="Producto no válido")

    payment_method_types = ["card"]
    if req.payment_method_type == "bizum":
        payment_method_types = ["bizum"]

    metadata = {
        "product_id": req.product_id,
    }
    if req.target_id is not None:
        metadata["target_id"] = str(req.target_id)

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="eur",
            payment_method_types=payment_method_types,
            description=description,
            metadata=metadata,
        )
        return PaymentIntentResponse(client_secret=intent.client_secret)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
