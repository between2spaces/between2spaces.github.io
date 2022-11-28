export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export LANGUAGE=en_US.UTF-8

export DISPLAY=:0
export LIBGL_ALWAYS_INDIRECT=1

export EDITOR=vi
export SUDO_EDITOR=vi
export VISUAL=vi


export FZF_DEFAULT_COMMAND='rg --hidden -l ""'


# don't put duplicate lines or lines starting with space in the history.
HISTCONTROL=ignoreboth

# append to the history file, don't overwrite it
shopt -s histappend

# set history length
HISTSIZE=1000
HISTFILESIZE=2000



# set a fancy prompt (non-color, unless we know we "want" color)
case "$TERM" in
    xterm-color|*-256color) color_prompt=yes;;
esac


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


# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi


# source alias definitions
if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi


# if ssh and service commands are available; start sshd as root if not already running
if command -v ssh &> /dev/null && command -v service &> /dev/null; then
	if grep -qi microsoft /proc/version && ! service ssh status &>/dev/null && command -v /mnt/c/Windows/System32/wsl.exe &> /dev/null; then
		# when in WSL environment elivate to root without password using wsl.exe command
		echo "starting sshd..."
		/mnt/c/Windows/System32/wsl.exe -u root -e sh -c "service ssh start"
	fi
fi


# if docker and service commands are available; start Docker as root if not already running
if command -v docker &> /dev/null && command -v service &> /dev/null; then
	if grep -qi microsoft /proc/version && ! service docker status &>/dev/null && command -v /mnt/c/Windows/System32/wsl.exe &> /dev/null; then
		# when in WSL environment elivate to root without password using wsl.exe command
		echo "starting docker..."
		/mnt/c/Windows/System32/wsl.exe -u root -e sh -c "service docker start"
	fi
fi




# install Node Version Manager (nvm) if not available
export NVM_DIR="$HOME/.nvm"
if [ ! -d $NVM_DIR ]; then
  git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
  cd "$NVM_DIR"
	git checkout `git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1)`
  . "$NVM_DIR/nvm.sh"
fi

# load nvm on login
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"


PS1="\n\`if [[ \$? = "0" ]]; then echo "\\[\\033[32m\\]"; else echo "\\[\\033[31m\\]"; fi\`\\w \[\033[34m\]\$\[\033[0m\] "

