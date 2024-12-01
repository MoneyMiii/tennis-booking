from datetime import datetime, timedelta
from threading import Thread
from flask import Flask, jsonify, request
from modules.booking_tennis import booking_tennis
from modules.database import add_credit_card, delete_credit_card, get_all_credit_cards, get_slots_by_date_and_status, get_used_credit_card, init_db, add_slot, delete_slot, get_all_slots, update_credit_card, update_slot_status, delete_slots_before_today, get_slot_by_id
import flask_cors
import flasgger
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

            result = booking_tennis_with_credit_card(
                date, start_time, end_time, slot_type)
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
        result = booking_tennis_with_credit_card(
            slot['date'], slot['start_time'], slot['end_time'], slot['type']
        )

        if result.get("isSuccess", False) and not booking_successful:
            update_slot_status(slot['id'], 'book')
            booking_successful = True
        else:
            update_slot_status(slot['id'], 'not_book')

    delete_slots_before_today()


@app.route('/credit_cards', methods=['POST'])
@flasgger.swag_from('swags/add_credit_card.yml')
def add_credit_card_endpoint():
    try:
        data = request.json
        name = data.get('name')
        number = data.get('number')
        cvc = data.get('cvc')
        expiry_month = data.get('expiry_month')
        expiry_year = data.get('expiry_year')
        is_used = data.get('is_used')

        required_fields = ['name', 'number', 'cvc',
                           'expiry_month', 'expiry_year', 'is_used']
        missing_or_null_fields = [
            field for field in required_fields if field not in data or data[field] is None]

        if missing_or_null_fields:
            return create_response(
                False,
                f"Les champs suivants sont requis et ne doivent pas être nuls : {
                    ', '.join(missing_or_null_fields)}",
                status_code=400
            )

        is_valid, error_message = validate_credit_card_fields(data)
        if not is_valid:
            return create_response(False, error_message, status_code=400)

        if is_used:
            current_used_card = get_used_credit_card()
            if current_used_card['isSuccess'] and current_used_card['data']:
                card = current_used_card['data']
                update_credit_card(card['id'], card['name'], card['number'],
                                   card['cvc'], card['expiry_month'], card['expiry_year'], False)

        result = add_credit_card(
            name, number, cvc, expiry_month, expiry_year, is_used)
        return create_response(result['isSuccess'], result['message'])
    except Exception as e:
        return create_response(False, str(e), status_code=500)


@app.route('/credit_cards', methods=['GET'])
@flasgger.swag_from('swags/get_credit_cards.yml')
def get_credit_cards_endpoint():
    try:
        result = get_all_credit_cards()
        return create_response(result['isSuccess'], "Cartes récupérées avec succès" if result['isSuccess'] else result['message'], data=result if result['isSuccess'] else None)
    except Exception as e:
        return create_response(False, str(e), status_code=500)


@app.route('/credit_cards/<id>', methods=['DELETE'])
@flasgger.swag_from('swags/delete_credit_card.yml')
def delete_credit_card_endpoint(id):
    try:
        current_used_card = get_used_credit_card()

        if current_used_card["isSuccess"] and current_used_card["data"]["id"] == id:
            return create_response(
                False,
                "Impossible de supprimer la carte utilisée actuellement.",
                status_code=400
            )

        result = delete_credit_card(id)
        return create_response(result['isSuccess'], result['message'])
    except Exception as e:
        return create_response(False, str(e), status_code=500)


@app.route('/credit_cards/<id>', methods=['PUT'])
@flasgger.swag_from('swags/update_credit_card.yml')
def update_credit_card_endpoint(id):
    try:
        data = request.json
        name = data.get('name')
        number = data.get('number')
        cvc = data.get('cvc')
        expiry_month = data.get('expiry_month')
        expiry_year = data.get('expiry_year')
        is_used = data.get('is_used')

        required_fields = ['name', 'number', 'cvc',
                           'expiry_month', 'expiry_year', 'is_used']
        missing_or_null_fields = [
            field for field in required_fields if field not in data or data[field] is None]

        if missing_or_null_fields:
            return create_response(
                False,
                f"Les champs suivants sont requis et ne doivent pas être nuls : {
                    ', '.join(missing_or_null_fields)}",
                status_code=400
            )

        is_valid, error_message = validate_credit_card_fields(data)

        if not is_valid:
            return create_response(False, error_message, status_code=400)

        current_used_card = get_used_credit_card()

        if is_used:
            if current_used_card['isSuccess'] and current_used_card['data']:
                card = current_used_card['data']
                update_credit_card(card['id'], card['name'], card['number'],
                                   card['cvc'], card['expiry_month'], card['expiry_year'], False)
        else:
            if id == current_used_card['data']['id']:
                return create_response(False, "Vous ne pouvez pas désactiver la carte qui est la carte utilisée", status_code=400)

        result = update_credit_card(
            id,
            name,
            number,
            cvc,
            expiry_month,
            expiry_year,
            is_used
        )
        return create_response(result['isSuccess'], result['message'])
    except Exception as e:
        return create_response(False, str(e), status_code=500)


def validate_credit_card_fields(data):
    """
    Validate credit card fields.
    """
    try:
        cvc = data.get('cvc')
        expiry_month = data.get('expiry_month')
        expiry_year = data.get('expiry_year')

        if not (isinstance(cvc, str) and cvc.isdigit() and len(cvc) == 3):
            return False, "Le CVC doit être un code numérique de 3 chiffres."

        if not (1 <= int(expiry_month) <= 12):
            return False, "Le mois d'expiration doit être compris entre 1 et 12."

        current_year = datetime.now().year
        if int(expiry_year) < current_year:
            return False, "L'année d'expiration doit être au moins égale à l'année actuelle."

        return True, None
    except Exception as e:
        return False, str(e)


def booking_tennis_with_credit_card(date, start_time, end_time, slot_type):
    credit_card = get_used_credit_card()

    if not credit_card:
        return {"isSuccess": False, "message": "Aucune carte de crédit avec is_used = true trouvée."}

    result = booking_tennis(date, start_time, end_time,
                            slot_type, credit_card["data"])

    return result


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
