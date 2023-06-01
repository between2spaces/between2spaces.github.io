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

def init(*arguments):
    num_args = len(arguments)
    if len(sys.argv) < 2 + num_args:
        print('usage: python3 {} (dev|tst|prd){}'.format(sys.argv[0], '' if num_args == 0 else ' <{}>'.format('> <'.join(arguments))))
        sys.exit(0)

    env = sys.argv[1]
    endpoint = endpoints[env]

    client = Client(endpoint['url']+'?wsdl', timeout=1200)
    credentials = suds.sax.element.Element('LoginCredentials')
    credentials.append(suds.sax.element.Element('userid').setText(endpoint['userid']))
    credentials.append(suds.sax.element.Element('password').setText(endpoint['password']))
    credentials.append(suds.sax.element.Element('groupid').setText('webservice_group'))
    client.set_options(soapheaders=credentials)

    return (client, *sys.argv[2:])
