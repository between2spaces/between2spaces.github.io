import GareAdminWebServices

if __name__ == '__main__':
    [client, username] = GareAdminWebServices.init('username')
    array_useremail = client.factory.create('ArrayOfAWSUserEmailImg')
    array_useremail.email = {'address': username}
    user = {
        'userid': username,
        # Login Id
        'usr_username': username,
        # Login Password
        'password': 'password',
        'firstname': 'firstname',
        'lastname': 'lastname',
        'active': True,
        # System Id of Account
        #'parentGrpID': account_id,
        # STD/TMP
        'type': 'STD',
        # Email address
        'email_info': array_useremail,
        # Legacy mandatory field
        'companyname': 'The Company',
        'nrlogins': '500',
    }
    print( client.service.createUserWithoutGroups( user ) )
