#!/usr/bin/env bash

# Exit script when any command fails

set -e


# Global git config

git config user.email "between2spaces@gmail.com"
git config user.name "between2spaces"
#git remote set-url origin https://between2spaces@github.com/between2spaces/between2spaces.github.io.git


# Configure credential.helper

GCM_PATHS=("$USERPROFILE/AppData/Local/Programs/Git/mingw64/bin/git-credential-manager.exe" "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe" "/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe")

for gcm_path in ${GCM_PATHS[*]}; do
    if [ -f "$gcm_path" ]; then
        git config --global credential.helper "$gcm_path"
        echo "git config --global credential.helper \"$gcm_path\""
    fi
done


# Symlink dotfiles

rm -rf ~/.bash_profile && ln -s $PWD/dotfiles/.bash_profile ~/.bash_profile
rm -rf ~/.bashrc && ln -s $PWD/dotfiles/.bashrc ~/.bashrc
rm -rf ~/.inputrc && ln -s $PWD/dotfiles/.inputrc ~/.inputrc
rm -rf ~/.wgetrc && ln -s $PWD/dotfiles/.wgetrc ~/.wgetrc
mkdir -p ~/.vim
rm -rf ~/.vim/vimrc && ln -s $PWD/dotfiles/.vim/vimrc ~/.vim/vimrc



# Install Node Version Manager if not available

export NVM_DIR="$HOME/.nvm"
if [ ! -d $NVM_DIR ]; then
    echo "Installing Node Version Manager..."
    git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
fi


# Check for updates

echo "Checking for Node Version Manager updates..."
WORKINGDIR=$PWD
cd "$NVM_DIR"
git -c advice.detachedHead=false checkout `git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1)`
. "$NVM_DIR/nvm.sh"
cd $WORKINGDIR


# Add Dockers official GPG key and setup repository if not already

sudo apt install -y ca-certificates curl gnupg lsb-release

if [ ! -f /etc/apt/keyrings/docker.gpg ] && [ ! -f /etc/apt/sources.list.d/docker.list ]; then
    echo "Adding Dockers official GPG key and setting up repo..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
fi


# Full apt update, upgrade, remove, clean cycle

sudo apt update
sudo apt upgrade -y
sudo apt dist-upgrade -y
sudo apt autoremove -y
sudo apt autoclean -y


# For ssh to work properly; we need to uninstall and then reinstall

sudo apt remove -y openssh-server
sudo apt install -y openssh-server


# TODO: how to automate the following...
# sudo vim /etc/ssh/sshd_config
# Change PasswordAuthentication to yes
# Add login user to bottom of file:
# AllowUsers intranet

# Setup Docker and Docker compose under Ubuntu

sudo apt install -y docker-ce docker-ce-cli containerd.io python3-pip
sudo pip3 install docker-compose

if ! service docker status &> /dev/null; then
    sudo service docker start
fi


# Source update interactive login shell bash profile

. ~/.bash_profile


# Copy Windows Terminal settings to LocalState if needed
WORKINGDIR=$PWD
cd terminal
. ./cpytoterminal.sh
cd $WORKINGDIR

