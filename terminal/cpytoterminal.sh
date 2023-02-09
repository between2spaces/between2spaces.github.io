#!/usr/bin/env bash

LOCALSETTINGS="$USERPROFILE/AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json"

if cmp -s settings.json "$LOCALSETTINGS"; then
    echo "settings.json identical to Windows Terminal LocalState, nothing to do."
else
    echo "Difference found, copying settings.json to Windows Terminal LocalState..."
    cp -v settings.json "$LOCALSETTINGS"
fi

