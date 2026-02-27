//Creating a function for token creation and handling
import {SignJWT , jwtVerify} from "jose";
//encodeing because the jose needs a Uint8Array for secret
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
// console.log(secret);
// import fs from "fs";
// import path from "path";
// import dotenv from "dotenv";
// import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // explicit path to this package's .env
// const envPath = path.resolve(__dirname, "..", ".env");

// // load .env here (only once). do not overwrite existing process.env values.
// if (fs.existsSync(envPath)) {
//   dotenv.config({ path: envPath });
// } else {
//   // optional: warn, but don't throw in CI; up to you
//   // console.warn(`No .env at ${envPath}`);
// }

// typed accessors (optional)
// export const TOKEN_SECRET = process.env.TOKEN_SECRET ?? "";

async function createToken(userId: string){

    const token = await new SignJWT({userId})
    .setExpirationTime("24h")
    .setProtectedHeader({alg : "HS256"})
    .setSubject(userId)
    .sign(secret);
   console.log("Generated Token:", token);
    if (token) return;
    throw new Error("Token generation failed");
}
// await createToken("testuser");
async function verifyToken(token: string){
    const {payload} = await jwtVerify(token, secret);
    const userId = payload.userId;
    // console.log("Verified User ID:", userId);
    if (typeof userId === "string" || userId !== "") return userId;
    throw new Error("Invalid token");
}

export {createToken, verifyToken};