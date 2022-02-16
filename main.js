const solanaWeb3 = require('@solana/web3.js');
const { Connection, programs } = require('@metaplex/js');
const axios = require('axios');
const puppeteer = require('puppeteer');
require('dotenv').config()

if (!process.env.PROJECT_ADDRESS || !process.env.SALE_URL || !process.env.LISTING_URL) {
    console.log("please set your environment variables!");
    return;
}

const projectPubKey = new solanaWeb3.PublicKey(process.env.PROJECT_ADDRESS);
const url = solanaWeb3.clusterApiUrl('mainnet-beta');
const solanaConnection = new solanaWeb3.Connection(url, 'confirmed');
const metaplexConnection = new Connection('mainnet-beta');
const { metadata: { Metadata } } = programs;
const pollingInterval = 5000; // ms

const marketplaceMap = {
    "MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8": {
        "name": "Magic Eden",
        "imageURL": "https://imagedelivery.net/E-VnZk4fwouzlzwX_qz4fg/532afb9b-8805-424d-8f85-da5c3e0f8600/public",
        "URL": "https://magiceden.io/",
        "listingURL": "https://magiceden.io/item-details/"
    }, 
    "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K": {
        "name": "Magic Eden",
        "imageURL": "https://imagedelivery.net/E-VnZk4fwouzlzwX_qz4fg/532afb9b-8805-424d-8f85-da5c3e0f8600/public",
        "URL": "https://magiceden.io/",
        "listingURL": "https://magiceden.io/item-details/"
    }, 
    "HZaWndaNWHFDd9Dhk5pqUUtsmoBCqzb1MLu3NAh1VX6B": {
        "name": "Alpha Art",
        "imageURL": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqlfHALauwNTSfegubAL4PVccBDEEVB5lTXcez2K3YyX9YkG_GaokoIK1iQzVda3VIV0&usqp=CAU",
        "URL": "https://alpha.art/",
        "listingURL": ""
    }, 
    "617jbWo616ggkDxvW1Le8pV38XLbVSyWY8ae6QUmGBAU": {
        "name": "Solsea",
        "imageURL": "https://pbs.twimg.com/profile_images/1476517676407263234/3iVAt6rl_400x400.jpg",
        "URL": "https://solsea.io/",
        "listingURL": "https://solsea.io/nft/"
    }, 
    "CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz": {
        "name": "Solanart",
        "imageURL": "https://solanart.io/static/media/logoonly.dbc1c255.png",
        "URL": "https://solanart.io/",
        "listingURL": ""
    }, 
    "A7p8451ktDCHq5yYaHczeLMYsjRsAkzc3hCXcSrwYHU7": {
        "name": "Digital Eyes",
        "imageURL": "https://pbs.twimg.com/profile_images/1430306224713740292/q4termyJ.jpg",
        "URL": "https://digitaleyes.market/",
        "listingURL": ""
    },
    "AmK5g2XcyptVLCFESBCJqoSfwV3znGoVYQnqEnaAZKWn": {
        "name": "Exchange Art",
        "imageURL": "https://pbs.twimg.com/profile_images/1442229418320019457/5m8XAwLm_400x400.jpg",
        "URL": "https://exchange.art/",
        "listingURL": ""
    }
}

async function startBrowser(){
	let browser;
	try {
	    console.log("Opening the browser......");
	    browser = await puppeteer.launch({
	        headless: true,
	        args: ["--disable-setuid-sandbox"],
	        'ignoreHTTPSErrors': true
	    });
	} catch (err) {
	    console.log("Could not create a browser instance => : ", err);
	}
	return browser;
}


const timer = ms => new Promise(res => setTimeout(res, ms))

const getMetadata = async (tokenPubKey) => {
    try {
        const addr = await Metadata.getPDA(tokenPubKey)
        const resp = await Metadata.load(metaplexConnection, addr);
        const { data } = await axios.get(resp.data.data.uri);

        return data;
    } catch (error) {
        console.log("error fetching metadata: ", error)
    }
}

const logSale = (date, price, signature, title, marketplace, imageURL) => {
    console.log("-------------------------------------------")
    console.log(`Sale at ${date} ---> ${price} SOL`)
    console.log("Signature: ", signature)
    console.log("Name: ", title)
    console.log("Image: ", imageURL)
    console.log("Marketplace: ", marketplace["name"])
}

