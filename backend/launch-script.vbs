Set WshShell = CreateObject("WScript.Shell")

projectPath = "C:\Users\Alain\Documents\tennis-booking\backend"

activateCommand = "cmd.exe /c cd /d """ & projectPath & """ && call python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python main.py && deactivate"

WshShell.Run activateCommand, 0, False
