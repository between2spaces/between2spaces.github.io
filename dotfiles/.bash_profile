# ~/.bash_profile: executed for interactive login shells
# use to run commands that should run only once, such as customising the $PATH


PATH=$PATH:~/.local/bin


# Start Docker service as root if not already running
if command -v docker &> /dev/null && ! service docker status &> /dev/null; then
    if grep -qi microsoft /proc/version; then
		# In WSL, use wsl.exe to run as root
        $(which wsl.exe) -u root -e sh -c "service docker start"
    fi
fi

# source .bashrc
if [ -f ~/.bashrc ]; then
    . ~/.bashrc
fi


