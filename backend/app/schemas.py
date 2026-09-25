from typing import Literal
from pydantic import BaseModel, Field


class Cliente(BaseModel):
    nome: str = Field(min_length=2)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    telefone: str = Field(min_length=10)


class Item(BaseModel):
    productId: str
    quantidade: int = Field(ge=1, le=10)
    valorGiftCard: float | None = None


class Retirada(BaseModel):
    tipo: Literal["retirada"]


class Entrega(BaseModel):
    tipo: Literal["entrega"]
    cep: str
    endereco: str
    frete: float = Field(ge=0)


class Pix(BaseModel):
    metodo: Literal["pix"]


class Cartao(BaseModel):
    metodo: Literal["cartao"]
    parcelas: int = Field(ge=1, le=18)


class OrderInput(BaseModel):
    itens: list[Item] = Field(min_length=1)
    cliente: Cliente
    entrega: Retirada | Entrega = Field(discriminator="tipo")
    pagamento: Pix | Cartao = Field(discriminator="metodo")


class ProtocolInput(BaseModel):
    resumo: str = Field(min_length=3, max_length=2000)
