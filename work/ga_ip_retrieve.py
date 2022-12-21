import suds
from suds.client import Client
endpoint = {
	'dev': {
		'url': 'http://apacdev.psdidevenvs.com/gare_admin_ws/GareAdminWebService',
		'userid': 'WebService_User',
		'password': 'WebService_User'
	},
	'test': {
		'url': 'http://test-intelliconnect.wkasiapacific.com/gare_admin_ws/GareAdminWebService',
		'userid': 'adminws_user',
		'password': 't@aptst1'
	},
	'prod': {
		'url': 'http://intelliconnect.wkasiapacific.com/gare_admin_ws/GareAdminWebService',
		'userid': 'adminws_user',
		'password': 'prdap*c502'
	},
}['prod']
client = Client(endpoint['url']+'?wsdl', timeout=1200)
credentials = suds.sax.element.Element('LoginCredentials')
credentials.append(suds.sax.element.Element('userid').setText(endpoint['userid']))
credentials.append(suds.sax.element.Element('password').setText(endpoint['password']))
credentials.append(suds.sax.element.Element('groupid').setText('webservice_group'))
client.set_options(soapheaders=credentials)



def convertIP2LongInt(ip):
	ip = ip.split('.')
	return (int(ip[0]) << 24) + (int(ip[1]) << 16) + (int(ip[2]) << 8) + int(ip[3])


mapMinMaxAccount = {}

startIndex = 1
maxRecords = 1000
totalRecords = startIndex + 1
currentRecord = 0

while startIndex < totalRecords:
	results = client.service.getAllSubscriptions(startIndex, maxRecords)
	paginationInfo = results['paginationInfo']
	totalRecords = paginationInfo.totalRecords
	rwsSubscriptions = results['rwsSubscriptions'][0]
	for rwsSubscription in rwsSubscriptions:
		currentRecord += 1
		accountGuid = rwsSubscription.account_Guid
		for AWSGroupIPFilterImg in rwsSubscription.ipFileterImg:
			rangeMinIP = AWSGroupIPFilterImg.rangemin
			if rangeMinIP is None:
				continue
			rangeMaxIP = AWSGroupIPFilterImg.rangemax
			if rangeMaxIP is None:
				continue
			mapKey = '{},{},{}'.format(rangeMinIP, rangeMaxIP, accountGuid)
			if mapKey in mapMinMaxAccount:
				continue
			mapMinMaxAccount[mapKey] = None
			rangeMinLInt = convertIP2LongInt(rangeMinIP)
			rangeMaxLInt = convertIP2LongInt(rangeMaxIP)
			print('{},{},{},{},{},{},{}'.format(currentRecord, totalRecords, rangeMinIP, rangeMaxIP, rangeMinLInt, rangeMaxLInt, accountGuid))
	startIndex += len(rwsSubscriptions)
