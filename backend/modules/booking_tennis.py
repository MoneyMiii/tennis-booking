import time
from datetime import datetime
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from modules.gpt_capcha_model import solve_capcha_with_gpt
from typesForFilters.court_type_enum import CourtType
import locale


def setup_driver():
    """Configure et retourne un driver Selenium pour Chrome."""
    try:
        chrome_options = Options()
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')

        service = Service()
        driver = webdriver.Chrome(service=service, options=chrome_options)
        return driver
    except WebDriverException as e:
        raise RuntimeError(
            f"Erreur lors de la configuration du driver : {str(e)}")


def login(driver):
    """Connecte l'utilisateur avec ses identifiants."""
    try:
        driver.get(
            'https://v70-auth.paris.fr/auth/realms/paris/protocol/openid-connect/auth?client_id=moncompte_modal&response_type=code&redirect_uri=https%3A%2F%2Fmoncompte.paris.fr%2Fmoncompte%2Fjsp%2Fsite%2FPortal.jsp%3Fpage%3Dmyluteceusergu%26view%3DcreateAccountModal%26close_modal%3Dtrue%26data_client%3DauthData%26handler_name%3DbannerLoginHandler&scope=openid&state=be6675ef91c4d4e5143440d10b7e0cef&nonce=39f06d1f2f815f275edec4f6b8c30a13&app_code=&back_url=https%3A%2F%2Ftennis.paris.fr%2Ftennis%2Fjsp%2Fsite%2FPortal.jsp%3Fpage%3Dtennis%26view%3DstartDefault%26full%3D1')

        WebDriverWait(driver, 10).until(EC.presence_of_element_located(
            (By.ID, 'username'))).send_keys(os.getenv('EMAIL_LOGGING'))
        WebDriverWait(driver, 10).until(EC.presence_of_element_located(
            (By.ID, 'password'))).send_keys(os.getenv('PWD_LOGGING'))
        WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.NAME, 'Submit'))).click()
    except TimeoutException:
        raise RuntimeError("Erreur : Temps dépassé lors de la connexion.")
    except Exception as e:
        raise RuntimeError(f"Erreur lors de la connexion : {str(e)}")


def navigate_to_tennis_page(driver):
    """Accède à la page des créneaux de tennis."""
    try:
        driver.get(
            'https://tennis.paris.fr/tennis/jsp/site/Portal.jsp?page=recherche&view=recherche_creneau')
    except WebDriverException as e:
        raise RuntimeError(
            f"Erreur lors de la navigation vers la page de tennis : {str(e)}")


def select_location_and_time(driver, date):
    """Sélectionne l'emplacement et l'heure du créneau."""
    # locale.setlocale(locale.LC_TIME, 'fr_FR.UTF-8')  # Sur Linux/Mac
    # Sur Windows, essayez cette ligne si la précédente échoue
    locale.setlocale(locale.LC_TIME, 'fr_FR')

    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d')
        formatted_date = date_obj.strftime("%A %d %B")
        where_token = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, 'ul#whereToken input'))
        )
        where_token.send_keys('Elisabeth')
        time.sleep(0.5)
        ActionChains(driver).send_keys(
            Keys.ARROW_DOWN).send_keys(Keys.ENTER).perform()
        time.sleep(0.5)
        when_field = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, 'when'))
        )
        when_field.click()

        date_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, f"//div[@class='date' and normalize-space(text()) = '{formatted_date}']")
                                       ))
        date_button.click()
    except TimeoutException:
        raise RuntimeError(
            "Erreur : Échec lors de la sélection de la date ou de l'emplacement.")
    except Exception as e:
        raise RuntimeError(
            f"Erreur lors de la sélection du lieu et de l'heure : {str(e)}")


def select_terrain(driver, court_type: CourtType):
    """Sélectionne le type de terrain."""
    try:
        if court_type == CourtType.BOTH.value:
            return

        dropdown_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, 'dropdownTerrain'))
        )
        dropdown_button.click()

        if court_type == CourtType.INDOOR.value:
            label = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable(
                    (By.CSS_SELECTOR, 'label[for="chckDécouvert"]'))
            )
        else:
            label = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable(
                    (By.CSS_SELECTOR, 'label[for="chckCouvert"]'))
            )
        label.click()

        dropdown_button.click()
    except TimeoutException:
        raise RuntimeError(
            "Erreur : Échec lors de la sélection du type de terrain.")
    except Exception as e:
        raise RuntimeError(
            f"Erreur lors de la sélection du terrain : {str(e)}")


