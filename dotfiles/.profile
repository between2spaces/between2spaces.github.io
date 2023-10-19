# ~/.profile: executed by the command interpreter for login shells.
# use to run commands that should run only once, such as customising the $PATH

# if running bash
if [ -n "$BASH_VERSION" ]; then
	# include .bashrc if it exists
	if [ -f "$HOME/.bashrc" ]; then
	        . "$HOME/.bashrc"
	fi
fi

# set PATH so it includes user's private bin(s) if they exist
if [ -d "$HOME/bin" ] ; then
	PATH="$HOME/bin:$PATH"
fi

if [ -d "$HOME/.local/bin" ] ; then
	PATH="$HOME/.local/bin:$PATH"
fi

if [ -d "$HOME/node_modules/.bin" ] ; then
	PATH="$HOME/node_modules/.bin:$PATH"
fi

