# ~/.bash_profile: executed for interactive login shells
# use to run commands that should run only once, such as customising the $PATH


PATH=$PATH:~/.local/bin


# source .bashrc
if [ -f ~/.bashrc ]; then
    . ~/.bashrc
fi


