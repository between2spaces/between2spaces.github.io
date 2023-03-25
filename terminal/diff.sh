#!/usr/bin/env bash

export USERPROFILE=$(wslpath $(echo "$(cmd.exe /Q /C "echo %userprofile%" 2>/dev/null)" | sed "s/\r$//"))

LOCALSETTINGS="${USERPROFILE}/AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json"

echo $LOCALSETTINGS

#diff settings.json "$LOCALSETTINGS"

