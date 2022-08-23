#!/usr/bin/env bash

if grep -qi microsoft /proc/version; then
	# in a WSL environment
	USERPROFILE=$(wslpath "$(wslvar USERPROFILE)")
	LOCALAPPDATA=$(wslpath "$(wslvar LOCALAPPDATA)")
	PROGFILES_PATH="/mnt/c/Program\ Files"
elif command -v cygpath &> /dev/null; then
	# in a Git for Windows environment
	USERPROFILE="${HOME}"
	LOCALAPPDATA="${HOME}/AppData/Local"
	PROGFILES_PATH="/c/Program\ Files"
fi

git pull

windows_terminal_settingspath="${LOCALAPPDATA}/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json"
if [ ! -f "${windows_terminal_settingspath}" ]; then
	windows_terminal_settingspath="${LOCALAPPDATA}/Packages/Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe/LocalState/settings.json"
fi

if [ -f "${windows_terminal_settingspath}" ]; then
	cp "${windows_terminal_settingspath}" windows_terminal.json
	echo "${windows_terminal_settingspath}"
fi

git add .
git commit -m "sync"
git push

