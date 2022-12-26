require('dotenv').config()

const {request, gql} = require('graphql-request');
const {MeiliSearch} = require('meilisearch')
const {uid} = require('uid');

const endpoint = process.env.MAGENTO_ENDPOINT;
const client = new MeiliSearch({host: process.env.MEILISEARCH_ENDPOINT, apiKey: process.env.MEILISEARCH_KEY})

const query = gql`
    {
        products(filter:{category_id: {in: "2"}}, currentPage:1, pageSize: 9999){
            items {
                __typename

                id
                name
                url_key
                image {
                    label
                    url
                }
                media_gallery {
                    url
                    label
                    position

                }
                description {
                    html
                }
                categories {
                    name
                    id
                }
                price_range {
                    maximum_price {
                        regular_price {
                            currency
                            value
                        }
                        final_price {
                            currency
                            value
                        }
                    }

                    minimum_price {
                        regular_price {
                            currency
                            value
                        }
                        final_price {
                            currency
                            value
                        }
                    }
                }
                promotion
                ... on ConfigurableProduct{
                    configurable_options{
                        values {
                            label
                        }
                        label
                    }

                    variants {
                        product {
                            sku
                            promotion

                            name
                            image {
                                url
                                label
                            }
                            media_gallery {
                                url
                                label
                                position
                            }
                            url_key
                        }
                    }


                }
            }
        }
    }
`
const mapLoop = async _ => {
    const stores = ['en']

    for( const store of stores) {
        console.log(store);
        const requestHeaders = {
            Store: store
          }
          const res = await request(endpoint, query, {}, requestHeaders);
          const {products: {items}} = res;
            const documents = [];
            const suggestionDocs = [];
            const categoryDocs = [];
            client.index('store_'+store+'_product').delete();
            //client.index('store_en_category').delete();
            client.index('store_'+store+'_suggestion').delete();
        
            const productIndex = client.index('store_'+store+'_product');
            const categoryIndex = client.index('store_'+store+'_category');
            const suggestionIndex = client.index('store_'+store+'_suggestion');
        
            for (const item of items) {
                const {categories, name} = item;
                if (item.__typename === 'ConfigurableProduct') {
                    categories.forEach(category => {
                        categoryDocs.push(category.name);
                    });
        
                    name.split(' ').forEach(n => {
                        suggestionDocs.push(n);
                    });
                    for (const variant of item.variants) {
                        const {product} = variant;
                        
                        
                    }
                    var formatter = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: item.price_range.minimum_price.final_price.currency,
                      
                        // These options are needed to round to whole numbers if that's what you want.
                        //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
                        //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
                      });
                      let imgUrl = item.image.url;
                      if (imgUrl.includes('placeholder')) {
                        if (item.media_gallery.find(m => !m.label)) {
                            imgUrl = item.media_gallery.find(m => !m.label).url;
                        }
                      }
                    documents.push({
                        id: uid(),
                        image: imgUrl.replace(/cache\/\w*\//g, '').replace('https://static.mobelaris.com', 'https://res.cloudinary.com/dfgbpib38/image/upload/w_800,f_auto/mobelaris'),
                        image_alt: item.image.label,
                        name: item.name,
                        final_price: formatter.format(item.price_range.minimum_price.final_price.value),
                        normal_price: formatter.format(item.price_range.minimum_price.regular_price.value),
                        url: 'https://www.mobelaris.com/'+store+'/'+ item.url_key
        
                    })
                }
            }
        
            suggestionIndex.addDocuments(suggestionDocs.filter((value, index, self) => {
                return self.indexOf(value) === index
            }).map(item => ({id: uid(), text: item}))).then(res => console.log(res));
        
            categoryIndex.addDocuments(categoryDocs.filter((value, index, self) => {
                return self.indexOf(value) === index
            }).map(item => ({id: uid(), text: item}))).then(res => console.log(res));
        
            productIndex.addDocuments(documents).then(res => console.log(res));
  
    
    }
        
        
}

mapLoop();