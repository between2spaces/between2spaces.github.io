
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


# Git

echo "Configuring Git"

git config --global credential.helper "store"

git config user.email "between2spaces@gmail.com"
git config user.name "between2spaces"

git config pull.rebase true



# WSL set WSLENV USERPROFILE

if [ -z "$(grep -i micrxosoft /proc/version)" ]; then
	echo "Running on WSL"
	echo "Setting USERPROFILE environment variable"
	cmd.exe /c setx WSLENV USERPROFILE/up 2>/dev/null
	export USERPROFILE=$(wslpath $(echo "$(cmd.exe /Q /C "echo %userprofile%" 2>/dev/null)" | sed "s/\r$//"))
fi



# Dotfiles

if [ -d $HOME/.config ]; then rm -rf $HOME/.config; fi

for dotfile in dotfiles/.[a-z]*;
do
	dotfile=${dotfile##*/}
	rm -rf $HOME/$dotfile && ln -s $PWD/dotfiles/$dotfile $HOME/$dotfile
done



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


# Java

sudo apt install openjdk-19-jdk


# Python3 and pip

sudo apt install -y python3-pip


# Powerline-shell

pip install powerline-shell


# Copy Windows Terminal settings to LocalState if needed

$HOME/between2spaces.github.io/terminal/update.sh




# Tmux

if [[ "$(tmux -V)" != "tmux 3.2a" ]];
then

	# Prerequisites
	sudo apt install autotools-dev automake pkg-config libevent-dev yacc libncurses5-dev libncursesw5-dev

	# Tmp working directory
	TMP_DIR="$(mktemp -d)"
	cd $TMP_DIR
	echo "Installing Tmux using working directory $TMP_DIR..."

	git clone https://github.com/tmux/tmux.git
	cd tmux
	sh autogen.sh
	./configure && make

	# Clean tmp working directory
	rm -rf $TMP_DIR

	# Tmux TPM
	rm -rf $HOME/.tmux/plugins/tpm
	mkdir -p $HOME/.tmux/plugins
	cd $HOME/.tmux/plugins
	git clone https://github.com/tmux-plugins/tpm

fi



# Node Version Manager

echo "Node Version Manager"
export NVM_DIR="$HOME/.nvm"
if [ ! -d $NVM_DIR ];
then
	git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
fi

CWD=$PWD
cd "$NVM_DIR"
git -c advice.detachedHead=false checkout `git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1)`
. "$NVM_DIR/nvm.sh"
cd $CWD

nvm install node
nvm install-latest-npm

source ~/.profile



# Neovim

if [[ "$(nvim --version | head -n 1)" != "NVIM v0.9.1-dev-57+ge81b2eb94" ]];
then

	# Prerequisites
	sudo apt install ninja-build gettext cmake unzip curl

	# Tmp working directory
	TMP_DIR="$(mktemp -d)"
	cd $TMP_DIR
	echo "Installing Neovim 0.9 using working directory $TMP_DIR..."

	# Install Neovim 0.9
	git clone https://github.com/neovim/neovim.git
	cd neovim
	git checkout release-0.9
	make CMAKE_BUILD_TYPE=Release
	sudo make install

	# Clean tmp working directory
	rm -rf $TMP_DIR

fi


# Neovim health support

sudo apt install ripgrep 	# for Telescope
sudo apt install fd-find    # for Telescope
pip install pynvim			# Python support

if [ ! -f ~/.local/bin/fd ];
then
	ln -s $(which fdfind) ~/.local/bin/fd 
fi



# Docker

sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo pip3 install docker-compose



echo "Finished."
echo '"source ~/.profile" to updated current process environment'

