const urlModel = require("../models/urlModel");
const validUrl = require('valid-url');

const shortid = require('shortid');
const validation = require("../validation/validation");


//------------------------1.Create URL---------------------------------------------------------
const exportFunc = {
    createUrl: async (req, res) => {
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
            const uriParts = uri.split('.')

            if (!((scheme == "http:") || (scheme == "https:")) && (uriParts[0].trim().length) && (uriParts[1].trim().length)) {
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

    },


    //----------------------------------------2.Get Url---------------------------------------------------------------
    getUrl: async (req, res) => {
        try {
            let originalUrlDetails = await urlModel.findOne({ urlCode: req.params.urlCode });
            if (!originalUrlDetails) {
                return res.status(404).send({ status: false, message: "Url Not Found!!" })
            }
            else {
                return res.redirect(307, originalUrlDetails.longUrl)
            }

        }
        catch (error) {
            console.log(error.stack)
            return res.status(500).send({ status: false, message: error.stack })
        }
    }
}
module.exports = exportFunc
