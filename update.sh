# How to install Corporate Cert in WSL2
# 1) Go to any HTTPS cite in browser
# 2) View site security info from location bar icon
# 3) Export WKGLOBAL-Secure-CertificateAuthority as Base64-encoded ASCII, certificate chain
# 4) sudo cp /mnt/c/Users/stephen.carmody/Downloads/WKGLOBAL-Secure-CertificateAuthority.crt /usr/local/share/ca-certificates
# 5) sudo update-ca-certificates
#
set -e

CWD=$PWD
YELLOW='\e[33m'
GREEN='\e[1;92m'
NOCOLOUR='\e[0m'

# Git global config
echo -e "\n${YELLOW}# Git set config${NOCOLOUR}\n"
git config --global pull.rebase true
echo -e "git config --global pull.rebase true ${GREEN}✓${NOCOLOUR}"
git config --global credential.helper "store"
echo -e "git config --global credential.helper "store" ${GREEN}✓${NOCOLOUR}"
git config user.email "between2spaces@gmail.com"
echo -e "git config user.email "between2spaces@gmail.com" ${GREEN}✓${NOCOLOUR}"
git config user.name "between2spaces"
echo -e "git config user.name "between2spaces" ${GREEN}✓${NOCOLOUR}"

# Dotfiles
echo -e "\n${YELLOW}# Dotfiles${NOCOLOUR}\n"
if [ -f $HOME/.motd_shown ]; then
	rm -rf $HOME/.motd_shown
	echo -e "rm -rf $HOME/.motd_shown ${GREEN}✓${NOCOLOUR}"
fi
for dotfile in dotfiles/.[a-z]*; do
	dotfile=${dotfile##*/}
	if [ "$dotfile" == ".config" ]; then continue; fi
	rm -rf $HOME/$dotfile && ln -s $PWD/dotfiles/$dotfile $HOME/$dotfile
	echo -e "${HOME}/${dotfile} ${GREEN}✓${NOCOLOUR}"
done
if [ ! -d $HOME/.config ]; then mkdir ~/.config; fi
for dotfile in dotfiles/.config/[a-z]*; do
	dotfile=${dotfile##*/}
	rm -rf $HOME/.config/$dotfile && ln -s $PWD/dotfiles/.config/$dotfile $HOME/.config/$dotfile
	echo -e "${HOME}/.config/${dotfile} ${GREEN}✓${NOCOLOUR}"
done


# Add corporate certificate if not already done
if [ -f /usr/local/share/ca-certificates/WKGLOBAL-Secure-CertificateAuthority.crt ]; then
	sudo cp certificates/WKGLOBAL-Secure-CertificateAuthority.crt /usr/local/share/ca-certificates
	sudo update-ca-certificates
fi


# Attempt to add the deadsnakes open source repository, needed for Python3.12
if [ ! -f /etc/apt/sources.list.d/deadsnakes-ubuntu-ppa-jammy.list ]; then
	set +e
	sudo add-apt-repository -y ppa:deadsnakes/ppa
	set -e
fi

# Full apt update, upgrade, remove, clean cycle
echo -e "\n${YELLOW}# Full apt update, upgrade, remove, clean cycle${NOCOLOUR}\n"
sudo apt update -y
sudo apt upgrade -y
sudo apt dist-upgrade -y
sudo apt autoremove -y
sudo apt autoclean -y

# Install Python3.12 if we successfully added the deadsnakes repo
if [ -f /etc/apt/sources.list.d/deadsnakes-ubuntu-ppa-jammy.list ]; then
	echo -e "\n${YELLOW}# Install Python3.12${NOCOLOUR}\n"
	sudo apt install -y python3.12
fi

# Python virtual environment
if [ "$(echo $VIRTUAL_ENV_PROMPT)" == "" ]; then
	echo -e "\n${YELLOW}# Python virtual environment${NOCOLOUR}\n"
	cd ~
	if [ "$(which python3.12)" == "" ]; then 
		python3 -m venv --without-pip env
	else
		python3.12 -m venv --without-pip env
	fi
	source env/bin/activate
	curl -k https://bootstrap.pypa.io/get-pip.py | python
	cd $CWD
fi

# Powerline-shell
echo -e "\n${YELLOW}# Powerline-shell${NOCOLOUR}\n"
pip install powerline-shell

# Install wl-clipboard required for my Neovim g.clipboard config (see .config/nvim/init.lua)
echo -e "\n${YELLOW}# Neovim clipoard support for WSL2${NOCOLOUR}\n"
sudo apt install wl-clipboard


# Install ripgrep requried for NeoVim Telescope
echo -e "\n${YELLOW}# ripgrep ${NOCOLOR}\n"
sudo apt install ripgrep

# Neovim
if [ "$(which nvim)" == "" ] || [ "$(($(date +%s)-$(date -r $(which nvim) +%s)))" -gt "604800" ]; then
	echo -e "\n${YELLOW}# Neovim not found or binary is older than a week, installing latest release...${NOCOLOUR}\n"
	sudo apt install ninja-build gettext cmake unzip curl
	cd ~
	if [ ! -d neovim ]; then
		git clone https://github.com/neovim/neovim.git
	fi
	cd neovim
	make CMAKE_BUILD_TYPE=RelWithDebInfo
	sudo make install
	cd $CWD
fi

# Node Version Manager
echo -e "\n${YELLOW}# Node version manager${NOCOLOUR}\n"
export NVM_DIR="$HOME/.nvm"
if [ ! -d $NVM_DIR ]; then
	git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
fi
cd "$NVM_DIR"
git -c advice.detachedHead=false checkout `git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1)`
. "$NVM_DIR/nvm.sh"
cd $CWD

# Node package manager
echo -e "\n${YELLOW}# Node package manager${NOCOLOUR}\n"
nvm install node
nvm install-latest-npm

# Install package.json packages; check for updates; install updates
npm install
npx npm-check-updates -u
npm install

# Install vtsls language server for Neovim LSP
npm install -g @vtsls/language-server

# Source .bashrc
. "$HOME/.bashrc"

# Update Windows Terminal settings
./terminal/update.sh

