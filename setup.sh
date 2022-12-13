#!/usr/bin/env bash

# global git config
git config user.email "between2spaces@gmail.com"
git config user.name "between2spaces"
git remote set-url origin https://between2spaces@github.com/between2spaces/between2spaces.github.io.git


if [[ "$OSTYPE" =~ ^linux ]]; then
	# in a WSL environment
	
	USERPROFILE=$(wslpath "$(wslvar USERPROFILE)")
	LOCALAPPDATA=$(wslpath "$(wslvar LOCALAPPDATA)")
	PROGFILES_PATH="/mnt/c/Program\ Files/Git"

elif [[ "$OSTYPE" =~ ^msys ]]; then
	# in a Git for Windows environment
	
	USERPROFILE="${HOME}"
	LOCALAPPDATA="${HOME}/AppData/Local"
	PROGFILES_PATH="/c/Program\ Files/Git"
fi


# configure credential.helper
GCM_REL_EXE="mingw64/bin/git-credential-manager.exe"
if [ -f "${USERPROFILE}/AppData/Local/Programs/Git/${GCM_REL_EXE}" ]; then
	git config --global credential.helper "${USERPROFILE}/AppData/Local/Programs/Git/${GCM_REL_EXE}"
elif [ -f "${PROGFILES_PATH}$/{GCM_REL_EXE}" ]; then
	git config --global credential.helper "${PROGFILES_PATH}/${GCM_REL_EXE}"
fi


# disable login banner
touch ~/.hushlogin

# make sure there is a $HOME/.config directory
mkdir -p ~/.config

# make sure there is a $HOME/.vim directory
mkdir -p ~/.vim



# symlink dotfiles
rm -rf ~/.bash_aliases && ln -s $PWD/dotfiles/.bash_aliases ~/.bash_aliases
rm -rf ~/.bash_profile && ln -s $PWD/dotfiles/.bash_profile ~/.bash_profile
rm -rf ~/.bashrc && ln -s $PWD/dotfiles/.bashrc ~/.bashrc
rm -rf ~/.inputrc && ln -s $PWD/dotfiles/.inputrc ~/.inputrc
rm -rf ~/.vim/vimrc && ln -s $PWD/dotfiles/.vim/vimrc ~/.vim/vimrc
rm -rf ~/.config/ranger && ln -s $PWD/dotfiles/.config/ranger ~/.config/ranger
rm -rf ~/bin && ln -s $PWD/bin ~/bin



# source new symlinked $HOME/.bashrc
. ~/.bashrc


# install Node Version Manager (nvm) if not available
export NVM_DIR="$HOME/.nvm"
if [ ! -d $NVM_DIR ]; then
  git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
  cd "$NVM_DIR"
	git checkout `git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1)`
  . "$NVM_DIR/nvm.sh"
fi


if grep -qi microsoft /proc/version; then
	# in a WSL environment

	# question whether to go on and perform package management and tool installs
	read -r -p "run package purge, installs and updates (requires sudo)? [Yn] " response
	case "$response" in
		[Yy])
			sudo apt purge --auto-remove -y nano
			sudo apt purge --auto-remove -y vim-common

			# Full apt update, upgrade, remove, clean cycle
			sudo apt update
			sudo apt upgrade -y
			sudo apt dist-upgrade -y
			sudo apt autoremove -y
			sudo apt autoclean -y

			# List installed packages
			#sudo apt list --installed

			# Read size of WSL distro excluding Windows drive mount
			#sudo du -sh / --exclude=/mnt/c

			# for ssh to work properly; we need to uninstall and then reinstall
			sudo apt remove -y openssh-server
			sudo apt install -y openssh-server

			# TODO: how to automate the following...
			# sudo vim /etc/ssh/sshd_config
			# Change PasswordAuthentication to yes
			# Add login user to bottom of file:
			# AllowUsers intranet

			sudo apt install -y wsl
			sudo apt install -y fzf
			sudo apt install -y -o Dpkg::Options::="--force-overwrite" bat ripgrep
			sudo apt install -y python3-pip

			# Check for tooling updates and install if available
			compareInstalled() {

				latest_version="${1}"
				cmd="${2}"
				cmd_read_version="${3}"
				cmp=0

				if command -v "${cmd}" &> /dev/null; then
					installed_version="$(eval ${cmd} ${cmd_read_version})"
					if [ "${installed_version}" != "${latest_version}" ]; then
						echo "installed version ${installed_version}, newer version ${latest_version} available"
						cmp=1
					else
						echo "installed version ${installed_version} is up-to-date"
					fi
				else
					echo "${cmd} not installed"
					cmp=1
				fi

				if [ "${cmp}" -eq "1" ]; then
					read -r -p "install $latest_version? [Yn] " response
					case "$response" in
						[Yy])
							;;
						*)
							exit
							;;
					esac
				else
					exit 0
				fi

			}



			installDependancies() {

			  required=("${@}")
			  missing=()

			  for package in "${required[@]}"; do
					checking="checking for ${package}... "
					if dpkg-query -l "$package" &> /dev/null; then
						checking="${checking}yes"
					else
							checking="${checking}no"
						missing+=("${package}")
					fi
					echo ${checking}
			  done

			  if [ ${#missing[@]} -gt 0 ]; then
					echo "installing ${#missing[@]} packages..."
			  fi

			  for package in "${missing[@]}"; do
					sudo apt --yes install "${package}"
			  done

			}


			downloadAndInstall() {
			 	tarball_url="${1}"
				configure_args="${2}"

				tmp_filename=$(mktemp -q /tmp/XXXXXX)

				cd /tmp

				wget -O "${tmp_filename}" "${tarball_url}"
				extracted_dir=$(tar -tf "${tmp_filename}" | head -1 | cut -d "/" -f1)
				tar xvf "${tmp_filename}"

				cd "${extracted_dir}"
				./configure ${configure_args}
				make
				sudo make install


				# Clean up
				cd ..
				rm -rf "${extracted_dir}"
				rm -f "${tmp_filename}"

			}

			# Vim
			tarball_url=$(curl -sL https://api.github.com/repos/vim/vim/tags | grep -Po '"tarball_url":[ ]*"\K[^"]+' | head -1)
			tarball_version=$(basename "$tarball_url")
			compareInstalled "${tarball_version}" "vim" "--version | head -2 | sed \"N;s/\n/ /\" | sed -E \"s/^VIM - Vi IMproved (.*) \(.*Included patches: 1-([0-9]+).*$/v\1.\2/g\""
			installDependancies "build-essential" "libncurses-dev"
			downloadAndInstall "${tarball_url}" "--enable-python3interp --with-python3-command=python3.8 --with-python3-config-dir=/usr/lib/python3.8/config-3.8-x86_64-linux-gnu"
			;;
	esac

fi
