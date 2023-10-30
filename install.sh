# Git config

echo "Configuring Git"

git config --global credential.helper "store"
git config --global user.email "between2spaces@gmail.com"
git config --global user.name "between2spaces"
git config --global pull.rebase true


if [ $# -eq 0 ]; then
	if [[ -d "$HOME/between2spaces.github.io" ]]; then
		echo "Updating existing clone..."
		cd $HOME/between2spaces.github.io
		git add .; git commit -a -m "lazy commit"; git push; git pull
	else
		echo "Cloning github repo..."
		cd $HOME
		git clone https://github.com/between2spaces/between2spaces.github.io.git
		cd between2spaces.github.io
	fi
	./install.sh update
	exit 0
fi



set -e

# Colour codes for echo logging
YELLOW='\033[1;33m'
NOCOLOUR='\033[0m'


# WSL set WSLENV USERPROFILE

if [ -z "$(grep -i microsoft /proc/version)" ]; then
	echo -e "\n${YELLOW}# WSL set WSLENV USERPROFILE${NOCOLOUR}\n"
	cmd.exe /c setx WSLENV USERPROFILE/up 2>/dev/null
	export USERPROFILE=$(wslpath $(echo "$(cmd.exe /Q /C "echo %userprofile%" 2>/dev/null)" | sed "s/\r$//"))
fi


# Dotfiles

echo -e "\n${YELLOW}# Dotfiles${NOCOLOUR}\n"

if [ -d $HOME/.config ]; then rm -rf $HOME/.config; fi

for dotfile in dotfiles/.[a-z]*; do
	dotfile=${dotfile##*/}
	rm -rf $HOME/$dotfile && ln -s $PWD/dotfiles/$dotfile $HOME/$dotfile
done



# Update root certificates
sudo apt install --only-upgrade ca-certificates


exit 0


# Add deadsnakes open source repository, needed for Python3.12

echo -e "\n${YELLOW}# Add deadsnakes open source repository, needed for Python3.12${NOCOLOUR}\n"
sudo add-apt-repository -y ppa:deadsnakes/ppa



# Full apt update, upgrade, remove, clean cycle

echo -e "\n${YELLOW}# Full apt update, upgrade, remove, clean cycle${NOCOLOUR}\n"

sudo apt update -y
sudo apt upgrade -y
sudo apt dist-upgrade -y
sudo apt autoremove -y
sudo apt autoclean -y


# Java

echo -e "\n${YELLOW}# Java${NOCOLOUR}\n"

sudo apt install openjdk-19-jdk


# Python3.12
echo -e "\n${YELLOW}# Python3.12${NOCOLOUR}\n"
sudo apt install -y python3.12

# Python virtual environment
echo -e "\n${YELLOW}# Python virtual environment${NOCOLOUR}\n"
CWD=$PWD
cd ~
python3.12 -m venv --without-pip env
source env/bin/activate
curl https://bootstrap.pypa.io/get-pip.py | python
cd $CWD





# Powerline-shell

echo -e "\n${YELLOW}# Powerline-shell${NOCOLOUR}\n"
pip install powerline-shell



# Sync Windows Terminal settings

echo -e "\n${YELLOW}# Sync Windows Terminal settings${NOCOLOUR}\n"
$HOME/between2spaces.github.io/terminal/update.sh




# Node Version Manager

echo -e "\n${YELLOW}# Node version manager${NOCOLOUR}\n"
export NVM_DIR="$HOME/.nvm"
if [ ! -d $NVM_DIR ]; then
	git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
fi

CWD=$PWD
cd "$NVM_DIR"
git -c advice.detachedHead=false checkout `git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1)`
. "$NVM_DIR/nvm.sh"
cd $CWD

# Node package manager
echo -e "\n${YELLOW}# Node package manager${NOCOLOUR}\n"
nvm install node nvm install-latest-npm




source ~/.profile




# Neovim

if [ "$(which nvim)" == "" ] || [ "$(($(date +%s)-$(date -r $(which nvim) +%s)))" -gt "604800" ]; then
	echo -e "\n${YELLOW}# Neovim not found or binar is older than a week, installing latest release-0.9...${NOCOLOUR}\n"

	# Build prerequisites
	sudo apt install ninja-build gettext cmake unzip curl

	# Create tmp working directory
	TMP_DIR="$(mktemp -d)"
	cd $TMP_DIR
	echo "Installing Neovim 0.9 using working directory $TMP_DIR..."

	# Clone git repo; build and install
	git clone https://github.com/neovim/neovim.git
	cd neovim
	git checkout release-0.9
	make CMAKE_BUILD_TYPE=Release
	sudo make install

	# Removed tmp working directory
	rm -rf $TMP_DIR
fi



# Neovim Python support
echo -e "\n${YELLOW}# Neovim Python support${NOCOLOUR}\n"
pip install pynvim


# Make sure Ripgrep and fd find is available
echo -e "\n${YELLOW}# Make sure Ripgrep and fd find is available${NOCOLOUR}\n"
sudo apt install ripgrep fd-find

if [ ! -f ~/.local/bin/fd ]; then
	ln -s $(which fdfind) ~/.local/bin/fd
fi


# Neovim clipboard support for WSL2
echo -e "\n${YELLOW}# Neovim clipoard support for WSL2${NOCOLOUR}\n"
sudo apt install wl-clipboard



# NPM install project dependencies

echo -e "\n${YELLOW}# NPM install project dependencies${NOCOLOUR}\n"
npm install



# Install typescript-language-server
npm install -g typescript-language-server


echo -e "\n${YELLOW}Finished. source ~/.profile to updated current process environment or restart terminal.${NOCOLOUR}\n"

