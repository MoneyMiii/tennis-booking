import logging
import sqlite3
import uuid
from datetime import datetime

DB_NAME = "slots.db"

# Configure logging
logging.basicConfig(level=logging.ERROR,
                    format="%(asctime)s - %(levelname)s - %(message)s")


def init_db():
    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS slots (
                    id TEXT PRIMARY KEY,
                    date TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    type TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'not_book'
                )
            """)
            conn.commit()
    except Exception as e:
        logging.error(
            f"Erreur lors de l'initialisation de la base de données: {str(e)}")


def add_slot(date, start_time, end_time, slot_type, status):
    try:
        slot_id = str(uuid.uuid4())
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO slots (id, date, start_time, end_time, type, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (slot_id, date, start_time, end_time, slot_type, status))
            conn.commit()
        return {"isSuccess": True, "message": "Créneau ajouté avec succès", "slot_id": slot_id}
    except sqlite3.IntegrityError as e:
        logging.error(
            f"Erreur d'intégrité lors de l'ajout du créneau: {str(e)}")
        return {"isSuccess": False, "message": "Conflit d'intégrité lors de l'ajout du créneau"}
    except Exception as e:
        logging.error(f"Erreur lors de l'ajout du créneau: {str(e)}")
        return {"isSuccess": False, "message": f"Erreur inconnue: {str(e)}"}


def update_slot_status(slot_id, new_status):
    valid_statuses = {"book", "not_book", "waiting"}
    if new_status not in valid_statuses:
        return {"isSuccess": False, "message": "Statut invalide"}

    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE slots
                SET status = ?
                WHERE id = ?
            """, (new_status, slot_id))
            conn.commit()
        if cursor.rowcount > 0:
            return {"isSuccess": True, "message": "Statut mis à jour avec succès"}
        else:
            return {"isSuccess": False, "message": "Créneau introuvable"}
    except Exception as e:
        logging.error(
            f"Erreur lors de la mise à jour du statut du créneau: {str(e)}")
        return {"isSuccess": False, "message": f"Erreur inconnue: {str(e)}"}


def delete_slot(slot_id):
    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM slots WHERE id = ?", (slot_id,))
            conn.commit()
        if cursor.rowcount > 0:
            return {"isSuccess": True, "message": "Créneau supprimé avec succès"}
        else:
            return {"isSuccess": False, "message": "Créneau introuvable"}
    except Exception as e:
        logging.error(f"Erreur lors de la suppression du créneau: {str(e)}")
        return {"isSuccess": False, "message": f"Erreur inconnue: {str(e)}"}


def get_all_slots():
    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, date, start_time, end_time, type, status FROM slots")
            slots = [
                {
                    "id": row[0],
                    "date": row[1],
                    "start_time": row[2],
                    "end_time": row[3],
                    "type": row[4],
                    "status": row[5]
                } for row in cursor.fetchall()
            ]
        return {"isSuccess": True, "data": slots}
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des créneaux: {str(e)}")
        return {"isSuccess": False, "message": f"Erreur inconnue: {str(e)}"}


def get_slots_by_date_and_status(date=None, status=None):
    query = "SELECT id, date, start_time, end_time, type, status FROM slots"
    filters = []
    params = []

    if date:
        filters.append("date = ?")
        params.append(date)
    if status:
        filters.append("status = ?")
        params.append(status)

    if filters:
        query += " WHERE " + " AND ".join(filters)

    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            slots = [
                {
                    "id": row[0],
                    "date": row[1],
                    "start_time": row[2],
                    "end_time": row[3],
                    "type": row[4],
                    "status": row[5]
                } for row in cursor.fetchall()
            ]
        return {"isSuccess": True, "data": slots}
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des créneaux: {str(e)}")
        return {"isSuccess": False, "message": f"Erreur inconnue: {str(e)}"}


def delete_slots_before_today():
    today = datetime.now().date()
    query = "DELETE FROM slots WHERE date < ?"

    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute(query, (today,))
            conn.commit()
            deleted_count = cursor.rowcount
        return {"isSuccess": True, "message": f"{deleted_count} créneau(x) supprimé(s) avec succès"}
    except Exception as e:
        logging.error(f"Erreur lors de la suppression des créneaux: {str(e)}")
        return {"isSuccess": False, "message": f"Erreur inconnue: {str(e)}"}


def get_slot_by_id(slot_id):
    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, date, start_time, end_time, type, status 
                FROM slots 
                WHERE id = ?
            """, (slot_id,))
            row = cursor.fetchone()
            if row:
                return {
                    "isSuccess": True,
                    "data": {
                        "id": row[0],
                        "date": row[1],
                        "start_time": row[2],
                        "end_time": row[3],
                        "type": row[4],
                        "status": row[5]
                    }
                }
            else:
                return {"isSuccess": False, "message": "Créneau introuvable"}
    except Exception as e:
        logging.error(f"Erreur lors de la récupération du créneau avec ID {
                      slot_id}: {str(e)}")
        return {"isSuccess": False, "message": f"Erreur inconnue: {str(e)}"}
