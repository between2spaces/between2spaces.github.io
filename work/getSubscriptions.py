import GareAdminWebServices

if __name__ == '__main__':
    [client, accountid] = GareAdminWebServices.init('accountid')
    for r in client.service.getSubscriptions(accountid).awsRightOwner:
        print(r.status, r.authenticationType, r.emailRequired, r.emailPassword, r.usergroupname)
