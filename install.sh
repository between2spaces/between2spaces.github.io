
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



# Full apt update, upgrade, remove, clean cycle

sudo apt update
sudo apt upgrade -y
sudo apt dist-upgrade -y
sudo apt autoremove -y
sudo apt autoclean -y


# Python3 and pip

sudo apt install -y python3-pip

# Powerline-shell

pip install powerline-shell


# Copy Windows Terminal settings to LocalState if needed

$HOME/between2spaces.github.io/terminal/update.sh



# Neovim 

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




# Tmux

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




echo "Finished."
echo '"source ~/.profile" to updated current process environment'

