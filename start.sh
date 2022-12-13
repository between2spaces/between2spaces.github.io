npx -y npm-check-updates -u
npm install
trap 'kill 0' SIGINT
$(which python) -m http.server
