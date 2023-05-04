:: Install chocolately package manager
@echo off
echo Starting install process
echo Press ctrl+c to exit if you have not ran this file as administrator
echo This bot is entirely open source, you can check all the code if you are worried about malicious code
echo You may have to press enter or Y periodically during the install process
echo Installation should only take a few minutes at most
echo Press enter to continue with installation
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command " [System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"

:: Install npm and node
choco install nodejs -y

echo Node and npm finished installing
echo open install-pt2.bat to finish install the bot.
pause