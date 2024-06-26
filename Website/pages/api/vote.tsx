
import { ComputeBudgetProgram, PublicKey, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { Config, PROGRAM, SYSTEM_KEY } from '../../components/Solana/constants';
import { ListingData, getRecentPrioritizationFees, get_current_blockhash, request_raw_account_data, serialise_HypeVote_instruction } from '../../components/Solana/state';



export default async function handler(req, res) {
  
    // Handle OPTIONS method
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Encoding, Accept-Encoding');

      console.log("have options req", req.method, req.query, req.body)
      res.status(200).end();
      return;
    }
    console.log("have req", req.method, req.query, req.body)

    if (req.method === 'GET') {

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Encoding, Accept-Encoding');
        try {
            const { mint } = req.query;

            let token_mint = new PublicKey(mint)
            let listing_account = PublicKey.findProgramAddressSync([token_mint.toBytes(), Buffer.from("Listing")], PROGRAM)[0]
            let listing_data = await request_raw_account_data("", listing_account);
            const [listing] = ListingData.struct.deserialize(listing_data)
            let current_hype = listing.positive_votes + listing.negative_votes


            // Your data here
            const data = {
                "title": listing.name + " Hype! "+ current_hype,
                "icon": listing.icon,
                "description": "Vote on your favourite memes at letscook.wtf!",
                "label": "Hype Vote",
                "links": {
                    "actions": [
                    {
                        "label": "Hyped", // button text
                        "href": "/api/vote?mint="+mint+"&choice=1"
                    },
                    {
                        "label": "Not Hyped", // button text
                        "href": "/api/vote?mint="+mint+"&choice=2"
                    }
                    ]
                }
            }
            res.status(200).json(data);
        }
        catch(error){
            res.status(400).json({ error: 'Invalid mint' });
        }
    
    } 
    else if (req.method === 'POST') {

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        console.log("in post")
        try {
          const { account } = req.body;

          if (!account) {
            console.log("No account found")
            return res.status(400).json({ error: 'Account parameter is required' });
          }
          console.log("have account", account)
          const { mint, choice } = req.query;

          let vote_val = parseInt(choice)
          if(vote_val < 1 || vote_val > 2){
            console.log("invalid vote")
            return res.status(400).json({ error: 'Invalid vote' });
          }

          let user = new PublicKey(account)
          let mint_key = new PublicKey(mint)
          let listing_account: PublicKey = PublicKey.findProgramAddressSync([mint_key.toBytes(), Buffer.from("Listing")], PROGRAM)[0];
            let user_data_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("User")], PROGRAM)[0];

            const instruction_data = serialise_HypeVote_instruction(0, vote_val);

            var account_vector = [
                { pubkey: user, isSigner: true, isWritable: true },
                { pubkey: user_data_account, isSigner: false, isWritable: true },
                { pubkey: listing_account, isSigner: false, isWritable: true },
                { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
            ];

            const list_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: PROGRAM,
                data: instruction_data,
            });

            let txArgs = await get_current_blockhash("");

            let instructions = []
            let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
            instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
            instructions.push(list_instruction);

            let message = new TransactionMessage({payerKey: user, recentBlockhash: txArgs.blockhash,instructions });
            let compiled = message.compileToV0Message();
            let transaction = new VersionedTransaction(compiled)
            let encoded_transaction = Buffer.from(transaction.serialize()).toString('base64')

    
            // Process the decoded account (this is a placeholder, replace with your actual logic)
            const processedData = {
              transaction: encoded_transaction,
              message: "Vote will be stored on chain.  One vote per user.  User account wil be created if it does not exist.  For more info visit letscook.wtf!"
            };
      
            res.status(200).json(processedData);
        } catch (error) {
          console.error('Error processing request:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      } 
    else {
      // Handle any other HTTP method
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }