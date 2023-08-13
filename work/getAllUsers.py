import GareAdminWebServices

if __name__ == '__main__':
    [client] = GareAdminWebServices.init()
    rwsUsers = client.service.getAllUsers( 1, 3 )
    totalRecords = rwsUsers.paginationInfo.totalRecords
    for awsUser in rwsUsers.rwsUsers[0]:
        print( awsUser )
        print( client.service.getUserDetails( awsUser.userid ) )

