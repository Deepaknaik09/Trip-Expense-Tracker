import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

USERS_FILE = os.path.join(DATA_DIR, 'users.json')
TRIPS_FILE = os.path.join(DATA_DIR, 'trips.json')
EXPENSES_FILE = os.path.join(DATA_DIR, 'expenses.json')

def _load_json(file_path, default_val):
    if not os.path.exists(file_path):
        # Save default value if file does not exist
        _save_json(file_path, default_val)
        return default_val
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return default_val

def _save_json(file_path, data):
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving {file_path}: {e}")
        return False

# User storage functions
def get_users():
    """Load users as a dict: { username: { password_hash: str, ... } }"""
    return _load_json(USERS_FILE, {})

def save_users(users):
    """Save users dict"""
    return _save_json(USERS_FILE, users)

# Trip storage functions
def get_trips():
    """Load list of trips"""
    return _load_json(TRIPS_FILE, [])

def save_trips(trips):
    """Save trips list"""
    return _save_json(TRIPS_FILE, trips)

# Expense storage functions
def get_expenses():
    """Load list of expenses"""
    return _load_json(EXPENSES_FILE, [])

def save_expenses(expenses):
    """Save expenses list"""
    return _save_json(EXPENSES_FILE, expenses)
