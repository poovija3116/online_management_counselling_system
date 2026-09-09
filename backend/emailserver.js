const nodemailer = require("nodemailer");

// =====================================================
// GMAIL EMAIL TRANSPORTER
// =====================================================

function getEmailTransporter() {

    const emailUser =
        String(
            process.env.EMAIL_USER ||
            process.env.SMTP_USER ||
            ""
        ).trim();

    const emailPass =
        String(
            process.env.EMAIL_PASS ||
            process.env.SMTP_PASS ||
            ""
        ).trim();


    if (!emailUser || !emailPass) {

        throw new Error(
            "Email service is not configured"
        );

    }


    return {
        transporter: nodemailer.createTransport({
            service: "gmail",

            auth: {
                user: emailUser,
                pass: emailPass
            }
        }),

        emailUser
    };
}


// =====================================================
// SEND STUDENT LOGIN CREDENTIALS
// =====================================================

async function sendStudentCredentials(
    studentEmail,
    studentName,
    username,
    temporaryPassword
) {

    const recipientEmail =
        String(studentEmail || "")
            .trim()
            .toLowerCase();

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailRegex.test(recipientEmail)) {

        throw new Error(
            "Invalid student email address"
        );

    }


    const {
        transporter,
        emailUser
    } = getEmailTransporter();


    const mailOptions = {

        from:
            `"GCE Erode Counselling" <${emailUser}>`,

        to:
            recipientEmail,

        subject:
            "GCE Erode Counselling - Student Login Credentials",

        html: `
        <!DOCTYPE html>

        <html>

        <body style="
            font-family: Arial, sans-serif;
            background-color: #f4f6f8;
            padding: 30px;
        ">

            <div style="
                max-width: 600px;
                margin: auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
            ">

                <h2>
                    GCE Erode Counselling
                </h2>

                <p>
                    Dear <strong>${studentName}</strong>,
                </p>

                <p>
                    Your student account has been created successfully
                    by the counselling administration.
                </p>

                <h3>
                    Your Login Credentials
                </h3>

                <table style="
                    width: 100%;
                    border-collapse: collapse;
                ">

                    <tr>
                        <td style="padding: 10px;">
                            <strong>Username</strong>
                        </td>

                        <td style="padding: 10px;">
                            ${username}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 10px;">
                            <strong>Temporary Password</strong>
                        </td>

                        <td style="padding: 10px;">
                            ${temporaryPassword}
                        </td>
                    </tr>

                </table>

                <p>
                    Please use these credentials to log in to
                    the GCE Erode Counselling portal.
                </p>

                <p>
                    For security, please change your password
                    after your first login.
                </p>

                <br>

                <p>
                    Regards,<br>
                    <strong>
                        GCE Erode Counselling Administration
                    </strong>
                </p>

            </div>

        </body>

        </html>
        `
    };


    return transporter.sendMail(mailOptions);
}


// =====================================================
// SEND COUNSELLING SCHEDULE EMAIL
// =====================================================

