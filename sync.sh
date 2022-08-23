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

windows_terminal_settingspath="${LOCALAPPDATA}/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json"
if [ -f "${windows_terminal_settingspath}" ]; then
	echo "${windows_terminal_settingspath}"
else
	windows_terminal_settingspath="${LOCALAPPDATA}/Packages/Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe/LocalState/settings.json"
	if [ -f "${windows_terminal_settingspath}" ]; then
		echo "${windows_terminal_settingspath}"
	fi
fi

exit 0

