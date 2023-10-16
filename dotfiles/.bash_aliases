alias python="python3"
alias vi="nvim"
alias vim="nvim"

nvim() { 

	if [ -n "$1" ]; then
		if [ -n "$NVIM" ]; then
			$(which nvim) --server "$NVIM" --remote-send "<C-\><C-N><C-W>k:drop $(realpath $1)<CR>"
		else
			$(which nvim) --listen ~/.cache/nvim/server.pipe "$1"
		fi
	else
		[ -z "$NVIM" ] && $(which nvim) --listen ~/.cache/nvim/server.pipe
	fi

}

lazycommit() { git add .; git commit -a -m "lazy commit"; git push; }

docker-start() { $(which wsl.exe) -u root -e sh -c "service docker start"; }


# work servers

ssh-ecls-cls-dev() { ssh ecls@zaue1declsap02.wkap.int; }
ssh-ecls-cls-tst() { ssh ecls@zaue1ueclsap03.wkap.int; }
ssh-ecls-cls-prd() { ssh ecls@zaue1peclsap04.wkap.int; }

ssh-intranet-cls-dev() { ssh intranet@zaue1declsap02.wkap.int; }
ssh-intranet-cls-tst() { ssh intranet@zaue1ueclsap03.wkap.int; }
ssh-intranet-cls-prd() { ssh intranet@zaue1peclsap04.wkap.int; }

ssh-intranet-ngp-dev() { ssh intranet@zauaed1pubapp01.wkap.int; }
ssh-intranet-ngp-tst() { ssh intranet@zauaetpubapp02.wkap.int; }
ssh-intranet-ngp-prd() { ssh intranet@zaue1ppubap02.wkap.int; }

sftp-intranet-ngp-dev() { sftp intranet@zauaed1pubapp01.wkap.int; }
sftp-intranet-ngp-tst() { sftp intranet@zauaetpubapp02.wkap.int; }
sftp-intranet-ngp-prd() { sftp intranet@zaue1ppubap02.wkap.int; }

ssh-scarmody-ngp-dev() { ssh scarmody@zauaed1pubapp01.wkap.int; }
ssh-scarmody-ngp-tst() { ssh scarmody@zauaetpubapp02.wkap.int; }
ssh-scarmody-ngp-prd() { ssh scarmody@zaue1ppubap02.wkap.int; }

ssh-scarmody-newsagent() { ssh scarmody@zaue1pcchiqap02.wkap.int; }



