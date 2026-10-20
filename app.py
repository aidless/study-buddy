"""study-buddy MVP — 学习任务拆解 + 完成率前后对比.

v1 (2026-10-19): 最小可用闭环
  1. 首次使用登记自报基线（过去一周完成率 %）
  2. 贴今日学习任务 → LLM 拆成 3-6 个带预估时长的子任务
  3. 页面勾选完成 → 当日完成率 / 连续天数实时更新
  4. 每日一句 LLM 复盘提问（基于当日完成模式）
  5. /buddy/stats 个人页：before(自报) vs after(实测) + 每日趋势

诚实边界（写进页面页脚）：
  - 昵称即身份（无密码），试运行版，10 人内测
  - before 是自报数字，有回忆偏差；after 是勾选实测，有自评宽松偏差
  - 单人样本不构成因果结论，只构成「这东西对我有没有用」的信号
"""

from __future__ import annotations

import html
import json
import os
import sqlite3
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field

DB_PATH = os.getenv("BUDDY_DB_PATH", "buddy.db")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.deepseek.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "deepseek-v4-flash")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")

app = FastAPI(title="study-buddy", docs_url=None, redoc_url=None)


# ── DB ───────────────────────────────────────────────────────────────────────

def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA journal_mode=WAL")
    return c


def init_db() -> None:
    with _conn() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS users(
                nickname TEXT PRIMARY KEY,
                baseline_pct REAL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS plans(
                user TEXT NOT NULL,
                date TEXT NOT NULL,
                raw_text TEXT NOT NULL,
                subtasks TEXT NOT NULL,  -- JSON [{text, minutes, done}]
                created_at TEXT NOT NULL,
                PRIMARY KEY (user, date)
            );
            CREATE TABLE IF NOT EXISTS reflections(
                user TEXT NOT NULL,
                date TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT,
                created_at TEXT NOT NULL,
                PRIMARY KEY (user, date)
            );
            """
        )


def _today() -> str:
    return datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d")


# ── LLM ──────────────────────────────────────────────────────────────────────

def llm_json(system: str, user: str) -> dict:
    """One chat completion, expect JSON object back. Raises on bad shape."""
    body = json.dumps(
        {
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }
    ).encode()
    req = urllib.request.Request(
        LLM_BASE_URL.rstrip("/") + "/chat/completions",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {LLM_API_KEY}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read())
    content = payload["choices"][0]["message"]["content"]
    data = json.loads(content)
    if not isinstance(data, dict):
        raise ValueError("llm returned non-object")
    return data


# ── Models ───────────────────────────────────────────────────────────────────

class PlanRequest(BaseModel):
    user: str = Field(min_length=1, max_length=30)
    text: str = Field(min_length=4, max_length=1000)
    baseline_pct: float | None = Field(default=None, ge=0, le=100)


class ToggleRequest(BaseModel):
    user: str = Field(min_length=1, max_length=30)
    idx: int = Field(ge=0, le=20)


class ReflectionAnswer(BaseModel):
    user: str = Field(min_length=1, max_length=30)
    answer: str = Field(min_length=1, max_length=1000)


# ── API ──────────────────────────────────────────────────────────────────────

@app.get("/buddy/api/day")
def get_day(user: str):
    day = _today()
    with _conn() as c:
        u = c.execute("SELECT baseline_pct FROM users WHERE nickname=?", (user,)).fetchone()
        p = c.execute(
            "SELECT subtasks, raw_text FROM plans WHERE user=? AND date=?", (user, day)
        ).fetchone()
        r = c.execute(
            "SELECT question, answer FROM reflections WHERE user=? AND date=?", (user, day)
        ).fetchone()
    subtasks = json.loads(p["subtasks"]) if p else []
    done = sum(1 for s in subtasks if s.get("done"))
    return {
        "user": user,
        "date": day,
        "is_new_user": u is None,
        "baseline_pct": u["baseline_pct"] if u else None,
        "raw_text": p["raw_text"] if p else None,
        "subtasks": subtasks,
        "planned": len(subtasks),
        "done": done,
        "rate": round(done / len(subtasks), 4) if subtasks else None,
        "reflection": dict(r) if r else None,
    }


@app.post("/buddy/api/plan")
def make_plan(req: PlanRequest):
    day = _today()
    data = llm_json(
        "你是学习任务拆解助手。把用户贴的今日学习任务拆成 3-6 个可在今天完成的子任务。"
        "每个子任务给一个现实的预估分钟数（10-120 分钟）。"
        '只返回 JSON：{"subtasks":[{"text":"...","minutes":30}, ...]}。'
        "不要发明用户没提的任务；拆解粒度以「做完能明确打勾」为准。",
        req.text,
    )
    items = data.get("subtasks")
    if not isinstance(items, list) or not (1 <= len(items) <= 8):
        raise HTTPException(502, "llm returned unexpected shape")
    subtasks = [
        {"text": str(s.get("text", ""))[:200], "minutes": int(s.get("minutes", 30)), "done": False}
        for s in items
    ]
    with _conn() as c:
        if req.baseline_pct is not None:
            c.execute(
                "INSERT INTO users(nickname, baseline_pct, created_at) VALUES(?,?,?) "
                "ON CONFLICT(nickname) DO UPDATE SET baseline_pct=excluded.baseline_pct "
                "WHERE users.baseline_pct IS NULL",
                (req.user, req.baseline_pct, datetime.utcnow().isoformat()),
            )
        else:
            c.execute(
                "INSERT OR IGNORE INTO users(nickname, baseline_pct, created_at) VALUES(?,NULL,?)",
                (req.user, datetime.utcnow().isoformat()),
            )
        c.execute(
            "INSERT INTO plans(user, date, raw_text, subtasks, created_at) VALUES(?,?,?,?,?) "
            "ON CONFLICT(user, date) DO UPDATE SET raw_text=excluded.raw_text, subtasks=excluded.subtasks",
            (req.user, day, req.text, json.dumps(subtasks, ensure_ascii=False), datetime.utcnow().isoformat()),
        )
    return get_day(req.user)


@app.post("/buddy/api/toggle")
def toggle(req: ToggleRequest):
    day = _today()
    with _conn() as c:
        p = c.execute(
            "SELECT subtasks FROM plans WHERE user=? AND date=?", (req.user, day)
        ).fetchone()
        if not p:
            raise HTTPException(404, "no plan for today")
        subtasks = json.loads(p["subtasks"])
        if req.idx >= len(subtasks):
            raise HTTPException(400, "idx out of range")
        subtasks[req.idx]["done"] = not subtasks[req.idx]["done"]
        c.execute(
            "UPDATE plans SET subtasks=? WHERE user=? AND date=?",
            (json.dumps(subtasks, ensure_ascii=False), req.user, day),
        )
    return get_day(req.user)


@app.post("/buddy/api/reflection")
def reflection_answer(req: ReflectionAnswer):
    day = _today()
    with _conn() as c:
        c.execute(
            "INSERT INTO reflections(user, date, question, answer, created_at) VALUES(?,?,?,?,?) "
            "ON CONFLICT(user, date) DO UPDATE SET answer=excluded.answer",
            (req.user, day, "(v1: 用户自填复盘)", req.answer, datetime.utcnow().isoformat()),
        )
    return {"ok": True}


@app.get("/buddy/api/reflection-question")
def reflection_question(user: str):
    d = get_day(user)
    if not d["subtasks"]:
        raise HTTPException(404, "no plan for today")
    try:
        data = llm_json(
            "你是学习复盘教练。基于今天的学习计划完成情况，提一个具体的、能落地到明天行动的复盘问题。"
            '只返回 JSON：{"question":"..."}。问题不超过 60 字，不许空泛（禁止「今天感觉怎么样」）。',
            json.dumps(
                {"任务": d["raw_text"], "子任务完成情况": [
                    {"text": s["text"], "minutes": s["minutes"], "done": s["done"]}
                    for s in d["subtasks"]
                ]},
                ensure_ascii=False,
            ),
        )
        q = str(data.get("question", ""))[:120]
        if not q:
            raise HTTPException(502, "empty question")
    except (HTTPException,):
        raise
    except Exception:
        q = "今天哪个子任务卡住了？卡在哪一步？"
    with _conn() as c:
        c.execute(
            "INSERT INTO reflections(user, date, question, answer, created_at) VALUES(?,?,?,?,?) "
            "ON CONFLICT(user, date) DO UPDATE SET question=excluded.question",
            (user, d["date"], q, None, datetime.utcnow().isoformat()),
        )
    return {"question": q}


@app.get("/buddy/api/stats")
def stats(user: str):
    with _conn() as c:
        u = c.execute("SELECT baseline_pct, created_at FROM users WHERE nickname=?", (user,)).fetchone()
        rows = c.execute(
            "SELECT date, subtasks FROM plans WHERE user=? ORDER BY date", (user,)
        ).fetchall()
    days, streak = [], 0
    for r in rows:
        subs = json.loads(r["subtasks"])
        done = sum(1 for s in subs if s.get("done"))
        rate = done / len(subs) if subs else None
        streak = streak + 1 if rate == 1.0 and rate is not None else 0
        days.append({"date": r["date"], "planned": len(subs), "done": done, "rate": rate})
    used = [d["rate"] for d in days if d["rate"] is not None]
    after = sum(used) / len(used) if used else None
    return {
        "user": user,
        "baseline_pct": u["baseline_pct"] if u else None,
        "since": u["created_at"][:10] if u else None,
        "days": days,
        "days_planned": len(days),
        "after_rate": round(after, 4) if after is not None else None,
        "delta": round(after - u["baseline_pct"] / 100, 4)
        if after is not None and u and u["baseline_pct"] is not None
        else None,
        "perfect_streak": streak,
    }


# ── Pages ────────────────────────────────────────────────────────────────────

def _page(template: str, **kw) -> HTMLResponse:
    body = template
    for k, v in kw.items():
        body = body.replace("{{ " + k + " }}", html.escape(str(v)))
    return HTMLResponse(body)

_INDEX = Path(__file__).parent.joinpath("templates", "index.html").read_text(encoding="utf-8")
_STATS = Path(__file__).parent.joinpath("templates", "stats.html").read_text(encoding="utf-8")


@app.get("/buddy/")
def index():
    return HTMLResponse(_INDEX)


@app.get("/buddy/stats/")
def stats_page(user: str = ""):
    return HTMLResponse(_STATS)


@app.on_event("startup")
def _startup() -> None:
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    init_db()
