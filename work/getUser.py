import GareAdminWebServices

if __name__ == '__main__':
    [client, username] = GareAdminWebServices.init('username')
    for u in client.service.getUsers('user/username', username).awsUser:
        print(u)
        #print('userid={} username="{}" firstname="{}" lastname="{}"'.format(u.userid, u.usr_username, u.firstname, u.lastname))
