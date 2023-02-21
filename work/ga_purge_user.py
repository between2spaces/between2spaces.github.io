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
    userid = sys.argv[2]

    endpoint = endpoints[env]
    client = Client(endpoint['url']+'?wsdl', timeout=1200)
    credentials = suds.sax.element.Element('LoginCredentials')
    credentials.append(suds.sax.element.Element('userid').setText(endpoint['userid']))
    credentials.append(suds.sax.element.Element('password').setText(endpoint['password']))
    credentials.append(suds.sax.element.Element('groupid').setText('webservice_group'))
    client.set_options(soapheaders=credentials)

    for awsUser in client.service.getUsers('user/userid', userid).awsUser:
        if awsUser.active:
            print( 'deactivateUser: ', client.service.deactivateUser(userid) )
        else:
            print( 'deactivateUser: already deactive' )

        print( 'purgeUser: ', client.service.purgeUser(userid) )

