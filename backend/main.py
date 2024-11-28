from datetime import datetime, timedelta
from flask import Flask, jsonify, request
import werkzeug.serving
from modules.booking_tennis import booking_tennis
from modules.database import get_slots_by_date_and_status, init_db, add_slot, delete_slot, get_all_slots, update_slot_status, delete_slots_before_today, get_slot_by_id
import flask_cors
import flasgger
import modules.swagger
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)
flask_cors.CORS(app)
swagger = flasgger.Swagger(app, template=modules.swagger.generate_template())

init_db()


def create_response(is_success, message, data=None, status_code=200):
    response = {"isSuccess": is_success, "message": message}
    if data is not None:
        response["data"] = data['data']
    return jsonify(response), status_code


@app.route('/', methods=['GET'])
@flasgger.swag_from('swags/home.yml')
def home():
    return create_response(
        True,
        "Bienvenue sur l'API de réservation de tennis, API up and running ! Accédez au Swagger grâce à la route /apidocs !"
    )


@app.route('/slots', methods=['POST'])
@flasgger.swag_from('swags/add_slot.yml')
def add_slot_endpoint():
    try:
        data = request.json
        date = data.get('date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        slot_type = data.get('type')

        if not all([date, start_time, end_time, slot_type]):
            return create_response(False, "Tous les champs sont requis", status_code=400)

        current_date = datetime.now().date()
        slot_date = datetime.strptime(date, "%Y-%m-%d").date()

        if slot_date < current_date:
            return create_response(False, "Impossible d'ajouter un créneau pour une date passée", status_code=400)

        if slot_date >= current_date + timedelta(days=7):
            if add_slot(date, start_time, end_time, slot_type, 'waiting'):
                return create_response(True, "Créneau ajouté avec le statut 'waiting'")
            else:
                return create_response(False, "Erreur lors de l'ajout du créneau", status_code=500)
        else:
            slots = get_slots_by_date_and_status(slot_date, 'book')
            if len(slots['data']) > 0:
                return create_response(
                    False,
                    f"Un créneau avec le statut 'book' existe déjà pour la date {
                        date}.",
                    status_code=400
                )

            result = booking_tennis(date, start_time, end_time, slot_type)
            if 'Aucun créneau disponible' in result.get("message"):
                return create_response(
                    False,
                    result.get("message")
                )
            status = 'book' if result.get("isSuccess", False) else 'not_book'
            add_slot(date, start_time, end_time, slot_type, status)

            return create_response(
                True,
                f"Créneau ajouté avec le statut '{status}'",
                data={"status": status}
            )
    except Exception as e:
        return create_response(False, str(e), status_code=500)


@app.route('/slots/<id>', methods=['DELETE'])
@flasgger.swag_from('swags/delete_slot.yml')
def delete_slot_endpoint(id):
    try:
        slot_result = get_slot_by_id(id)

        if slot_result["isSuccess"]:
            slot = slot_result["data"]
            if slot["status"] in ["not_book", "waiting"]:
                if delete_slot(id):
                    return create_response(True, "Créneau supprimé")
                else:
                    return create_response(False, "Erreur lors de la suppression du créneau", status_code=500)
            else:
                return create_response(False, "Impossible de supprimer un créneau réservé", status_code=400)
        else:
            return create_response(False, slot_result["message"], status_code=400)

    except Exception as e:
        return create_response(False, str(e), status_code=500)


@app.route('/slots', methods=['GET'])
@flasgger.swag_from('swags/get_slots.yml')
def get_slots_endpoint():
    try:
        slots = get_all_slots()
        return create_response(True, "Liste des créneaux récupérée", data=slots)
    except Exception as e:
        return create_response(False, str(e), status_code=500)


def booking_tennis_cron():
    target_date = (datetime.now().date() +
                   timedelta(days=6)).strftime("%Y-%m-%d")

    slots = get_slots_by_date_and_status(target_date, 'book')

    if len(slots) > 0:
        return create_response(
            False,
            f"Un créneau avec le statut 'book' existe déjà pour la date {
                target_date}.",
            status_code=400
        )

    slots = get_slots_by_date_and_status(target_date, 'waiting')

    if len(slots) == 0:
        return

    booking_successful = False

    for slot in slots:
        result = booking_tennis(
            slot['date'], slot['start_time'], slot['end_time'], slot['type']
        )

        if result.get("isSuccess", False) and not booking_successful:
            update_slot_status(slot['id'], 'book')
            booking_successful = True
        else:
            update_slot_status(slot['id'], 'not_book')

    delete_slots_before_today()


def configure_worker():
    scheduler = BackgroundScheduler()
    scheduler.add_job(booking_tennis_cron, 'cron', hour=8, minute=0)
    scheduler.start()


if __name__ == '__main__':
    configure_worker()
    werkzeug.serving.WSGIRequestHandler.protocol_version = "HTTP/1.1"
    app.run(debug=False, port=5000, threaded=True, host='0.0.0.0')


# @app.route('/book-tennis', methods=['POST'])
# @flasgger.swag_from('swags/book_tennis.yml')
# def book_tennis_endpoint():
#     try:
#         data = request.json
#         date = data.get('date')
#         start_time = data.get('start_time')
#         end_time = data.get('end_time')
#         court_type = data.get('type')

#         if not all([date, start_time, end_time, court_type]):
#             return create_response(False, "Tous les champs sont requis", status_code=400)

#         result = booking_tennis(date, start_time, end_time, court_type)
#         if result.get("isSuccess", False):
#             return create_response(True, "Réservation réussie")
#         else:
#             return create_response(False, result.get("message", "Erreur inconnue"), status_code=400)
#     except Exception as e:
#         return create_response(False, str(e), status_code=500)
