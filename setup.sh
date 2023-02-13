#!/usr/bin/env bash

# Exit script when any command fails

set -e


# Global git config

git config user.email "between2spaces@gmail.com"
git config user.name "between2spaces"
#git remote set-url origin https://between2spaces@github.com/between2spaces/between2spaces.github.io.git


# Configure credential.helper

GCM_PATHS=(
    "$USERPROFILE/AppData/Local/Programs/Git/mingw64/bin/git-credential-manager.exe"
    "$(wslpath 'C:\Program Files\Git\mingw64\bin\git-credential-manager.exe')"
)
set found_gcm = 0
for ((i = 0; i < ${#GCM_PATHS[@]}; i++)); do
    gcm_path="${GCM_PATHS[$i]}"
    if [ -f "$gcm_path" ]; then
        gcm_path="${gcm_path/ /\\ }"
        git config --global credential.helper "$gcm_path"
        echo "git config --global credential.helper \"$gcm_path\""
        set found_gcm = 1
    fi
done

if ! $found_gcm; then
    echo "Warning: git config --global credential.helper not set; unable to find Git Credential Manager"
fi



# Symlink dotfiles

rm -rf ~/.bash_profile && ln -s $PWD/dotfiles/.bash_profile ~/.bash_profile
rm -rf ~/.bashrc && ln -s $PWD/dotfiles/.bashrc ~/.bashrc
rm -rf ~/.inputrc && ln -s $PWD/dotfiles/.inputrc ~/.inputrc
rm -rf ~/.wgetrc && ln -s $PWD/dotfiles/.wgetrc ~/.wgetrc
rm -rf ~/.tmux.conf && ln -s $PWD/dotfiles/.tmux.conf ~/.tmux.conf
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


# Add PPA Vim repository to install latest Vim

sudo add-apt-repository -y ppa:jonathonf/vim



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


# Install latest Vim

sudo apt install -y vim


# Source update interactive login shell bash profile

. ~/.bash_profile


# Copy Windows Terminal settings to LocalState if needed
WORKINGDIR=$PWD
cd terminal
. ./cpytoterminal.sh
cd $WORKINGDIR

