SOURCE="$HOME/between2spaces.github.io/terminal/settings.json"

{
	DESTINATION="$USERPROFILE/AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/"
	cp "$SOURCE" "$DESTINATION" 2>/dev/null &&
    echo "Success: Copied settings.json to $DESTINATION"
} || {
	DESTINATION="$USERPROFILE/AppData/Local/Microsoft/Windows Terminal/settings.json"
	cp "$SOURCE" "$DESTINATION" 2>/dev/null &&
    echo "Success: Copied settings.json to $DESTINATION"
} || {
    echo "Error: Unable to copy settings.json to Windows Terminal path"
}

