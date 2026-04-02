const crypto = require("crypto");

function signHmacSHA256(raw, secretKey) {
  return crypto.createHmac("sha256", secretKey).update(raw).digest("hex");
}

function buildCreateSignature(params, secretKey) {
  const raw =
    "accessKey=" + params.accessKey +
    "&amount=" + params.amount +
    "&extraData=" + params.extraData +
    "&ipnUrl=" + params.ipnUrl +
    "&orderId=" + params.orderId +
    "&orderInfo=" + params.orderInfo +
    "&partnerCode=" + params.partnerCode +
    "&redirectUrl=" + params.redirectUrl +
    "&requestId=" + params.requestId +
    "&requestType=" + params.requestType;
  return signHmacSHA256(raw, secretKey);
}

function buildReturnSignature(params, secretKey) {
  const raw =
    "accessKey=" + params.accessKey +
    "&amount=" + params.amount +
    "&extraData=" + params.extraData +
    "&message=" + params.message +
    "&orderId=" + params.orderId +
    "&orderInfo=" + params.orderInfo +
    "&orderType=" + params.orderType +
    "&partnerCode=" + params.partnerCode +
    "&payType=" + params.payType +
    "&requestId=" + params.requestId +
    "&responseTime=" + params.responseTime +
    "&resultCode=" + params.resultCode +
    "&transId=" + params.transId;
  return signHmacSHA256(raw, secretKey);
}

module.exports = {
  signHmacSHA256,
  buildCreateSignature,
  buildReturnSignature
};
