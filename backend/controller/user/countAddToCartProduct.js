const addToCartModel = require("../../models/cartProduct")

const countAddToCartProduct = async(req,res) => {
    try {
        const userId = req.user
        const count = await addToCartModel.countDocuments({
            userId : userId
        })

        res.json({
            data : {
                count : count
            },
            message : "Ok",
            error : false,
            success : true
        })
    }catch(error){
        res.json({
            message : error.message || error,
            error : false,
            success : false,
        })
    }
}

module.exports = countAddToCartProduct