async def test_health(client):
    r = await client.get("/api/health")
    assert r.json() == {"ok": True}


async def test_list_and_filter(client):
    r = await client.get("/api/products")
    body = r.json()
    assert body["total"] >= 28 and len(body["items"]) == body["total"]
    used = (await client.get("/api/products", params={"condicao": "usado"})).json()
    assert used["total"] > 0 and all(p["condicao"] == "usado" for p in used["items"])


async def test_search_play5_returns_ps5(client):
    items = (await client.get("/api/products", params={"q": "play 5"})).json()["items"]
    assert items and all(p["familia"] == "PlayStation 5" for p in items)


async def test_sort_menor_preco(client):
    items = (await client.get("/api/products", params={"sort": "menor-preco"})).json()["items"]
    prices = [p["preco"]["precoAVista"] for p in items]
    assert prices == sorted(prices)


async def test_product_by_slug_and_404(client):
    first = (await client.get("/api/products")).json()["items"][0]
    r = await client.get(f"/api/products/{first['slug']}")
    assert r.status_code == 200 and r.json()["id"] == first["id"]
    assert (await client.get("/api/products/nao-existe")).status_code == 404


async def test_suggest(client):
    assert (await client.get("/api/search/suggest", params={"q": "p"})).json() == []
    s = (await client.get("/api/search/suggest", params={"q": "ps5"})).json()
    assert 0 < len(s) <= 6 and {"slug", "nome", "preco", "imagem"} <= set(s[0])


async def test_campaigns_only_active(client):
    ids = [c["id"] for c in (await client.get("/api/campaigns")).json()]
    assert ids == ["semana-retro"]


async def test_content_endpoints(client):
    assert len((await client.get("/api/services")).json()) == 6
    assert len((await client.get("/api/reviews")).json()) == 5
    assert any(not t["aceito"] for t in (await client.get("/api/trade-in")).json())
    assert "assistencia" in (await client.get("/api/faq")).json()


async def test_create_order(client):
    p = (await client.get("/api/products")).json()["items"][0]
    body = {"itens": [{"productId": p["id"], "quantidade": 1}], "cliente": {"nome": "Ana", "email": "ana@x.com", "telefone": "47999990000"},
            "entrega": {"tipo": "retirada"}, "pagamento": {"metodo": "pix"}}
    r = await client.post("/api/orders", json=body)
    assert r.status_code == 201
    assert r.json()["numero"].startswith("MG-") and r.json()["total"] == p["preco"]["precoAVista"]


async def test_trade_in_protocol(client):
    r = await client.post("/api/trade-in/protocol", json={"resumo": "PS4 usado"})
    assert r.status_code == 201 and r.json()["protocolo"].startswith("TR-")


async def test_create_product_validation(client):
    bad = {"familia": "PlayStation 5", "modelo": "Slim1TBControle", "condicao": "usado", "tipo": "console",
           "preco": {"precoAVista": 1, "precoParcelado": 1.2, "parcelasMax": 12}, "plataforma": "playstation"}
    r = await client.post("/api/products", json=bad)
    assert r.status_code == 422


async def test_create_product_invalid_condicao_returns_422_not_500(client):
    bad = {"plataforma": "playstation", "familia": "PlayStation 5", "modelo": "Pro", "tipo": "console",
           "condicao": "reformado", "preco": {"precoAVista": 100, "precoParcelado": 100, "parcelasMax": 1}}
    r = await client.post("/api/products", json=bad)
    assert r.status_code == 422


async def test_create_product_missing_preco_returns_422(client):
    bad = {"plataforma": "playstation", "familia": "PlayStation 5", "modelo": "Pro", "tipo": "console", "condicao": "novo"}
    r = await client.post("/api/products", json=bad)
    assert r.status_code == 422


async def test_create_product_valid_used_returns_201_and_is_gettable(client):
    body = {
        "plataforma": "playstation", "familia": "PlayStation 5", "modelo": "Slim", "capacidade": "1TB",
        "condicao": "usado", "tipo": "console",
        "preco": {"precoAVista": 2999, "precoParcelado": 3199.92, "parcelasMax": 12},
        "usado": {"estado": "excelente", "acompanha": {"console": True, "controles": 1, "cabos": True, "caixa": False, "jogo": False},
                  "revisadoEm": "2026-09-20", "fotosReais": []},
    }
    r = await client.post("/api/products", json=body)
    assert r.status_code == 201
    slug = r.json()["slug"]
    g = await client.get(f"/api/products/{slug}")
    assert g.status_code == 200 and g.json()["slug"] == slug
