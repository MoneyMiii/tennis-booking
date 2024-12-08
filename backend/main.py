from datetime import datetime, timedelta
from threading import Thread
from flask import Flask, jsonify, request
from modules.booking_tennis import booking_tennis
from modules.database import add_account, delete_account, get_all_accounts, get_slots_by_date_and_status, get_used_account, init_db, add_slot, delete_slot, get_all_slots, update_account, update_slot_status, delete_slots_before_today, get_slot_by_id
import flask_cors
import flasgger
from modules.get_time_remaining import get_remaining_time
import modules.swagger
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

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

            result = booking_tennis_with_account(
                date, start_time, end_time, slot_type)

            if not result["isSuccess"]:
                status_code = 500 if "Erreur interne" in result["message"] else 400
                return create_response(False, result["message"], status_code=status_code)

            if 'Aucun créneau disponible' in result.get("message"):
                return create_response(
                    False,
                    result.get("message")
                )
            status = 'book' if result.get("isSuccess", False) else 'not_book'
            add_slot(date, start_time, end_time, slot_type, status)

            return create_response(
                True,
                f"Créneau ajouté avec le statut '{status}'"
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

    if len(slots['data']) > 0:
        return create_response(
            False,
            f"Un créneau avec le statut 'book' existe déjà pour la date {
                target_date}.",
            status_code=400
        )

    slots = get_slots_by_date_and_status(target_date, 'waiting')

    if len(slots['data']) == 0:
        return

    booking_successful = False

    for slot in slots:
        result = booking_tennis_with_account(
            slot['date'], slot['start_time'], slot['end_time'], slot['type']
        )

        if result.get("isSuccess", False) and not booking_successful:
            update_slot_status(slot['id'], 'book')
            booking_successful = True
        else:
            update_slot_status(slot['id'], 'not_book')

    delete_slots_before_today()


@app.route('/account', methods=['POST'])
@flasgger.swag_from('swags/add_account.yml')
def add_account_endpoint():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        is_used = data.get('is_used')

        required_fields = ['email', 'password', 'is_used']

        missing_or_null_fields = [
            field for field in required_fields if field not in data or data[field] is None]

        if missing_or_null_fields:
            return create_response(
                False,
                f"Les champs suivants sont requis et ne doivent pas être nuls : {
                    ', '.join(missing_or_null_fields)}",
                status_code=400
            )

        if is_used:
            current_account = get_used_account()
            if current_account['isSuccess'] and current_account['data']:
                account = current_account['data']
                update_account(
                    account['id'], account['email'], account['password'], False)

        result = add_account(
            email, password, is_used)
        return create_response(result['isSuccess'], result['message'])
    except Exception as e:
        return create_response(False, str(e), status_code=500)


@app.route('/account', methods=['GET'])
@flasgger.swag_from('swags/get_accounts.yml')
def get_accounts_endpoint():
    try:
        result = get_all_accounts()
        return create_response(result['isSuccess'], "Comptes récupérés avec succès" if result['isSuccess'] else result['message'], data=result if result['isSuccess'] else None)
    except Exception as e:
        return create_response(False, str(e), status_code=500)


@app.route('/accounts/<id>', methods=['DELETE'])
@flasgger.swag_from('swags/delete_account.yml')
def delete_account_endpoint(id):
    try:
        current_account = get_used_account()

        if current_account["isSuccess"] and current_account["data"]["id"] == id:
            return create_response(
                False,
                "Impossible de supprimer le compte utilisé actuellement.",
                status_code=400
            )

        result = delete_account(id)
        return create_response(result['isSuccess'], result['message'])
    except Exception as e:
        return create_response(False, str(e), status_code=500)


@app.route('/accounts/<id>', methods=['PUT'])
@flasgger.swag_from('swags/update_account.yml')
def update_account_endpoint(id):
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        is_used = data.get('is_used')

        required_fields = ['email', 'password', 'is_used']
        missing_or_null_fields = [
            field for field in required_fields if field not in data or data[field] is None]

        if missing_or_null_fields:
            return create_response(
                False,
                f"Les champs suivants sont requis et ne doivent pas être nuls : {
                    ', '.join(missing_or_null_fields)}",
                status_code=400
            )

        current_used_account = get_used_account()

        if is_used:
            if current_used_account['isSuccess'] and current_used_account['data']:
                account = current_used_account['data']
                update_account(
                    account['id'], account['email'], account['password'], False)
        else:
            if id == current_used_account['data']['id']:
                return create_response(False, "Vous ne pouvez pas désactiver le compte qui est celui utilisé", status_code=400)

        result = update_account(
            id,
            email,
            password,
            is_used
        )
        return create_response(result['isSuccess'], result['message'])
    except Exception as e:
        return create_response(False, str(e), status_code=500)


@app.route('/remaining_hours', methods=['GET'])
@flasgger.swag_from('swags/get_remaining_hours.yml')
def get_remaining_hours_endpoint():
    """
    Endpoint pour récupérer le nombre d'heures restantes pour les carnets "Court découvert" et "Court couvert".
    """
    try:
        account = get_used_account()
        if not account["isSuccess"] or not account.get("data"):
            return create_response(False, "Aucun compte avec is_used = true trouvé.", status_code=400)

        result = get_remaining_time(account["data"])
        if not result["isSuccess"]:
            return create_response(False, result["message"], status_code=500)

        return create_response(True, result["message"], data={"data": result["data"]})

    except Exception as e:
        return create_response(False, f"Erreur interne : {str(e)}", status_code=500)


def booking_tennis_with_account(date, start_time, end_time, slot_type):
    try:
        account = get_used_account()

        if not account["isSuccess"]:
            return {"isSuccess": False, "message": "Aucun compte avec is_used = true trouvé."}

        return booking_tennis(date, start_time, end_time,
                              slot_type, account["data"])

    except Exception as e:
        return {"isSuccess": False, "message": f"Erreur interne : {str(e)}"}


def run_flask():
    app.run(debug=False, port=5000, threaded=True, host='0.0.0.0')


def configure_scheduler():
    scheduler = BackgroundScheduler()

    scheduler.add_job(
        func=booking_tennis_cron,
        trigger=CronTrigger(hour='8', minute='0'),
    )

    scheduler.start()


configure_scheduler()

if __name__ == '__main__':
    thread = Thread(target=run_flask)
    thread.start()
