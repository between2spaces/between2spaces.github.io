# ~/.bashrc: executed for non-login shells
# use to run the commands that should run every time you launch a new shell


# set editing mode to vi
set -o vi


# enable color support of ls and also add handy aliases

if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi



# remove ugly green background from ow 'other, writable' and tw 'sticky, writable'

export LS_COLORS="$LS_COLORS:ow=1;34:tw=1;34:"



# enable programmable completion features

if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi



# Set default editors to neovim

export VISUAL=nvim
export EDITOR="$VISUAL"
export SUDO_EDITOR="$VISUAL"


# Set USERPROFILE for Windows host user home

export USERPROFILE=$(wslpath $(echo "$(cmd.exe /Q /C "echo %userprofile%" 2>/dev/null)" | sed "s/\r$//"))


# activate Python virtual environment if available

if [ -f ~/env/bin/activate ]; then
	. ~/env/bin/activate
fi


# source Node Version Manager if not available

export NVM_DIR="$HOME/.nvm"
if [ -d $NVM_DIR ]; then
    . "$NVM_DIR/nvm.sh"
fi


# required for Python requests module inside venvs to trust system-trusted certificate authorities
export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt


# source aliases

if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

# Fancy prompt
Z="\033[0m"
ENV="\033[92;100m"
ENV_="\033[90;42m"
USR="\033[97;42m"
USR_="\033[32;100m"
CWD="\033[97;100m"
CWD_="\033[90m"

export PS1="${ENV}${VIRTUAL_ENV_PROMPT}${Z}${ENV_}${Z}${USR}\u${Z}${USR_}${Z}${CWD} \w${Z}${CWD_}${Z}\n\$ "
