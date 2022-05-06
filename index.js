const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
    // import { got } from 'got'

const Hidemyacc = require('./hidemyacc');
// const { data } = require('cheerio/lib/api/attributes');
const jsdom = require('jsdom');
const { JSDOM } = require('jsdom');
const CronJob = require('cron').CronJob;

const hidemyacc = new Hidemyacc()

const path = require("path");
const fs = require("fs");
const { ifError } = require('assert');



const urlDashBoard = "https://merch.amazon.com/dashboard"
const urlManage = "https://merch.amazon.com/manage/designs"

const urlAnalyzeEarning = "https://merch.amazon.com/analyze/earnings"
const urlAnalyzeProducts = "https://merch.amazon.com/analyze/products"


const profileID = "6189184ca2acb824458a8911"

const MKT_US = ".com"
const MKT_UK = ".co.uk"
const MKT_DE = ".de"
const MKT_FR = ".fr"
const MKT_IT = ".it"
const MKT_ES = ".es"
const MKT_JP = ".co.jp"

const STATUS_DRAFT = "Draft"
const STATUS_TRANSLATING = "Translating"
const STATUS_UNDER_REVIEW = "Under Review"
const STATUS_DECLINED = "Declined"
const STATUS_REJECTED = "Rejected"
const STATUS_PROCESSING = "Processing"
const STATUS_TIMED_OUT = "Timed out"
const STATUS_AUTO_UPLOADED = "Auto-uploaded"
const STATUS_LIVE = "Live"
const STATUS_REMOVED = "Removed"

const STATUS_SELECTOR_UNDER_REVIEW = "REVIEW"
const STATUS_SELECTOR_DECLINED = "DECLINED"
const STATUS_SELECTOR_REJECTED = "AMAZON_REJECTED"
const STATUS_SELECTOR_PROCESSING = "PUBLISHING"

const checkStatusList = [
    STATUS_SELECTOR_UNDER_REVIEW,
    STATUS_SELECTOR_DECLINED,
    STATUS_SELECTOR_REJECTED,
    STATUS_SELECTOR_PROCESSING
]

const months_year = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
]

/**
 * @requires
 * @access only products has publish and has sales
 */

/**
 * UNDER_REVIEW, PROCESSING, REJECTED, LIVE
 */
// console.log("Starting")

/**
 * Tier
 * account-status-v2 > div > div > div > div:nth-child(1) > h4
 * 
 * Account status  Tier + tier
 */

/**
 * h4 id=currency-summary-sold-USD: Purchase USD
 * h4 id=currency-summary-royalties-USD: Royalties USD
 * h4 id=currency-summary-sold-GBP: Purchase GBP
 * ...
 */

/**
 * Alias Name:
 * Today sales: 
 * This month sales: 
 * Date: 
 */

/**
 * Submit Today
 * div[class="card-body"] > div > div:nth-child({1}) > progress-summary > div > div[class="row"] > div[class="progress-summary col-9 text-left"] > span
 */

/**
 * Yesterday
 * This Week
 * This Month
 * Previous Month
 * All Time
 */

// var job = new CronJob('00 05 22 * * 1-5', async function() {

//         console.log("Starting")

//         getAllAccountInfo()
//             /*
//              * Runs every weekday (Monday through Friday)
//              * at 11:30:00 AM. It does not run on Saturday
//              * or Sunday.
//              */
//     }, function() {
//         /* This function is executed when the job stops */
//         console.log("OK")
//     },
//     true, /* Start the job right now */
//     'Asia/Ho_Chi_Minh' /* Time zone of this job. */
// );

// job.start();

getAllAccountInfo()

async function getAllAccountInfo() {
    let response = null;

    let index = -1
    response = await hidemyacc.profiles()

    if (response != null && response.code == 1) {

        const profiles = response.data

        while (true) {
            index += 1
            await getDashBoardInfo(profiles[index].id)
            console.log(profiles[index].id)
        }

        // const timeInterval = setInterval(async() => {
        //     index += 1
        //     console.log(profiles[index].id)
        //     if (index == profiles.length) {
        //         clearInterval(timeInterval)
        //         return
        //     }
        //     await getDashBoardInfo(profiles[index].id)
        // }, 3000)
    }
}

// getDashBoardInfo()

