npx -y npm-check-updates -u
npm install
trap 'kill 0' SIGINT
if [[ "$OSTYPE" =~ ^msys ]]; then
	alias python3="python"
fi
python3 -m http.server
