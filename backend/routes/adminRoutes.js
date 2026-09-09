const express = require("express");

const {
    authenticateToken,
    requireRole
} = require("../middleware/authMiddleware");

const db = require("../config/db");

// Email function
const {
    sendStudentCredentials
} = require("../emailserver");

const router = express.Router();


// =====================================
// ADMIN DASHBOARD ACCESS
// =====================================

router.get(
    "/dashboard",
    authenticateToken,
    requireRole("admin"),
    (req, res) => {

        res.json({
            success: true,
            message: "Admin dashboard access granted",
            user: req.user
        });

    }
);


// =====================================
// ADD NEW STUDENT
// CREATE ACCOUNT + APPLICATION + EMAIL
// =====================================

router.post(
    "/students",
    authenticateToken,
    requireRole("admin"),
    async (req, res) => {

        const connection = await db.getConnection();

        try {

            const {
                name,
                email,
                password,
                date_of_birth,
                application_number,
                cutoff_mark,
                community
            } = req.body;


            // =====================================
            // VALIDATION
            // =====================================

            if (
                !name ||
                !email ||
                !password ||
                !date_of_birth ||
                !application_number ||
                cutoff_mark === undefined ||
                !community
            ) {

                return res.status(400).json({
                    success: false,
                    message: "All student details are required"
                });

            }


            const studentName =
                String(name).trim();

            const studentEmail =
                String(email)
                    .trim()
                    .toLowerCase();

            const applicationNumber =
                String(application_number).trim();

            const studentCommunity =
                String(community).trim();

            const cutoff =
                Number(cutoff_mark);


            // =====================================
            // VALIDATE CUTOFF
            // =====================================

            if (
                Number.isNaN(cutoff) ||
                cutoff < 0 ||
                cutoff > 200
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid cutoff mark"
                });

            }


            // =====================================
            // VALIDATE EMAIL
            // =====================================

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(studentEmail)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid email address"
                });

            }


            // =====================================
            // START TRANSACTION
            // =====================================

            await connection.beginTransaction();


            // =====================================
            // CHECK DUPLICATE EMAIL
            // =====================================

            const [existingUsers] =
                await connection.execute(
                    `
                    SELECT id
                    FROM users
                    WHERE email = ?
                    LIMIT 1
                    `,
                    [studentEmail]
                );


            if (existingUsers.length > 0) {

                await connection.rollback();

                return res.status(409).json({
                    success: false,
                    message:
                        "This email / username already exists"
                });

            }


            // =====================================
            // CHECK DUPLICATE APPLICATION
            // =====================================

            const [existingApplications] =
                await connection.execute(
                    `
                    SELECT id
                    FROM applications
                    WHERE application_number = ?
                    LIMIT 1
                    `,
                    [applicationNumber]
                );


            if (existingApplications.length > 0) {

                await connection.rollback();

                return res.status(409).json({
                    success: false,
                    message:
                        "This application number already exists"
                });

            }


            // =====================================
            // GET NEXT RANK
            // =====================================

            const [rankRows] =
                await connection.execute(
                    `
                    SELECT
                        COALESCE(
                            MAX(rank_number),
                            0
                        ) + 1 AS next_rank
                    FROM students
                    `
                );


            const nextRank =
                rankRows[0].next_rank;


            // =====================================
            // HASH PASSWORD
            // =====================================

            const bcrypt =
                require("bcrypt");

            const hashedPassword =
                await bcrypt.hash(
                    String(password),
                    10
                );


            // =====================================
            // CREATE USER
            // =====================================

            const [userResult] =
                await connection.execute(
                    `
                    INSERT INTO users
                    (
                        name,
                        email,
                        password,
                        role
                    )
                    VALUES (?, ?, ?, 'student')
                    `,
                    [
                        studentName,
                        studentEmail,
                        hashedPassword
                    ]
                );


            const userId =
                userResult.insertId;


            // =====================================
            // CREATE STUDENT
            // =====================================

            const [studentResult] =
                await connection.execute(
                    `
                    INSERT INTO students
                    (
                        user_id,
                        date_of_birth,
                        community,
                        cutoff_mark,
                        rank_number
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        userId,
                        date_of_birth,
                        studentCommunity,
                        cutoff,
                        nextRank
                    ]
                );


            const studentId =
                studentResult.insertId;


            // =====================================
            // CREATE APPLICATION
            // =====================================

            await connection.execute(
                `
                INSERT INTO applications
                (
                    student_id,
                    application_number,
                    status
                )
                VALUES (?, ?, 'pending')
                `,
                [
                    studentId,
                    applicationNumber
                ]
            );


            // =====================================
            // COMMIT
            // =====================================

            await connection.commit();


            // =====================================
            // SEND LOGIN CREDENTIALS
            // =====================================

            let emailSent = false;

            try {

                await sendStudentCredentials(
                    studentEmail,
                    studentName,
                    studentEmail,
                    String(password)
                );

                emailSent = true;

                console.log(
                    "Student credentials email sent to:",
                    studentEmail
                );

            }
            catch (emailError) {

                console.error(
                    "STUDENT EMAIL ERROR:",
                    emailError
                );

            }


            // =====================================
            // RESPONSE
            // =====================================

            return res.status(201).json({

                success: true,

                message:
                    emailSent
                        ? "Student added successfully and login credentials sent by email"
                        : "Student added successfully, but email could not be sent",

                emailSent,

                student: {

                    student_id:
                        studentId,

                    user_id:
                        userId,

                    name:
                        studentName,

                    email:
                        studentEmail,

                    application_number:
                        applicationNumber,

                    cutoff_mark:
                        cutoff,

                    community:
                        studentCommunity,

                    date_of_birth:
                        date_of_birth,

                    rank:
                        nextRank

                }

            });

        }
        catch (error) {

            try {

                await connection.rollback();

            }
            catch (rollbackError) {

                console.error(
                    "ROLLBACK ERROR:",
                    rollbackError
                );

            }


            console.error(
                "ADD STUDENT ERROR:",
                error
            );


            if (
                error.code === "ER_DUP_ENTRY"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Email or application number already exists"

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "Failed to add student",

                error:
                    error.message

            });

        }
        finally {

            connection.release();

        }

    }
);


// =====================================
// STUDENT ALLOTMENT MONITORING
// WITH SEARCH + FILTERS
// =====================================

router.get(
    "/students",
    authenticateToken,
    requireRole("admin"),
    async (req, res) => {

        try {

            const {
                rank,
                name,
                email,
                application_number,
                department,
                status
            } = req.query;


            let query = `
                SELECT

                    s.id AS student_id,
                    s.rank_number,
                    s.cutoff_mark,
                    s.community,
                    s.date_of_birth,

                    u.id AS user_id,
                    u.name AS student_name,
                    u.email,

                    app.application_number,
                    app.status AS application_status,

                    a.id AS allotment_id,
                    a.seat_number,
                    a.status AS allotment_status,
                    a.student_decision,
                    a.round_id,

                    d.id AS department_id,
                    d.code AS department_code,
                    d.name AS department_name,

                    p.id AS payment_id,
                    p.amount AS payment_amount,
                    p.payment_status,
                    p.receipt_number,

                    r.round_number

                FROM students s

                JOIN users u
                    ON s.user_id = u.id

                LEFT JOIN applications app
                    ON app.student_id = s.id

                LEFT JOIN allotments a
                    ON a.student_id = s.id

                LEFT JOIN departments d
                    ON a.department_id = d.id

                LEFT JOIN payments p
                    ON p.allotment_id = a.id

                LEFT JOIN counselling_rounds r
                    ON a.round_id = r.id

                WHERE 1 = 1
            `;


            const params = [];


            // =====================================
            // RANK FILTER
            // =====================================

            if (rank) {

                query += `
                    AND s.rank_number = ?
                `;

                params.push(rank);

            }


            // =====================================
            // NAME SEARCH
            // =====================================

            if (name) {

                query += `
                    AND u.name LIKE ?
                `;

                params.push(
                    `%${name}%`
                );

            }


            // =====================================
            // EMAIL SEARCH
            // =====================================

            if (email) {

                query += `
                    AND u.email LIKE ?
                `;

                params.push(
                    `%${email}%`
                );

            }


            // =====================================
            // APPLICATION SEARCH
            // =====================================

            if (application_number) {

                query += `
                    AND app.application_number LIKE ?
                `;

                params.push(
                    `%${application_number}%`
                );

            }


            // =====================================
            // DEPARTMENT FILTER
            // =====================================

            if (department) {

                query += `
                    AND (
                        d.code = ?
                        OR d.name LIKE ?
                    )
                `;

                params.push(
                    department,
                    `%${department}%`
                );

            }


            // =====================================
            // STATUS FILTER
            // =====================================

            if (status) {

                if (
                    status === "not_allotted"
                ) {

                    query += `
                        AND a.id IS NULL
                    `;

                }
                else if (
                    status === "confirmed"
                ) {

                    query += `
                        AND a.status = 'confirmed'
                    `;

                }
                else if (
                    status === "allotted"
                ) {

                    query += `
                        AND a.status IN (
                            'allotted',
                            'payment_pending'
                        )
                    `;

                }
                else {

                    query += `
                        AND a.status = ?
                    `;

                    params.push(status);

                }

            }


            // =====================================
            // ORDER
            // =====================================

            query += `
                ORDER BY
                    s.rank_number ASC,
                    a.id DESC
            `;


            // =====================================
            // EXECUTE
            // =====================================

            const [students] =
                await db.execute(
                    query,
                    params
                );


            // =====================================
            // FORMAT RESPONSE
            // =====================================

            const formattedStudents =
                students.map(student => {

                    let overallStatus =
                        "not_allotted";


                    if (
                        student.allotment_status ===
                        "confirmed"
                    ) {

                        overallStatus =
                            "confirmed";

                    }
                    else if (
                        student.allotment_status ===
                            "allotted" ||
                        student.allotment_status ===
                            "payment_pending"
                    ) {

                        overallStatus =
                            "allotted";

                    }
                    else if (
                        student.allotment_status
                    ) {

                        overallStatus =
                            student.allotment_status;

                    }


                    return {

                        student_id:
                            student.student_id,

                        rank:
                            student.rank_number,

                        cutoff_mark:
                            student.cutoff_mark,

                        community:
                            student.community,

                        date_of_birth:
                            student.date_of_birth,

                        student_name:
                            student.student_name,

                        email:
                            student.email,

                        application: {

                            number:
                                student.application_number,

                            status:
                                student.application_status

                        },

                        allotment: {

                            id:
                                student.allotment_id,

                            department_id:
                                student.department_id,

                            department_code:
                                student.department_code,

                            department_name:
                                student.department_name,

                            seat_number:
                                student.seat_number,

                            status:
                                student.allotment_status,

                            decision:
                                student.student_decision,

                            round_id:
                                student.round_id,

                            round_number:
                                student.round_number

                        },

                        payment: {

                            id:
                                student.payment_id,

                            amount:
                                student.payment_amount,

                            status:
                                student.payment_status,

                            receipt_number:
                                student.receipt_number

                        },

                        overall_status:
                            overallStatus

                    };

                });


            return res.json({

                success: true,

                count:
                    formattedStudents.length,

                filters: {

                    rank:
                        rank || null,

                    name:
                        name || null,

                    email:
                        email || null,

                    application_number:
                        application_number || null,

                    department:
                        department || null,

                    status:
                        status || null

                },

                students:
                    formattedStudents

            });

        }
        catch (error) {

            console.error(
                "ADMIN STUDENT FILTER ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to fetch student monitoring data",

                error:
                    error.message

            });

        }

    }
);


// =====================================
// GET STUDENT CORRECTION REQUESTS
// STUDENT → ADMIN
// =====================================

router.get(
    "/correction-requests",
    authenticateToken,
    requireRole("admin"),
    async (req, res) => {

        try {

            const [requests] =
                await db.execute(`
                    SELECT

                        cr.id,
                        cr.student_id,

                        u.name AS student_name,
                        u.email AS student_email,

                        s.rank_number,
                        s.community,
                        s.cutoff_mark,

                        app.application_number,

                        cr.field_name,
                        cr.incorrect_data,
                        cr.correct_data,
                        cr.reason,
                        cr.status,
                        cr.created_at,
                        cr.resolved_at

                    FROM correction_requests cr

                    INNER JOIN students s
                        ON cr.student_id = s.id

                    INNER JOIN users u
                        ON s.user_id = u.id

                    LEFT JOIN applications app
                        ON app.student_id = s.id

                    ORDER BY

                        CASE
                            WHEN cr.status = 'pending'
                            THEN 0
                            ELSE 1
                        END,

                        cr.created_at DESC
                `);


            return res.json({

                success: true,

                count:
                    requests.length,

                requests

            });

        }
        catch (error) {

            console.error(
                "GET CORRECTION REQUESTS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to load correction requests",

                error:
                    error.message

            });

        }

    }
);


// =====================================
// UPDATE STUDENT FROM CORRECTION REQUEST
// UPDATE MYSQL + RESOLVE REQUEST
// =====================================

router.put(
    "/correction-requests/:id/resolve",
    authenticateToken,
    requireRole("admin"),
    async (req, res) => {

        const connection =
            await db.getConnection();

        try {

            const correctionRequestId =
                Number(req.params.id);


            // =====================================
            // REQUEST ID VALIDATION
            // =====================================

            if (
                !Number.isInteger(
                    correctionRequestId
                ) ||
                correctionRequestId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid correction request ID"

                });

            }


            // =====================================
            // START TRANSACTION
            // =====================================

            await connection.beginTransaction();


            // =====================================
            // GET CORRECTION REQUEST
            // =====================================

            const [requestRows] =
                await connection.execute(
                    `
                    SELECT

                        cr.id,
                        cr.student_id,
                        cr.field_name,
                        cr.incorrect_data,
                        cr.correct_data,
                        cr.reason,
                        cr.status,

                        s.user_id,
                        s.rank_number,
                        s.date_of_birth,
                        s.community,
                        s.cutoff_mark,

                        u.name AS old_name,
                        u.email AS old_email,

                        app.application_number

                    FROM correction_requests cr

                    INNER JOIN students s
                        ON cr.student_id = s.id

                    INNER JOIN users u
                        ON s.user_id = u.id

                    LEFT JOIN applications app
                        ON app.student_id = s.id

                    WHERE cr.id = ?

                    LIMIT 1

                    FOR UPDATE
                    `,
                    [correctionRequestId]
                );


            // =====================================
            // REQUEST NOT FOUND
            // =====================================

            if (
                requestRows.length === 0
            ) {

                await connection.rollback();

                return res.status(404).json({

                    success: false,

                    message:
                        "Correction request not found"

                });

            }


            const correctionRequest =
                requestRows[0];


            // =====================================
            // CHECK STATUS
            // =====================================

            if (
                String(
                    correctionRequest.status
                ).toLowerCase() === "resolved"
            ) {

                await connection.rollback();

                return res.status(409).json({

                    success: false,

                    message:
                        "This correction request has already been resolved"

                });

            }


            const studentId =
                correctionRequest.student_id;

            const userId =
                correctionRequest.user_id;

            const fieldName =
                String(
                    correctionRequest.field_name || ""
                )
                .trim()
                .toLowerCase();

            const correctData =
                String(
                    correctionRequest.correct_data || ""
                )
                .trim();


            // =====================================
            // VALIDATE CORRECTION DATA
            // =====================================

            if (
                !fieldName ||
                !correctData
            ) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    message:
                        "Correction request does not contain valid correction data"

                });

            }


            // =====================================
            // DEBUG INFORMATION
            // =====================================

            console.log(
                "=========================================="
            );

            console.log(
                "RESOLVING CORRECTION REQUEST"
            );

            console.log(
                "Request ID:",
                correctionRequestId
            );

            console.log(
                "Student ID:",
                studentId
            );

            console.log(
                "User ID:",
                userId
            );

            console.log(
                "Field:",
                fieldName
            );

            console.log(
                "Incorrect:",
                correctionRequest.incorrect_data
            );

            console.log(
                "Correct:",
                correctData
            );


            // =====================================
            // CURRENT VALUES
            // =====================================

            let updatedName =
                correctionRequest.old_name;

            let updatedEmail =
                correctionRequest.old_email;

            let updatedApplicationNumber =
                correctionRequest.application_number;

            let updatedDOB =
                correctionRequest.date_of_birth;

            let updatedCommunity =
                correctionRequest.community;

            let updatedCutoff =
                Number(
                    correctionRequest.cutoff_mark
                );


            // =====================================
            // APPLY CORRECTION
            // =====================================

            // -------------------------------------
            // NAME
            // -------------------------------------

            if (
                fieldName === "name" ||
                fieldName === "student_name"
            ) {

                updatedName =
                    correctData;

            }


            // -------------------------------------
            // EMAIL
            // -------------------------------------

            else if (
                fieldName === "email"
            ) {

                updatedEmail =
                    correctData.toLowerCase();

                const emailRegex =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (
                    !emailRegex.test(
                        updatedEmail
                    )
                ) {

                    await connection.rollback();

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid corrected email address"

                    });

                }

            }


            // -------------------------------------
            // COMMUNITY
            // -------------------------------------

            else if (
                fieldName === "community"
            ) {

                updatedCommunity =
                    correctData;

            }


            // -------------------------------------
            // DATE OF BIRTH
            // -------------------------------------

            else if (
                fieldName === "date_of_birth" ||
                fieldName === "dob"
            ) {

                updatedDOB =
                    correctData;

            }


            // -------------------------------------
            // CUTOFF
            // -------------------------------------

            else if (
                fieldName === "cutoff" ||
                fieldName === "cutoff_mark"
            ) {

                const newCutoff =
                    Number(correctData);


                if (
                    Number.isNaN(newCutoff) ||
                    newCutoff < 0 ||
                    newCutoff > 200
                ) {

                    await connection.rollback();

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid corrected cutoff mark"

                    });

                }


                updatedCutoff =
                    newCutoff;

            }


            // -------------------------------------
            // APPLICATION NUMBER
            // -------------------------------------

            else if (
                fieldName === "application_number" ||
                fieldName === "application_no"
            ) {

                updatedApplicationNumber =
                    correctData;

            }


            // -------------------------------------
            // UNSUPPORTED FIELD
            // -------------------------------------

            else {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    message:
                        `Unsupported correction field: ${fieldName}`

                });

            }


            // =====================================
            // CHECK DUPLICATE EMAIL
            // =====================================

            if (
                updatedEmail !==
                correctionRequest.old_email
            ) {

                const [duplicateEmail] =
                    await connection.execute(
                        `
                        SELECT id
                        FROM users
                        WHERE email = ?
                        AND id <> ?
                        LIMIT 1
                        `,
                        [
                            updatedEmail,
                            userId
                        ]
                    );


                if (
                    duplicateEmail.length > 0
                ) {

                    await connection.rollback();

                    return res.status(409).json({

                        success: false,

                        message:
                            "This email already belongs to another account"

                    });

                }

            }


            // =====================================
            // CHECK DUPLICATE APPLICATION
            // =====================================

            if (
                updatedApplicationNumber !==
                correctionRequest.application_number
            ) {

                const [duplicateApplication] =
                    await connection.execute(
                        `
                        SELECT id
                        FROM applications
                        WHERE application_number = ?
                        AND student_id <> ?
                        LIMIT 1
                        `,
                        [
                            updatedApplicationNumber,
                            studentId
                        ]
                    );


                if (
                    duplicateApplication.length > 0
                ) {

                    await connection.rollback();

                    return res.status(409).json({

                        success: false,

                        message:
                            "This application number already belongs to another student"

                    });

                }

            }


            // =====================================
            // UPDATE USERS
            // =====================================

            const [userUpdate] =
                await connection.execute(
                    `
                    UPDATE users

                    SET
                        name = ?,
                        email = ?

                    WHERE id = ?
                    `,
                    [
                        updatedName,
                        updatedEmail,
                        userId
                    ]
                );


            console.log(
                "USERS UPDATE:",
                userUpdate.affectedRows,
                "affected"
            );


            // =====================================
            // UPDATE STUDENTS
            // =====================================

            const [studentUpdate] =
                await connection.execute(
                    `
                    UPDATE students

                    SET
                        date_of_birth = ?,
                        community = ?,
                        cutoff_mark = ?

                    WHERE id = ?
                    `,
                    [
                        updatedDOB,
                        updatedCommunity,
                        updatedCutoff,
                        studentId
                    ]
                );


            console.log(
                "STUDENTS UPDATE:",
                studentUpdate.affectedRows,
                "affected"
            );

            console.log(
                "STUDENTS CHANGED:",
                studentUpdate.changedRows
            );


            // =====================================
            // VERIFY STUDENT UPDATE
            // =====================================

            const [verifyStudent] =
                await connection.execute(
                    `
                    SELECT

                        id,
                        user_id,
                        date_of_birth,
                        community,
                        cutoff_mark,
                        rank_number

                    FROM students

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [studentId]
                );


            if (
                verifyStudent.length === 0
            ) {

                throw new Error(
                    "Student record could not be found after update"
                );

            }


            console.log(
                "STUDENT AFTER UPDATE:",
                verifyStudent[0]
            );


            // =====================================
            // UPDATE APPLICATION
            // =====================================

            const [applicationUpdate] =
                await connection.execute(
                    `
                    UPDATE applications

                    SET
                        application_number = ?

                    WHERE student_id = ?
                    `,
                    [
                        updatedApplicationNumber,
                        studentId
                    ]
                );


            console.log(
                "APPLICATION UPDATE:",
                applicationUpdate.affectedRows,
                "affected"
            );


            // =====================================
            // RESOLVE CORRECTION REQUEST
            // =====================================

            const [correctionUpdate] =
                await connection.execute(
                    `
                    UPDATE correction_requests

                    SET
                        status = 'resolved',
                        resolved_at = NOW()

                    WHERE id = ?

                    AND status <> 'resolved'
                    `,
                    [
                        correctionRequestId
                    ]
                );


            if (
                correctionUpdate.affectedRows !== 1
            ) {

                throw new Error(
                    "Correction request could not be marked as resolved"
                );

            }


            // =====================================
            // COMMIT
            // =====================================

            await connection.commit();


            console.log(
                "CORRECTION SUCCESSFULLY SAVED"
            );

            console.log(
                "Student:",
                updatedName
            );

            console.log(
                "Community:",
                updatedCommunity
            );

            console.log(
                "Cutoff:",
                updatedCutoff
            );

            console.log(
                "=========================================="
            );


            // =====================================
            // SEND CORRECTION EMAIL
            // =====================================

            let emailSent = false;

            try {

                const {
                    sendCorrectionResolvedEmail
                } = require("../emailserver");


                if (
                    typeof sendCorrectionResolvedEmail ===
                    "function"
                ) {

                    await sendCorrectionResolvedEmail(
                        updatedEmail,
                        updatedName
                    );

                    emailSent = true;

                    console.log(
                        "Correction update email sent to:",
                        updatedEmail
                    );

                }
                else {

                    console.error(
                        "sendCorrectionResolvedEmail is not exported from emailserver.js"
                    );

                }

            }
            catch (emailError) {

                console.error(
                    "CORRECTION EMAIL ERROR:",
                    emailError
                );

            }


            // =====================================
            // RESPONSE
            // =====================================

            return res.json({

                success: true,

                message:
                    emailSent
                        ? "Student details updated successfully, correction request resolved, and email sent"
                        : "Student details updated successfully and correction request resolved",

                emailSent,

                student: {

                    student_id:
                        studentId,

                    user_id:
                        userId,

                    name:
                        updatedName,

                    email:
                        updatedEmail,

                    application_number:
                        updatedApplicationNumber,

                    cutoff_mark:
                        updatedCutoff,

                    date_of_birth:
                        updatedDOB,

                    community:
                        updatedCommunity,

                    rank:
                        correctionRequest.rank_number

                }

            });

        }
        catch (error) {

            try {

                await connection.rollback();

            }
            catch (rollbackError) {

                console.error(
                    "ROLLBACK ERROR:",
                    rollbackError
                );

            }


            console.error(
                "=========================================="
            );

            console.error(
                "UPDATE CORRECTION ERROR:",
                error
            );

            console.error(
                "=========================================="
            );


            if (
                error.code === "ER_DUP_ENTRY"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Email or application number already exists"

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "Failed to update student details",

                error:
                    error.message

            });

        }
        finally {

            connection.release();

        }

    }
);


// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;