def handle_slider(driver, start_time, end_time):
    """Manipule le slider (sélection des créneaux)."""
    try:
        start_time_diff = abs(8 - start_time)
        end_time_diff = abs(22 - end_time)
        time.sleep(0.5)

        tooltip1 = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'tooltip1'))
        )
        parent_span1 = tooltip1.find_element(By.XPATH, 'parent::span')
        parent_span1.click()

        for _ in range(start_time_diff):
            ActionChains(driver).send_keys(Keys.ARROW_RIGHT).perform()
            time.sleep(0.1)

        tooltip2 = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'tooltip2'))
        )
        parent_span2 = tooltip2.find_element(By.XPATH, 'parent::span')
        parent_span2.click()

        for _ in range(end_time_diff):
            ActionChains(driver).send_keys(Keys.ARROW_LEFT).perform()
            time.sleep(0.1)

    except TimeoutException:
        raise RuntimeError(
            "Erreur : Éléments de slider non trouvés dans le délai imparti.")
    except Exception as e:
        raise RuntimeError(
            f"Erreur lors de la manipulation du slider : {str(e)}")


def click_search_button(driver):
    """Clique sur le bouton pour valider les filtres et faire la recherche."""
    try:
        search_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, 'rechercher'))
        )
        search_button.click()
    except TimeoutException:
        raise RuntimeError(
            "Erreur : Le bouton de recherche n'a pas pu être cliqué dans le délai imparti.")


def is_no_result_element_found(driver):
    """Retourne True si l'élément est trouvé, sinon False."""
    try:
        WebDriverWait(driver, 3).until(
            EC.presence_of_all_elements_located(
                (By.CLASS_NAME, 'no_result'))
        )
        return True
    except TimeoutException:
        return False


def click_first_booking_button(driver):
    """Clique sur le premier bouton pour réserver un créneau de tennis après la recherche."""
    try:
        if is_no_result_element_found(driver):
            raise RuntimeError(
                "Erreur : Aucun créneau disponible avec les filtres choisis.")

        first_booking_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'search-result-block')]//div[contains(@class, 'row tennis-court')]//button[contains(@class, 'btn')]")
                                       ))
        first_booking_button.click()
    except TimeoutException:
        raise RuntimeError(
            "Erreur : Impossible de cliquer sur le bouton de réservation.")


def switch_to_iframe(driver):
    """Passe au contexte iframe pour gérer le captcha."""
    try:
        time.sleep(1)
        iframe = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, 'li-antibot-iframe'))
        )
        driver.switch_to.frame(iframe)
    except TimeoutException:
        raise RuntimeError("Erreur : Iframe non trouvé dans le délai imparti.")


def switch_to_default_frame(driver):
    """Switches the WebDriver to the default frame."""
    try:
        driver.switch_to.default_content()
    except Exception as e:
        raise RuntimeError(f"Error switching to the default frame: {e}")


def get_screenshot_captcha(driver):
    """Captures a screenshot of the captcha as base64."""
    try:
        image_div = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located(
                (By.ID, "li-antibot-questions-container"))
        )
        return image_div.screenshot_as_base64
    except Exception as e:
        raise RuntimeError(f"Error capturing captcha screenshot: {e}")


def solve_captcha(driver):
    """Attempts to solve the captcha by interacting with the iframe and using an external solver."""
    try:
        for _ in range(3):
            try:
                switch_to_iframe(driver)

                image_data = get_screenshot_captcha(driver)

                response = solve_capcha_with_gpt(image_data)

                input_field = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located(
                        (By.ID, 'li-antibot-answer'))
                )
                input_field.send_keys(response.get('response'))

                validate_button = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.ID, 'li-antibot-validate'))
                )
                validate_button.click()

                WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located(
                        (By.ID, 'li-antibot-check-img'))
                )
                return

            except Exception as e:
                switch_to_default_frame(driver)

        raise RuntimeError(
            "Failed to solve the captcha after multiple attempts.")

    finally:
        switch_to_default_frame(driver)


def go_to_add_partenaire(driver):
    """Navigates to the "Add Partner" section by clicking the appropriate button."""
    try:
        submit_control = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, 'submitControle'))
        )
        submit_control.click()
    except Exception as e:
        raise RuntimeError(f"Error navigating to Add Partner section: {e}")


