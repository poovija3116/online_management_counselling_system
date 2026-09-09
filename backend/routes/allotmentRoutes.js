const express = require("express");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const db = require("../config/db");

const router = express.Router();


// ============================================================
// HELPER
// GET STUDENT ID FROM LOGGED-IN USER ID
// ============================================================

async function getStudentIdFromUserId(userId) {

    const [students] = await db.execute(
        `SELECT id
         FROM students
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
    );

    if (students.length === 0) {
        return null;
    }

    return students[0].id;
}


// ============================================================
// CORE AUTOMATIC ALLOTMENT FUNCTION
// ============================================================

async function runAllotmentForRound(roundId) {

    let connection = null;

    try {

        // ======================================================
        // 1. CHECK ROUND
        // ======================================================

        const [rounds] = await db.execute(
            `SELECT *
             FROM counselling_rounds
             WHERE id = ?`,
            [roundId]
        );

        if (rounds.length === 0) {

            throw new Error(
                "Counselling round not found"
            );

        }

        const round = rounds[0];


        // ======================================================
        // 2. GET DATABASE CURRENT TIME
        // ======================================================

        const [timeRows] =
            await db.execute(
                `SELECT NOW() AS db_now`
            );

        const currentTime =
            new Date(timeRows[0].db_now);


        // ======================================================
        // 3. CHECK ALLOTMENT TIME
        // ======================================================

        const allotmentTime =
            round.allotment_at
                ? new Date(round.allotment_at)
                : null;


        if (
            allotmentTime &&
            currentTime < allotmentTime
        ) {

            return {

                success: false,

                not_ready: true,

                message:
                    "Allotment time has not been reached yet",

                round_id:
                    roundId,

                allotment_at:
                    round.allotment_at

            };

        }


        // ======================================================
        // 4. CHECK CHOICE CLOSING TIME
        // ======================================================
        // Allotment should happen only after choice filling
        // has closed.
        // ======================================================

        const choiceCloseValue =
            round.choice_close_at ||
            round.preference_end;


        if (choiceCloseValue) {

            const choiceCloseTime =
                new Date(choiceCloseValue);


            if (currentTime < choiceCloseTime) {

                return {

                    success: false,

                    not_ready: true,

                    message:
                        "Choice filling is still open",

                    round_id:
                        roundId,

                    choice_close_at:
                        choiceCloseValue,

                    allotment_at:
                        round.allotment_at

                };

            }

        }


        // ======================================================
        // 5. SAFETY LOCK
        // ======================================================
        // IMPORTANT:
        //
        // Student only SAVES preferences.
        // Student does NOT lock them.
        //
        // When choice filling is closed, backend locks them.
        // This prevents "no_locked_preferences" during allotment.
        // ======================================================

        await db.execute(
            `UPDATE preferences
             SET
                is_locked = 1,
                locked_at = COALESCE(locked_at, NOW())
             WHERE round_id = ?
             AND is_locked = 0`,
            [
                roundId
            ]
        );


        // ======================================================
        // 6. UPDATE ROUND STATUS
        // ======================================================

        await db.execute(
            `UPDATE counselling_rounds
             SET status = 'preferences_locked'
             WHERE id = ?
             AND allotment_published_at IS NULL
             AND status <> 'allotment_completed'`,
            [
                roundId
            ]
        );


        console.log(
            `🔒 Round ${round.round_number} preferences confirmed as locked.`
        );


        // ======================================================
        // 7. GET ELIGIBLE STUDENTS
        // ======================================================

        const [students] = await db.execute(
            `SELECT
                s.id AS student_id,
                s.rank_number
             FROM students s
             WHERE s.rank_number IS NOT NULL
             AND s.rank_number >= ?
             AND s.rank_number <= ?
             AND EXISTS (
                 SELECT 1
                 FROM applications a
                 WHERE a.student_id = s.id
             )
             ORDER BY s.rank_number ASC`,
            [
                round.min_rank,
                round.max_rank
            ]
        );


        let allottedCount = 0;
        let skippedCount = 0;
        let notAllottedCount = 0;

        const allotmentResults = [];


        // ======================================================
        // 8. PROCESS STUDENTS IN RANK ORDER
        // ======================================================

        for (const student of students) {

            connection =
                await db.getConnection();

            try {

                await connection.beginTransaction();


                const studentId =
                    student.student_id;


                // ==================================================
                // 9. CHECK EXISTING ACTIVE ALLOTMENT
                // ==================================================

                const [existingAllotment] =
                    await connection.execute(
                        `SELECT
                            id,
                            department_id,
                            seat_number,
                            status,
                            student_decision
                         FROM allotments
                         WHERE student_id = ?
                         AND round_id = ?
                         AND status IN (
                            'allotted',
                            'payment_pending',
                            'confirmed',
                            'upward_requested',
                            'upgraded'
                         )
                         LIMIT 1`,
                        [
                            studentId,
                            roundId
                        ]
                    );


                if (existingAllotment.length > 0) {

                    skippedCount++;


                    allotmentResults.push({

                        student_id:
                            studentId,

                        rank:
                            student.rank_number,

                        status:
                            "already_allotted",

                        department_id:
                            existingAllotment[0]
                                .department_id,

                        seat_number:
                            existingAllotment[0]
                                .seat_number,

                        student_decision:
                            existingAllotment[0]
                                .student_decision

                    });


                    await connection.rollback();

                    connection.release();

                    connection = null;

                    continue;
                }


                // ==================================================
                // 10. GET LOCKED PREFERENCES
                // ==================================================

                const [preferences] =
                    await connection.execute(
                        `SELECT
                            p.department_id,
                            p.priority,
                            d.code,
                            d.name
                         FROM preferences p
                         JOIN departments d
                         ON p.department_id = d.id
                         WHERE p.student_id = ?
                         AND p.round_id = ?
                         AND p.is_locked = 1
                         ORDER BY p.priority ASC`,
                        [
                            studentId,
                            roundId
                        ]
                    );


                // ==================================================
                // 11. NO PREFERENCES
                // ==================================================

                if (preferences.length === 0) {

                    notAllottedCount++;


                    allotmentResults.push({

                        student_id:
                            studentId,

                        rank:
                            student.rank_number,

                        status:
                            "no_preferences"

                    });


                    await connection.rollback();

                    connection.release();

                    connection = null;

                    continue;
                }


                let allotted = false;


                // ==================================================
                // 12. CHECK PREFERENCES IN PRIORITY ORDER
                // ==================================================

                for (const preference of preferences) {


                    // ==================================================
                    // LOCK DEPARTMENT ROW
                    // ==================================================

                    const [departmentRows] =
                        await connection.execute(
                            `SELECT
                                id,
                                code,
                                name,
                                available_seats
                             FROM departments
                             WHERE id = ?
                             FOR UPDATE`,
                            [
                                preference.department_id
                            ]
                        );


                    if (departmentRows.length === 0) {

                        continue;

                    }


                    const department =
                        departmentRows[0];


                    // ==================================================
                    // CHECK SEAT AVAILABILITY
                    // ==================================================

                    if (
                        Number(
                            department.available_seats
                        ) <= 0
                    ) {

                        continue;

                    }


                    // ==================================================
                    // FIND NEXT SEAT NUMBER
                    // ==================================================

                    const [seatRows] =
                        await connection.execute(
                            `SELECT seat_number
                             FROM allotments
                             WHERE department_id = ?
                             ORDER BY id DESC
                             LIMIT 1`,
                            [
                                department.id
                            ]
                        );


                    let nextSeatNumber = 1;


                    if (
                        seatRows.length > 0 &&
                        seatRows[0].seat_number
                    ) {

                        const lastSeat =
                            String(
                                seatRows[0].seat_number
                            );


                        const match =
                            lastSeat.match(/(\d+)$/);


                        if (match) {

                            nextSeatNumber =
                                parseInt(
                                    match[1],
                                    10
                                ) + 1;

                        }

                    }


                    // ==================================================
                    // CREATE SAFE DEPARTMENT CODE
                    // ==================================================

                    const cleanCode =
                        String(
                            department.code ||
                            `DEPT${department.id}`
                        )
                        .replace(/\s+/g, "")
                        .toUpperCase();


                    const seatNumber =
                        `${cleanCode}-${String(nextSeatNumber).padStart(3, "0")}`;


                    // ==================================================
                    // INSERT ALLOTMENT
                    // ==================================================

                    const [insertResult] =
                        await connection.execute(
                            `INSERT INTO allotments
                            (
                                student_id,
                                department_id,
                                seat_number,
                                status,
                                round_id,
                                student_decision
                            )
                            VALUES
                            (
                                ?,
                                ?,
                                ?,
                                'allotted',
                                ?,
                                'pending'
                            )`,
                            [
                                studentId,
                                department.id,
                                seatNumber,
                                roundId
                            ]
                        );


                    // ==================================================
                    // REDUCE AVAILABLE SEATS
                    // ==================================================

                    const [seatUpdate] =
                        await connection.execute(
                            `UPDATE departments
                             SET available_seats =
                                 available_seats - 1
                             WHERE id = ?
                             AND available_seats > 0`,
                            [
                                department.id
                            ]
                        );


                    if (
                        seatUpdate.affectedRows !== 1
                    ) {

                        throw new Error(
                            `Failed to reduce seat count for department ${department.id}`
                        );

                    }


                    allotted = true;

                    allottedCount++;


                    // ==================================================
                    // STORE RESULT
                    // ==================================================

                    allotmentResults.push({

                        allotment_id:
                            insertResult.insertId,

                        student_id:
                            studentId,

                        rank:
                            student.rank_number,

                        status:
                            "allotted",

                        student_decision:
                            "pending",

                        department_id:
                            department.id,

                        department:
                            cleanCode,

                        department_name:
                            department.name,

                        priority:
                            preference.priority,

                        seat_number:
                            seatNumber

                    });


                    // Stop checking preferences
                    // after successful allotment.

                    break;

                }


                // ==================================================
                // 13. STUDENT NOT ALLOTTED
                // ==================================================

                if (!allotted) {

                    notAllottedCount++;


                    allotmentResults.push({

                        student_id:
                            studentId,

                        rank:
                            student.rank_number,

                        status:
                            "not_allotted"

                    });

                }


                // ==================================================
                // 14. COMMIT STUDENT TRANSACTION
                // ==================================================

                await connection.commit();

            }

            catch (studentError) {

                if (connection) {

                    try {

                        await connection.rollback();

                    }

                    catch (rollbackError) {

                        console.error(
                            "ROLLBACK ERROR:",
                            rollbackError
                        );

                    }

                }


                console.error(
                    `❌ ALLOTMENT ERROR FOR STUDENT ${student.student_id}:`,
                    studentError
                );


                notAllottedCount++;


                allotmentResults.push({

                    student_id:
                        student.student_id,

                    rank:
                        student.rank_number,

                    status:
                        "error",

                    error:
                        studentError.message

                });

            }

            finally {

                if (connection) {

                    connection.release();

                    connection = null;

                }

            }

        }


        // ======================================================
        // 15. PUBLISH ALLOTMENT
        // ======================================================

        await db.execute(
            `UPDATE counselling_rounds
             SET
                status = 'allotment_completed',
                allotment_published_at = NOW()
             WHERE id = ?
             AND allotment_published_at IS NULL`,
            [
                roundId
            ]
        );


        console.log(
            `🎯 Round ${round.round_number} allotment completed automatically.`
        );

        console.log(
            `   Total students : ${students.length}`
        );

        console.log(
            `   Allotted       : ${allottedCount}`
        );

        console.log(
            `   Skipped        : ${skippedCount}`
        );

        console.log(
            `   Not allotted   : ${notAllottedCount}`
        );


        // ======================================================
        // 16. RETURN RESULT
        // ======================================================

        return {

            success: true,

            message:
                "Allotment completed and published automatically",

            round_id:
                roundId,

            round_number:
                round.round_number,

            total_students:
                students.length,

            allotted:
                allottedCount,

            skipped:
                skippedCount,

            not_allotted:
                notAllottedCount,

            results:
                allotmentResults

        };

    }

    catch (error) {

        if (connection) {

            try {

                await connection.rollback();

            }

            catch (rollbackError) {

                console.error(
                    "ROLLBACK ERROR:",
                    rollbackError
                );

            }


            connection.release();

            connection = null;

        }


        console.error(
            "RUN ALLOTMENT FUNCTION ERROR:",
            error
        );


        throw error;

    }

}


// ============================================================
// ADMIN MANUAL API
// POST /api/allotments/run
// ============================================================
// Kept only for admin testing.
// Normal project flow uses automatic scheduler.
// ============================================================

router.post(
    "/run",
    authenticateToken,
    async (req, res) => {

        try {

            if (req.user.role !== "admin") {

                return res.status(403).json({

                    success: false,

                    message:
                        "Only admin can run seat allotment"

                });

            }


            const {
                round_id
            } = req.body;


            if (!round_id) {

                return res.status(400).json({

                    success: false,

                    message:
                        "round_id is required"

                });

            }


            const result =
                await runAllotmentForRound(
                    round_id
                );


            if (result.not_ready) {

                return res.status(400).json(
                    result
                );

            }


            return res.json(
                result
            );

        }

        catch (error) {

            console.error(
                "MANUAL ALLOTMENT ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Seat allotment failed",

                error:
                    error.message

            });

        }

    }
);
// ============================================================
// GET ALL ALLOTMENTS
// ADMIN + COUNSELLOR
// GET /api/allotments
// ============================================================

router.get(
    "/",
    authenticateToken,
    async (req, res) => {

        try {

            // ------------------------------------------------
            // Admin and counsellor can view allotments
            // ------------------------------------------------

            if (
                req.user.role !== "admin" &&
                req.user.role !== "counsellor"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Only admin and counsellor can view all allotments"

                });

            }


            // ------------------------------------------------
            // Get all allotments with complete student details
            // ------------------------------------------------

            const [allotments] =
                await db.execute(
                    `SELECT
                        a.id,
                        a.student_id,

                        s.rank_number,
                        s.cutoff_mark,
                        s.community,

                        u.name AS student_name,
                        u.email,

                        (
                            SELECT app.application_number
                            FROM applications app
                            WHERE app.student_id = s.id
                            ORDER BY app.id DESC
                            LIMIT 1
                        ) AS application_number,

                        a.department_id,

                        d.code AS department_code,
                        d.name AS department_name,

                        a.seat_number,
                        a.status,

                        a.round_id,

                        r.round_number,

                        a.student_decision,

                        a.allotted_at,
                        a.decision_at,

                        r.allotment_published_at

                    FROM allotments a

                    JOIN students s
                    ON a.student_id = s.id

                    JOIN users u
                    ON s.user_id = u.id

                    JOIN departments d
                    ON a.department_id = d.id

                    LEFT JOIN counselling_rounds r
                    ON a.round_id = r.id

                    ORDER BY
                        s.rank_number ASC,
                        a.id ASC`
                );


            return res.json({

                success: true,

                count:
                    allotments.length,

                allotments

            });

        }

        catch (error) {

            console.error(
                "GET ALLOTMENTS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to fetch allotments",

                error:
                    error.message

            });

        }

    }
);
// ============================================================
// GET MY ALLOTMENT
// STUDENT
// ============================================================

router.get(
    "/my",
    authenticateToken,
    async (req, res) => {

        try {

            if (req.user.role !== "student") {

                return res.status(403).json({

                    success: false,

                    message:
                        "Only students can view their allotment"

                });

            }


            const studentId =
                await getStudentIdFromUserId(
                    req.user.id
                );


            if (!studentId) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student profile not found"

                });

            }


            const [allotments] =
                await db.execute(
                    `SELECT
                        a.id,
                        a.student_id,

                        s.rank_number,
                        s.cutoff_mark,

                        u.name AS student_name,
                        u.email,

                        s.phone,
                        s.date_of_birth,
                        s.gender,
                        s.community,

                        (
                            SELECT app.application_number
                            FROM applications app
                            WHERE app.student_id = s.id
                            ORDER BY app.id DESC
                            LIMIT 1
                        ) AS application_number,

                        d.id AS department_id,
                        d.code AS department_code,
                        d.name AS department_name,

                        a.seat_number,
                        a.status,
                        a.round_id,
                        a.student_decision,

                        a.allotted_at,
                        a.decision_at,

                        r.round_number,
                        r.min_rank,
                        r.max_rank,
                        r.allotment_at,
                        r.payment_deadline,
                        r.allotment_published_at

                     FROM allotments a

                     JOIN students s
                     ON a.student_id = s.id

                     JOIN users u
                     ON s.user_id = u.id

                     JOIN departments d
                     ON a.department_id = d.id

                     LEFT JOIN counselling_rounds r
                     ON a.round_id = r.id

                     WHERE a.student_id = ?

                     ORDER BY a.id DESC

                     LIMIT 1`,
                    [
                        studentId
                    ]
                );


            if (allotments.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "No allotment found"

                });

            }


            const allotment =
                allotments[0];


            const orderAvailable =
                allotment.student_decision ===
                "accepted";


            return res.json({

                success: true,

                allotment: {

                    ...allotment,

                    order_available:
                        orderAvailable

                }

            });

        }

        catch (error) {

            console.error(
                "GET MY ALLOTMENT ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to fetch allotment",

                error:
                    error.message

            });

        }

    }
);



// ============================================================
// STUDENT DECISION
// ============================================================

router.post(
    "/decision",
    authenticateToken,
    async (req, res) => {

        let connection = null;

        try {

            if (req.user.role !== "student") {

                return res.status(403).json({

                    success: false,

                    message:
                        "Only students can make allotment decisions"

                });

            }


            const {
                decision
            } = req.body;


            const validDecisions = [
                "accepted",
                "upward",
                "rejected"
            ];


            if (
                !decision ||
                !validDecisions.includes(decision)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Decision must be accepted, upward, or rejected"

                });

            }


            const studentId =
                await getStudentIdFromUserId(
                    req.user.id
                );


            if (!studentId) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student profile not found"

                });

            }


            connection =
                await db.getConnection();


            await connection.beginTransaction();


            const [allotments] =
                await connection.execute(
                    `SELECT
                        id,
                        department_id,
                        seat_number,
                        status,
                        student_decision,
                        round_id

                     FROM allotments

                     WHERE student_id = ?

                     AND status IN (
                        'allotted',
                        'payment_pending',
                        'confirmed',
                        'upward_requested',
                        'upgraded'
                     )

                     ORDER BY id DESC

                     LIMIT 1

                     FOR UPDATE`,
                    [
                        studentId
                    ]
                );


            if (allotments.length === 0) {

                await connection.rollback();

                return res.status(404).json({

                    success: false,

                    message:
                        "No active allotment found"

                });

            }


            const allotment =
                allotments[0];


            if (
                allotment.student_decision !==
                "pending"
            ) {

                await connection.rollback();

                return res.status(400).json({

                    success: false,

                    message:
                        "A decision has already been submitted",

                    current_decision:
                        allotment.student_decision

                });

            }


            // ==================================================
            // ACCEPT
            // ==================================================

            if (decision === "accepted") {

                await connection.execute(
                    `UPDATE allotments
                     SET
                        student_decision = 'accepted',
                        status = 'payment_pending',
                        decision_at = NOW()
                     WHERE id = ?`,
                    [
                        allotment.id
                    ]
                );


                await connection.commit();


                return res.json({

                    success: true,

                    message:
                        "Seat accepted successfully. Your Allotment Order is now available.",

                    allotment_id:
                        allotment.id,

                    decision:
                        "accepted",

                    status:
                        "payment_pending",

                    order_available:
                        true

                });

            }


            // ==================================================
            // UPWARD
            // ==================================================

            if (decision === "upward") {

                await connection.execute(
                    `UPDATE allotments
                     SET
                        student_decision = 'upward',
                        status = 'upward_requested',
                        decision_at = NOW()
                     WHERE id = ?`,
                    [
                        allotment.id
                    ]
                );


                await connection.execute(
                    `INSERT INTO upward_requests
                    (
                        student_id,
                        allotment_id,
                        current_department_id,
                        status,
                        requested_at
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        'requested',
                        NOW()
                    )`,
                    [
                        studentId,
                        allotment.id,
                        allotment.department_id
                    ]
                );


                await connection.commit();


                return res.json({

                    success: true,

                    message:
                        "Upward request submitted successfully.",

                    allotment_id:
                        allotment.id,

                    decision:
                        "upward",

                    status:
                        "upward_requested",

                    order_available:
                        false

                });

            }


            // ==================================================
            // REJECT / DECLINE
            // ==================================================

            if (decision === "rejected") {

                await connection.execute(
                    `UPDATE allotments
                     SET
                        student_decision = 'rejected',
                        status = 'released',
                        decision_at = NOW()
                     WHERE id = ?`,
                    [
                        allotment.id
                    ]
                );


                await connection.execute(
                    `UPDATE departments
                     SET available_seats =
                         available_seats + 1
                     WHERE id = ?`,
                    [
                        allotment.department_id
                    ]
                );


                await connection.execute(
                    `INSERT INTO seat_movements
                    (
                        allotment_id,
                        student_id,
                        from_department_id,
                        from_round_id,
                        movement_type,
                        reason
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        'student_rejected',
                        'Student declined allotted seat'
                    )`,
                    [
                        allotment.id,
                        studentId,
                        allotment.department_id,
                        allotment.round_id
                    ]
                );


                await connection.commit();


                return res.json({

                    success: true,

                    message:
                        "Seat declined successfully. The seat has been released.",

                    allotment_id:
                        allotment.id,

                    decision:
                        "rejected",

                    status:
                        "released",

                    order_available:
                        false

                });

            }


            await connection.rollback();


            return res.status(400).json({

                success: false,

                message:
                    "Invalid decision"

            });

        }

        catch (error) {

            if (connection) {

                try {

                    await connection.rollback();

                }

                catch (rollbackError) {

                    console.error(
                        "ROLLBACK ERROR:",
                        rollbackError
                    );

                }

            }


            console.error(
                "ALLOTMENT DECISION ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to submit allotment decision",

                error:
                    error.message

            });

        }

        finally {

            if (connection) {

                connection.release();

                connection = null;

            }

        }

    }
);


// ============================================================
// CHECK ALLOTMENT ORDER STATUS
// ============================================================

router.get(
    "/order-status",
    authenticateToken,
    async (req, res) => {

        try {

            if (req.user.role !== "student") {

                return res.status(403).json({

                    success: false,

                    message:
                        "Only students can check allotment order status"

                });

            }


            const studentId =
                await getStudentIdFromUserId(
                    req.user.id
                );


            if (!studentId) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student profile not found"

                });

            }


            const [rows] =
                await db.execute(
                    `SELECT
                        a.id AS allotment_id,

                        a.student_decision,

                        a.status,

                        a.round_id,

                        a.seat_number,

                        d.code AS department_code,

                        d.name AS department_name,

                        r.round_number,

                        r.allotment_published_at

                     FROM allotments a

                     JOIN departments d
                     ON a.department_id = d.id

                     LEFT JOIN counselling_rounds r
                     ON a.round_id = r.id

                     WHERE a.student_id = ?

                     ORDER BY a.id DESC

                     LIMIT 1`,
                    [
                        studentId
                    ]
                );


            if (rows.length === 0) {

                return res.json({

                    success: true,

                    allotment_found:
                        false,

                    order_available:
                        false

                });

            }


            const allotment =
                rows[0];


            const orderAvailable =
                allotment.student_decision ===
                "accepted";


            return res.json({

                success: true,

                allotment_found:
                    true,

                order_available:
                    orderAvailable,

                allotment

            });

        }

        catch (error) {

            console.error(
                "ORDER STATUS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to check allotment order status",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// EXPOSE CORE FUNCTION TO server.js
// ============================================================

router.runAllotmentForRound =
    runAllotmentForRound;


// ============================================================
// EXPORT
// ============================================================

module.exports = router;