const urlModel = require("../models/urlModel");
const validUrl = require('valid-url');

const shortid = require('shortid');
const validation = require("../validation/validation");
const BASE_URL=process.env.BASE_URL
const exportFunc = {
    createUrl: async (req, res) => {
        try {
            if (!validation.isValidReqBody(req.body)) {
                return res.status(400).send({ status: false, message: "Body data is missing" });
            }

            if (!validation.isValid(req.body.longUrl)) {
                return res.status(400).send({ status: false, message: "Please provide correct key value" })
            }
            if (typeof (req.body.longUrl) != 'string') {
                return res.status(400).send({ status: false, message: "Numbers are not allowed" })
            }

            const longUrl = req.body.longUrl.trim()
            const baseUrl = BASE_URL

            const urlParts = longUrl.split('//')
            const scheme = urlParts[0]

            const uri = urlParts[1]
            if (!(uri.includes('.'))) {
                return res.status(400).send({ status: false, msg: 'Invalid longUrl' })
            }
            const uriParts = uri.split('.')

            if (!((scheme == "http:") || (scheme == "https:"))) {
                return res.status(400).send({ status: false, msg: 'Invalid longUrl' })
            }
            const urlCode = shortid.generate().toLowerCase()
            if (validUrl.isUri(longUrl)) {
                let url = await urlModel.findOne({ longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })
                if (url) {

                    return res.status(200).send({ status: true, message:"short url fetched successfully! ",data: url })

                } else {

                    const shortUrl = baseUrl + '/' +urlCode

                    let urlData = { longUrl, shortUrl, urlCode }

                    const urlInfo = await urlModel.create(urlData);
                    return res.status(200).send({ status: true, message:"short url created successfully! ",data: urlInfo })
                }
            }else{
                return res.status(401).send({status:false,message:'Invalid longUrl'})
            }
            }catch (error) {

            return res.status(500).send({ status: false, message: error.message })
        }

    },

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
            return res.status(500).send({ status: false, message: error.message })
        }
    }
}
module.exports = exportFunc
