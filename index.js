const express = require("express");
const axios = require("axios");
const faker = require("faker");
const random = require("random");
const qs = require("qs");
const { UserAgent } = require("user-agents");

const ua = new UserAgent();

const TEMPMAIL_API = 'https://api.internal.temp-mail.io/api/v3';
const FB_REG_URL = 'https://www.facebook.com/reg';

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve static files (like HTML, CSS, JS) from the 'public' directory

async function generateEmail() {
    try {
        const response = await axios.post(`${TEMPMAIL_API}/email/new`);
        return response.data.email;
    } catch (error) {
        console.error("Error generating email:", error);
        return null;
    }
}

async function fetchOTP(email) {
    try {
        const response = await axios.get(`${TEMPMAIL_API}/email/${email}/messages`);
        const message = response.data[0];
        const otp = message.body_text.match(/FB-(\d+)/);
        return otp ? otp[1] : null;
    } catch (error) {
        console.error("Error fetching OTP:", error);
        return null;
    }
}

async function submitRegistration(email, otp) {
    try {
        const firstName = faker.firstName();
        const lastName = faker.lastName();
        const password = "TestPassword123";  // Customize your password as needed

        const payload = {
            ccp: "2",
            reg_instance: random.int(1, 1000).toString(),
            reg_impression_id: random.int(1, 1000).toString(),
            reg_email__: email,
            firstName,
            lastName,
            password,
            birthday_day: random.int(1, 28),
            birthday_month: random.int(1, 12),
            birthday_year: random.int(1992, 2009),
            sex: "2", // Female, change to "1" for male if needed
            encpass: `#PWD_BROWSER:0:${Date.now()}:unknown404`,
            fb_dtsg: "NAcMC2x5X2VrJ7jhipS0eIpYv1zLRrDsb5y2wzau2bw3ipw88fbS_9A:0:0",
            jazoest: random.int(1, 1000).toString(),
            lsd: random.int(1, 1000).toString(),
            submit: "Sign Up"
        };

        const headers = {
            "User-Agent": ua.toString(),
            "Content-Type": "application/x-www-form-urlencoded",
        };

        const response = await axios.post(FB_REG_URL, qs.stringify(payload), { headers });

        if (response.data.includes("c_user")) {
            return {
                status: true,
                email,
                message: "Account successfully registered",
                cookies: response.headers["set-cookie"]
            };
        } else {
            return {
                status: false,
                email,
                message: "Account registration failed"
            };
        }
    } catch (error) {
        console.error("Error during registration:", error);
        return {
            status: false,
            email,
            message: "Error during registration"
        };
    }
}

app.get("/fb_otp_auto_create", async (req, res) => {
    try {
        const email = req.query.email;

        if (!email) {
            const generatedEmail = await generateEmail();
            if (!generatedEmail) {
                return res.status(500).json({ status: false, error: "Failed to generate email" });
            }

            return res.json({
                creator: "Yasis",
                API: "TempMail",
                email: generatedEmail,
                check_otp: `/fb_otp_auto_create?email=${generatedEmail}`
            });
        }

        let otp = null;
        let retries = 0;
        const maxRetries = 15;

        while (retries < maxRetries) {
            otp = await fetchOTP(email);
            if (otp) break;
            retries++;
            console.log(`Attempt ${retries}: OTP not found, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); 
        }

        if (!otp) {
            return res.status(400).json({ status: false, error: "OTP not found, please try again later" });
        }

        const registrationResult = await submitRegistration(email, otp);
        return res.json(registrationResult);
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ status: false, error: "Internal server error" });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});