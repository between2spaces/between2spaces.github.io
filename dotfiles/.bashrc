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



# source Node Version Manager if not available

export NVM_DIR="$HOME/.nvm"
if [ -d $NVM_DIR ]; then
    . "$NVM_DIR/nvm.sh"
fi



# source aliases

if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi



# powerline-shell prompt

function _update_ps1() {
    PS1=$(powerline-shell $?)
}

if [[ $TERM != linux && ! $PROMPT_COMMAND =~ _update_ps1 ]]; then
    PROMPT_COMMAND="_update_ps1; $PROMPT_COMMAND"
fi

. "$HOME/.cargo/env"

if command -v tmux &> /dev/null && [ -n "$PS1" ] && [[ ! "$TERM" =~ screen ]] && [[ ! "$TERM" =~ tmux ]] && [ -z "$TMUX" ]; then
  exec tmux
fi
