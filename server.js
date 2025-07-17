const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const emailjs = require('emailjs-com');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/send-email', (req, res) => {
  const { email, displayName, productName } = req.body;

  const templateParams = {
    to_email: email,
    to_name: displayName,
    product_name: productName,
  };

  emailjs.send('service_o6j8fde', 'template_v2cdayw', templateParams, 'EbB8JDvyqsTaroPPF')
    .then(response => {
      res.status(200).send('Email sent successfully');
    })
    .catch(error => {
      console.error('Error sending email:', error);
      res.status(500).send('Failed to send email');
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
