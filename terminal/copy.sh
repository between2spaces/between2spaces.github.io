#!/usr/bin/env bash

LOCALSETTINGS="$USERPROFILE/AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json"

if cmp -s settings.json "$LOCALSETTINGS"; then
    echo "Windows Terminal LocalState identical to settings.json, nothing to do."
else
    echo "Difference found, copying Windows Terminal LocalState to settings.json..."
    cp -v "$LOCALSETTINGS" .
fi

