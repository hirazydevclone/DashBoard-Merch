const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const Hidemyacc = require('./hidemyacc');

const urlDashBoard = "https://merch.amazon.com/dashboard"
const urlManage = "https://merch.amazon.com/manage/designs"

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

getDashBoardInfo()

async function getDashBoardInfo(){

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
        let responseText = await page.goto(urlDashBoard, { waitUntil: 'load', timeout: 10000 });

        let element = await page.waitForSelector('account-status-v2 > div > div > div > div:nth-child(1) > h4')
        // Get Tier
        if(element != null){
            const tier = await page.evaluate(el => el.textContent, element)
            console.log(`Tier ${tier}`)
        } 

        // Get Submit Today
        for(let i = 1; i <= 3;i++){
            const selectAccount = `div[class="card-body"] > div > div:nth-child(${i}) > progress-summary > div > div[class="row"] > div[class="progress-summary col-9 text-left"] > span`
            const element = await page.waitForSelector(selectAccount)
            if(element != null){
                if(i == 1){
                    const submitToday = await page.evaluate(el => el.textContent, element)
                    console.log(`Submit Today ${submitToday}`)
                }
                else if(i == 2){
                    const publishDesigned = await page.evaluate(el => el.textContent, element)
                    console.log(`Publish Design ${publishDesigned}`)
                }
                else{
                    const potentialProduct = await page.evaluate(el => el.textContent, element)
                    console.log(`Potential Product ${potentialProduct}`)
                }
            }
        }

        // Get Recent Sales
        const nationSales = [
            "USD",
            "GBP",
            "EUR",
            "JPY"
        ]

        for(const nationSale of nationSales){
            const soldElement = `h4[id=currency-summary-sold-${nationSale}]`
            const royaltiesElement = `h4[id="currency-summary-royalties-${nationSale}"]`
            const soldSelector = await page.waitForSelector(soldElement)
            const royaltiesSelector = await page.waitForSelector(royaltiesElement)
            if(soldSelector != null && royaltiesSelector != null){
                
                console.log(`${nationSale}`)
                const soldValue = await page.evaluate(el => el.textContent, soldSelector)
                console.log(`   Sold Value: ${soldValue}`)
                const royaltiesValue = await page.evaluate(el => el.textContent, royaltiesSelector)
                console.log(`   Royalties Element: ${royaltiesValue}`)
            }
        }

        // const productItems = await page.evaluate(() => {
        //     const tds = Array.from(document.querySelectorAll('.GridHeader td'))
        //     return tds.map(td => td.textContent)
        // });
    
        
    }

    // Hihi


}

