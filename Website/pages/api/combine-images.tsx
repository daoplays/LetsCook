import { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import axios from 'axios';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM } from '../../components/Solana/constants';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";


const firebaseConfig = {
  // ...
  // The value of `databaseURL` depends on the location of the database
  databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com/",
};

// Function to escape special characters for XML
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}

// Function to clean the text by removing null characters and trimming
function cleanText(text: string): string {
  return (text || '').replace(/\u0000/g, '').trim();
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize Realtime Database and get a reference to the service
  const database = getDatabase(app);

  
  const { mint1, mint2 } = req.query;

  try {

    let token_mint1 = new PublicKey(mint1);
    let listing_account1 = PublicKey.findProgramAddressSync([token_mint1.toBytes(), Buffer.from("Listing")], PROGRAM)[0];
    const snapshot1 = await get(ref(database, "data/" + listing_account1.toString()));
    let listing1 = JSON.parse(snapshot1.val());

    let token_mint2 = new PublicKey(mint2);
    let listing_account2 = PublicKey.findProgramAddressSync([token_mint2.toBytes(), Buffer.from("Listing")], PROGRAM)[0];
    const snapshot2 = await get(ref(database, "data/" + listing_account2.toString()));
    let listing2 = JSON.parse(snapshot2.val());
    
    let url1 = listing1.icon;
    let url2 = listing2.icon;

    let text1 = [cleanText(listing1.name), "Current Hype: " + (listing1.positive_votes - listing1.negative_votes)];
    let text2 = [cleanText(listing2.name), "Current Hype: " + (listing2.positive_votes - listing2.negative_votes)];

    console.log(text1, JSON.stringify(text1))
    const [image1, image2] = await Promise.all([
      axios.get(url1 as string, { responseType: 'arraybuffer' }),
      axios.get(url2 as string, { responseType: 'arraybuffer' })
    ]);

    console.log(image1.data, image2.data)

     // Define dimensions
    const totalSize = 1000; // Total size of the square output
    const gapWidth = 10;
    const textHeight = 100;
    const imageWidth = (totalSize - gapWidth) / 2;
    const imageHeight = totalSize - textHeight;

    // Resize and process both images
    const [processedImage1, processedImage2] = await Promise.all([
      sharp(image1.data)
        .resize(imageWidth, imageHeight, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer(),
      sharp(image2.data)
        .resize(imageWidth, imageHeight, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer()
    ]);

    

    // Create SVGs for text
    const createTextSvg = (text, width) => {
      const lineHeight = 50;
      const fontSize = 24;
      const padding = 10; // Add padding to top and bottom
      const svgHeight = Math.max(textHeight, text.length * lineHeight + 2 * padding);
  
      return `
      <svg width="${width}" height="${svgHeight}">
        <style>
          .title { fill: black; font-size: ${fontSize}px; font-weight: bold; font-family: sans-serif; }
        </style>
        ${text.map((line, index) => 
          `<text x="50%" y="${(index + 0.5) * lineHeight}" text-anchor="middle" class="title">${escapeXml(line)}</text>`
        ).join('')}
        </svg>
    `;
    };

    const textSvg1 = createTextSvg(text1 , imageWidth);
    const textSvg2 = createTextSvg(text2 , imageWidth);

    // Create an SVG for the dividing line
    const lineSvg = `
      <svg width="${gapWidth}" height="${imageHeight}">
        <rect width="${gapWidth}" height="${imageHeight}" fill="black" />
      </svg>
    `;

    // Create the base canvas and composite everything
    const combinedImage = await sharp({
      create: {
        width: totalSize,
        height: totalSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      { input: processedImage1, left: 0, top: 0 },
      { input: Buffer.from(lineSvg), left: imageWidth, top: 0 },
      { input: processedImage2, left: imageWidth + gapWidth, top: 0 },
      { input: Buffer.from(textSvg1), left: 0, top: imageHeight },
      { input: Buffer.from(textSvg2), left: imageWidth + gapWidth, top: imageHeight }
    ])
    .jpeg()
    .toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(combinedImage);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to process images' });
  }
}