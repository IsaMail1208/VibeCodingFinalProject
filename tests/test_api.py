def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_register_and_list_users(client):
    r = client.post(
        "/api/users",
        json={
            "username": "alice",
            "email": "alice@example.com",
            "password": "secret",
        },
    )
    assert r.status_code == 201
    uid = r.json()["id"]
    r2 = client.get("/api/users")
    assert r2.status_code == 200
    assert any(u["id"] == uid for u in r2.json())


def test_search_users(client):
    client.post(
        "/api/users",
        json={"username": "bob", "email": "bob@example.com", "password": "secret"},
    )
    r = client.get("/api/users?q=bob")
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_register_normalizes_username_and_email(client):
    r1 = client.post(
        "/api/users",
        json={
            "username": " alice ",
            "email": "ALICE@EXAMPLE.COM ",
            "password": "secret",
        },
    )
    assert r1.status_code == 201
    data = r1.json()
    assert data["username"] == "alice"
    assert data["email"] == "alice@example.com"

    r2 = client.post(
        "/api/users",
        json={
            "username": "alice",
            "email": "alice@example.com",
            "password": "secret",
        },
    )
    assert r2.status_code == 400


def test_messages_flow(client):
    a = client.post(
        "/api/users",
        json={"username": "u1", "email": "u1@example.com", "password": "secret"},
    ).json()["id"]
    b = client.post(
        "/api/users",
        json={"username": "u2", "email": "u2@example.com", "password": "secret"},
    ).json()["id"]
    m = client.post(
        "/api/messages",
        json={"sender_id": a, "receiver_id": b, "content": "Hello"},
    )
    assert m.status_code == 201
    hist = client.get(f"/api/messages/conversation/{a}/{b}")
    assert hist.status_code == 200
    msgs = hist.json()
    assert len(msgs) == 1
    assert msgs[0]["content"] == "Hello"


def test_message_search_in_conversation(client):
    a = client.post(
        "/api/users",
        json={"username": "a1", "email": "a1@example.com", "password": "secret"},
    ).json()["id"]
    b = client.post(
        "/api/users",
        json={"username": "b1", "email": "b1@example.com", "password": "secret"},
    ).json()["id"]
    client.post(
        "/api/messages",
        json={"sender_id": a, "receiver_id": b, "content": "alpha beta"},
    )
    r = client.get(f"/api/messages/conversation/{a}/{b}?search=beta")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_reject_whitespace_only_message(client):
    a = client.post(
        "/api/users",
        json={"username": "m1", "email": "m1@example.com", "password": "secret"},
    ).json()["id"]
    b = client.post(
        "/api/users",
        json={"username": "m2", "email": "m2@example.com", "password": "secret"},
    ).json()["id"]
    r = client.post(
        "/api/messages",
        json={"sender_id": a, "receiver_id": b, "content": "   \n\t  "},
    )
    assert r.status_code == 400


def test_list_messages_filters(client):
    a = client.post(
        "/api/users",
        json={"username": "x1", "email": "x1@example.com", "password": "secret"},
    ).json()["id"]
    b = client.post(
        "/api/users",
        json={"username": "y1", "email": "y1@example.com", "password": "secret"},
    ).json()["id"]
    client.post(
        "/api/messages",
        json={"sender_id": a, "receiver_id": b, "content": "only-from-a"},
    )
    r = client.get(f"/api/messages?sender_id={a}")
    assert r.status_code == 200
    assert len(r.json()) == 1
