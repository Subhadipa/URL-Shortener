const urlModel = require("../models/urlModel");
const validUrl = require('valid-url');

const shortid = require('shortid');
const validation = require("../validation/validation");
const redis = require("redis");
const { promisify } = require("util");



//Connect to redis
const redisClient = redis.createClient
(
    16386,//6379
    "redis-16386.c264.ap-south-1-1.ec2.cloud.redislabs.com",//Ip address
    { no_ready_check: true }
);
  redisClient.auth("B3F19MMVhCYyVFD7xGAxfuFtXWUcTb8g", function (err) //password empty
  {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () 
  {
    console.log("Connected to Redis..");
  });
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//------------------------1.Create URL---------------------------------------------------------

const createUrl = async  (req, res)=> 
{   
    try {
        if (!validation.isValidReqBody(req.body)) {    
            // Check Req Body is Not Empty or allways >0 if not then pass a msg
            return res.status(400).send({ status: false, message: "Body data is missing" });
        }

        if (!validation.isValid(req.body.longUrl)) {  
            return res.status(400).send({ status: false, message: "Please provide correct key value" })
        }
        if (typeof (req.body.longUrl) != 'string') {  
            return res.status(400).send({ status: false, message: "Numbers are not allowed" })
        }

        const longUrl = req.body.longUrl.trim()  
        if (!(longUrl.includes('//'))) {
            return res.status(400).send({ status: false, msg: 'Invalid longUrl' })
        }
        
       
        const urlParts = longUrl.split('//')
     //console.log(urlParts)
        const scheme = urlParts[0]
     
        const uri = urlParts[1]
        console.log(uri)
        if (!(uri.includes('.'))) {
            return res.status(400).send({ status: false, msg: 'Invalid longUrl' })
        }
        const uriParts=uri.split('.')
       
        if (!((scheme == "http:") || (scheme == "https:"))&& (uriParts[0].trim().length)&& (uriParts[1].trim().length)) {
            return res.status(400).send({ status: false, msg: 'Invalid longUrl' })
        }
        const baseUrl = 'http://localhost:3000'  

        if (!validUrl.isUri(baseUrl)) {  
            return res.status(400).send({ status: false, msg: 'Invalid base URL' })
        }
        const urlCode = shortid.generate().toLowerCase()
        //console.log(urlCode)
        if (validUrl.isUri(longUrl)) {
            let url = await urlModel.findOne({ longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
            if (url) {
            
            return res.status(200).send({ status: true, data: url })
               
            } else {

                const shortUrl = baseUrl + '/' + urlCode.toLowerCase()

                let urlData = { longUrl, shortUrl, urlCode }

                const urlInfo = await urlModel.create(urlData);
                const urlInfo1 = await urlModel.findOne({ _id: urlInfo._id }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
                await SET_ASYNC(urlCode.toLowerCase(), longUrl);    
                return res.status(201).send({ status: true, msg: urlInfo1 })
            }
        }
        else {
            return res.status(400).send({ status: false, msg: 'Invalid longUrl' })
        }
    }
    catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }

}


//----------------------------------------2.Get Url---------------------------------------------------------------
const getUrl = async (req, res)=> 
{
    try
    {
      
        let cachedLongUrl = await GET_ASYNC(`${req.params.urlCode}`)
     
        if(cachedLongUrl) 
        {
          return res.redirect(307, cachedLongUrl)
          
        }
         else
        {
         let originalUrlDetails = await urlModel.findOne({urlCode:req.params.urlCode});
      
             if (!originalUrlDetails) 
             {
                 return res.status(404).send({ status: false, message: "Url Not Found!!" })
             }
             else
             {
              //  await SET_ASYNC(`${req.params.urlCode}`,JSON.stringify(url))//redis take argument as string
               
                 return res.redirect(307, url.longUrl)
             }
         }
    }
    catch (error) 
    {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports = { createUrl, getUrl }
