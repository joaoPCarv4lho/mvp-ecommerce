import secrets
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from .db import Base, Session, engine
from .models import ContentRow, OrderRow, ProductRow
from .repository import get_by_slug, list_products
from .schemas import OrderInput, ProtocolInput
from .search import normalize_search
from .seed import product_row, seed_if_empty
from .validation import build_product_name, slugify, unique_slug, validate_product_input


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with Session() as s:
        await seed_if_empty(s)
    yield


app = FastAPI(title="Mateus Games API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://localhost:4173"], allow_methods=["*"], allow_headers=["*"])


async def session():
    async with Session() as s:
        yield s


def _code(prefix: str) -> str:
    return f"{prefix}-{date.today():%Y%m%d}-{secrets.token_hex(2).upper()}"


async def _content(s, key: str):
    row = await s.get(ContentRow, key)
    return row.doc if row else []


@app.get("/api/health")
async def health():
    return {"ok": True}


@app.get("/api/products")
async def products(plataforma: str | None = None, tipo: str | None = None, condicao: str | None = None,
                   precoMin: float | None = None, precoMax: float | None = None, disponibilidade: str | None = None,
                   q: str | None = None, sort: str = "relevancia", limit: int | None = Query(None, ge=1, le=100), s=Depends(session)):
    items = await list_products(s, plataforma=plataforma, tipo=tipo, condicao=condicao, precoMin=precoMin, precoMax=precoMax,
                                disponibilidade=disponibilidade, q=q, sort=sort)
    return {"items": items[:limit] if limit else items, "total": len(items)}


@app.get("/api/products/{slug}")
async def product(slug: str, s=Depends(session)):
    doc = await get_by_slug(s, slug)
    if not doc:
        raise HTTPException(404, "Produto não encontrado")
    return doc


@app.get("/api/search/suggest")
async def suggest(q: str = "", s=Depends(session)):
    if len(normalize_search(q)) < 2:
        return []
    items = await list_products(s, q=q, sort="relevancia", limit=6)
    return [{"slug": p["slug"], "nome": build_product_name(p), "preco": p["preco"]["precoAVista"], "imagem": p["imagens"][0]} for p in items]


@app.get("/api/services")
async def services(s=Depends(session)):
    return await _content(s, "services")


@app.get("/api/trade-in")
async def trade_in(s=Depends(session)):
    return await _content(s, "trade-in")


@app.get("/api/reviews")
async def reviews(s=Depends(session)):
    return await _content(s, "reviews")


@app.get("/api/faq")
async def faq(s=Depends(session)):
    return await _content(s, "faq")


@app.get("/api/campaigns")
async def campaigns(s=Depends(session)):
    today = date.today().isoformat()
    return [c for c in await _content(s, "campaigns") if c["inicio"][:10] <= today <= c["fim"][:10]]


@app.post("/api/orders", status_code=201)
async def create_order(body: OrderInput, s=Depends(session)):
    total = 0.0
    for item in body.itens:
        row = await s.get(ProductRow, item.productId)
        if not row:
            raise HTTPException(422, f"Produto {item.productId} não existe")
        preco = row.doc["preco"]
        unit = item.valorGiftCard or (preco["precoAVista"] if body.pagamento.metodo == "pix" else preco["precoParcelado"])
        total += unit * item.quantidade
    if body.entrega.tipo == "entrega":
        total += body.entrega.frete
    order = OrderRow(numero=_code("MG"), total=round(total, 2), criado_em=datetime.now(timezone.utc).isoformat(), doc=body.model_dump())
    s.add(order)
    await s.commit()
    return {"numero": order.numero, "total": order.total, "criadoEm": order.criado_em, "input": order.doc}


@app.post("/api/trade-in/protocol", status_code=201)
async def protocol(body: ProtocolInput):
    return {"protocolo": _code("TR")}


@app.post("/api/products", status_code=201)
async def create_product(body: dict, s=Depends(session)):
    errors = validate_product_input(body)
    if errors:
        raise HTTPException(422, errors)
    taken = set((await s.execute(select(ProductRow.slug))).scalars())
    doc = {"atributos": [], "avisos": [], "imagens": [], "estoque": 0, "retiradaImediata": False, "relevancia": 1,
           "descricaoTecnica": "", "criadoEm": datetime.now(timezone.utc).isoformat(), **body}
    doc.setdefault("id", slugify(build_product_name(doc)))
    doc["slug"] = unique_slug(slugify(build_product_name(doc)), taken)
    s.add(product_row(doc))
    await s.commit()
    return doc
