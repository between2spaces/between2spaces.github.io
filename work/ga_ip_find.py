rows = []
with open('apac_globalatlas_iprange_account.csv') as f:
    for row in f.readlines():
        rows.append(row.strip().split(','))

def convertIP2LongInt(ip):
    ip = ip.split('.')
    return (int(ip[0]) << 24) + (int(ip[1]) << 16) + (int(ip[2]) << 8) + int(ip[3])


ip = convertIP2LongInt('203.218.40.230')

for row in rows:
    rangeMinInt = int(row[4])
    rangeMaxInt = int(row[5])
    #print(rangeMinInt, ip, rangeMaxInt)
    if ip >= rangeMinInt and ip <= rangeMaxInt:
        print(row)
