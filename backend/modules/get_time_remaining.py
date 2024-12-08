
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException


def setup_driver():
    """Configure et retourne un driver Selenium pour Chrome."""
    try:
        chrome_options = Options()
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--headless')

        service = Service()
        driver = webdriver.Chrome(service=service, options=chrome_options)
        return driver
    except WebDriverException as e:
        raise RuntimeError(
            f"Erreur lors de la configuration du driver : {str(e)}")


def login(driver, account):
    """Connecte l'utilisateur avec ses identifiants."""
    try:
        driver.get(
            'https://v70-auth.paris.fr/auth/realms/paris/protocol/openid-connect/auth?client_id=moncompte_modal&response_type=code&redirect_uri=https%3A%2F%2Fmoncompte.paris.fr%2Fmoncompte%2Fjsp%2Fsite%2FPortal.jsp%3Fpage%3Dmyluteceusergu%26view%3DcreateAccountModal%26close_modal%3Dtrue%26data_client%3DauthData%26handler_name%3DbannerLoginHandler&scope=openid&state=be6675ef91c4d4e5143440d10b7e0cef&nonce=39f06d1f2f815f275edec4f6b8c30a13&app_code=&back_url=https%3A%2F%2Ftennis.paris.fr%2Ftennis%2Fjsp%2Fsite%2FPortal.jsp%3Fpage%3Dtennis%26view%3DstartDefault%26full%3D1')

        WebDriverWait(driver, 30).until(EC.presence_of_element_located(
            (By.ID, 'username'))).send_keys(account['email'])
        WebDriverWait(driver, 30).until(EC.presence_of_element_located(
            (By.ID, 'password'))).send_keys(account['password'])
        WebDriverWait(driver, 30).until(
            EC.element_to_be_clickable((By.NAME, 'Submit'))).click()
    except TimeoutException:
        raise RuntimeError("Erreur : Temps dépassé lors de la connexion.")
    except Exception as e:
        raise RuntimeError(f"Erreur lors de la connexion : {str(e)}")


def navigate_to_carnet_page(driver):
    """Accède à la page des carnets de réservation."""
    try:
        driver.get(
            'https://tennis.paris.fr/tennis/jsp/site/Portal.jsp?page=profil&view=carnet_reservation')
    except WebDriverException as e:
        raise RuntimeError(
            f"Erreur lors de la navigation vers la page de carnet : {str(e)}")


def get_remaining_hours(driver, h4_text):
    """
    Récupère le nombre d'heures restantes pour un titre <h4> donné, ou retourne '0h' si non trouvé.
    """
    try:
        h4_elements = driver.find_elements(By.TAG_NAME, 'h4')

        for h4 in h4_elements:
            if h4_text in h4.text:
                try:
                    span = h4.find_element(By.CLASS_NAME, 'subtitle')
                    match = re.search(r'\d+', span.text)
                    if match:
                        return int(match.group(0))
                    else:
                        return 0
                except:
                    return 0
        return 0
    except WebDriverException as e:
        raise RuntimeError(
            f"Erreur lors de la récupération des heures restantes : {str(e)}")


def get_remaining_time(account):
    """
    Récupère les heures restantes pour les types de courts spécifiés.
    """
    driver = None
    try:
        # Configurer le driver et se connecter
        driver = setup_driver()
        login(driver, account)
        navigate_to_carnet_page(driver)

        # Récupérer les heures pour les courts
        court_decouvert_hours = get_remaining_hours(
            driver,
            "Tarif plein - Court découvert :"
        )
        court_couvert_hours = get_remaining_hours(
            driver,
            "Tarif plein - Court couvert :"
        )

        return {
            "isSuccess": True,
            "message": "Récupération des heures réussie.",
            "data": {
                "court_decouvert_hours": court_decouvert_hours,
                "court_couvert_hours": court_couvert_hours
            }
        }
    except Exception as e:
        return {
            "isSuccess": False,
            "message": f"Erreur : {str(e)}",
            "data": None
        }
    finally:
        if driver:
            driver.quit()
