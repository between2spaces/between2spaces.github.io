#!/usr/bin/env bash
set -e
if [ $# -eq 0 ];
then
	if [[ -d "$HOME/between2spaces.github.io" ]];
	then
		echo "Updating existing clone..."
		cd $HOME/between2spaces.github.io
		git pull
	else
		echo "Cloning github repo..."
		cd $HOME 
		git clone https://github.com/between2spaces/between2spaces.github.io.git
		cd between2spaces.github.io
	fi
	./install.sh update
	exit 0
fi


echo "Configuring Git"
git config --global credential.helper "store"

git config user.email "between2spaces@gmail.com"
git config user.name "between2spaces"



if [ -z "$(grep -i micrxosoft /proc/version)" ]; then
	echo "Running on WSL"
	echo "Setting USERPROFILE environment variable"
	cmd.exe /c setx WSLENV USERPROFILE/up 2>/dev/null
	#export USERPROFILE=$(wslpath $(echo "$(cmd.exe /Q /C "echo %userprofile%" 2>/dev/null)" | sed "s/\r$//"))
fi


