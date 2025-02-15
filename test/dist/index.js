"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
const cloudinary_1 = __importDefault(require("cloudinary"));
const crypto_1 = __importDefault(require("crypto"));
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const generateSignedUrl = () => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "uploads";
    const paramsToSign = {
        folder,
        timestamp,
    };
    let stringToSign = Object.keys(paramsToSign)
        .sort()
        .map((key) => `${key}=${paramsToSign[key]}`)
        .join("&");
    stringToSign = stringToSign + API_SECRET;
    console.log("Exact String to Sign:", `'${stringToSign}'`);
    const signature = crypto_1.default
        .createHash("sha1")
        .update(stringToSign)
        .digest("hex");
    console.log("Generated Signature:", signature);
    return {
        url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        params: {
            api_key: API_KEY,
            timestamp,
            folder,
            signature,
        },
    };
};
console.log(generateSignedUrl());
/*
const generateSignedUrlAuto = () => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
        timestamp,
        folder: "uploads",
    };

    const signature = cloudinary.v2.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET as string);

    return {
        url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        params: {
            ...paramsToSign,
            api_key: process.env.CLOUDINARY_API_KEY,
            signature,
        },
    };
};
*/
