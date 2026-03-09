"""
Flask backend for GUI Agent - Next Action Planner.
Implements a REST resource `Plan` backed by SQLite using Flask-SQLAlchemy.
"""

from __future__ import annotations

import base64
import json
import os
from datetime import datetime, timezone

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__, instance_relative_config=True)
CORS(app)

os.makedirs(app.instance_path, exist_ok=True)
db_path = os.path.join(app.instance_path, "plans.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)


class Plan(db.Model):
    __tablename__ = "plans"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    goal = db.Column(db.Text, nullable=False)
    model = db.Column(db.Text, nullable=False)
    action = db.Column(db.Text, nullable=False)
    screenshot_base64 = db.Column(db.Text, nullable=False)
    mime_type = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self, include_image: bool = False) -> dict:
        data = {
            "id": self.id,
            "goal": self.goal,
            "model": self.model,
            "action": self.action,
            "mime_type": self.mime_type,
            "created_at": self.created_at.isoformat(),
        }
        if include_image:
            data["screenshot_base64"] = self.screenshot_base64
        return data


with app.app_context():
    db.create_all()


def image_file_to_base64(image_file) -> str:
    """Convert an uploaded image file into a base64 string."""
    image_bytes = image_file.read()
    image_file.seek(0)
    return base64.b64encode(image_bytes).decode("utf-8")


def generate_action(goal: str, model: str, image_b64: str, mime_type: str) -> str:
    """
    Generate next action using the existing VLM call patterns you already started.
    Returns a string action (best-effort).
    """
    system_prompt = (
        "You are a mobile agent that recommends the next UI action from a phone screenshot and a user goal."
    )
    user_prompt = f"Goal: {goal}\nReturn the next UI action only."
    data_url = f"data:{mime_type};base64,{image_b64}"

    if model == "glm-4.6v-flash":
        api_key = "4cd014f0416446b993e475bef4622b1b.e8SuKjDQiPY4geFN"
        url = "https://api.z.ai/api/paas/v4/chat/completions/"
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            },
        ]
        payload = {"model": "glm-4.6v-flash", "messages": messages}
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        if resp.ok:
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        return f"[Error] GLM request failed ({resp.status_code}): {resp.text[:500]}"

    if model == "gemma-3-4b-it":
        return f"Model not supported."

    return f"[Placeholder] For goal '{goal}' using {model}: Tap the appropriate UI element."


@app.route("/plans", methods=["POST"])
def create_plan():
    """
    POST /plans
    Body: multipart/form-data
        - image: screenshot file
        - goal: user goal/instruction
        - model: model name
    """
    image = request.files.get("image")
    goal = request.form.get("goal", "").strip()
    model = request.form.get("model", "").strip() or "glm-4.6v-flash"

    if not image or not goal:
        return jsonify({"error": "Missing image or goal"}), 400

    image_b64 = image_file_to_base64(image)
    mime_type = getattr(image, "mimetype", None) or "image/png"

    action = generate_action(goal=goal, model=model, image_b64=image_b64, mime_type=mime_type)
    if not isinstance(action, str):
        action = json.dumps(action)

    plan = Plan(
        goal=goal,
        model=model,
        action=action,
        screenshot_base64=image_b64,
        mime_type=mime_type,
    )
    db.session.add(plan)
    db.session.commit()

    return jsonify(plan.to_dict(include_image=False)), 201


@app.route("/plans", methods=["GET"])
def list_plans():
    plans = Plan.query.order_by(Plan.id.desc()).all()
    return jsonify([p.to_dict(include_image=False) for p in plans])


@app.route("/plans/<int:plan_id>", methods=["GET"])
def get_plan(plan_id: int):
    plan = Plan.query.get(plan_id)
    if not plan:
        return jsonify({"error": "Plan not found"}), 404
    return jsonify(plan.to_dict(include_image=True))


@app.route("/plans/<int:plan_id>", methods=["DELETE"])
def delete_plan(plan_id: int):
    plan = Plan.query.get(plan_id)
    if not plan:
        return jsonify({"error": "Plan not found"}), 404
    db.session.delete(plan)
    db.session.commit()
    return jsonify({"deleted": True, "id": plan_id})


if __name__ == "__main__":
    # Avoid Flask's reloader spawning a child process that can survive shell script cleanup.
    app.run(debug=True, port=5001, use_reloader=False)
