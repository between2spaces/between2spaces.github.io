if [[ "$OSTYPE" =~ ^linux ]]; then
	# in a WSL environment
	
	USERPROFILE=$(wslpath "$(wslvar USERPROFILE)")
	LOCALAPPDATA=$(wslpath "$(wslvar LOCALAPPDATA)")

elif [[ "$OSTYPE" =~ ^msys ]]; then
	# in a Git for Windows environment
	
	USERPROFILE="${HOME}"
	LOCALAPPDATA="${HOME}/AppData/Local"

fi

WINDOWS_TERMINAL="$LOCALAPPDATA/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/"

cp -v settings.json "$WINDOWS_TERMINAL/LocalState/"

