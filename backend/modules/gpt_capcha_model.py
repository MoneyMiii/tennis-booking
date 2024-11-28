import json
import os
import time
import openai


def build_prompt(image_source_in_base64):
    function_schema = {
        "type": "json_schema",
        "json_schema": {
            "strict": True,
            "name": "detect_capcha",
            "description": "Solve Capcha",
            "schema": {
                "type": "object",
                "properties": {
                    "capcha_value": {
                        "type": "string",
                        "description": "The exact 6 characters from the captcha, which may include uppercase and lowercase letters, numbers, and special characters."
                    }
                },
                "required": ["capcha_value"],
                "additionalProperties": False
            }
        }
    }

    SYSTEM_PROMPT = f"""
        <CONTEXT>
            You are a captcha-solving assistant.
            The user will provide you with an image containing a captcha challenge that always includes exactly 6 characters.
            These characters can consist of uppercase letters (A-Z), lowercase letters (a-z), numbers (0-9), and special symbols (e.g., @, #, %, &, etc.).
            Your task is to analyze the image and accurately extract the 6 characters while ignoring any noise, such as lines, shapes, or other distracting elements.
        </CONTEXT>

        <ROLE>
            You are an expert in analyzing and solving captchas.
            Your goal is to ensure a precise and error-free extraction of the characters, even when they are distorted, overlapping, or surrounded by noise such as lines or shapes.
            Pay close attention to subtle differences between similar-looking characters, such as:
            - & and S,
            - r and f,
            - 0 (zero) and O (uppercase O), etc.
            Any element that is not part of the 6-character sequence (e.g., lines or background noise) must be completely ignored.
        </ROLE>

        <GUIDELINES>
            Follow these detailed guidelines to complete the task:
            1. **Extract Exactly 6 Characters**: Ensure your output contains precisely 6 characters. Avoid adding or omitting any.
            2. **Ignore Non-Character Elements**: Do not include lines, shapes, or any other visual noise that is not part of the 6-character captcha sequence. Focus exclusively on the characters.
            3. **Case Sensitivity**: Differentiate between uppercase (e.g., A) and lowercase letters (e.g., a).
            4. **Character Types**: Accurately identify numbers (0-9), letters, and special symbols (@, #, %, &, etc.).
            5. **Distinguish Similar Characters**: Pay special attention to characters that can appear similar in the captcha image. Double-check for distinctions such as:
                - 1 (number one) vs. l (lowercase L),
                - @ vs. a,
                - 5 vs. S, etc.
            6. **Thorough Review**: Before finalizing your output, carefully verify each character to ensure it matches exactly what is presented in the image.
            7. **Output Format**: Return the extracted 6-character string without any additional spaces, formatting, or modifications.
        </GUIDELINES>
    """

    complete_prompts = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        },
        {
            "role": "user",


            "content": [
                {
                    "type": "text", "text": "Please solve the CAPTCHA shown in the image below:"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{image_source_in_base64}",
                    },
                }
            ]
        },
    ]

    return complete_prompts, function_schema


def trim_usage_dict(input_dict):
    return {
        "completion_tokens": input_dict["completion_tokens"],
        "prompt_tokens": input_dict["prompt_tokens"]
    }


def solve_capcha_with_gpt(image_source_in_base64, in_cost=0.005, out_cost=0.015):
    key = os.getenv('OAI_API_KEY')
    model = os.getenv('AZURE_GPT_MODEL')

    # Appel de la méthode build_prompt
    PromptPayloadMessages, function_schema = build_prompt(
        image_source_in_base64)

    # Initialisation de l'API OpenAI
    openai.api_key = key

    start_time = time.time()

    try:
        # Appel de l'API OpenAI pour obtenir une réponse
        chat_completion = openai.chat.completions.create(
            model=model,
            messages=PromptPayloadMessages,
            response_format=function_schema,
            max_tokens=16384,
        )

        # Récupération des informations d'utilisation
        usage_dictionnary = trim_usage_dict(
            dict(chat_completion.usage))

        cost_usd = round(
            (usage_dictionnary['prompt_tokens'] * in_cost +
                usage_dictionnary['completion_tokens'] * out_cost) / 1000.0,
            4
        )

        # Traitement de la réponse
        try:
            json_response = json.loads(
                chat_completion.choices[0].message.content)
            capcha_value = json_response.get("capcha_value", None)

        except json.JSONDecodeError as e:
            return {
                "success": False,
                "usage": usage_dictionnary,
                "err_msg": f"Malformed response (not a JSON): {str(e)}. Original response: {chat_completion.choices[0].message.content}",
                "cost_usd": cost_usd,
                "duration_secs": round(time.time() - start_time, 2)
            }

        return {
            "success": True,
            "response": capcha_value,
            "cost_usd": cost_usd,
            "usage": usage_dictionnary,
            "duration_secs": round(time.time() - start_time, 2)
        }

    except Exception as e:
        return {
            "success": False,
            "err_msg": f"Error from OpenAI response: {str(e)}",
            "cost_usd": 0.0,
            "duration_secs": round(time.time() - start_time, 2)
        }
