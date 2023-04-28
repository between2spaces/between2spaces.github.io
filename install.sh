#!/usr/bin/env bash
set -e
if [[ -d "~/between2spaces.github.io" ]]
then
	echo "Updating existing clone..."
	cd ~/between2spaces.github.io
	git pull
else
	echo "Cloning github repo..."
	cd ~
	git clone https://github.com/between2spaces/between2spaces.github.io.git
	cd ~/between2spaces.github.io
fi