async function sendCounsellingScheduleEmail(
    studentEmail,
    studentName,
    roundNumber,
    minRank,
    maxRank,
    preferenceStart,
    preferenceEnd,
    allotmentAt,
    paymentDeadline
) {

    const recipientEmail =
        String(studentEmail || "")
            .trim()
            .toLowerCase();


    if (!recipientEmail) {

        throw new Error(
            "Student email is missing"
        );

    }


    const {
        transporter,
        emailUser
    } = getEmailTransporter();


    // -------------------------------------------------
    // Format date and time
    // -------------------------------------------------

    const formatDateTime = (value) => {

        if (!value) {
            return "Not announced";
        }


        const date =
            new Date(value);


        if (Number.isNaN(date.getTime())) {
            return "Not announced";
        }


        return date.toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    };


    // -------------------------------------------------
    // Email
    // -------------------------------------------------

    const mailOptions = {

        from:
            `"GCE Erode Counselling" <${emailUser}>`,

        to:
            recipientEmail,

        subject:
            `GCE Erode Counselling - Round ${roundNumber} Schedule`,

        html: `
        <!DOCTYPE html>

        <html>

        <body style="
            margin: 0;
            padding: 30px;
            background-color: #f4f6f8;
            font-family: Arial, sans-serif;
        ">

            <div style="
                max-width: 650px;
                margin: auto;
                padding: 25px;
                border: 1px solid #d9e8dc;
                border-radius: 10px;
                background: #ffffff;
            ">

                <h2 style="
                    color: #176b3a;
                    margin-bottom: 5px;
                ">

                    Government College of Engineering, Erode

                </h2>


                <p style="
                    color: #555;
                    margin-top: 0;
                ">

                    Online Management Counselling

                </p>


                <hr>


                <p>

                    Dear
                    <strong>
                        ${studentName || "Student"}
                    </strong>,

                </p>


                <p>

                    You are eligible to participate in
                    <strong>
                        Round ${roundNumber}
                    </strong>
                    of the online counselling process.

                </p>


                <div style="
                    background: #f1f8f3;
                    padding: 18px;
                    border-radius: 8px;
                    margin: 20px 0;
                ">

                    <h3 style="
                        color: #176b3a;
                    ">

                        Your Counselling Details

                    </h3>


                    <p>

                        <strong>
                            Round:
                        </strong>

                        ${roundNumber}

                    </p>


                    <p>

                        <strong>
                            Eligible Rank Range:
                        </strong>

                        ${minRank} - ${maxRank}

                    </p>


                    <p>

                        <strong>
                            Choice Filling Opens:
                        </strong>

                        ${formatDateTime(preferenceStart)}

                    </p>


                    <p>

                        <strong>
                            Choice Filling Closes:
                        </strong>

                        ${formatDateTime(preferenceEnd)}

                    </p>


                    <p>

                        <strong>
                            Allotment:
                        </strong>

                        ${formatDateTime(allotmentAt)}

                    </p>


                    <p>

                        <strong>
                            Payment Deadline:
                        </strong>

                        ${formatDateTime(paymentDeadline)}

                    </p>

                </div>


                <p>

                    Please log in to the counselling portal during
                    the specified choice-filling period and submit
                    your department preferences.

                </p>


                <p>

                    Choice filling will automatically open and close
                    according to the schedule set by the counsellor.

                </p>


                <br>


                <p>

                    Regards,<br>

                    <strong>
                        GCE Erode Counselling Team
                    </strong>

                </p>

            </div>

        </body>

        </html>
        `
    };


    return transporter.sendMail(
        mailOptions
    );

}


// =====================================================
// SEND CORRECTION RESOLVED EMAIL
// =====================================================

async function sendCorrectionResolvedEmail(
    studentEmail,
    studentName
) {

    const recipientEmail =
        String(studentEmail || "")
            .trim()
            .toLowerCase();


    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailRegex.test(recipientEmail)) {

        throw new Error(
            "Invalid student email address"
        );

    }


    const {
        transporter,
        emailUser
    } = getEmailTransporter();


    // -------------------------------------------------
    // EMAIL
    // -------------------------------------------------

    const mailOptions = {

        from:
            `"GCE Erode Counselling" <${emailUser}>`,

        to:
            recipientEmail,

        subject:
            "GCE Erode Counselling - Correction Request Updated",

        html: `
        <!DOCTYPE html>

        <html>

        <body style="
            margin: 0;
            padding: 30px;
            background-color: #f4f6f8;
            font-family: Arial, sans-serif;
        ">

            <div style="
                max-width: 650px;
                margin: auto;
                padding: 30px;
                border: 1px solid #d9e8dc;
                border-radius: 12px;
                background: #ffffff;
            ">

                <h2 style="
                    color: #176b3a;
                    margin-bottom: 5px;
                ">

                    Government College of Engineering, Erode

                </h2>


                <p style="
                    color: #555;
                    margin-top: 0;
                ">

                    Online Management Counselling

                </p>


                <hr>


                <p>

                    Dear
                    <strong>
                        ${studentName || "Student"}
                    </strong>,

                </p>


                <p>

                    Your correction request submitted through
                    the Online Management Counselling System
                    has been reviewed by the administrator.

                </p>


                <div style="
                    background: #f1f8f3;
                    padding: 18px;
                    border-radius: 8px;
                    margin: 20px 0;
                ">

                    <h3 style="
                        color: #176b3a;
                        margin-top: 0;
                    ">

                        Correction Request Updated

                    </h3>


                    <p>

                        The requested student information has been
                        successfully corrected and updated in the
                        counselling system.

                    </p>


                    <p>

                        Your updated information is now available
                        in your student dashboard.

                    </p>

                </div>


                <p>

                    Please log in to the GCE Erode Counselling portal
                    and check your <strong>My Application</strong>
                    page to verify the updated information.

                </p>


                <br>


                <p>

                    Regards,<br>

                    <strong>
                        GCE Erode Counselling Team
                    </strong>

                </p>

            </div>

        </body>

        </html>
        `
    };


    return transporter.sendMail(
        mailOptions
    );

}


// =====================================================
// EXPORT ALL EMAIL FUNCTIONS
// =====================================================

module.exports = {

    sendStudentCredentials,

    sendCounsellingScheduleEmail,

    sendCorrectionResolvedEmail

};