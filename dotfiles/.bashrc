# ~/.bashrc: executed for non-login shells
# use to run the commands that should run every time you launch a new shell

# don't put duplicate lines or lines starting with space in the history.
HISTCONTROL=ignoreboth

# append to the history file, don't overwrite it
shopt -s histappend

# set history length
HISTSIZE=1000
HISTFILESIZE=2000

# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

# enable color support of ls and also add handy aliases
if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi


# enable programmable completion features
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi

# Set default editors to vim
export VISUAL=vim
export EDITOR="$VISUAL"
export SUDO_EDITOR="$VISUAL"

# source Node Version Manager if not available
export NVM_DIR="$HOME/.nvm"
if [ -d $NVM_DIR ]; then
    . "$NVM_DIR/nvm.sh"
fi

export USERPROFILE=$(wslpath "$(cmd.exe /c "<nul set /p=%UserProfile%" 2>/dev/null)")


# common command functions
ssh-ecls-cls-dev() { ssh ecls@zaue1declsap02.wkap.int; }
ssh-ecls-cls-tst() { ssh ecls@zaue1ueclsap03.wkap.int; }
ssh-ecls-cls-prd() { ssh ecls@zaue1peclsap04.wkap.int; }

ssh-intranet-cls-dev() { ssh intranet@zaue1declsap02.wkap.int; }
ssh-intranet-cls-tst() { ssh intranet@zaue1ueclsap03.wkap.int; }
ssh-intranet-cls-prd() { ssh intranet@zaue1peclsap04.wkap.int; }

ssh-intranet-ngp-dev() { ssh intranet@zauaed1pubapp01.wkap.int; }
ssh-intranet-ngp-tst() { ssh intranet@zauaetpubapp02.wkap.int; }
ssh-intranet-ngp-prd() { ssh intranet@zaue1ppubap02.wkap.int; }

ssh-scarmody-ngp-dev() { ssh scarmody@zauaed1pubapp01.wkap.int; }
ssh-scarmody-ngp-tst() { ssh scarmody@zauaetpubapp02.wkap.int; }
ssh-scarmody-ngp-prd() { ssh scarmody@zaue1ppubap02.wkap.int; }

ssh-scarmody-newsagent() { ssh scarmody@zaue1pcchiqap02.wkap.int; }

lazycommit() { git add .; git commit -a -m "lazy commit"; git push; }


# set a fancy prompt
PS1="\n\`if [[ \$? = "0" ]]; then echo "\\[\\033[32m\\]"; else echo "\\[\\033[31m\\]"; fi\`\\w \[\033[34m\]\$\[\033[0m\] "

