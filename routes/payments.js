const express = require("express");
const router = express.Router();
const axios = require("axios");
const { CheckLogin } = require("../utils/authHandler");
const reservationModel = require("../schemas/reservation");
const cartModel = require("../schemas/carts");
const { buildCreateSignature, buildReturnSignature } = require("../utils/momoService");

const momoConfig = {
  endpoint: process.env.MOMO_ENDPOINT,
  partnerCode: process.env.MOMO_PARTNER_CODE,
  accessKey: process.env.MOMO_ACCESS_KEY,
  secretKey: process.env.MOMO_SECRET_KEY,
  redirectUrl: process.env.MOMO_REDIRECT_URL,
  ipnUrl: process.env.MOMO_IPN_URL
};

function ensureConfig() {
  return (
    momoConfig.endpoint &&
    momoConfig.partnerCode &&
    momoConfig.accessKey &&
    momoConfig.secretKey &&
    momoConfig.redirectUrl &&
    momoConfig.ipnUrl
  );
}

router.post("/momo/create", CheckLogin, async (req, res) => {
  if (!ensureConfig()) {
    return res.status(500).send({ message: "MoMo config missing" });
  }
  const { reservationId } = req.body;
  if (!reservationId) {
    return res.status(400).send({ message: "reservationId is required" });
  }
  const reservation = await reservationModel.findById(reservationId);
  if (!reservation) {
    return res.status(404).send({ message: "reservation not found" });
  }
  if (String(reservation.user) !== String(req.user._id) && req.user.role?.name !== "ADMIN") {
    return res.status(403).send({ message: "ban khong co quyen" });
  }
  if (!reservation.amount || reservation.amount <= 0) {
    return res.status(400).send({ message: "amount invalid" });
  }

  const amountVnd = Math.round(reservation.amount || 0);
  if (amountVnd < 1000) {
    return res.status(400).send({ message: "amount too small", amount: amountVnd });
  }
  const requestId = Date.now().toString();
  const orderId = `RES_${reservation._id}_${Date.now()}`;
  const orderInfo = `Thanh toan don hang ${reservation._id}`;
  const requestType = "payWithCC";
  const extraData = "";

  const signature = buildCreateSignature(
    {
      accessKey: momoConfig.accessKey,
      amount: amountVnd.toString(),
      extraData,
      ipnUrl: momoConfig.ipnUrl,
      orderId,
      orderInfo,
      partnerCode: momoConfig.partnerCode,
      redirectUrl: momoConfig.redirectUrl,
      requestId,
      requestType
    },
    momoConfig.secretKey
  );

  const body = {
    partnerCode: momoConfig.partnerCode,
    partnerName: "NNPTUD Shoes",
    storeId: "NNPTUD_SHOES",
    requestId,
    amount: amountVnd,
    orderId,
    orderInfo,
    redirectUrl: momoConfig.redirectUrl,
    ipnUrl: momoConfig.ipnUrl,
    lang: "vi",
    extraData,
    orderType: "momo_wallet",
    autoCapture: true,
    requestType,
    signature
  };

  try {
    const response = await axios.post(momoConfig.endpoint, body, {
      headers: { "Content-Type": "application/json" }
    });
    const payUrl = response.data && response.data.payUrl;
    if (!payUrl) {
      return res.status(400).send({ message: "payUrl not returned", data: response.data });
    }
    reservation.paymentMethod = "MOMO";
    reservation.paymentStatus = "PENDING";
    reservation.momoOrderId = orderId;
    reservation.momoRequestId = requestId;
    await reservation.save();
    res.send({ payUrl });
  } catch (err) {
    const momoError = err.response && err.response.data ? err.response.data : null;
    res.status(400).send({ message: err.message, momo: momoError });
  }
});

router.get("/momo/return", async (req, res) => {
  if (!ensureConfig()) {
    return res.status(500).send("MoMo config missing");
  }
  const data = req.query;
  const expected = buildReturnSignature(
    {
      accessKey: momoConfig.accessKey,
      amount: data.amount || "",
      extraData: data.extraData || "",
      message: data.message || "",
      orderId: data.orderId || "",
      orderInfo: data.orderInfo || "",
      orderType: data.orderType || "",
      partnerCode: data.partnerCode || "",
      payType: data.payType || "",
      requestId: data.requestId || "",
      responseTime: data.responseTime || "",
      resultCode: data.resultCode || "",
      transId: data.transId || ""
    },
    momoConfig.secretKey
  );
  if (data.signature && expected !== data.signature) {
    return res.redirect("/cart.html?momo=invalid_signature");
  }

  const reservation = await reservationModel.findOne({ momoOrderId: data.orderId });
  if (!reservation) {
    return res.redirect("/cart.html?momo=order_not_found");
  }
  if (String(data.resultCode) === "0") {
    reservation.paymentStatus = "PAID";
    reservation.status = "paid";
    reservation.momoTransId = data.transId || null;
    await reservation.save();
    if (reservation.user) {
      await cartModel.findOneAndUpdate(
        { user: reservation.user },
        { items: [] },
        { new: true }
      );
    }
    return res.redirect("/history.html?momo=success");
  }
  reservation.paymentStatus = "FAILED";
  await reservation.save();
  return res.redirect("/cart.html?momo=failed");
});

router.post("/momo/ipn", async (req, res) => {
  if (!ensureConfig()) {
    return res.status(500).send("MoMo config missing");
  }
  const data = req.body;
  const expected = buildReturnSignature(
    {
      accessKey: momoConfig.accessKey,
      amount: data.amount || "",
      extraData: data.extraData || "",
      message: data.message || "",
      orderId: data.orderId || "",
      orderInfo: data.orderInfo || "",
      orderType: data.orderType || "",
      partnerCode: data.partnerCode || "",
      payType: data.payType || "",
      requestId: data.requestId || "",
      responseTime: data.responseTime || "",
      resultCode: data.resultCode || "",
      transId: data.transId || ""
    },
    momoConfig.secretKey
  );
  if (data.signature && expected !== data.signature) {
    return res.status(400).send({ message: "invalid signature" });
  }

  const reservation = await reservationModel.findOne({ momoOrderId: data.orderId });
  if (!reservation) {
    return res.status(404).send({ message: "order not found" });
  }
  if (String(data.resultCode) === "0") {
    reservation.paymentStatus = "PAID";
    reservation.status = "paid";
    reservation.momoTransId = data.transId || null;
    await reservation.save();
    if (reservation.user) {
      await cartModel.findOneAndUpdate(
        { user: reservation.user },
        { items: [] },
        { new: true }
      );
    }
  } else {
    reservation.paymentStatus = "FAILED";
    await reservation.save();
  }
  res.status(200).send({ message: "ok" });
});

module.exports = router;
