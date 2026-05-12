from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Message, User
from app.schemas import MessageCreate, MessageOut

router = APIRouter(prefix="/api/messages", tags=["messages"])


@router.post("", response_model=MessageOut, status_code=201)
def send_message(payload: MessageCreate, db: Session = Depends(get_db)):
    if payload.sender_id == payload.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content cannot be blank")
    sender = db.query(User).filter(User.id == payload.sender_id).first()
    receiver = db.query(User).filter(User.id == payload.receiver_id).first()
    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="Sender or receiver not found")
    msg = Message(
        sender_id=payload.sender_id,
        receiver_id=payload.receiver_id,
        content=content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/conversation/{user_a}/{user_b}", response_model=list[MessageOut])
def conversation_history(
    user_a: int,
    user_b: int,
    search: str | None = Query(None, description="Filter messages in this thread by text"),
    db: Session = Depends(get_db),
):
    """All messages between two users (both directions), oldest first."""
    q = db.query(Message).filter(
        or_(
            and_(Message.sender_id == user_a, Message.receiver_id == user_b),
            and_(Message.sender_id == user_b, Message.receiver_id == user_a),
        )
    )
    if search and search.strip():
        q = q.filter(Message.content.ilike(f"%{search.strip()}%"))
    return q.order_by(Message.created_at.asc()).all()


@router.get("", response_model=list[MessageOut])
def list_messages(
    search: str | None = Query(None, description="Search in message text"),
    sender_id: int | None = Query(None, description="Filter by author"),
    receiver_id: int | None = Query(None, description="Filter by recipient"),
    user_a: int | None = Query(
        None,
        description="With user_b: messages in this 1:1 conversation (both directions)",
    ),
    user_b: int | None = Query(None),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(Message)
    if user_a is not None and user_b is not None:
        q = q.filter(
            or_(
                and_(Message.sender_id == user_a, Message.receiver_id == user_b),
                and_(Message.sender_id == user_b, Message.receiver_id == user_a),
            )
        )
    else:
        if sender_id is not None:
            q = q.filter(Message.sender_id == sender_id)
        if receiver_id is not None:
            q = q.filter(Message.receiver_id == receiver_id)
    if search and search.strip():
        q = q.filter(Message.content.ilike(f"%{search.strip()}%"))
    rows = q.order_by(Message.created_at.asc()).limit(limit).all()
    return rows
