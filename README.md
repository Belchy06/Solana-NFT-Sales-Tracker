# Solana NFT Sales Bot
A sales bot for tracking NFT sales on Solana for a given collection and posting the sale details to Discord.

The code here isn't complete and is primarily meant for illustrating concepts. Please see [this accompanying post](https://mertmumtaz.medium.com/building-an-nft-sales-bot-with-javascript-and-solana-3d7add28f995) by Turk Mumtaz, which explains all parts of the bot.

# Usage
Once you've got a project address and a Discord webhook URL, simply run:

`PROJECT_ADDRESS=insert-address SALE_URL=insert-sale-channel-webhook LISTING_URL=insert-listing-channel-webhook node main.js`

Alternatively, you can create a `.env` file with the required parameters and simply run:

`node main.js`

# Caveats
The way the bot is currently set up, it fetches the last 20 signatures by default. This is on purpose - as I like backfilling historic sales when I add a bot to Discord.

The bot also currently only shows listings on SolSea. Listings on Magic Eden is planned, but as this is a hobby project, support for this feature may take longer than expected to be implemented,

# Issues
Sometimes there are problems with the Metaplex API. If this happens, please use the Magic Eden API for getting the metadata (this is covered in the Medium post), i.e., `https://api-mainnet.magiceden.io/rpc/getNFTByMintAddress/{paste-mint-address-here}`