const postToDiscord = (title, price, date, imageURL, marketplace, metadata, bIsSale, tokenAddress, signature) => {
    // An undefind price means the item was delisted
    if(price === undefined) return;

    let obj = {};
    obj["title"] = `"${title}" → ${(bIsSale ? "SOLD" : "LISTED")}`
    obj["url"] = `${marketplace["listingURL"] + tokenAddress}`
    obj["author"] = {
        name: `${marketplace["name"]}`,
		icon_url: `${marketplace["imageURL"]}`,
        url: `${marketplace["URL"]}`
    }
    obj["thumbnail"] = {
		url: `${imageURL}`,
	}
    obj["fields"] = [];
    obj["fields"].push({
        "name": "Price",
        "value": `${price}◎`,
        "inline": false
    })
    metadata.attributes.forEach(attribute => {
        let temp = {};
        temp["name"] = attribute["trait_type"]
        temp["value"] = attribute["value"]
        temp["inline"] = true;
        obj["fields"].push(temp);
    });
    obj["fields"].push({
        "name": "Mint Token",
        "value": `${tokenAddress}`,
        "inline": false
    })
    if(bIsSale) {
        obj["fields"].push({
            "name": "Transaction Details",
            "value": `[View on explorer](https://explorer.solana.com/tx/${signature})`,
            "inline": false
        })
    }

    obj["footer"] = {
        "text": `Built by LilSparagus | ${(bIsSale ? "Sold" : "Listed")} at ${date}`,
        icon_url: 'https://cdn.discordapp.com/avatars/217961554790842368/5af461faf85212cb917287f3acf089fd.webp?size=128'
    }
    axios.post((bIsSale ? process.env.SALE_URL : process.env.LISTING_URL), { "embeds": [ obj ]})
}

const parsePriceSolSea = async tokenAddress => {
    try {
        let browser = await startBrowser();
        let page = await browser.newPage();
        console.log(`Navigating to https://solsea.io/nft/${tokenAddress}...`);
        await page.goto(`https://solsea.io/nft/${tokenAddress}`);
        const element = (await page.$x('//span[contains(text(), "SOL")]'))[0];
        const parent = (await element.$x('..'))[0];
        const dirtyPrice = await page.evaluate(el => el.textContent, parent);
        let price = dirtyPrice.replace("SOL", '');
        await browser.close();
        return price;
    } catch (err) {
        console.log(err)
    }  
}

const parsePriceMagicEden = async tokenAddress => {
    try {
        let browser = await startBrowser();
        let page = await browser.newPage();
        console.log(`Navigating to https://magiceden.io/item-details/${tokenAddress}...`);
        await page.goto(`https://magiceden.io/item-details/${tokenAddress}`);
        const element = (await page.$x('//span[contains(text(), "SOL")]'))[0];
        const parent = (await element.$x('..'))[0];
        const dirtyPrice = await page.evaluate(el => el.textContent, parent);
        let price = dirtyPrice.replace("SOL", '');
        await browser.close();
        return price;
    } catch (err) {
        console.log(err)
    }
}

const main = async () => {
    console.log("Starting sales tracker...");
    let signatures;
    let lastKnownSignature;
    const options = {};

    while (true) {
        try {
            signatures = await solanaConnection.getSignaturesForAddress(projectPubKey, options);
            if (!signatures.length) {
                console.log("Polling...")
                await timer(pollingInterval);
                continue;
            }
        } catch (err) {
            console.log("Error fetching signatures: ", err);
            continue;
        }

        for (let i = (signatures.length > 20 ? 20 : signatures.length); i >= 0; i--) {
            try {
                let { signature } = signatures[i];
                const txn = await solanaConnection.getTransaction(signature);
                if (txn.meta && txn.meta.err != null) { continue; }

                const dateString = new Date(txn.blockTime * 1000).toLocaleString();
                const price = Math.abs((txn.meta.preBalances[0] - txn.meta.postBalances[0])) / solanaWeb3.LAMPORTS_PER_SOL;

                const accounts = txn.transaction.message.accountKeys;
                const marketplaceAccount = accounts[accounts.length - 1].toString();
                const marketplace = marketplaceMap[marketplaceAccount]

                if (marketplace) {
                    const tokenAddress = txn.meta.postTokenBalances[0].mint
                    const metadata = await getMetadata(tokenAddress);
                    if (!metadata) {
                        console.log("Couldn't get metadata");
                        continue;
                    }

                    logSale(dateString, price, signature, metadata.name, marketplace, metadata.image);

                    if(price < 0.01) { 
                        /* A price of < 0.01 indicates a listing and the amount paid is the listing fee */ 
                        let listingPrice;
                        if(marketplace["name"] === "Solsea") {
                            listingPrice = await parsePriceSolSea(tokenAddress);
                            await postToDiscord(metadata.name, listingPrice, dateString, metadata.image, marketplace, metadata, false, tokenAddress, signature )
                        } else if(marketplace["name"] === "Magic Eden") {
                            listingPrice = await parsePriceMagicEden(tokenAddress);
                            await postToDiscord(metadata.name, listingPrice, dateString, metadata.image, marketplace, metadata, false, tokenAddress, signature )
                        }
                        
                    } else {
                        await postToDiscord(metadata.name, price.toFixed(2), dateString, metadata.image, marketplace, metadata, true, tokenAddress, signature )
                    }

                    
                } else {
                    console.log(`Not a supported marketplace sale. Wallet address: ${marketplaceAccount}`);
                }
            } catch (err) {
                console.log("Error while parsing signatures: ", err);
                continue;
            }
        }

        lastKnownSignature = signatures[0].signature;
        if (lastKnownSignature) {
            options.until = lastKnownSignature;
        }
    }
}

main();