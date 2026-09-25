from sqlalchemy import select
from .models import ProductRow
from .search import matches

SORTS = {
    "relevancia": ProductRow.relevancia.desc(),
    "menor-preco": ProductRow.preco_a_vista.asc(),
    "maior-preco": ProductRow.preco_a_vista.desc(),
    "recentes": ProductRow.criado_em.desc(),
}


async def list_products(session, *, plataforma=None, tipo=None, condicao=None, precoMin=None, precoMax=None,
                        disponibilidade=None, q=None, sort="relevancia", limit=None) -> list[dict]:
    stmt = select(ProductRow)
    for col, val in [(ProductRow.plataforma, plataforma), (ProductRow.tipo, tipo), (ProductRow.condicao, condicao)]:
        if val:
            stmt = stmt.where(col == val)
    if precoMin is not None:
        stmt = stmt.where(ProductRow.preco_a_vista >= precoMin)
    if precoMax is not None:
        stmt = stmt.where(ProductRow.preco_a_vista <= precoMax)
    if disponibilidade in ("estoque", "retirada"):
        stmt = stmt.where(ProductRow.estoque > 0)
    if disponibilidade == "retirada":
        stmt = stmt.where(ProductRow.retirada_imediata.is_(True), ProductRow.em_revisao.is_(False))
    stmt = stmt.order_by(SORTS.get(sort or "relevancia", SORTS["relevancia"]))
    rows = (await session.execute(stmt)).scalars().all()
    # ponytail: search filtered in Python over ~30 rows; move to Postgres full-text/trigram when catalog grows.
    if q:
        rows = [r for r in rows if matches(r.search_index, q)]
    return [r.doc for r in (rows[:limit] if limit else rows)]


async def get_by_slug(session, slug: str) -> dict | None:
    row = (await session.execute(select(ProductRow).where(ProductRow.slug == slug))).scalar_one_or_none()
    return row.doc if row else None