def add_partenaire(driver):
    try:
        name_input = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located(
                (By.XPATH,
                 "//div[@class='form-group has-feedback name']//input[@name='player1']")
            )
        )
        name_input.send_keys("Dupont")

        firstname_input = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located(
                (By.XPATH,
                 "//div[@class='form-group has-feedback firstname']//input[@name='player1']")
            )
        )
        firstname_input.send_keys("Jean")

        firstname_input.send_keys(Keys.ENTER)
    except Exception as e:
        raise RuntimeError(f"Error in add_partenaire: {str(e)}")


def select_payment_formule(driver):
    try:
        selected_table = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR,
                 "table.price-item.text-center.option[paymentmode='ticket'][nbtickets='1']")
            )
        )
        selected_table.click()

        button_next_step = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable(
                (By.ID, 'submit')
            )
        )
        button_next_step.click()
    except Exception as e:
        raise RuntimeError(f"Error in select_payment_formule: {str(e)}")


def pay_by_card(driver):
    try:
        button_pay_by_card = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable(
                (By.ID, 'textBoutonPaiement')
            )
        )
        button_pay_by_card.click()
    except Exception as e:
        raise RuntimeError(f"Error in pay_by_card: {str(e)}")


def complete_card_data(driver):
    try:
        card_number = os.getenv('CREDIT_CARD_NUMBER')
        card_cvc = os.getenv('CREDIT_CARD_CVC')
        expiry_month = int(os.getenv('CREDIT_CARD_EXPIRY_MONTH'))
        expiry_year = int(os.getenv('CREDIT_CARD_EXPIRY_YEAR'))

        current_date = datetime.now()
        current_year = current_date.year

        card_number_input = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located(
                (By.ID, 'cardNumberField')
            )
        )
        card_number_input.send_keys(card_number)

        ActionChains(driver).send_keys(Keys.TAB).perform()

        for _ in range(expiry_month - 1):
            ActionChains(driver).send_keys(Keys.ARROW_DOWN).perform()

        ActionChains(driver).send_keys(Keys.TAB).perform()

        years_to_arrow_down = int(expiry_year) - current_year
        if years_to_arrow_down < 0:
            raise ValueError("The card expiry year is already passed.")

        for _ in range(years_to_arrow_down):
            ActionChains(driver).send_keys(Keys.ARROW_DOWN).perform()

        cryptogramme_input = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located(
                (By.ID, 'cvvfield')
            )
        )
        cryptogramme_input.send_keys(card_cvc)

        button_submit = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable(
                (By.ID, 'form_submit')
            )
        )
        # Uncomment the line below to enable form submission
        # button_submit.click()

    except Exception as e:
        raise RuntimeError(f"Error in complete_card_data: {str(e)}")


def check_inputs(date, start_time, end_time, court_type):
    try:
        datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        raise ValueError(f"The date '{date}' is not in 'yyyy-mm-dd' format.")

    if not (8 <= start_time <= 21):
        raise ValueError(
            f"start_time must be between 8 and 21 inclusive, got: {start_time}.")
    if not (9 <= end_time <= 22):
        raise ValueError(
            f"end_time must be between 9 and 22 inclusive, got: {end_time}.")
    if start_time >= end_time:
        raise ValueError("start_time must be less than end_time.")

    if court_type not in [ct.value for ct in CourtType]:
        raise ValueError(
            f"court_type must be one of the following: {[ct.value for ct in CourtType]}, got: {court_type}.")


def booking_tennis(date, start_time, end_time, court_type):
    """Attempts to book a tennis slot with retries on failure."""
    max_attempts = 3

    for attempt in range(max_attempts):
        try:
            # Input validation
            check_inputs(date, start_time, end_time, court_type)

            # Setup and navigation
            driver = setup_driver()
            login(driver)
            navigate_to_tennis_page(driver)

            # Booking process
            select_location_and_time(driver, date)
            select_terrain(driver, court_type)
            handle_slider(driver, start_time, end_time)
            click_search_button(driver)
            click_first_booking_button(driver)
            solve_captcha(driver)
            go_to_add_partenaire(driver)
            add_partenaire(driver)
            select_payment_formule(driver)
            pay_by_card(driver)
            complete_card_data(driver)

            return {"isSuccess": True, "message": "Booking successful."}

        except RuntimeError as e:
            if attempt == max_attempts - 1 or attempt == 0:
                return {"isSuccess": False, "message": str(e)}
        except Exception as e:
            if attempt == max_attempts - 1:
                return {"isSuccess": False, "message": f"Unknown error: {str(e)}"}
        finally:
            try:
                driver.quit()
            except Exception:
                print("Error closing the browser.")

        if attempt < max_attempts - 1:
            time.sleep(120)

    return {"isSuccess": False, "message": "All booking attempts failed."}
