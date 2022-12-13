npx -u npm-check-updates -u
npm install
if ! grep -q "PORT=" ".env"; then echo 'PORT=6500' >> .env; fi
trap 'kill 0' SIGINT
export $(sed -e '/^[ ]*#/d' .env | xargs)
node wurmserver.js
