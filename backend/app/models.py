from sqlalchemy import JSON, Boolean, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base


class ProductRow(Base):
    __tablename__ = "products"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True)
    plataforma: Mapped[str] = mapped_column(String, index=True)
    tipo: Mapped[str] = mapped_column(String, index=True)
    condicao: Mapped[str] = mapped_column(String, index=True)
    preco_a_vista: Mapped[float] = mapped_column(Float, index=True)
    estoque: Mapped[int] = mapped_column(Integer)
    retirada_imediata: Mapped[bool] = mapped_column(Boolean)
    em_revisao: Mapped[bool] = mapped_column(Boolean, default=False)
    relevancia: Mapped[int] = mapped_column(Integer)
    criado_em: Mapped[str] = mapped_column(String)
    search_index: Mapped[str] = mapped_column(String)
    doc: Mapped[dict] = mapped_column(JSON)


class ContentRow(Base):
    """Key/value store for small content lists: services, trade-in, reviews, faq, campaigns."""
    __tablename__ = "content"
    key: Mapped[str] = mapped_column(String, primary_key=True)
    doc: Mapped[list | dict] = mapped_column(JSON)


class OrderRow(Base):
    __tablename__ = "orders"
    numero: Mapped[str] = mapped_column(String, primary_key=True)
    total: Mapped[float] = mapped_column(Float)
    criado_em: Mapped[str] = mapped_column(String)
    doc: Mapped[dict] = mapped_column(JSON)
