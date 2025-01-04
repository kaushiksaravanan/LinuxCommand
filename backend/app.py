from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from pathlib import Path
import sqlite3

# Pydantic models
class CommandPart(BaseModel):
    part: str
    description: str
    color: str

class Variation(BaseModel):
    flag: str
    description: str

class Command(BaseModel):
    id: int
    command: str
    category: str
    difficulty: str
    parts: List[CommandPart]
    description: str
    example: str
    output: str
    variations: List[Variation]

app = FastAPI(title="Command Explorer API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path("commands.db")

def get_db_connection():
    """Helper function to get a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Allows fetching rows as dictionaries
    return conn

def init_db():
    """Initializes the SQLite database."""
    conn = get_db_connection()
    c = conn.cursor()

    # Create tables
    c.execute('''
        CREATE TABLE IF NOT EXISTS commands (
            id INTEGER PRIMARY KEY,
            command TEXT NOT NULL,
            category TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            description TEXT NOT NULL,
            example TEXT NOT NULL,
            output TEXT NOT NULL
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS command_parts (
            id INTEGER PRIMARY KEY,
            command_id INTEGER,
            part TEXT NOT NULL,
            description TEXT NOT NULL,
            color TEXT NOT NULL,
            FOREIGN KEY (command_id) REFERENCES commands (id)
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS variations (
            id INTEGER PRIMARY KEY,
            command_id INTEGER,
            flag TEXT NOT NULL,
            description TEXT NOT NULL,
            FOREIGN KEY (command_id) REFERENCES commands (id)
        )
    ''')

    # Insert sample data if the table is empty
    c.execute('SELECT COUNT(*) FROM commands')
    if c.fetchone()[0] == 0:
        insert_sample_data(conn)

    conn.commit()
    conn.close()

def insert_sample_data(conn):
    """Inserts sample data into the database."""
    c = conn.cursor()

    # Sample commands
    sample_commands = [
        ("cp -p source destination", "File Operations", "Beginner",
         "Copy files and directories while preserving their original attributes",
         "cp -p document.txt backup/", "File copied with original permissions and timestamps preserved"),
        ("ls -la", "File Operations", "Beginner",
         "List directory contents in detail, including hidden files",
         "ls -la", "total 32\ndrwxr-xr-x  2 user group 4096 Jan 3 12:34 ."),
        ("find . -name \"*.txt\" -type f", "Search", "Intermediate",
         "Search for files recursively based on name pattern",
         "find . -name \"*.txt\" -type f", "./docs/note.txt\n./backup/old.txt")
    ]

    for cmd in sample_commands:
        c.execute('''
            INSERT INTO commands (command, category, difficulty, description, example, output)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', cmd)
        cmd_id = c.lastrowid

        # Insert corresponding parts and variations
        if cmd[0].startswith("cp"):
            parts = [
                ("cp", "Copy command", "#EC4899"),
                ("-p", "Preserve mode, ownership, and timestamps", "#8B5CF6"),
                ("source", "Source file to copy from", "#10B981"),
                ("destination", "Destination to copy to", "#3B82F6")
            ]
            variations = [
                ("-r", "Copy directories recursively"),
                ("-v", "Verbose mode - show progress"),
                ("-i", "Interactive mode - prompt before overwrite")
            ]
        elif cmd[0].startswith("ls"):
            parts = [
                ("ls", "List directory contents", "#EC4899"),
                ("-l", "Use long listing format", "#8B5CF6"),
                ("-a", "Show hidden files", "#10B981")
            ]
            variations = [
                ("-h", "Human-readable sizes"),
                ("-t", "Sort by modification time"),
                ("-S", "Sort by file size")
            ]
        else:  # find command
            parts = [
                ("find", "Search command", "#EC4899"),
                (".", "Current directory", "#8B5CF6"),
                ("-name \"*.txt\"", "Match files ending in .txt", "#10B981"),
                ("-type f", "Only find files", "#3B82F6")
            ]
            variations = [
                ("-size", "Search by file size"),
                ("-mtime", "Search by modification time")
            ]

        for part in parts:
            c.execute('''
                INSERT INTO command_parts (command_id, part, description, color)
                VALUES (?, ?, ?, ?)
            ''', (cmd_id, *part))

        for variation in variations:
            c.execute('''
                INSERT INTO variations (command_id, flag, description)
                VALUES (?, ?, ?)
            ''', (cmd_id, *variation))

def get_full_command(command_id: int) -> Optional[Command]:
    """Fetches a full command by its ID."""
    conn = get_db_connection()
    c = conn.cursor()

    # Get basic command info
    c.execute('SELECT * FROM commands WHERE id = ?', (command_id,))
    cmd = c.fetchone()
    if not cmd:
        return None

    # Get command parts
    c.execute('SELECT part, description, color FROM command_parts WHERE command_id = ?', (command_id,))
    parts = [CommandPart(part=row["part"], description=row["description"], color=row["color"]) for row in c.fetchall()]

    # Get variations
    c.execute('SELECT flag, description FROM variations WHERE command_id = ?', (command_id,))
    variations = [Variation(flag=row["flag"], description=row["description"]) for row in c.fetchall()]

    conn.close()

    return Command(
        id=cmd["id"],
        command=cmd["command"],
        category=cmd["category"],
        difficulty=cmd["difficulty"],
        description=cmd["description"],
        example=cmd["example"],
        output=cmd["output"],
        parts=parts,
        variations=variations
    )

@app.get("/api/commands", response_model=List[Command])
async def get_commands(
    search: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty")
):
    """Fetches a list of commands based on optional filters."""
    conn = get_db_connection()
    c = conn.cursor()

    query = 'SELECT id FROM commands WHERE 1=1'
    params = []

    if search:
        query += ' AND (command LIKE ? OR description LIKE ?)'
        search_param = f'%{search}%'
        params.extend([search_param, search_param])

    if category:
        query += ' AND category = ?'
        params.append(category)

    if difficulty:
        query += ' AND difficulty = ?'
        params.append(difficulty)

    c.execute(query, params)
    command_ids = [row["id"] for row in c.fetchall()]
    conn.close()

    commands = [get_full_command(cmd_id) for cmd_id in command_ids]
    return [cmd for cmd in commands if cmd]

@app.get("/api/commands/{command_id}", response_model=Command)
async def get_command(command_id: int):
    """Fetches a single command by its ID."""
    command = get_full_command(command_id)
    if not command:
        raise HTTPException(status_code=404, detail="Command not found")
    return command

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
