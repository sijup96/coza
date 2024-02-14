
const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler')

const sendEmail = asyncHandler(async (data, req, res) => {


  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: process.env.MAIL_ID,
      pass: process.env.MP,
    },
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Hey.. 👻" <cozastore@gmail.com>', // sender address
    to: data.to, // list of receivers
    subject: data.subject, // Subject line
    text: data.text, // plain text body
    html: data.htm, // html body
  });

  console.log("Message sent: %s", info.messageId);

  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

})


module.exports = sendEmail