import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.environ.get("SQLITE_DB_PATH", "./data/history.db")

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # Create projects table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at TEXT
    )
    ''')
    
    # Seed default General project if empty
    cursor.execute("SELECT COUNT(*) FROM projects")
    count = cursor.fetchone()[0]
    if count == 0:
        created_at = datetime.now().isoformat()
        cursor.execute("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)", ("default", "General", created_at))
    
    # Create sessions table with project_id reference
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at TEXT,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE DEFAULT 'default'
    )
    ''')
    
    # Run migration: Check if project_id exists in sessions schema (for existing databases)
    cursor.execute("PRAGMA table_info(sessions)")
    columns = [col[1] for col in cursor.fetchall()]
    if "project_id" not in columns:
        cursor.execute("ALTER TABLE sessions ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE CASCADE")
        cursor.execute("UPDATE sessions SET project_id = 'default' WHERE project_id IS NULL")
    
    # Create messages table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        role TEXT,
        text TEXT,
        input_type TEXT,
        audio_url TEXT,
        citations TEXT,
        created_at TEXT,
        parent_id INTEGER,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES messages(id) ON DELETE SET NULL
    )
    ''')
    
    # Run migration: Check if parent_id exists in messages schema (for existing databases)
    cursor.execute("PRAGMA table_info(messages)")
    columns = [col[1] for col in cursor.fetchall()]
    if "parent_id" not in columns:
        cursor.execute("ALTER TABLE messages ADD COLUMN parent_id INTEGER REFERENCES messages(id) ON DELETE SET NULL")
    
    conn.commit()
    conn.close()

def get_sessions():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def create_session(session_id, title="New Chat", project_id="default"):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    pid = project_id if project_id else "default"
    cursor.execute("INSERT OR REPLACE INTO sessions (id, title, created_at, project_id) VALUES (?, ?, ?, ?)", (session_id, title, created_at, pid))
    conn.commit()
    conn.close()
    return {"id": session_id, "title": title, "created_at": created_at, "project_id": pid}

def rename_session(session_id, title):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE sessions SET title = ? WHERE id = ?", (title, session_id))
    conn.commit()
    conn.close()
    return {"id": session_id, "title": title}

def get_messages(session_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC", (session_id,))
    rows = cursor.fetchall()
    conn.close()
    
    messages = []
    for row in rows:
        msg = dict(row)
        msg['citations'] = json.loads(msg['citations']) if msg['citations'] else []
        messages.append({
            "id": msg["id"],
            "parentId": msg["parent_id"],
            "role": msg["role"],
            "text": msg["text"],
            "inputType": msg["input_type"],
            "audioUrl": msg["audio_url"],
            "citations": msg["citations"],
            "createdAt": msg["created_at"]
        })
    return messages

def add_message(session_id, role, text, input_type="text", audio_url=None, citations=None, parent_id=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Ensure session exists implicitly
    cursor.execute("INSERT OR IGNORE INTO sessions (id, title, created_at, project_id) VALUES (?, ?, ?, 'default')", (session_id, "New Chat", datetime.now().isoformat()))
    
    # Update title on first user message if still "New Chat"
    if role == "user":
        cursor.execute("SELECT title FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        if row and row[0] == "New Chat":
            title = text[:30] + "..." if len(text) > 30 else text
            cursor.execute("UPDATE sessions SET title = ? WHERE id = ?", (title, session_id))
    
    citations_json = json.dumps(citations) if citations else "[]"
    created_at = datetime.now().isoformat()
    
    cursor.execute('''
    INSERT INTO messages (session_id, role, text, input_type, audio_url, citations, created_at, parent_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (session_id, role, text, input_type, audio_url, citations_json, created_at, parent_id))
    
    msg_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return msg_id

def get_last_message_id(session_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT 1", (session_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def delete_session(session_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()

def clear_all_sessions():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.execute("DELETE FROM sessions")
    conn.commit()
    conn.close()

def get_projects():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects ORDER BY created_at ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def create_project(project_id, name):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    cursor.execute("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)", (project_id, name, created_at))
    conn.commit()
    conn.close()
    return {"id": project_id, "name": name, "created_at": created_at}

def rename_project(project_id, name):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE projects SET name = ? WHERE id = ?", (name, project_id))
    conn.commit()
    conn.close()
    return {"id": project_id, "name": name}

def delete_project(project_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()

init_db()
