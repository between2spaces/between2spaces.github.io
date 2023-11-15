#!/usr/bin/env bash

USERPROFILE=$(wslpath $(echo "$(cmd.exe /Q /C "echo %userprofile%" 2>/dev/null)" | sed "s/\r$//"))
TERMINAL_SETTINGS="$USERPROFILE/AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json"

if [ ! -f $TERMINAL_SETTINGS ]; then
	TERMINAL_SETTINGS="$USERPROFILE/AppData/Local/Microsoft/Windows\ Terminal/settings.json"
fi

echo "$TERMINAL_SETTINGS"

if [ ! -f $TERMINAL_SETTINGS ]; then
    echo "Error: Unable to find Windows Terminal settings.json path"
	exit 1
fi

if cmp -s $HOME/between2spaces.github.io/terminal/settings.json "$TERMINAL_SETTINGS"; then
    echo "Windows Terminal settings.json identical, no changes to overwrite."
else
    cp $HOME/between2spaces.github.io/terminal/settings.json "$TERMINAL_SETTINGS"
    echo "Success: Copied settings.json to Windows Terminal path"
fi

