import json
import re
from datetime import date, timedelta
from pathlib import Path
from sqlalchemy import select
from .models import ContentRow, ProductRow
from .search import normalize_search
from .validation import build_product_name, slugify, unique_slug

SEED_DIR = Path(__file__).resolve().parents[2] / "seed"
DATE_FIELDS = {"garantiaAte", "dataLancamento", "criadoEm", "revisadoEm", "inicio", "fim", "data"}
_REL = re.compile(r"^([+-])(\d+)d$")


def resolve_date(value: str, today: date) -> str:
    m = _REL.match(value)
    if not m:
        return value
    n = int(m.group(2)) * (-1 if m.group(1) == "-" else 1)
    return (today + timedelta(days=n)).isoformat()


def resolve_dates(obj, today: date):
    if isinstance(obj, list):
        return [resolve_dates(x, today) for x in obj]
    if isinstance(obj, dict):
        return {k: resolve_date(v, today) if k in DATE_FIELDS and isinstance(v, str) else resolve_dates(v, today) for k, v in obj.items()}
    return obj


def load(name: str):
    return json.loads((SEED_DIR / f"{name}.json").read_text(encoding="utf-8"))


def product_row(p: dict) -> ProductRow:
    return ProductRow(
        id=p["id"], slug=p["slug"], plataforma=p["plataforma"], tipo=p["tipo"], condicao=p["condicao"],
        preco_a_vista=p["preco"]["precoAVista"], estoque=p["estoque"], retirada_imediata=p["retiradaImediata"],
        em_revisao=bool(p.get("emRevisao")), relevancia=p["relevancia"], criado_em=p["criadoEm"],
        search_index=normalize_search(" ".join([build_product_name(p), p["familia"], *p.get("atributos", [])])), doc=p,
    )


async def seed_if_empty(session, today: date | None = None) -> None:
    if (await session.execute(select(ProductRow.id).limit(1))).first():
        return
    today = today or date.today()
    taken: set[str] = set()
    for p in resolve_dates(load("products"), today):
        p["slug"] = unique_slug(slugify(build_product_name(p)), taken)
        session.add(product_row(p))
    for key in ["services", "trade-in", "reviews", "faq", "campaigns"]:
        session.add(ContentRow(key=key, doc=resolve_dates(load(key), today)))
    await session.commit()
