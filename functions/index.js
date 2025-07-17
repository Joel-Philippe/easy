const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'YOUR_EMAIL@gmail.com',
    pass: 'YOUR_EMAIL_PASSWORD'
  }
});

exports.sendOrderConfirmation = functions.firestore
  .document('orders/{orderId}')
  .onCreate((snap, context) => {
    const order = snap.data();
    const mailOptions = {
      from: 'YOUR_EMAIL@gmail.com',
      to: order.receiverEmail,
      subject: 'Confirmation de commande',
      text: `Votre commande pour le produit "${order.productTitle}" est en cours de livraison. Temps de livraison estimé: ${order.deliveryTime}.`
    };

    return transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  });
