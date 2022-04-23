const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
    // import { got } from 'got'

const Hidemyacc = require('./hidemyacc');
// const { data } = require('cheerio/lib/api/attributes');
const jsdom = require('jsdom');
const { JSDOM } = require('jsdom');

const path = require("path");
const fs = require("fs");
const { ifError } = require('assert');

const urlDashBoard = "https://merch.amazon.com/dashboard"
const urlManage = "https://merch.amazon.com/manage/designs"

const urlAnalyzeEarning = "https://merch.amazon.com/analyze/earnings"
const urlAnalyzeProducts = "https://merch.amazon.com/analyze/products"


const profileID = "620ddcf8d9863b1f18f2f371"

console.log("Starting")

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

getDashBoardInfo()

async function getDashBoardInfo() {

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

    console.log("Time now " + timeNow)

    const hidemyacc = new Hidemyacc();

    const response = await hidemyacc.start(profileID);

    if (response.code == 1) {

        const data = response.data;

        const browser = await puppeteer.connect({
            browserWSEndpoint: data.wsUrl,
            ignoreHTTPSErrors: true,
            args: ['--start-maximized'],
            slowMo: 90,
        });
        const page = await browser.newPage();
        await page._client.send('Emulation.clearDeviceMetricsOverride')

        /**
         * Analyze Page
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

        let dom = new JSDOM(textAnalyzeHTML).window.document

        let priceProducts = []

        const nationSales = [
            "USD",
            "GBP",
            "EUR",
            "JPY"
        ]

        for (const nation of nationSales) {
            const soldValue = dom.querySelector(`#currency-summary-sold-${nation}`).textContent
            const royaltiesValue = dom.querySelector(`#currency-summary-royalties-${nation}`).textContent

            priceProducts.push({
                nation: nation,
                sold: soldValue,
                royalties: royaltiesValue
            })
            console.log(`${nation}`)
            console.log(`   Sold Value: ${soldValue}`)
            console.log(`   Royalties Element: ${royaltiesValue}`)
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

        console.log("Earning")

        for (const nation of nationSales) {
            const soldValue = dom.querySelector(`#currency-summary-sold-${nation}`).textContent
            const royaltiesValue = dom.querySelector(`#currency-summary-royalties-${nation}`).textContent

            console.log(`${nation}`)
            console.log(`   Sold Value: ${soldValue}`)
            console.log(`   Royalties Element: ${royaltiesValue}`)
        }

        // All Item Month
        const monthItems = dom.querySelector('tbody')
        const monthItemsList = monthItems.querySelectorAll('tr')
        console.log(`Length ${monthItemsList.length}`)

        let earningLists = []

        for (let i = 0; i < monthItemsList.length; i++) {
            const item = monthItemsList[i]
            const monthElement = item.querySelector(`#record-${i}-month`).textContent
            const grossEarningElement = item.querySelector(`#record-${i}-gross`).textContent
            const adjustmentElement = item.querySelector(`#record-${i}-adjustments`).textContent
            const earningBeforeTaxElement = item.querySelector(`#record-${i}-net`).textContent


            console.log(`${monthElement}`)
            console.log(`   Gross Earning: ${grossEarningElement}`)
            console.log(`   Adjust: ${adjustmentElement}`)
            console.log(`   Earning Before Text: ${earningBeforeTaxElement}`)

            earningLists.push({
                month: monthElement,
                gross: grossEarningElement,
                adjust: adjustmentElement,
                earningBeforeTax: earningBeforeTaxElement
            })
        }

        /**
         * Manage Page
         */
        let responseManage = await page.goto(urlManage, { waitUntil: 'load', timeout: 0 });
        await page.setDefaultNavigationTimeout(60000);

        // Wait Page Loaded - Find First Item
        while (true) {
            await sleep(1000)
            const detectLoadedEle = await page.$('table.table > tr')
            if (detectLoadedEle != null) {
                break
            }
            count += 1

            if (count == 30) {
                return
            }
        }

        await sleep(1000)

        let textManageHTML = await page.content()

        dom = new JSDOM(textManageHTML).window.document

        const productItems = dom.querySelector('table')
        const productItemsList = productItems.querySelectorAll('tr')

        let productsList = []

        console.log(`Product Length ${productItemsList.length}`)

        // ID 

        /**
         * img
         * title
         * mkt
         * type
         * status
         * createAt
         * price
         * status
         * 
         * */

        for (let i = 0; i < productItemsList.length; i++) {
            const item = productItemsList[i]

            const trEle = `table[class="table"] > tr:nth-child(${i+2})`

            const mktEle = 'td:nth-child(1)'

            const imgEle = 'td:nth-child(2) > img' // src
            const titleEle = 'td:nth-child(2) > span > i'
            const brandEle = trEle + ' > td:nth-child(3)'
            const typeEle = trEle + ' > td:nth-child(4)'
            const createdAtEle = trEle + ' > td:nth-child(5) > div'
            const priceAtEle = trEle + ' > td:nth-child(6)'
            const statusEle = trEle + ' > td:nth-child(7) > div'

            const mkt = item.querySelector(mktEle)
                // const title = item.querySelector(mktEle).textContent
                // const brand = item.querySelector(mktEle).textContent

            console.log(`MKT ${JSON.stringify(mkt)}`)

            // const title = await getText(page, titleEle)
            // const brand = await getText(page, brandEle)
            // const type = await getText(page, typeEle)
            // const createdAt = await getText(page, createdAtEle)
            // const price = await getText(page, priceAtEle)
            // const status = await getText(page, statusEle)

            // const img = await page.evaluate((sel) => {
            //     return document.querySelector(sel).getAttribute('src')
            // }, imgEle)

            // const product = {
            //     img: img,
            //     mkt: mkt,
            //     title: title,
            //     brand: brand,
            //     type: type,
            //     createdAt: createdAt,
            //     price: price,
            //     status: status
            // }

            // products.push(product)
        }


        // Filter Product
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
        await page.click('button[id="MarketplaceDropdown"]')
        await page.click(`flowcheckbox[class="mr-2 checkbox-all"]`)

        let itemMktList = []

        // Market
        // await page.click('class="btn btn-secondary dropdown-toggle"')

        for (let i = 0; i < mktList.length; i++) {

            const mkt = mktList[i]

            // await page.click('button[id="MarketplaceDropdown"]')
            if (i != 0) {
                const beforeMkt = mktList[i - 1]
                await page.click(`flowcheckbox[class="mr-2 checkbox-${beforeMkt}"]`)
            }

            await page.click(`flowcheckbox[class="mr-2 checkbox-${mkt}"]`)

            let isExistItem = true

            // Wait to load Page    
            while (true) {
                await sleep(1000)
                const detectLoadedEle = await page.$('table.table > tr')
                if (detectLoadedEle != null) {
                    break
                }

                const detectWarning = await page.$('span[class="warning-text"]')
                if (detectLoadedEle != null) {
                    isExistItem = falses
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

            console.log(`Product Length ${productItemsList.length}`)

            // itemMktList.push({

            // })
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
            count += 1

            if (count == 30) {
                return
            }
        }

        await sleep(1000)

        let textDashBoardHTML = await page.content()

        dom = new JSDOM(textDashBoardHTML).window.document

        // Tier
            'div["class="row pb-large account-status-container"]'

        // Submitted Today

        // Published Designs

        // Product Potential

        // Last 7 days

        let itemSevenDaysList = []

        console.log("Last 7 days")

        /**
         * Get Sales in last 7 days
         */
        for (const nation of nationSales) {
            const soldValue = dom.querySelector(`#currency-summary-sold-${nation}`).textContent
            const royaltiesValue = dom.querySelector(`#currency-summary-royalties-${nation}`).textContent

            console.log(`${nation}`)
            console.log(`   Sold Value: ${soldValue}`)
            console.log(`   Royalties Element: ${royaltiesValue}`)
            itemSevenDaysList.push({
                sold: soldValue,
                royalties: royaltiesValue
            })
        }

        await page.close()

        // browser.close()



        // await page.evaluate(() => {
        //     const tds = Array.from(document.querySelectorAll('.GridHeader td'))

        //     return tds.map(td => td.textContent)
        // });

        // console.log($.textContent)

        // const listPrice = dom.querySelectorAll('')


        // // Write File Data
        // fs.writeFile("C:\\Users\\Admin\\test.txt", html, (err) => {
        //     if (err) console.log(err);
        //     else {
        //         console.log("File written successfully\n");
        //     }
        // });

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

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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