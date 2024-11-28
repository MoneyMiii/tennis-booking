def generate_template():
    template = {
        "host": "127.0.0.1:5000",
        "swagger": "2.0",
        "info": {
            "title": "Tennis Booking API",
            "description": "API pour la gestion des réservations de terrains de tennis. Permet de réserver un créneau, ajouter ou supprimer des créneaux disponibles.",  # Description de l'API
            "version": "1.0.0"
        },
        "schemes": [
            "http"
        ]
    }
    return template
