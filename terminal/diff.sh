#!/usr/bin/env bash

LOCALSETTINGS="$USERPROFILE/AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json"

diff settings.json "$LOCALSETTINGS"

