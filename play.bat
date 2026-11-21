@echo off
rem Starts a small local web server for the game and opens it in the browser.
cd /d "%~dp0"
start "" http://127.0.0.1:8765/index.html
python -m http.server 8765 --bind 127.0.0.1
