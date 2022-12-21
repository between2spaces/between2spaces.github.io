import sys
import suds
from suds.client import Client

endpoints = {
	'dev': {
		'url': 'http://apacdev.psdidevenvs.com/gare_admin_ws/GareAdminWebService',
		'userid': 'WebService_User',
		'password': 'WebService_User'
	},
	'tst': {
		'url': 'http://test-intelliconnect.wkasiapacific.com/gare_admin_ws/GareAdminWebService',
		'userid': 'adminws_user',
		'password': 't@aptst1'
	},
	'prd': {
		'url': 'http://intelliconnect.wkasiapacific.com/gare_admin_ws/GareAdminWebService',
		'userid': 'adminws_user',
		'password': 'prdap*c502'
	},
}

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('usage: python3 ga_user_preferences.py (dev|tst|prd) <username>')
        sys.exit(0)

    env = sys.argv[1]
    username = sys.argv[2]

    endpoint = endpoints[env]
    client = Client(endpoint['url']+'?wsdl', timeout=1200)
    credentials = suds.sax.element.Element('LoginCredentials')
    credentials.append(suds.sax.element.Element('userid').setText(endpoint['userid']))
    credentials.append(suds.sax.element.Element('password').setText(endpoint['password']))
    credentials.append(suds.sax.element.Element('groupid').setText('webservice_group'))
    client.set_options(soapheaders=credentials)

    #startIndex = 1
    #maxRecords = 1000
    #totalRecords = startIndex + 1

    #while startIndex < totalRecords:
    #    results = client.service.getAllAccounts(startIndex, maxRecords)
    #    paginationInfo = results['paginationInfo']
    #    totalRecords = paginationInfo.totalRecords
    #    awsAccounts = results['rwsAccounts'][0]
    #    startIndex += len(awsAccounts)
    #    for awsAccount in awsAccounts:
    #        if awsAccount.accountName == 'WOLTERS KLUWER STAFF ACCOUNT':
    #            print(awsAccount)
    #            sys.exit(0)

    awsAccount = client.service.getAccountDetails('TEST')
    print(awsAccount)
    accountUpdate = client.factory.create('AWSAccount')
    accountUpdate.accountStatus = awsAccount.accountStatus
    accountUpdate.accountGuid = awsAccount.accountGuid
    print(accountUpdate)
    #print(client.service.updateAccount(awsAccount))
    sys.exit(0)


    for awsUser in client.service.getUsers('user/username', 'Stephen.Carmody@wolterskluwer.com').awsUser:
        userid = awsUser.userid
        print(awsUser)
        userPreferencesMap = client.service.getUserPreferencesMap(userid)
        print(userPreferencesMap)
