const express = require("express");
const app = express();
const router = express.Router();

const https = require("https");
const qs = require("querystring");

const checksum_lib = require("../Paytm/checksum");
const config = require("../Paytm/config");

const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });

const Payment = require('../models/paymentModel');
const Product = require('../models/products');


var name, amount, phone, user_id, products, country, state, pincode, address, order_id, payment_mode,pro = [], quantity=[];
router.post("/paynow", [parseUrl, parseJson], async (req, res) => {
  // Route for making payment
  var paymentDetails = {
    amount: req.body.totalAmount,
    customerId: req.body.name,
    customerEmail: req.body.email,
    customerPhone: req.body.contact,
  }

  name = req.body.name;
  amount = req.body.totalAmount;
  phone = req.body.contact;
  user_id = req.body.user_id;
  products = req.body.products;
  id = products.split(",");
  q = req.body.proQuant;
  quan = q.split(",");
  for(var i=0; i<quan.length; i++) {
  qua = quan[i].toString().replace(/^"|"$/g, "");
  quantity.push(qua.split('"').join(''));
  console.log(quantity);
  }
  country = req.body.country;
  state = req.body.state;
  pincode = req.body.pincode;
  address = req.body.address;


  console.log(paymentDetails);
  if (!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
    res.render('shop/payment-failed');
  } else {
    var params = {};
    params['MID'] = config.PaytmConfig.mid;
    params['WEBSITE'] = config.PaytmConfig.website;
    params['CHANNEL_ID'] = 'WEB';
    params['INDUSTRY_TYPE_ID'] = 'Retail';
    params['ORDER_ID'] = 'TEST_' + new Date().getTime();
    params['CUST_ID'] = paymentDetails.customerId;
    params['TXN_AMOUNT'] = paymentDetails.amount;
    params['CALLBACK_URL'] = 'https://feel-fit.herokuapp.com/checkout';
    params['EMAIL'] = paymentDetails.customerEmail;
    params['MOBILE_NO'] = paymentDetails.customerPhone;

    order_id = params['ORDER_ID'];

    checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
      var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
      // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

      var form_fields = "";
      for (var x in params) {
        form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
      }
      form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
      res.end();
    });
  }
});
router.post("/callback", async (req, res) => {
  // Route for verifiying payment

  var body = '';

  req.on('data', async function (data) {
    body += data;
  });

  req.on('end', async function () {
    var html = "";
    var post_data = qs.parse(body);

    // received params in callback
    console.log('Callback Response: ', post_data, "\n");


    // verify the checksum
    var checksumhash = post_data.CHECKSUMHASH;
    // delete post_data.CHECKSUMHASH;
    var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);
    console.log("Checksum Result => ", result, "\n");


    // Send Server-to-Server request to verify Order Status
    var params = { "MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID };

    checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {

      params.CHECKSUMHASH = checksum;
      post_data = 'JsonData=' + JSON.stringify(params);

      var options = {
        hostname: 'securegw-stage.paytm.in', // for staging
        // hostname: 'securegw.paytm.in', // for production
        port: 443,
        path: '/merchant-status/getTxnStatus',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': post_data.length
        }
      };


      // Set up the request
      var response = "";
      var post_req = https.request(options, function (post_res) {
        post_res.on('data', function (chunk) {
          response += chunk;
        });

        
        
        post_res.on('end', async function () {
          console.log('S2S Response: ', response, "\n");

          var _result = JSON.parse(response);
          payment_mode= _result.PAYMENTMODE;

          if (_result.STATUS == 'TXN_SUCCESS') {
            var names=[], ids=[];
            for(var i=0; i<id.length; i++)
            { 
              idd = id[i].toString().replace(/^"|"$/g, "");
              ids.push(idd);
              iddd = idd.split('"').join('');
              data = await Product.find({_id:iddd});
              names.push(data[0].product_name);
            }

            var Details = new Payment({
              name: name,
              amount: amount,
              phone: phone,
              user_id: user_id,
              product_id: ids,
              products: names,
              quantity: quantity,
              country: country,
              state: state,
              pincode: pincode,
              address: address,
              payment_mode: payment_mode,
              payment_status: 'success',
              order_id: order_id,
              order_status: 'Order Placed',
            })
            saved = await Details.save();
            if (saved) {
              res.render('shop/payment-success');
            }
          } else {
            res.render('shop/payment-failed');
          }
        });
      });

      // post the data
      post_req.write(post_data);
      post_req.end();
    });
  });
});

module.exports = router;

