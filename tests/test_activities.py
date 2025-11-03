from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_signup_and_unregister_flow():
    activity = 'Chess Club'
    email = 'test.student@mergington.edu'

    # Ensure clean start
    if email in activities[activity]['participants']:
        activities[activity]['participants'].remove(email)

    # Signup
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200
    assert email in activities[activity]['participants']

    # Unregister
    r = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r.status_code == 200
    assert email not in activities[activity]['participants']