async function getDashBoardInfo(id) {

    hidemyacc.createFolder()

    const timeNow = new Date().toLocaleString("en-US", { timeZone: "Pacific/Chatham" });
    const date_nz = new Date(timeNow);

    const month = date_nz.getMonth() + 1
    const today = date_nz.getDate()

    let yesterday = new Date();
    yesterday.setDate(date_nz.getDate() - 1)

    const hour = date_nz.getHours()
    const minute = date_nz.getMinutes()
    const second = date_nz.getSeconds()

    const thisWeek = ""
    const thisMonth = ""
    const allTime = ""

    let curYear = date_nz.getFullYear()
    let dateFirstPublish = ""
    let monthFirstPublish = ""
    let yearFirstPublish = ""

    console.log("Time now " + curYear)

    let resData = {}

    const responseStatus = await hidemyacc.status();

    let isRunning = false;
    let wsUrlProfile = "";

    if (responseStatus.code == 1) {
        const data = responseStatus.data
        for (const item of data) {
            if (item.id == id) {
                if (item.wsUrl != "") {
                    wsUrlProfile = item.wsUrl
                } else {
                    isRunning = false
                }
            }
        }
    }

    // If not running
    if (isRunning == false || wsUrlProfile != "") {
        let response = null

        if (wsUrlProfile == "") {
            try {
                // console.log("Axios")
                // response = await axios.post(`${baseUrl}/profiles/start/${profileID}`, { timeout: 16 })
                // .then(res => {     console.log(JSON.stringify(res) );  })
                // .catch(error => {     console.log("TimeoutCC")  });
                response = await hidemyacc.start(profileID);

                const data = response.data

                wsUrlProfile = data.wsUrl
            } catch (e) {
                await hidemyacc.stop(id)
                return;
            }
        }

        let browser = null

        try {
            browser = await puppeteer.connect({
                browserWSEndpoint: wsUrlProfile,
                ignoreHTTPSErrors: true,
                args: ["--start-maximized"],
                slowMo: 90,
            });
        } catch (e) {
            console.log("Page Error Browser")
            return;
        }

        let page = null

        try {
            page = await browser.newPage();

            await page._client.send("Emulation.clearDeviceMetricsOverride");
        } catch (e) {
            console.log("Page Error")
            return;
        }

        let dom = null

        /**
         * Manage Page
         */
        let responseManage = await page.goto(urlManage, { waitUntil: 'load', timeout: 0 });

        await sleep(3000)
        await page.setDefaultNavigationTimeout(60000);

        if (await page.$('a[class="link logout-link"]') === null) {
            await hidemyacc.stop(id)
            return
        }

        // Number of pages
        let isExistProductItems = true

        // Wait Page Loaded - Find First Item
        while (true) {
            await sleep(1000)
            const detectLoadedEle = await page.$('table.table > tr')
            if (detectLoadedEle != null) {
                break
            }

            const detectWarning = await page.$('span[class="warning-text"]')
            if (detectWarning != null) {
                isExistProductItems = falses
                break
            }

            // count += 1

            // if (count == 30) {
            //     return
            // }
        }

        await sleep(1000)

        let allProducts = []

        let allSaleProducts = []

        // Check has any Products
        if (isExistProductItems) {

            let textManageHTML = await page.content()

            dom = new JSDOM(textManageHTML).window.document

            const productAll = dom.querySelector('[class="float-right mb-small mt-small"] > b').textContent
                // console.log("Product All " + productAll)

            const productAllSplit = productAll.split(" ")
                // console.log("Product All Split " + productAllSplit[4])

            let maxItems = 100

            // Default 100 => Click 250 Items
            if (productAllSplit[4] > 100) {
                maxItems = 250
                await page.click('button[class="btn btn-outline-secondary dropdown-toggle"]')
                await page.click('div[class="dropdown-menu show"] > button:nth-child(5)')
            }

            let countPage = Math.floor(parseInt(productAllSplit[4] - 1) / maxItems) + 1

            // console.log("Count Page " + countPage)

            // Get All
            for (let i = 0; i < countPage; i++) {

                const isExistProduct = true

                while (true) {
                    await sleep(1000)
                    const detectLoadedEle = await page.$('table.table > tr')
                    if (detectLoadedEle != null) {
                        break
                    }
                }

                const productItems = dom.querySelector('table')
                const productItemsList = productItems.querySelectorAll('tr')

                let productsList = []
                    // console.log(`Product Length ${productItemsList.length}`)

                /**
                 * img: String - Unique ID
                 * title: String
                 * mkt: String
                 * type: String,
                 * status: []
                 * createAt: String
                 * price: String
                 * asin: String
                 * 
                 * */
                for (let i = 0; i < productItemsList.length; i++) {
                    const item = productItemsList[i]

                    const trEle = `table[class="table"] > tr:nth-child(${i+2})`

                    const mktEle = 'td:nth-child(1)'

                    const imgEle = 'td:nth-child(2) > img'
                    const titleEle = 'td:nth-child(2) > span > .product-title'
                    const brandEle = 'td:nth-child(3)'
                    const typeEle = 'td:nth-child(4)'
                    const createdAtEle = 'td:nth-child(5) > div'
                    const priceAtEle = 'td:nth-child(6)'
                    const statusEle = 'td:nth-child(7) > div'

                    let isSaleProduct = false

                    if (i != 0) {
                        const mkt = item.querySelector(mktEle).textContent
                        const img = item.querySelector(imgEle).getAttribute('src')
                        const title = item.querySelector(titleEle).textContent
                        const type = item.querySelector(typeEle).textContent
                        const brand = item.querySelector(brandEle).textContent
                        const createdAt = item.querySelector(createdAtEle).textContent
                        const price = item.querySelector(priceAtEle).textContent
                        const status = item.querySelector(statusEle).textContent
                        let asin = ""
                            // const brand = item.querySelector(mktEle).textContent

                        // console.log(`img ${JSON.stringify(img)}`)

                        if (status == STATUS_LIVE) {
                            asin = item.querySelector(titleEle).getAttribute('href')

                            // console.log("Asin " + asin)
                        }

                        const product = {
                            img: img,
                            mkt: mkt,
                            title: title,
                            brand: brand,
                            type: type,
                            createdAt: createdAt,
                            price: price,
                            status: status,
                            asin: asin
                        }

                        if (status == STATUS_LIVE) {
                            allProducts.push(product)
                        }
                    }
                }

                if (i != countPage - 1) {
                    // Next Page
                    await page.click('button[class="sci-icon sci-chevron-right paging plain-transparent-btn bg-transparent border-0 p-0"]')
                }
            }

            // console.log("Date First " + allProducts[allProducts.length - 1].createdAt)

            // for (let i = 0; i < productItemsList.length; i++) {

            // }

            const mktList = [
                "US",
                "GB",
                "DE",
                "FR",
                "IT",
                "ES",
                "JP"
            ]

            const warningText = 'class="warning-text"'

            // Click to Skip All
            // await page.click('button[id="MarketplaceDropdown"]')
            // await page.click(`flowcheckbox[class="mr-2 checkbox-all"]`)

            // let itemMktList = []

            // // Market
            // // await page.click('class="btn btn-secondary dropdown-toggle"')
            // // Filter Product
            // for (let i = 0; i < mktList.length; i++) {

            //     const mkt = mktList[i]

            //     // await page.click('button[id="MarketplaceDropdown"]')
            //     if (i != 0) {
            //         const beforeMkt = mktList[i - 1]
            //         await page.click(`flowcheckbox[class="mr-2 checkbox-${beforeMkt}"]`)
            //     }

            //     await page.click(`flowcheckbox[class="mr-2 checkbox-${mkt}"]`)

            //     let isExistItem = true

            //     // Wait to load Page    
            //     while (true) {
            //         await sleep(1000)
            //         const detectLoadedEle = await page.$('table.table > tr')
            //         if (detectLoadedEle != null) {
            //             break
            //         }

            //         const detectWarning = await page.$('span[class="warning-text"]')
            //         if (detectWarning != null) {
            //             isExistItem = falses
            //             break
            //         }
            //     }

            //     if (!isExistItem) {
            //         continue;
            //     }

            //     let textManageHTML = await page.content()

            //     dom = new JSDOM(textManageHTML).window.document

            //     const productItems = dom.querySelector('table')
            //     const productItemsList = productItems.querySelectorAll('tr')

            //     // console.log(`Product Length ${productItemsList.length}`)
            // }

            // Click to Skip All
            await page.click('button[id="StatusDropdown"]')
            const eleStatusAll = 'filter-type[id="status-filter"] > div > div > div:nth-child(1) > flowcheckbox'

            await page.click(eleStatusAll)

            for (let i = 0; i < checkStatusList.length; i++) {

                const statusSelector = checkStatusList[i]

                // await page.click('button[id="MarketplaceDropdown"]')
                if (i != 0) {
                    const beforeStatus = checkStatusList[i - 1]
                    await page.click(`flowcheckbox[class="mr-2 checkbox-${beforeStatus}"]`)
                }

                await page.click(`flowcheckbox[class="mr-2 checkbox-${statusSelector}"]`)

                let isExistItem = true

                // Wait to load Page    
                while (true) {
                    await sleep(1000)
                    const detectLoadedEle = await page.$('table.table > tr')
                    if (detectLoadedEle != null) {
                        break
                    }

                    const detectWarning = await page.$('span[class="warning-text"]')
                    if (detectWarning != null) {
                        isExistItem = false
                        break
                    }
                }

                if (!isExistItem) {
                    continue;
                }

                let textManageHTML = await page.content()

                dom = new JSDOM(textManageHTML).window.document

                const productItems = dom.querySelector('table')
                const productItemsList = productItems.querySelectorAll('tr')

                // console.log(`Product Length ${productItemsList.length}`)
            }

            resData["manage"] = {
                products: allProducts
            }
        }


        /**
         * Analyze Page - Products
         */
        let responseText = await page.goto(urlAnalyzeProducts, { waitUntil: 'load', timeout: 0 });
        await page.setDefaultNavigationTimeout(60000);

        // let htmlPage = await responseText.text()
        // console.log(htmlPage)

        let count = 0
        while (true) {
            await sleep(1000)
            const detectLoadedEle = await page.$('h4[id="currency-summary-royalties-USD"]')
            if (detectLoadedEle != null) {
                break
            }
            count += 1

            if (count == 30) {
                return
            }
        }

        const textAnalyzeHTML = await page.content()

        dom = new JSDOM(textAnalyzeHTML).window.document

        let priceProducts = []

        const nationSales = [
            "USD",
            "GBP",
            "EUR",
            "JPY"
        ]

        let firstProduct = ""

        if (allProducts.length != 0) {
            for (let i = allProducts.length - 1; i >= 0; i--) {
                if (allProducts[i].status == STATUS_LIVE) {

                    firstLiveProduct = allProducts[i].createdAt

                    const splitProduct = firstLiveProduct.split('/')
                    const month = splitProduct[0]
                    const date = splitProduct[1]
                    const year = splitProduct[2]

                    dateFirstPublish = date
                    monthFirstPublish = month
                    yearFirstPublish = "20" + year

                    break
                }
            }
        }

        if (yearFirstPublish == "") {
            yearFirstPublish = curYear.toString()
        }

        for (const nation of nationSales) {
            const soldValue = dom.querySelector(`#currency-summary-sold-${nation}`).textContent.trim()
            const royaltiesValue = dom.querySelector(`#currency-summary-royalties-${nation}`).textContent.trimEnd()

            priceProducts.push({
                nation: nation,
                sold: soldValue,
                royalties: royaltiesValue
            })

            // console.log(`${nation}`)
            // console.log(`   Sold Value: ${soldValue}`)
            // console.log(`   Royalties Element: ${royaltiesValue}`)
        }

        const infoSales = [
            "Month",
            "Week",
            "Today",
            "All"
        ]

        /**
         * Month div class="ngb-dp-day" tabindex="0"
         * 
         */

        const dateFromEle = 'div[class="col-6 d-flex align-items-center justify-content-end pl-large"] > datepicker:nth-child(2) > div > div > span'
        const dateToEle = `div[class="col-6 d-flex align-items-center justify-content-end pl-large"] > datepicker:nth-child(4) > div > div > span`
        const btnPreviousMonth = 'button[aria-label="Previous month"]'
        const btnNextMonth = 'button[aria-label="Next month"]'
        const btnGo = 'button[class="btn btn-secondary h-100 font-weight-bold ml-base"]'
        const yesterdayEle = 'div[class="btn-light bg-primary text-white"]'
        let yesterdaySelector = "1"

        let processYear = curYear
        let processMonth = 1
        let processDay = 1

        let isFirst = true

        /**
         * Loop Each Months to get Sale 
         * @implements if fisrt => get Date current, Month current, Year current
         */

        let listMonthProducts = []

        let detectPrevious = false

        do {
            /**
             * Click Date Picker To
             */
            await page.click(dateToEle)

            if (isFirst) {

                await sleep(1000)

                const textHTML = await page.content()

                dom = new JSDOM(textHTML).window.document

                /**
                 * Get Yesterday - Date To
                 */
                yesterdaySelector = dom.querySelector(yesterdayEle).textContent

                console.log("Yesterday " + yesterdaySelector)

                const monthToElement = dom.querySelector('ngb-datepicker-navigation > div[class="ngb-dp-month-name"]')
                const monthTo = monthToElement.textContent

                const monthTextEle = monthTo.match(/\S+/g)

                processMonth = monthTextEle[0]
                processYear = monthTextEle[1]
                processDay = parseInt(yesterdaySelector)

                // Click Date Picker From
                await page.click(dateFromEle)

                await sleep(1000)

                // Reload HTML INPUT
                const textDateFrom = await page.content()

                dom = new JSDOM(textDateFrom).window.document

                const monthFromElement = dom.querySelector('ngb-datepicker-navigation > div[class="ngb-dp-month-name"]')
                const monthFrom = monthFromElement.textContent

                const monthFromText = monthFrom.match(/\S+/g)[0]
                const yearFromText = monthFrom.match(/\S+/g)[1]

                const eleYesterdaySelector = `//div[text()="${processDay}"]`

                // Get Today
                // const eleTodaySelector = `//div[text()="${processDay}"]`

                // Get Yesterday

                // This Week Sold

                /**
                 * Different Month => Click the nearest date with yesterday
                 */
                if (processMonth != monthFromText) {
                    // Next Month
                    await page.click(btnNextMonth)

                    await page.waitForXPath(eleYesterdaySelector);
                    const [button] = await page.$x(eleYesterdaySelector);

                    if (button != null) {
                        await button.click()
                    } else {
                        console.log("processMonth " + eleYesterdaySelector)
                    }

                    await page.click(btnGo)

                    let isExistProductMonth = false

                    while (true) {

                        await sleep(1000)

                        const tvWarning = await page.$('span[class="sci-icon sci-warning pr-small"]')
                        if (tvWarning != null) {
                            break
                        }

                        const detectItems = await page.$('tbody > tr[id="record-0"]')
                        if (detectItems != null) {
                            isExistProductMonth = true
                            break
                        }
                    }

                    await sleep(1000)

                    const textHTML = await page.content()
                    dom = new JSDOM(textHTML).window.document

                    let todaySold = 0

                    // Get Today
                    for (const nation of nationSales) {
                        const soldValue = dom.querySelector(`#currency-summary-sold-${nation}`).textContent.trim()
                        const royaltiesValue = dom.querySelector(`#currency-summary-royalties-${nation}`).textContent.trim()

                        todaySold += parseInt(soldValue)
                            // earningNationals.push({
                            //     nation: nation,
                            //     sold: soldValue,
                            //     royalties: royaltiesValue
                            // })
                    }

                    /**
                     * @param todaySold
                     */
                    resData["todaySold"] = todaySold

                    let dateYesterday = "31"

                    /**
                     * Click Date Picker From
                     */
                    await page.click(dateFromEle)

                    // Get Yesterday
                    /**
                     * Status: Date Picker From
                     * Yesterday is was the last day of last month
                     */
                    if (processDay == 1) {
                        // Go to Previous Month
                        await page.click(btnPreviousMonth)

                        // Find Button Enable to Click
                        for (var i = 31; i >= 1; i--) {
                            const eleYesterdaySelector = `//div[text()="${i}"]`
                            const [button] = await page.$x(eleYesterdaySelector);
                            if (button.length != 0) {
                                await page.waitForXPath(eleYesterdaySelector);
                            } else {
                                continue
                            }

                            if (button != null) {
                                dateYesterday = i.toString()
                                await button.click()
                                break
                            }
                        }

                        // Click Date Picker To
                        await page.click(dateToEle)

                        // Previous Month
                        await page.click(btnPreviousMonth)

                        const eleYesterdaySelector = `//div[text()="${dateYesterday}"]`
                        await page.waitForXPath(eleYesterdaySelector);
                        const [button] = await page.$x(eleYesterdaySelector);

                        if (button != null) {
                            await button.click()
                        }

                        // Reload
                        await page.click(btnGo)

                        let isExistProductMonth = false

                        while (true) {

                            await sleep(1000)

                            const tvWarning = await page.$('span[class="sci-icon sci-warning pr-small"]')
                            if (tvWarning != null) {
                                break
                            }

                            const detectItems = await page.$('tbody > tr[id="record-0"]')
                            if (detectItems != null) {
                                isExistProductMonth = true
                                break
                            }
                        }

                        let yesterdaySold = 0

                        /**
                         * Reload Dom
                         */
                        const textHTML = await page.content()
                        dom = new JSDOM(textHTML).window.document

                        // Get Yesterday
                        for (const nation of nationSales) {
                            const soldValue = dom.querySelector(`#currency-summary-sold-${nation}`).textContent.trim()
                            const royaltiesValue = dom.querySelector(`#currency-summary-royalties-${nation}`).textContent.trim()

                            yesterdaySold += parseInt(soldValue)
                        }

                        /**
                         * @param yesterdaySold
                         */
                        resData["yesterdaySold"] = yesterdaySold

                        // Click Date Picker To
                        await page.click(dateToEle)

                        // Click Next Month
                        await page.click(btnNextMonth)

                        const eleTodaySelector = `//div[text()="${processDay}"]`

                        await page.waitForXPath(eleTodaySelector);
                        const [buttonTodayNext] = await page.$x(eleTodaySelector);

                        if (buttonTodayNext != null) {
                            await buttonTodayNext.click()
                        } else {
                            console.log("processMonth " + eleTodaySelector)
                        }

                    } else {
                        /**
                         * Process day different 1
                         * Status: Date Picker From
                         */

                        let yesterdaySold = 0
                        dateYesterday = processDay - 1

                        // // Click Next Month
                        // await page.click(btnNextMonth)

                        const eleYesterdaySelector = `//div[text()="${dateYesterday}"]`
                        await page.waitForXPath(eleYesterdaySelector);
                        const [buttonYesterday] = await page.$x(eleYesterdaySelector);
                        await buttonYesterday.click()

                        // Click Date Picker To
                        await page.click(dateToEle)
                        const eleYesterdayNextSelector = `//div[text()="${dateYesterday}"]`
                        await page.waitForXPath(eleYesterdayNextSelector);
                        const [buttonNextYesterday] = await page.$x(eleYesterdayNextSelector);
                        await buttonNextYesterday.click()

                        await page.click(btnGo)

                        let isExistProductMonth = false

                        while (true) {

                            await sleep(1000)

                            const tvWarning = await page.$('span[class="sci-icon sci-warning pr-small"]')
                            if (tvWarning != null) {
                                break
                            }

                            const detectItems = await page.$('tbody > tr[id="record-0"]')
                            if (detectItems != null) {
                                isExistProductMonth = true
                                break
                            }
                        }

                        await sleep(1000)

                        /**
                         * Reload Dom
                         */
                        const textHTML = await page.content()
                        dom = new JSDOM(textHTML).window.document

                        // Get Yesterday
                        for (const nation of nationSales) {
                            const soldValue = dom.querySelector(`#currency-summary-sold-${nation}`).textContent.trim()

                            // const royaltiesValue = dom.querySelector(`#currency-summary-royalties-${nation}`).textContent.trim()
                            yesterdaySold += parseInt(soldValue)
                        }

                        /**
                         * @param yesterdaySold
                         */
                        resData["yesterdaySold"] = yesterdaySold

                        // Click Date Picker From
                        await page.click(dateFromEle)

                        // Click Next Month
                        await page.click(btnPreviousMonth)

                        const elePreviousSelector = `//div[text()="1"]`

                        await page.waitForXPath(elePreviousSelector);
                        const [buttonPrevious] = await page.$x(elePreviousSelector);

                        if (buttonPrevious != null) {
                            await buttonPrevious.click()
                        } else {
                            // console.log("processMonth " + eleTodaySelector)
                        }
                    }

                } else {
                    /**
                     * Process Month equal Month From
                     * Status: Date Picker From
                     */

                    /**
                     * Developping
                     */

                    // Get Today
                    await page.waitForXPath(eleYesterdaySelector);
                    const [buttonToday] = await page.$x(eleYesterdaySelector);

                    if (buttonToday != null) {
                        await buttonToday.click()
                    } else {
                        console.log("processMonth " + eleYesterdaySelector)
                    }

                    await page.click(btnGo)

                    let isExistProductMonth = false

                    while (true) {

                        await sleep(1000)

                        const tvWarning = await page.$('span[class="sci-icon sci-warning pr-small"]')
                        if (tvWarning != null) {
                            break
                        }

                        const detectItems = await page.$('tbody > tr[id="record-0"]')
                        if (detectItems != null) {
                            isExistProductMonth = true
                            break
                        }
                    }

                    // Get Yesterday

                    /**
                     * Reload Dom
                     */
                    const textHTML = await page.content()
                    dom = new JSDOM(textHTML).window.document

                    let todaySold = 0

                    // Get Yesterday
                    for (const nation of nationSales) {
                        const soldValue = dom.querySelector(`#currency-summary-sold-${nation}`).textContent.trim()
                        const royaltiesValue = dom.querySelector(`#currency-summary-royalties-${nation}`).textContent.trim()

                        todaySold += parseInt(soldValue)
                    }

                    /**
                     * @param todaySold
                     */
                    resData["todaySold"] = todaySold

                    // Get Yesterday
                    let dateYesterday = processDay - 1

                    const eleYesterday = `//div[text()="${dateYesterday}"]`

                    // Click Date Picker From
                    await page.click(dateFromEle)

                    await page.waitForXPath(eleYesterday);
                    const [buttonFromYesterday] = await page.$x(eleYesterday);
                    await buttonFromYesterday.click()

                    // Click Date Picker To
                    await page.click(dateToEle)

                    await page.waitForXPath(eleYesterday);
                    const [buttonNextYesterday] = await page.$x(eleYesterday);
                    await buttonNextYesterday.click()

                    await page.click(btnGo)

                    while (true) {

                        await sleep(1000)

                        const tvWarning = await page.$('span[class="sci-icon sci-warning pr-small"]')
                        if (tvWarning != null) {
                            break
                        }

                        const detectItems = await page.$('tbody > tr[id="record-0"]')
                        if (detectItems != null) {
                            isExistProductMonth = true
                            break
                        }
                    }


                    let yesterdaySold = 0

                    for (const nation of nationSales) {
                        const soldValue = dom.querySelector(`#currency-summary-sold-${nation}`).textContent.trim()
                        const royaltiesValue = dom.querySelector(`#currency-summary-royalties-${nation}`).textContent.trim()

                        yesterdaySold += parseInt(soldValue)
                    }

                    /**
                     * @param yesterdaySold
                     */
                    resData["yesterdaySold"] = yesterdaySold

                    /**
                     * * Developping
                     */

                    // Previous Month
                    // Click Date Picker From
                    await page.click(dateFromEle)

                    // Click Previous Month
                    await page.click(btnPreviousMonth)

                    /**
                     * Wait For XPath Selector
                     */
                    await page.waitForXPath(eleYesterdaySelector);
                    const [button] = await page.$x(eleYesterdaySelector);
                    if (button != null) {
                        await button.click()
                    } else {

                        // If processDay not exist in previous month 
                        const yesterdayNum = processDay
                        for (let i = yesterdayNum - 1; i >= 1; i++) {
                            await page.waitForXPath(eleYesterdaySelector);
                            const eleDetect = await page.$x(`//div[text()="${i}"]`);
                            if (eleDetect != null) {
                                await eleDetect.click()
                                processDay = i
                                break
                            }
                        }
                    }
                }

                // Update isFirst
                isFirst = false
            } else {

                await sleep(1000)

                /** 
                 * Click Previous Month
                 */
                if (detectPrevious) {
                    await page.click(btnPreviousMonth)
                }

                const textHTML = await page.content()

                dom = new JSDOM(textHTML).window.document

                /**
                 * Update Month, Year
                 */
                const monthToElement = dom.querySelector('ngb-datepicker-navigation > div[class="ngb-dp-month-name"]')
                const monthTo = monthToElement.textContent
                const monthTextEle = monthTo.match(/\S+/g)
                processMonth = monthTextEle[0]
                processYear = monthTextEle[1]

                console.log("Month " + processMonth + " Year " + processYear)

                /**
                 * Click Date in Date Picker To
                 */
                let eleYesterdaySelector = `//div[text()="${processDay}"]`
                await page.waitForXPath(eleYesterdaySelector);
                const [eleDetect] = await page.$x(eleYesterdaySelector);

                if (eleDetect != null) {
                    await eleDetect.click()
                } else {
                    /**
                     * Click Date in DatePicker - To
                     */

                    for (let i = processDay - 1; i >= 1; i++) {
                        eleYesterdaySelector = `//div[text()="${i}"]`
                        await page.waitForXPath(eleYesterdaySelector);
                        const eleDetect = await page.$x(eleYesterdaySelector);
                        console.log("Index" + i)
                        if (eleDetect != null) {
                            await eleDetect.click()
                            processDay = i
                            break
                        }
                    }
                }

                // Click Date Picker From
                await page.click(dateFromEle)

                /**
                 * Click Previous Month
                 */
                if (detectPrevious) {
                    await page.click(btnPreviousMonth)
                }

                // await page.waitForXPath(eleYesterdaySelector);
                const [button] = await page.$x(eleYesterdaySelector);

                if (button != null) {
                    await button.click()
                } else {
                    for (let i = processDay - 1; i >= 1; i++) {
                        eleYesterdaySelector = `//div[text()="${i}"]`
                        const [eleDetect] = await page.$x(eleYesterdaySelector);
                        if (eleDetect.length != 0) {
                            await page.waitForXPath(eleYesterdaySelector);
                            await eleDetect.click()
                            processDay = i
                            break
                        }
                    }
                }

                processMonth -= 1

                detectPrevious = true
            }


            // Get date yesterday 

            // Get To     

            // Get To 
            // const datePickerToEle = dom.querySelector('input[aria-labelledby="datepicker-to"]')
            // const dateYesterday = datePickerToEle.value
            // console.log("Yesterday " + dateYesterday)

            // Get This Month

            /**
             * Get Data 
             */

            if (yesterdaySelector != null) {
                const dateYesterday = await page.evaluate(el => el.textContent, yesterdaySelector)

                await page.click(btnGo)

                let isExistProductMonth = false

                while (true) {

                    await sleep(1000)

                    const tvWarning = await page.$('span[class="sci-icon sci-warning pr-small"]')
                    if (tvWarning != null) {
                        break
                    }

                    const detectItems = await page.$('tbody > tr[id="record-0"]')
                    if (detectItems != null) {
                        isExistProductMonth = true
                        break
                    }
                }

                await sleep(1000)

                if (isExistProductMonth) {
                    let textAnalyzeMonth = await page.content()

                    dom = new JSDOM(textAnalyzeMonth).window.document

                    const productItems = dom.querySelector('tbody')
                    const productItemsList = productItems.querySelectorAll('tr')

                    const mktEle = 'td:nth-child(1)'
                    const titleEle = 'td:nth-child(2) > a'
                    const typeEle = 'td:nth-child(3)'
                    const purchasedEle = 'td:nth-child(4)'
                    const cancelledEle = 'td:nth-child(5)'
                    const returnedEle = 'td:nth-child(6)'
                    const revenueEle = 'td:nth-child(7)'
                    const royaltiesEle = 'td:nth-child(8)'

                    const variationItem = 'variation'

                    const dateTime = dom.querySelector('div[class="flow-typography-small-secondary"] > span:nth-child(2)').textContent

                    let listMonth = {
                        time: dateTime,
                        products: []
                    }

                    for (const item of productItemsList) {

                        if (item.id.includes(variationItem)) {
                            continue
                        }

                        console.log("Item Id " + item.id)

                        //Mkt
                        const mkt = item.querySelector(mktEle).textContent

                        // Title
                        const title = item.querySelector(titleEle).textContent

                        // Product Type
                        const type = item.querySelector(typeEle).textContent

                        // Purchased
                        const purchased = parseInt(item.querySelector(purchasedEle).textContent)

                        // Cancelled
                        const cancelled = parseInt(item.querySelector(cancelledEle).textContent)

                        // Returned
                        const returned = parseInt(item.querySelector(returnedEle).textContent)

                        // Revenue
                        const revenueText = item.querySelector(revenueEle).textContent
                        let revenue = parseFloat(revenueText.match(/\S+/g)[1])
                        if (revenueText.startsWith('-')) {
                            revenue *= -1
                        }

                        // Royalties
                        const royaltiesText = item.querySelector(royaltiesEle).textContent
                        let royalties = parseFloat(royaltiesText.match(/\S+/g)[1])
                        if (royaltiesText.startsWith('-')) {
                            royalties *= -1
                        }

                        // Asin 
                        const asin = item.querySelector(titleEle).getAttribute('href')

                        listMonth.products.push({
                            mkt: mkt,
                            title: title,
                            type: type,
                            purchased: purchased,
                            cancelled: cancelled,
                            returned: returned,
                            revenue: revenue,
                            royalties: royalties,
                            asin: asin
                        })
                    }

                    if (listMonth.products.length != 0) {
                        listMonthProducts.push(listMonth)
                    }
                }
            }
        }
        while (parseInt(processYear) > parseInt(yearFirstPublish) ||
            (parseInt(processYear) == parseInt(yearFirstPublish) &&
                parseInt(monthFirstPublish) - 1 <= getNumberOfMonth(processMonth)))

        console.log("List Month Products " + listMonthProducts.length)
        resData["analyze"] = {
            products: listMonthProducts
        }

        // const productItems = dom.querySelectorAll('.GridHeader')
        // console.log(productItems.length)

        /**
         * Earning Page
         */
        let responseEarningPage = await page.goto(urlAnalyzeEarning, { waitUntil: 'load', timeout: 0 });
        await page.setDefaultNavigationTimeout(60000);

        // Wait Page Loaded - Find First Item
        while (true) {
            await sleep(1000)
            const detectLoadedEle = await page.$('tbody > tr[id="record-0"] > td[id="record-0-gross"]')
            if (detectLoadedEle != null) {
                break
            }
            count += 1

            if (count == 30) {
                return
            }
        }

        await sleep(2000)

        let textEarningHTML = await page.content()

        dom = new JSDOM(textEarningHTML).window.document

        // console.log("Earning")

        let earningNationals = []

        for (const nation of nationSales) {
            const soldValue = dom.querySelector(`#currency-summary-sold-${nation}`).textContent.trim()
            const royaltiesValue = dom.querySelector(`#currency-summary-royalties-${nation}`).textContent.trim()

            earningNationals.push({
                nation: nation,
                sold: soldValue,
                royalties: royaltiesValue
            })
        }

        let earningLists = []

        let isFirstLoadSales = true

        console.log("Year First Publish " + yearFirstPublish)

        for (let i = 0; i <= curYear - yearFirstPublish; i++) {

            if (!isFirstLoadSales) {
                const btnYearDropDownSelector = `button[id="yearDropdown"]`
                await page.click(btnYearDropDownSelector)

                const btnYearDropDownItemSelector = `div[class="dropdown-menu show"] > label:nth-child(${i+1})`
                await page.click(btnYearDropDownItemSelector)

                while (true) {
                    await sleep(1000)
                    const detectLoadedEle = await page.$('tbody > tr[id="record-0"] > td[id="record-0-gross"]')
                    if (detectLoadedEle != null) {
                        break
                    }
                    count += 1

                    if (count == 30) {
                        return
                    }
                }
            }

            let textEarningHTML = await page.content()

            dom = new JSDOM(textEarningHTML).window.document

            // All Item Month
            const monthItems = dom.querySelector('tbody')
            const monthItemsList = monthItems.querySelectorAll('tr')

            let tmpListSales = []

            for (let j = 0; j < monthItemsList.length; j++) {

                const item = monthItemsList[j]
                const monthElement = item.querySelector(`#record-${j}-month`).textContent.trim()
                const grossEarningElement = item.querySelector(`#record-${j}-gross`).textContent.trim()
                const adjustmentElement = item.querySelector(`#record-${j}-adjustments`).textContent.trim()
                const earningBeforeTaxElement = item.querySelector(`#record-${j}-net`).textContent.trim()

                tmpListSales.push({
                    month: monthElement,
                    gross: grossEarningElement,
                    adjust: adjustmentElement,
                    earningBeforeTax: earningBeforeTaxElement
                })
            }

            earningLists.push({
                year: curYear - i,
                sales: tmpListSales
            })

            isFirstLoadSales = false
        }

        resData["earning"] = {
            national: earningNationals,
            products: earningLists
        }

        /**
         * Dashboard Page
         */
        let responseDashBoard = await page.goto(urlDashBoard, { waitUntil: 'load', timeout: 0 });
        await page.setDefaultNavigationTimeout(60000);

        // Wait Page Loaded - Find First Item
        while (true) {
            await sleep(1000)
            const detectLoadedEle = await page.$('div[class="progress-summary col-9 text-left"] > span')
            if (detectLoadedEle != null) {
                break
            }
            // count += 1

            // if (count == 30) {
            //     return
            // }
        }

        await sleep(1000)

        let textDashBoardHTML = await page.content()

        dom = new JSDOM(textDashBoardHTML).window.document

        // Tier

        const tierEle = dom.querySelector('.card-header > h4').textContent.trim()

        const tierTextList = tierEle.match(/\S+/g)
        resData["tier"] = tierTextList[tierTextList.length - 1]

        //    'div["class="row pb-large account-status-container"]'
        // Submitted Today
        const submitTodaySelector = dom.querySelector('.card > .card-body > .row > div:nth-child(1)')
        const uploadedToday = submitTodaySelector.querySelector('div[class="progress-summary col-9 text-left"] > span').textContent.trim()
        const percentUploadedToday = submitTodaySelector.querySelector('div[class="col-3 text-right flow-typography-body-text-secondary"] > span').textContent.trim()

        // Published Designs
        const publishSelector = dom.querySelector('.card > .card-body > .row > div:nth-child(2)')
        const publishDesignedEle = publishSelector.querySelector('div[class="progress-summary col-9 text-left"] > span').textContent.trim()
        const percentPublishDesignedEle = publishSelector.querySelector('div[class="col-3 text-right flow-typography-body-text-secondary"] > span').textContent.trim()

        // Slot
        resData["slot"] = publishDesignedEle.match(/\S+/g)[0] + "/" + publishDesignedEle.match(/\S+/g)[2]

        // Product Potential
        const poentialSelector = dom.querySelector('.card > .card-body > .row > div:nth-child(3)')
        const poentialEle = poentialSelector.querySelector('div[class="progress-summary col-9 text-left"] > span').textContent.trim()
        const percentPotential = poentialSelector.querySelector('div[class="col-3 text-right flow-typography-body-text-secondary"] > span').textContent.trim()

        const statusDashboard = {
            tier: tierEle,
            submit: {
                submit: uploadedToday,
                percentSubmit: percentUploadedToday
            },
            publish: {
                publish: publishDesignedEle,
                percentPublish: percentPublishDesignedEle
            },
            potential: {
                potential: poentialEle,
                percentPotential: percentPotential
            }
        }

        // Last 7 days

        let itemSevenDaysList = []

        // console.log("Last 7 days")

        let weekSold = 0

        /**
         * Get Sales in last 7 days
         */
        for (const nation of nationSales) {
            const soldValue = dom.querySelector(`#currency-summary-sold-${nation}`).textContent.trim()
            const royaltiesValue = dom.querySelector(`#currency-summary-royalties-${nation}`).textContent.trim()

            // console.log(`${nation}`)
            // console.log(`   Sold Value: ${soldValue}`)
            // console.log(`   Royalties Element: ${royaltiesValue}`)
            weekSold += parseInt(weekSold)
            itemSevenDaysList.push({
                sold: soldValue,
                royalties: royaltiesValue
            })
        }

        resData['weekSold'] = weekSold

        let tvNameAccount = ''
        let tvUserNameAccount = ''

        const btnAccountSelector = 'div[class="account-popover"] > button[class="btn-account-popover"]'
        const btnYourAccount = await page.waitForSelector(btnAccountSelector)
        if (btnYourAccount != null) {
            await page.click(btnAccountSelector)

            const btnManageAccountSelector = 'a[id="manage-account-link"]'
            const btnManageAccount = await page.waitForSelector(btnManageAccountSelector)

            if (btnManageAccount != null) {
                await page.click(btnManageAccountSelector)

                await page.setDefaultNavigationTimeout(60000);

                let isCheckAuth = false

                // Check
                while (true) {
                    if (await page.$('div[class="a-row a-size-base-plus auth-text-truncate"]') != null) {
                        break
                    }

                    if (await page.$('div[class="col-12 col-md-6"] > input[id="address-email"]') != null) {
                        isCheckAuth = true
                        break
                    }
                }

                // GO TO ACCOUNT PAGE
                if (!isCheckAuth) {
                    const tvNameAccountSelector = 'div[class="a-row a-size-base-plus auth-text-truncate"]'
                    const tvNameAccountEle = await page.waitForSelector(tvNameAccountSelector)

                    if (tvNameAccountEle != null) {
                        tvNameAccount = await page.evaluate(el => el.textContent, tvNameAccountEle)
                    }

                    const tvUserNameAccountSelector = 'div[class="a-row a-size-base a-color-tertiary auth-text-truncate"]'
                    const tvUserNameAccountEle = await page.waitForSelector(tvUserNameAccountSelector)

                    if (tvUserNameAccountEle != null) {
                        tvUserNameAccount = await page.evaluate(el => el.textContent, tvUserNameAccountEle)
                    }
                } else {
                    const tvNameAccountSelector = 'div[class="col-12 col-md-6"] > input[id="address-email"]'
                    const tvNameAccountEle = await page.waitForSelector(tvNameAccountSelector)

                    if (tvNameAccountEle != null) {
                        tvNameAccount = await page.evaluate(el => el.textContent, tvNameAccountEle)
                    }

                    const tvUserNameAccountSelector = 'div[class="col-12 col-md-6"] > input[id="address-name"]'
                    const tvUserNameAccountEle = await page.waitForSelector(tvUserNameAccountSelector)

                    if (tvUserNameAccountEle != null) {
                        tvUserNameAccount = await page.evaluate(el => el.textContent, tvUserNameAccountEle)
                    }
                }
            }
        }

        resData["dashboard"] = {
            status: statusDashboard,
            recentSales: itemSevenDaysList,
        }

        resData["name"] = tvNameAccount.trim()

        resData["username"] = tvUserNameAccount.trim()

        let mapProducts = {}

        /**
         * Total
         * Add sold, cancelled, royalties, revenue, purchased
         */
        for (const itemMonth of listMonthProducts) {
            for (const item of itemMonth.products) {
                if (mapProducts.hasOwnProperty(item.asin)) {
                    // Add Purchased
                    mapProducts[item.asin].purchased += item.purchased

                    // Add Revenue
                    mapProducts[item.asin].revenue += item.revenue

                    // Add Cancelled
                    mapProducts[item.asin].cancelled += item.cancelled

                    // Add Royalties
                    mapProducts[item.asin].royalties += item.royalties

                    // Add Sold
                    mapProducts[item.asin].returned += item.returned

                } else {
                    mapProducts[item.asin] = item

                    for (const itemManage of resData["manage"].products) {
                        if (itemManage.asin == item.asin) {
                            mapProducts[item.asin].img = itemManage.img
                            mapProducts[item.asin].createdAt = itemManage.createdAt
                            mapProducts[item.asin].brand = itemManage.brand
                            mapProducts[item.asin].status = itemManage.status
                            mapProducts[item.asin].price = itemManage.price
                        }
                    }
                }
            }
        }

        // let listProducts = Object.entries(mapProducts);
        resData["royalties"] = 0
        resData["purchased"] = 0
        resData["revenue"] = 0
        resData["cancelled"] = 0
        resData["returned"] = 0

        Object.keys(mapProducts)
            // iterate over them and generate the array
            .map(function(k) {
                resData["royalties"] += mapProducts[k].royalties
                resData["purchased"] += mapProducts[k].purchased
                resData["revenue"] += mapProducts[k].revenue
                resData["cancelled"] += mapProducts[k].cancelled
                resData["returned"] += mapProducts[k].returned
            });

        resData["overview"] = mapProducts

        // Write File Data
        // Create Folder
        hidemyacc.createFolder()

        const filePath = hidemyacc.createFilePath(`${id}.txt`)

        fs.writeFile(filePath, JSON.stringify(resData), (err) => {
            if (err) console.log(err);
            else {
                console.log("File written successfully\n");
            }
        });

        // fs.readFile("C:\\Users\\Admin\\test.txt", "utf8", function(err, data) {
        //     console.log(JSON.stringify(data))
        // })

        await page.close()

        await browser.close()

        // await page.evaluate(() => {
        //     const tds = Array.from(document.querySelectorAll('.GridHeader td'))

        //     return tds.map(td => td.textContent)
        // });

        // console.log($.textContent)

        // const listPrice = dom.querySelectorAll('')

        // Date Picker To aria-labelledby="datepicker-to"
        // Date Picker From aria-labelledby="datepicker-from"
        // Button Go class="btn btn-secondary h-100 font-weight-bold ml-base"
        // Warning span class="sci-icon sci-warning pr-small"
        // Date class="ngb-dp-day", aria-label="Friday, April 1, 2022"

        // Day class="ngb-dp-day"

        // let element = await page.waitForSelector('account-status-v2 > div > div > div > div:nth-child(1) > h4')
        //     // Get Tier
        // if (element != null) {
        //     const tier = await page.evaluate(el => el.textContent, element)
        //     console.log(`Tier ${tier}`)
        // }

        // // Get Submit Today
        // for (let i = 1; i <= 3; i++) {
        //     const selectAccount = `div[class="card-body"] > div > div:nth-child(${i}) > progress-summary > div > div[class="row"] > div[class="progress-summary col-9 text-left"] > span`
        //     const element = await page.waitForSelector(selectAccount)
        //     if (element != null) {
        //         if (i == 1) {
        //             const submitToday = await page.evaluate(el => el.textContent, element)
        //             console.log(`Submit Today ${submitToday}`)
        //         } else if (i == 2) {
        //             const publishDesigned = await page.evaluate(el => el.textContent, element)
        //             console.log(`Publish Design ${publishDesigned}`)
        //         } else {
        //             const potentialProduct = await page.evaluate(el => el.textContent, element)
        //             console.log(`Potential Product ${potentialProduct}`)
        //         }
        //     }
        // }

        // console.log("DashBoard - This Week")

        // // Get Recent Sales
        // const nationSales = [
        //     "USD",
        //     "GBP",
        //     "EUR",
        //     "JPY"
        // ]

        // // Get This Week
        // for (const nationSale of nationSales) {
        //     const soldElement = `h4[id=currency-summary-sold-${nationSale}]`
        //     const royaltiesElement = `h4[id="currency-summary-royalties-${nationSale}"]`
        //     const soldSelector = await page.waitForSelector(soldElement)
        //     const royaltiesSelector = await page.waitForSelector(royaltiesElement)
        //     if (soldSelector != null && royaltiesSelector != null) {

        //         console.log(`${nationSale}`)
        //         const soldValue = await page.evaluate(el => el.textContent, soldSelector)
        //         console.log(`   Sold Value: ${soldValue}`)
        //         const royaltiesValue = await page.evaluate(el => el.textContent, royaltiesSelector)
        //         console.log(`   Royalties Element: ${royaltiesValue}`)
        //     }
        // }

        // const productItems = await page.evaluate(() => {
        //     const tds = Array.from(document.querySelectorAll('.GridHeader td'))

        //     return tds.map(td => td.textContent)
        // });

        // // a-row a-size-base-plus auth-text-truncate
        // // a-row a-size-base a-color-tertiary auth-text-truncate


        // // Get All Recent product - Click Manage Screen
        // if (await page.waitForSelector('div[class="card-header"] > a[href="/manage"]') != null) {
        //     await page.click('div[class="card-header"] > a[href="/manage"]')

        //     // GO TO MANAGE PAGE

        //     await sleep(3000)

        //     const tvProductShownEle = 'table-item-count[class="float-right mb-small mt-small"] > b';

        //     const tvProductShownSelector = await page.waitForSelector(tvProductShownEle)

        //     if (tvProductShownSelector != null) {
        //         const tvProductShown = await page.evaluate(el => el.textContent, tvProductShownSelector)

        //         console.log(`Products Shown: ${tvProductShown}`)
        //     }

        //     if (await page.waitForSelector('.table tr') != null) {

        //         const productsTRow = await page.evaluate(() => {
        //             const tds = Array.from(document.querySelectorAll('.table tr'))
        //             return tds.map(td => td.textContent)
        //         });

        //         let products = []

        //         console.log(productsTRow.length)

        //         for (let i = 0; i < productsTRow.length - 10; i++) {
        //             const trEle = `table[class="table"] > tr:nth-child(${i+2})`

        //             const mktEle = trEle + ' > td:nth-child(1)'

        //             const imgEle = trEle + ' > td:nth-child(2) > img' // src
        //             const titleEle = trEle + ' > td:nth-child(2) > span > i'
        //             const brandEle = trEle + ' > td:nth-child(3)'
        //             const typeEle = trEle + ' > td:nth-child(4)'
        //             const createdAtEle = trEle + ' > td:nth-child(5) > div'
        //             const priceAtEle = trEle + ' > td:nth-child(6)'
        //             const statusEle = trEle + ' > td:nth-child(7) > div'

        //             const mkt = await getText(page, mktEle)
        //             const title = await getText(page, titleEle)
        //             const brand = await getText(page, brandEle)
        //             const type = await getText(page, typeEle)
        //             const createdAt = await getText(page, createdAtEle)
        //             const price = await getText(page, priceAtEle)
        //             const status = await getText(page, statusEle)

        //             const img = await page.evaluate((sel) => {
        //                 return document.querySelector(sel).getAttribute('src')
        //             }, imgEle)

        //             const product = {
        //                 img: img,
        //                 mkt: mkt,
        //                 title: title,
        //                 brand: brand,
        //                 type: type,
        //                 createdAt: createdAt,
        //                 price: price,
        //                 status: status
        //             }

        //             products.push(product)
        //         }

        //         console.log(products)
        //     }

        //     const btnAccountSelector = 'div[class="account-popover"] > button[class="btn-account-popover"]'
        //     const btnYourAccount = await page.waitForSelector(btnAccountSelector)
        //     if (btnYourAccount != null) {
        //         await page.click(btnAccountSelector)

        //         const btnManageAccountSelector = 'a[id="manage-account-link"]'
        //         const btnManageAccount = await page.waitForSelector(btnManageAccountSelector)

        //         if (btnManageAccount != null) {
        //             await page.click(btnManageAccountSelector)

        //             // GO TO ACCOUNT PAGE
        //             const tvNameAccountSelector = 'div[class="a-row a-size-base-plus auth-text-truncate"]'
        //             const tvNameAccountEle = await page.waitForSelector(tvNameAccountSelector)

        //             if (tvNameAccountEle != null) {
        //                 const tvNameAccount = await page.evaluate(el => el.textContent, tvNameAccountEle)
        //                 console.log("Name Account: " + tvNameAccount)
        //             }

        //             const tvUserNameAccountSelector = 'div[class="a-row a-size-base a-color-tertiary auth-text-truncate"]'
        //             const tvUserNameAccountEle = await page.waitForSelector(tvUserNameAccountSelector)

        //             if (tvUserNameAccountEle != null) {
        //                 const tvUserNameAccount = await page.evaluate(el => el.textContent, tvUserNameAccountEle)
        //                 console.log("UserName Account: " + tvUserNameAccount)
        //             }
        //         }
        //     }

        //     // Get This Month
        //     let responseAnalyzePage = await page.goto(urlAnalyzeProducts, { waitUntil: 'load', timeout: 10000 });

        //     await page.setDefaultNavigationTimeout(0);

        //     for (const nationSale of nationSales) {
        //         const soldMonthElement = `h4[id=currency-summary-sold-${nationSale}]`
        //         const royaltiesMonthElement = `h4[id="currency-summary-royalties-${nationSale}"]`
        //         const soldMonthSelector = await page.waitForSelector(soldMonthElement)
        //         const royaltiesMonthSelector = await page.waitForSelector(royaltiesMonthElement)
        //         if (soldMonthSelector != null && royaltiesMonthSelector != null) {

        //             console.log(`${nationSale}`)
        //             const soldValue = await page.evaluate(el => el.textContent, soldMonthSelector)
        //             console.log(`   Sold Value: ${soldValue}`)
        //             const royaltiesValue = await page.evaluate(el => el.textContent, royaltiesMonthSelector)
        //             console.log(`   Royalties Element: ${royaltiesValue}`)
        //         }
        //     }

        //     // Earning
        //     let responseEarningPage = await page.goto(urlAnalyzeEarning, { waitUntil: 'load', timeout: 10000 });

        //     await page.setDefaultNavigationTimeout(0);

        //     // Month of Year

        //     await sleep(5000)

        //     if (await page.waitForSelector('.table tbody tr') != null) {

        //         const saleMonthRows = await page.evaluate(() => {
        //             const tds = Array.from(document.querySelectorAll('.table tbody tr'))
        //             return tds.map(td => td.textContent)
        //         });

        //         let saleMonths = []

        //         for (let i = 0; i < saleMonthRows.length; i++) {
        //             const trEle = `table[class="table"] > tbody > tr[id="record-${i}"]`

        //             const monthEle = trEle + ` > td[id="record-${i}-month"]`
        //             const grossEle = trEle + ` > td[id="record-${i}-gross"]`
        //             const adjustmentsEle = trEle + ` > td[id="record-${i}-adjustments"]`
        //             const netEle = trEle + ` > td[id="record-${i}-net"]`

        //             const month = await getText(page, monthEle)
        //             const gross = await getText(page, grossEle)
        //             const adjustments = await getText(page, adjustmentsEle)
        //             const net = await getText(page, netEle)

        //             const saleMonth = {
        //                 month: month,
        //                 gross: gross,
        //                 adjustments: adjustments,
        //                 net: net
        //             }

        //             saleMonths.push(saleMonth)
        //         }

        //         console.log("Sale Month " + JSON.stringify(saleMonths))
        //     }

        //     // Get Previous month
        //     if (month == 1) {


        //     } else {


        //     }


        // }
    }
}

function splitSpace(txt) {
    var string = txt;
    string = string.split(" ");
    var stringArray = new Array();
    for (var i = 0; i < string.length; i++) {
        stringArray.push(string[i]);
        if (i != string.length - 1) {
            stringArray.push(" ");
        }
    }
    return stringArray;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNumberOfMonth(numberMonth) {
    console.log("Number Month " + numberMonth)
    for (let i = 0; i < months_year.length; i++) {
        if (numberMonth === months_year[i]) {
            return i + 1
        }
    }
    return 1
}

async function getText(page, selector) {
    const tvSelector = await page.waitForSelector(selector)

    if (tvSelector != null) {
        const text = await page.evaluate(el => el.textContent, tvSelector)
        return text
    }

    return null
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}