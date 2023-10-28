alias python="python3"
alias nvim="nvim"
alias typescript-language-server="npx typescript-language-server"

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



