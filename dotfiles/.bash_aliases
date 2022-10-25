alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias code='code -r'
alias open='code -r'
alias closure='java -jar ~/bin/closure-compiler-v20220601.jar'

if command -v batcat &> /dev/null; then alias bat='batcat'; fi
if command -v vim &> /dev/null; then alias vi='vim'; fi

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


# alias for the full apt update, upgrade, remove, clean cycle
apt-update-remove-clean() { sudo -- sh -c 'apt update; apt upgrade -y; apt dist-upgrade -y; apt autoremove -y; apt autoclean -y'; }

# start tbl project services
tbl() { cd ~/sunladen.github.io && python3 -m http.server &> /dev/null & cd ~/sunladen.github.io/tbl && npm start; } 

