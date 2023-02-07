export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export LANGUAGE=en_US.UTF-8

export EDITOR=vi
export SUDO_EDITOR=vi
export VISUAL=vi


LOCALAPPDATA=$(wslpath "$(wslvar LOCALAPPDATA)")

alias code="$LOCALAPPDATA/Programs/Microsoft\ VS\ Code/bin/code -r"

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

# if docker and service commands are available; start Docker as root if not already running
if command -v docker &> /dev/null && command -v service &> /dev/null; then
	if grep -qi microsoft /proc/version && ! service docker status &>/dev/null && command -v /mnt/c/Windows/System32/wsl.exe &> /dev/null; then
		# when in WSL environment elivate to root without password using wsl.exe command
		echo "starting docker..."
		/mnt/c/Windows/System32/wsl.exe -u root -e sh -c "service docker start"
	fi
fi


PS1="\n\`if [[ \$? = "0" ]]; then echo "\\[\\033[32m\\]"; else echo "\\[\\033[31m\\]"; fi\`\\w \[\033[34m\]\$\[\033[0m\] "

cd ~
