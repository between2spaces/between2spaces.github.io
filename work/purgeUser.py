import sys
import GareAdminWebServices

if __name__ == '__main__':
    [client, userid] = GareAdminWebServices.init('userid')

    try:
        awsUser = client.service.getUsers('user/userid', userid).awsUser[0]
    except Exception:
        print('Userid "{}" not found, other userids with matching usernames are:'.format(userid))
        for awsUser in client.service.getUsers('user/username', userid).awsUser:
            print('userid={}'.format(awsUser.userid), 'username="{}"'.format(awsUser.usr_username))
        sys.exit(1)

    if awsUser.active:
        print( 'deactivateUser: ', client.service.deactivateUser(userid) )
    else:
        print( 'deactivateUser: already deactive' )

    print( 'purgeUser: ', client.service.purgeUser(userid) )

