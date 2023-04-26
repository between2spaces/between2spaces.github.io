#!/usr/bin/env bash

# Exit script when any command fails

set -e

# Set USERPROFILE environment variable
cmd.exe /c setx WSLENV USERPROFILE/up 2>/dev/null
export USERPROFILE=$(wslpath $(echo "$(cmd.exe /Q /C "echo %userprofile%" 2>/dev/null)" | sed "s/\r$//"))


# Global git config

git config user.email "between2spaces@gmail.com"
git config user.name "between2spaces"


# Configure credential.helper

git config --global credential.helper "store"



# Symlink dotfiles

rm -rf ~/.bash_profile && ln -s $PWD/dotfiles/.bash_profile ~/.bash_profile
rm -rf ~/.bashrc && ln -s $PWD/dotfiles/.bashrc ~/.bashrc
rm -rf ~/.inputrc && ln -s $PWD/dotfiles/.inputrc ~/.inputrc
rm -rf ~/.wgetrc && ln -s $PWD/dotfiles/.wgetrc ~/.wgetrc
mkdir -p ~/.config
rm -rf ~/.config/nvim && ln -s $PWD/dotfiles/.config/nvim ~/.config/nvim
rm -rf ~/.config/tmux && ln -s $PWD/dotfiles/.config/tmux ~/.config/tmux
rm -rf ~/.config/powerline-shell && ln -s $PWD/dotfiles/.config/powerline-shell ~/.config/powerline-shell



# Install Node Version Manager if not available

export NVM_DIR="$HOME/.nvm"
if [ ! -d $NVM_DIR ]; then
    echo "Installing Node Version Manager..."
    git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
fi

echo "Checking for Node Version Manager updates..."
WORKINGDIR=$PWD
cd "$NVM_DIR"
git -c advice.detachedHead=false checkout `git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1)`
. "$NVM_DIR/nvm.sh"
cd $WORKINGDIR

nvm install node
nvm install-latest-npm



# Add Dockers official GPG key and setup repository if not already

sudo apt install -y ca-certificates curl gnupg lsb-release

if [ ! -f /etc/apt/keyrings/docker.gpg ] && [ ! -f /etc/apt/sources.list.d/docker.list ]; then
    echo "Adding Dockers official GPG key and setting up repo..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
fi


# Add Neovim unstable repo
sudo add-apt-repository ppa:neovim-ppa/unstable



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


# Install Neovim

sudo apt install neovim

# Install Neovim plugin/package manager Packer
rm -rf ~/.local/share/nvim/site/pack/packer/start/packer.nvim
git clone --depth 1 https://github.com/wbthomason/packer.nvim\
 ~/.local/share/nvim/site/pack/packer/start/packer.nvim


# Install Tmux
WORKINGDIR=$PWD
cd /tmp
rm -rf ./tmux_3.3a-3_amd64.deb
wget http://ftp.de.debian.org/debian/pool/main/t/tmux/tmux_3.3a-3_amd64.deb
sudo apt install ./tmux_3.3a-3_amd64.deb
rm -rf ./tmux_3.3a-3_amd64.deb
cd $WORKINGDIR


# Install tmux tpm

rm -rf ~/.tmux/plugins/tpm
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm


# Install powerline-shell

pip install powerline-shell



# Source update interactive login shell bash profile

. ~/.bash_profile


# Copy Windows Terminal settings to LocalState if needed
WORKINGDIR=$PWD
cd terminal
. ./cpytoterminal.sh
cd $WORKINGDIR

