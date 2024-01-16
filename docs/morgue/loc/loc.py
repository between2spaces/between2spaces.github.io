import sys
import requests
from lxml import html, etree

debug = False
iconUrl = "/assets/221216_101944/images/bg/icons/sprites/desktop/personals/sprite.svg"

badBreadcrumbs = [
    'Men Looking for', 'Men Seeking', 'M4w',
    'Erotic Photographers', 'Phone & Cam',
    'Transgender', 'Transsexuals', 'T4m',
    'M4m', 'Jobs', 'Crossdresser', 'Shopping',
    'Cross dressers', 'Fan Pages'
]


def crawlAds(baseSearchUrl):
    pagination = 0
    nextPageUrl = baseSearchUrl

    while True:
        if debug:
            print(nextPageUrl)

        page = html.fromstring(requests.get(nextPageUrl).text)

        pagination = pagination + 1
        nextPageUrl = "{}&page={}".format(baseSearchUrl, pagination)
        lastPage = len(page.xpath('//*[@href="{}"]'.format(nextPageUrl))) == 0

        for ad in page.xpath('//div'):
            print(ad)
            good = '✓'
            vip = ad.xpath('.//div[contains(@class, "resultImage--P")]')
            if len(vip) > 0:
                good = '✘'
            m4m = ad.xpath('.//use[@*[local-name()="xlink:href"]="{}#204"]'.format(iconUrl))
            w4mOrm4w = ad.xpath('.//use[@*[local-name()="xlink:href"]="{}#201_202"]'.format(iconUrl))
            w4w = ad.xpath('.//use[@*[local-name()="xlink:href"]="{}#203"]'.format(iconUrl))
            fetishOrTrans = ad.xpath('.//use[@*[local-name()="xlink:href"]="{}#207"]'.format(iconUrl))
            otherServicesOrPhotographyOrJobsOrPhoneCam = ad.xpath('.//use[@*[local-name()="xlink:href"]="{}#209"]'.format(iconUrl))
            if len(m4m) > 0 or len(w4w) > 0:
                good = '✘'
            ad_url = ad.xpath('.//a[@class="bp_ad__link"]/@href')[0]
            if debug:
                print(' ', good, ad_url)
            if good == '✓':
                page = html.fromstring(requests.get(ad_url).text)
                breadcrumb = page.xpath('//div[@class="breadcrumb_item"][last()]/a/text()')[0].strip()
                for badBreadcrumb in badBreadcrumbs:
                    if badBreadcrumb in breadcrumb:
                        good = '✘'
                        break
                if debug:
                    print('  ', good, breadcrumb)
                if good == '✘':
                    continue
                posted = ''.join(page.xpath('//div[@class="posting_info"]//text()')).replace('\n', ' ').strip().replace('Posted ', '')
                location = page.xpath('//span[@itemprop="addressLocality"]/text()')[0].strip()
                phonedata = page.xpath('//a[@data-phone]')
                phonedata = '📞 ' if len(phonedata) > 0 else ''
                print('  {}{},'.format(phonedata, location), '{} [{}]'.format(breadcrumb, posted))
                print('    ', ad_url)

        if lastPage or not ('just now' in posted or 'hours ago' in posted or 'today' in posted):
            return



if __name__ == '__main__':
    dist = sys.argv[1] if len(sys.argv) > 1 else 15
    print("dist={}".format(dist))

    #crawlAds("https://www.locanto.com.au/geo/498622/Personals/P/Ryde-Sydney/?sort=date&dist={}".format(dist))

    print("Fetish Encounters")
    crawlAds("https://www.locanto.com.au/geo/498622/Fetish-Encounters/20709/Ryde-Sydney/?sort=date&dist={}".format(dist))

    print("Women Looking for Men")
    crawlAds("https://www.locanto.com.au/geo/498622/Women-Looking-for-Men/20702/Ryde-Sydney/?sort=date&dist={}".format(dist))

    print("Couples Seeking Men")
    crawlAds("https://www.locanto.com.au/geo/498622/Couples-Seeking-Men/20707/Ryde-Sydney/?sort=date&dist={}".format(dist))

    print("Personels Services")
    crawlAds("https://www.locanto.com.au/geo/498622/Personals-Services/209/Ryde-Sydney/?sort=date&dist={}".format(dist))

