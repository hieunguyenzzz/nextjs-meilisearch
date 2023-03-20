// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import NextCors from 'nextjs-cors';
const { MeiliSearch } = require('meilisearch')
const client = new MeiliSearch({
  host: process.env.MEILISEARCH_ENDPOINT,
  apiKey: process.env.MEILISEARCH_KEY,
})

export default async function  handler(req, res) {
  let { query, store } = req.query;
  if (!store) {
    store = 'en';
  }
  let site = '';
  if (process.env.SITE) {
    site = process.env.SITE + '_';
  }
  console.log(site+'store_' + store + '_product');
  console.log(site+'store_' + store + '_category');
  console.log(site+'store_' + store + '_suggestion');
  const productResult = await client.index(site+'store_' + store + '_product').search(query);
  const categoryResult = await client.index(site+'store_' + store + '_category').search(query);
  const suggestionResult = await client.index(site+'store_' + store + '_suggestion').search(query);

  await NextCors(req, res, {
    // Options
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    headers: {
      'Access-Control-Allow-Origin': '*', // Replace * with your desired origin(s)
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    },
  });

  res.status(200).json({productResult, categoryResult, suggestionResult})
}
