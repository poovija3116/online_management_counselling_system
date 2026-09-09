const express = require("express");

const {
    authenticateToken,
    requireRole
} = require("../middleware/authMiddleware");

const db = require("../config/db");

const router = express.Router();


// ==================================================
// STUDENT ROUTES LOADED
// ==================================================

console.log("✅ STUDENT ROUTES FILE LOADED");


// ==================================================
// TEST ROUTE
// ==================================================

router.get("/test", (req, res) => {

    console.log("✅ STUDENT TEST ROUTE HIT");

    res.json({
        success: true,
        message: "Student route is working"
    });

});


// ==================================================
// GET STUDENT PROFILE
// ==================================================

router.get(
    "/profile",
    authenticateToken,
    requireRole("student"),

    async (req, res) => {

        try {

            console.log(
                "📡 STUDENT PROFILE REQUEST"
            );

            console.log(
                "USER FROM TOKEN:",
                req.user
            );

            const userId = req.user.id;


            // ==========================================
            // GET STUDENT DATA
            // ==========================================

            const [rows] = await db.execute(
                `
                SELECT

                    u.id AS user_id,
                    u.name,
                    u.email,
                    u.role,

                    s.id AS student_id,
                    s.phone,
                    s.date_of_birth,
                    s.gender,
                    s.community,
                    s.address,
                    s.cutoff_mark,
                    s.rank_number,

                    a.application_number,
                    a.status AS application_status

                FROM users u

                INNER JOIN students s
                    ON s.user_id = u.id

                LEFT JOIN applications a
                    ON a.student_id = s.id

                WHERE u.id = ?

                ORDER BY a.id DESC

                LIMIT 1
                `,
                [userId]
            );


            console.log(
                "📊 PROFILE DATABASE RESULT:",
                rows
            );


            // ==========================================
            // STUDENT NOT FOUND
            // ==========================================

            if (rows.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student profile not found"

                });

            }


            const student = rows[0];


            // ==========================================
            // SEND STUDENT DATA
            // ==========================================

            res.status(200).json({

                success: true,

                student: {

                    id:
                        student.student_id,

                    user_id:
                        student.user_id,

                    name:
                        student.name,

                    email:
                        student.email,

                    phone:
                        student.phone,

                    date_of_birth:
                        student.date_of_birth,

                    gender:
                        student.gender,

                    community:
                        student.community,

                    address:
                        student.address,

                    cutoff_mark:
                        student.cutoff_mark,

                    rank_number:
                        student.rank_number,

                    application_number:
                        student.application_number,

                    application_status:
                        student.application_status

                }

            });

        }

        catch (error) {

            console.error(
                "❌ GET STUDENT PROFILE ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch student profile",

                error:
                    error.message

            });

        }

    }
);


// ==================================================
// GET STUDENT APPLICATION DETAILS
// ==================================================

router.get(
    "/application",
    authenticateToken,
    requireRole("student"),

    async (req, res) => {

        try {

            console.log(
                "================================="
            );

            console.log(
                "📡 STUDENT APPLICATION REQUEST"
            );

            console.log(
                "USER FROM TOKEN:",
                req.user
            );


            // ==========================================
            // GET LOGGED-IN USER ID
            // ==========================================

            const userId = req.user.id;


            console.log(
                "🔑 USER ID:",
                userId
            );


            // ==========================================
            // GET APPLICATION DATA
            // ==========================================

            const [rows] = await db.execute(
                `
                SELECT

                    u.id AS user_id,
                    u.name,
                    u.email,

                    s.id AS student_id,
                    s.date_of_birth,
                    s.gender,
                    s.community,
                    s.cutoff_mark,
                    s.rank_number,

                    a.application_number,
                    a.status AS application_status,
                    a.created_at AS application_created_at

                FROM users u

                INNER JOIN students s
                    ON s.user_id = u.id

                LEFT JOIN applications a
                    ON a.student_id = s.id

                WHERE u.id = ?

                ORDER BY a.id DESC

                LIMIT 1
                `,
                [userId]
            );


            // ==========================================
            // SHOW DATABASE RESULT
            // ==========================================

            console.log(
                "📊 APPLICATION DATABASE RESULT:",
                rows
            );


            // ==========================================
            // STUDENT NOT FOUND
            // ==========================================

            if (rows.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student application not found"

                });

            }


            const student = rows[0];


            // ==========================================
            // SEND APPLICATION DATA
            // ==========================================

            res.status(200).json({

                success: true,

                application: {

                    user_id:
                        student.user_id,

                    student_id:
                        student.student_id,

                    name:
                        student.name,

                    email:
                        student.email,

                    date_of_birth:
                        student.date_of_birth,

                    gender:
                        student.gender,

                    community:
                        student.community,

                    cutoff_mark:
                        student.cutoff_mark,

                    rank_number:
                        student.rank_number,

                    application_number:
                        student.application_number,

                    application_status:
                        student.application_status,

                    created_at:
                        student.application_created_at

                }

            });


        }

        catch (error) {

            console.error(
                "❌ GET STUDENT APPLICATION ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch student application",

                error:
                    error.message

            });

        }

    }
);


// ==================================================
// SUBMIT CORRECTION REQUEST
// ==================================================

router.post(
    "/correction-request",
    authenticateToken,
    requireRole("student"),

    async (req, res) => {

        try {

            console.log(
                "================================="
            );

            console.log(
                "📡 CORRECTION REQUEST RECEIVED"
            );

            console.log(
                "USER FROM TOKEN:",
                req.user
            );


            // ==========================================
            // GET DATA FROM STUDENT
            // ==========================================

            const {
                errorType,
                incorrectData,
                correctData,
                errorDescription
            } = req.body;


            console.log(
                "CORRECTION DATA:",
                {
                    errorType,
                    incorrectData,
                    correctData,
                    errorDescription
                }
            );


            // ==========================================
            // VALIDATE DATA
            // ==========================================

            if (
                !errorType ||
                !incorrectData ||
                !correctData
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "All correction details are required"

                });

            }


            // ==========================================
            // GET STUDENT ID
            // ==========================================

            const [students] = await db.execute(
                `
                SELECT id
                FROM students
                WHERE user_id = ?
                LIMIT 1
                `,
                [req.user.id]
            );


            // ==========================================
            // STUDENT NOT FOUND
            // ==========================================

            if (students.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student record not found"

                });

            }


            const studentId =
                students[0].id;


            console.log(
                "🎓 STUDENT ID:",
                studentId
            );


            // ==========================================
            // INSERT CORRECTION REQUEST
            // ==========================================

            const [result] = await db.execute(
                `
                INSERT INTO correction_requests
                (
                    student_id,
                    field_name,
                    incorrect_data,
                    correct_data,
                    reason,
                    status
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    'pending'
                )
                `,
                [
                    studentId,
                    errorType,
                    incorrectData,
                    correctData,
                    errorDescription || ""
                ]
            );


            console.log(
                "✅ CORRECTION REQUEST SAVED"
            );

            console.log(
                "REQUEST ID:",
                result.insertId
            );


            // ==========================================
            // SEND SUCCESS RESPONSE
            // ==========================================

            res.status(201).json({

                success: true,

                message:
                    "Correction request submitted successfully",

                requestId:
                    result.insertId

            });

        }

        catch (error) {

            console.error(
                "❌ CORRECTION REQUEST ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to submit correction request",

                error:
                    error.message

            });

        }

    }
);


// ==================================================
// EXPORT ROUTER
// ==================================================

module.exports = router;