from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    email: EmailStr
    password: str = Field(min_length=4, max_length=128)


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    sender_id: int
    receiver_id: int
    content: str = Field(min_length=1, max_length=8000)


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    sender_username: str | None = None
    receiver_username: str | None = None
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
