const multer = require('multer')
const path = require('path')

// Multer middleware configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "public", "productImages"));
    },
    filename: (req, file, cb) => {
        const name = file.originalname;
        cb(null, name);
    }
});
// Configuring Multer middleware with the defined storage settings
const upload = multer({ storage: storage }).array('images');

module.exports={upload}