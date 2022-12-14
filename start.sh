npx -y npm-check-updates -u
npm install
trap 'kill 0' SIGINT
python3 -m http.server
