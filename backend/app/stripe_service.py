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
    "jinx": {"amount": 100, "name": "Mal de ojo", "description": "Echar mal de ojo a un participante"},
}

def verify_payment_intent(payment_intent_id: str) -> bool:
    if not stripe.api_key:
        return False
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return intent.status == "succeeded"
    except stripe.error.StripeError:
        return False

class PaymentIntentRequest(BaseModel):
    product_id: str
    amount: Optional[int] = Field(None, ge=100, le=20000)
    payment_method_type: str = "card"  # "card" | "bizum"
    phone: Optional[str] = None
    target_id: Optional[int] = None
    quantity: Optional[int] = 1

class PaymentIntentResponse(BaseModel):
    client_secret: str

@router.post("/api/create-payment-intent", response_model=PaymentIntentResponse)
def create_payment_intent(req: PaymentIntentRequest):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe no configurado")

    if req.product_id in PRICES:
        base_amount = PRICES[req.product_id]["amount"]
        quantity = req.quantity or 1
        amount = base_amount * quantity
        description = PRICES[req.product_id]["description"]
        if req.product_id == "jinx":
            description = f"Mal de ojo acumulativo x{quantity} para participante ID {req.target_id}"
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
    if req.quantity is not None:
        metadata["quantity"] = str(req.quantity)

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
