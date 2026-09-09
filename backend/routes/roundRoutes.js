const express = require("express");

const {
    sendCounsellingScheduleEmail
} = require("../emailserver");

const router = express.Router();

const db = require("../config/db");

const {
    authenticateToken,
    requireRole
} = require("../middleware/authMiddleware");


// ============================================================
// GET ALL ROUNDS
// GET /api/rounds
// ============================================================
router.get(
    "/",
    authenticateToken,
    requireRole("counsellor"),
    async (req, res) => {

        try {

            const [rounds] = await db.query(`
                SELECT
                    id,
                    round_number,
                    min_rank,
                    max_rank,
                    preference_start,
                    preference_end,
                    allotment_at,
                    payment_deadline,
                    status,
                    created_at,
                    choice_open_at,
                    choice_close_at,
                    allotment_published_at
                FROM counselling_rounds
                ORDER BY round_number ASC
            `);

            res.json({
                success: true,
                rounds
            });

        } catch (error) {

            console.error(
                "GET ROUNDS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to load counselling rounds",
                error: error.message
            });

        }

    }
);


// ============================================================
// GET CURRENT / SCHEDULED ROUND
// GET /api/rounds/current
//
// IMPORTANT:
// This route returns the scheduled round even BEFORE
// preference_start.
//
// This allows Student Dashboard to display:
//
// CURRENT ROUND: 1
// ELIGIBLE RANK: 1 - 45
// YOUR RANK: 23
//
// before choice filling opens.
//
// When preference_start arrives, the same route returns
// the round as OPEN and the existing student-dashboard.js
// automatically opens the choice-filling button.
// ============================================================
router.get(
    "/current",
    authenticateToken,
    async (req, res) => {

        try {

            const now = new Date();


            // ====================================================
            // 1. AUTOMATICALLY OPEN SCHEDULED CHOICE FILLING
            // ====================================================

            await db.query(`
                UPDATE counselling_rounds
                SET
                    status = 'preference_open',
                    choice_open_at = COALESCE(
                        choice_open_at,
                        preference_start
                    )
                WHERE preference_start IS NOT NULL
                  AND preference_start <= ?
                  AND (
                        preference_end IS NULL
                        OR preference_end > ?
                  )
                  AND status = 'not_started'
            `, [
                now,
                now
            ]);


            // ====================================================
            // 2. AUTOMATICALLY CLOSE CHOICE FILLING
            // ====================================================

            await db.query(`
                UPDATE counselling_rounds
                SET
                    status = 'preferences_locked',
                    choice_close_at = COALESCE(
                        choice_close_at,
                        preference_end
                    )
                WHERE preference_end IS NOT NULL
                  AND preference_end <= ?
                  AND status = 'preference_open'
            `, [
                now
            ]);


            // ====================================================
            // 3. FIND CURRENTLY OPEN ROUND
            //
            // If choice filling is currently running,
            // return that round first.
            // ====================================================

            const [activeRounds] = await db.query(`
                SELECT *
                FROM counselling_rounds
                WHERE
                    preference_start IS NOT NULL
                    AND preference_end IS NOT NULL
                    AND preference_start <= ?
                    AND preference_end > ?
                ORDER BY round_number ASC
                LIMIT 1
            `, [
                now,
                now
            ]);


            if (activeRounds.length > 0) {

                return res.json({
                    success: true,
                    round: activeRounds[0],
                    roundState: "open"
                });

            }


            // ====================================================
            // 4. FIND NEXT SCHEDULED ROUND
            //
            // IMPORTANT:
            // This is the main fix.
            //
            // If Round 1 is scheduled for 10:00 AM and current
            // time is 9:30 AM, this returns Round 1 instead of
            // returning round: null.
            // ====================================================

            const [scheduledRounds] = await db.query(`
                SELECT *
                FROM counselling_rounds
                WHERE
                    preference_start IS NOT NULL
                    AND preference_start > ?
                    AND status NOT IN (
                        'completed',
                        'allotment_completed',
                        'payment_period'
                    )
                ORDER BY
                    preference_start ASC,
                    round_number ASC
                LIMIT 1
            `, [
                now
            ]);


            if (scheduledRounds.length > 0) {

                return res.json({
                    success: true,
                    round: scheduledRounds[0],
                    roundState: "scheduled"
                });

            }


            // ====================================================
            // 5. FIND RECENTLY PROCESSED ROUND
            //
            // This allows the dashboard to continue showing
            // relevant information after choice filling closes
            // and while allotment/payment is being processed.
            // ====================================================

            const [processedRounds] = await db.query(`
                SELECT *
                FROM counselling_rounds
                WHERE status IN (
                    'preferences_locked',
                    'allotment_completed',
                    'payment_period'
                )
                ORDER BY round_number DESC
                LIMIT 1
            `);


            if (processedRounds.length > 0) {

                return res.json({
                    success: true,
                    round: processedRounds[0],
                    roundState: "processed"
                });

            }


            // ====================================================
            // 6. NO ACTIVE OR SCHEDULED ROUND
            // ====================================================

            return res.json({
                success: true,
                round: null,
                roundState: "none",
                message:
                    "No active or scheduled counselling round"
            });


        } catch (error) {

            console.error(
                "GET CURRENT ROUND ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to get current round",
                error: error.message
            });

        }

    }
);


// ============================================================
// SET TOTAL NUMBER OF ROUNDS
//
// PUT /api/rounds/set-count
//
// Example:
// {
//     "numberOfRounds": 2
// }
//
// Database will contain exactly the requested number
// of counselling rounds, provided extra rounds have no
// counselling data attached.
// ============================================================
router.put(
    "/set-count",
    authenticateToken,
    requireRole("counsellor"),
    async (req, res) => {

        const connection =
            await db.getConnection();

        try {

            const numberOfRounds =
                Number(
                    req.body.numberOfRounds
                );


            // ------------------------------------------------
            // Validate
            // ------------------------------------------------

            if (
                !Number.isInteger(numberOfRounds) ||
                numberOfRounds < 1 ||
                numberOfRounds > 20
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Number of rounds must be between 1 and 20"
                });

            }


            await connection.beginTransaction();


            // ------------------------------------------------
            // Get existing rounds
            // ------------------------------------------------

            const [existingRounds] =
                await connection.query(`
                    SELECT
                        id,
                        round_number,
                        status
                    FROM counselling_rounds
                    ORDER BY round_number ASC
                `);


            // ------------------------------------------------
            // Create missing rounds
            // ------------------------------------------------

            for (
                let i =
                    existingRounds.length + 1;

                i <= numberOfRounds;

                i++
            ) {

                await connection.query(`
                    INSERT INTO counselling_rounds
                    (
                        round_number,
                        min_rank,
                        max_rank,
                        status
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        'not_started'
                    )
                `, [
                    i,
                    1,
                    100
                ]);

            }


            // ------------------------------------------------
            // Delete extra rounds
            // ------------------------------------------------

            if (
                existingRounds.length >
                numberOfRounds
            ) {

                const extraRounds =
                    existingRounds.filter(
                        round =>
                            round.round_number >
                            numberOfRounds
                    );


                for (
                    const round
                    of extraRounds
                ) {

                    // ----------------------------------------
                    // Safety check: preferences
                    // ----------------------------------------

                    const [preferences] =
                        await connection.query(`
                            SELECT COUNT(*) AS count
                            FROM preferences
                            WHERE round_id = ?
                        `, [
                            round.id
                        ]);


                    // ----------------------------------------
                    // Safety check: allotments
                    // ----------------------------------------

                    const [allotments] =
                        await connection.query(`
                            SELECT COUNT(*) AS count
                            FROM allotments
                            WHERE round_id = ?
                        `, [
                            round.id
                        ]);


                    if (
                        preferences[0].count > 0 ||
                        allotments[0].count > 0
                    ) {

                        throw new Error(
                            `Round ${round.round_number} contains counselling data and cannot be deleted.`
                        );

                    }


                    // ----------------------------------------
                    // Delete extra round
                    // ----------------------------------------

                    await connection.query(`
                        DELETE FROM counselling_rounds
                        WHERE id = ?
                    `, [
                        round.id
                    ]);

                }

            }


            await connection.commit();


            res.json({
                success: true,
                message:
                    `Counselling rounds set to ${numberOfRounds} successfully.`,
                numberOfRounds
            });

        } catch (error) {

            await connection.rollback();

            console.error(
                "SET ROUND COUNT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Failed to set number of rounds"
            });

        } finally {

            connection.release();

        }

    }
);


// ============================================================
// GET SINGLE ROUND
// GET /api/rounds/:id
// ============================================================
router.get(
    "/:id",
    authenticateToken,
    requireRole("counsellor"),
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const [rounds] =
                await db.query(`
                    SELECT *
                    FROM counselling_rounds
                    WHERE id = ?
                `, [
                    id
                ]);


            if (rounds.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Round not found"
                });

            }


            res.json({
                success: true,
                round: rounds[0]
            });

        } catch (error) {

            console.error(
                "GET SINGLE ROUND ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to load round",
                error: error.message
            });

        }

    }
);


// ============================================================
// CREATE ROUND
// POST /api/rounds/create
// ============================================================
router.post(
    "/create",
    authenticateToken,
    requireRole("counsellor"),
    async (req, res) => {

        try {

            const {
                round_number,
                min_rank,
                max_rank
            } = req.body;


            if (
                round_number === undefined ||
                min_rank === undefined ||
                max_rank === undefined
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Round number, minimum rank and maximum rank are required"
                });

            }


            const roundNumber =
                Number(round_number);

            const minRank =
                Number(min_rank);

            const maxRank =
                Number(max_rank);


            if (
                roundNumber <= 0 ||
                minRank <= 0 ||
                maxRank <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Round and rank values must be greater than zero"
                });

            }


            if (minRank > maxRank) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Minimum rank cannot be greater than maximum rank"
                });

            }


            const [existing] =
                await db.query(`
                    SELECT id
                    FROM counselling_rounds
                    WHERE round_number = ?
                `, [
                    roundNumber
                ]);


            if (existing.length > 0) {

                return res.status(409).json({
                    success: false,
                    message:
                        `Round ${roundNumber} already exists`
                });

            }


            const [result] =
                await db.query(`
                    INSERT INTO counselling_rounds
                    (
                        round_number,
                        min_rank,
                        max_rank,
                        status
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        'not_started'
                    )
                `, [
                    roundNumber,
                    minRank,
                    maxRank
                ]);


            res.status(201).json({
                success: true,
                message:
                    "Counselling round created successfully",
                roundId:
                    result.insertId
            });

        } catch (error) {

            console.error(
                "CREATE ROUND ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to create counselling round",
                error: error.message
            });

        }

    }
);


// ============================================================
// UPDATE ROUND SETTINGS
//
// PUT /api/rounds/:id/settings
//
// Rank settings:
//     min_rank
//     max_rank
//
// Schedule settings:
//     preference_start
//     preference_end
//     allotment_at
//     payment_deadline
//
// EMAIL RULE:
//     Rank-only save  -> NO EMAIL
//     Schedule save   -> SEND EMAIL
//
// EMAILS ARE SENT IN PARALLEL.
// ============================================================
router.put(
    "/:id/settings",
    authenticateToken,
    requireRole("counsellor"),
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                min_rank,
                max_rank,
                preference_start,
                preference_end,
                allotment_at,
                payment_deadline
            } = req.body;


            // ------------------------------------------------
            // 1. Get existing round
            // ------------------------------------------------

            const [rounds] =
                await db.query(`
                    SELECT *
                    FROM counselling_rounds
                    WHERE id = ?
                `, [
                    id
                ]);


            if (rounds.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Round not found"
                });

            }


            const round =
                rounds[0];


            // ------------------------------------------------
            // 2. Preserve existing values
            // ------------------------------------------------

            const newMinRank =
                min_rank !== undefined
                    ? Number(min_rank)
                    : round.min_rank;


            const newMaxRank =
                max_rank !== undefined
                    ? Number(max_rank)
                    : round.max_rank;


            const newPreferenceStart =
                preference_start !== undefined
                    ? (
                        preference_start ||
                        null
                    )
                    : round.preference_start;


            const newPreferenceEnd =
                preference_end !== undefined
                    ? (
                        preference_end ||
                        null
                    )
                    : round.preference_end;


            const newAllotmentAt =
                allotment_at !== undefined
                    ? (
                        allotment_at ||
                        null
                    )
                    : round.allotment_at;


            const newPaymentDeadline =
                payment_deadline !== undefined
                    ? (
                        payment_deadline ||
                        null
                    )
                    : round.payment_deadline;


            // ------------------------------------------------
            // 3. Validate rank
            // ------------------------------------------------

            if (
                !Number.isInteger(newMinRank) ||
                !Number.isInteger(newMaxRank) ||
                newMinRank <= 0 ||
                newMaxRank <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Ranks must be positive whole numbers"
                });

            }


            if (
                newMinRank >
                newMaxRank
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Minimum rank cannot be greater than maximum rank"
                });

            }


            // ------------------------------------------------
            // 4. Validate time order
            // ------------------------------------------------

            if (
                newPreferenceStart &&
                newPreferenceEnd
            ) {

                if (
                    new Date(
                        newPreferenceStart
                    ) >=
                    new Date(
                        newPreferenceEnd
                    )
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Choice filling start time must be before closing time"
                    });

                }

            }


            if (
                newPreferenceEnd &&
                newAllotmentAt
            ) {

                if (
                    new Date(
                        newAllotmentAt
                    ) <=
                    new Date(
                        newPreferenceEnd
                    )
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Allotment time must be after choice filling closes"
                    });

                }

            }


            if (
                newAllotmentAt &&
                newPaymentDeadline
            ) {

                if (
                    new Date(
                        newPaymentDeadline
                    ) <=
                    new Date(
                        newAllotmentAt
                    )
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Payment deadline must be after allotment time"
                    });

                }

            }


            // ------------------------------------------------
            // 5. Save round settings
            // ------------------------------------------------

            await db.query(`
                UPDATE counselling_rounds
                SET
                    min_rank = ?,
                    max_rank = ?,
                    preference_start = ?,
                    preference_end = ?,
                    allotment_at = ?,
                    payment_deadline = ?
                WHERE id = ?
            `, [
                newMinRank,
                newMaxRank,
                newPreferenceStart,
                newPreferenceEnd,
                newAllotmentAt,
                newPaymentDeadline,
                id
            ]);


            // ------------------------------------------------
            // 6. Determine whether this is a schedule save
            // ------------------------------------------------

            const scheduleIsBeingSaved =
                preference_start !== undefined ||
                preference_end !== undefined ||
                allotment_at !== undefined ||
                payment_deadline !== undefined;


            // ------------------------------------------------
            // 7. Find eligible students
            // ------------------------------------------------

            let students = [];

            if (scheduleIsBeingSaved) {

                const [eligibleStudents] =
                    await db.query(`
                        SELECT
                            s.id AS student_id,
                            s.rank_number,
                            u.name,
                            u.email
                        FROM students s
                        INNER JOIN users u
                            ON u.id = s.user_id
                        WHERE
                            u.role = 'student'
                            AND s.rank_number >= ?
                            AND s.rank_number <= ?
                        ORDER BY s.rank_number ASC
                    `, [
                        newMinRank,
                        newMaxRank
                    ]);

                students =
                    eligibleStudents;

            }


            // ------------------------------------------------
            // 8. Send schedule emails
            //
            // Promise.all() sends emails concurrently.
            // ------------------------------------------------

            let emailSent = 0;

            let emailFailed = 0;

            const failedEmails = [];


            if (scheduleIsBeingSaved) {

                const emailResults =
                    await Promise.all(

                        students.map(
                            async (student) => {

                                try {

                                    await sendCounsellingScheduleEmail(
                                        student.email,
                                        student.name,
                                        round.round_number,
                                        newMinRank,
                                        newMaxRank,
                                        newPreferenceStart,
                                        newPreferenceEnd,
                                        newAllotmentAt,
                                        newPaymentDeadline
                                    );


                                    console.log(
                                        `Counselling schedule email sent to ${student.email}`
                                    );


                                    return {
                                        success: true,
                                        email:
                                            student.email
                                    };

                                } catch (emailError) {

                                    console.error(
                                        `Failed to send counselling email to ${student.email}:`,
                                        emailError.message
                                    );


                                    return {
                                        success: false,
                                        email:
                                            student.email,
                                        error:
                                            emailError.message
                                    };

                                }

                            }
                        )

                    );


                // --------------------------------------------
                // Count email results
                // --------------------------------------------

                for (
                    const result
                    of emailResults
                ) {

                    if (result.success) {

                        emailSent++;

                    } else {

                        emailFailed++;

                        failedEmails.push({
                            email:
                                result.email,
                            error:
                                result.error
                        });

                    }

                }

            }


            // ------------------------------------------------
            // 9. Return result
            // ------------------------------------------------

            res.json({

                success: true,

                message:
                    scheduleIsBeingSaved
                        ? "Round schedule saved successfully"
                        : "Round settings saved successfully",

                round: {

                    id:
                        round.id,

                    round_number:
                        round.round_number,

                    min_rank:
                        newMinRank,

                    max_rank:
                        newMaxRank,

                    preference_start:
                        newPreferenceStart,

                    preference_end:
                        newPreferenceEnd,

                    allotment_at:
                        newAllotmentAt,

                    payment_deadline:
                        newPaymentDeadline

                },

                eligibleStudents:
                    students.length,

                emailSent:
                    emailSent,

                emailFailed:
                    emailFailed,

                failedEmails:
                    failedEmails

            });

        } catch (error) {

            console.error(
                "UPDATE ROUND SETTINGS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to update round settings",
                error: error.message
            });

        }

    }
);


// ============================================================
// OPEN CHOICE FILLING
//
// POST /api/rounds/:id/open-preferences
// ============================================================
router.post(
    "/:id/open-preferences",
    authenticateToken,
    requireRole("counsellor"),
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                preference_start
            } = req.body;


            const [rounds] =
                await db.query(`
                    SELECT *
                    FROM counselling_rounds
                    WHERE id = ?
                `, [
                    id
                ]);


            if (rounds.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Round not found"
                });

            }


            const round =
                rounds[0];


            const startTime =
                preference_start ||
                round.preference_start;


            if (!startTime) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Choice filling start time is required"
                });

            }


            await db.query(`
                UPDATE counselling_rounds
                SET
                    preference_start = ?,
                    choice_open_at = ?,
                    status = 'preference_open'
                WHERE id = ?
            `, [
                startTime,
                startTime,
                id
            ]);


            res.json({
                success: true,
                message:
                    "Choice filling opened successfully",
                preference_start:
                    startTime
            });

        } catch (error) {

            console.error(
                "OPEN CHOICE FILLING ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to open choice filling",
                error: error.message
            });

        }

    }
);


// ============================================================
// LOCK CHOICE FILLING
//
// POST /api/rounds/:id/lock-preferences
// ============================================================
router.post(
    "/:id/lock-preferences",
    authenticateToken,
    requireRole("counsellor"),
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                preference_end
            } = req.body;


            const [rounds] =
                await db.query(`
                    SELECT *
                    FROM counselling_rounds
                    WHERE id = ?
                `, [
                    id
                ]);


            if (rounds.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Round not found"
                });

            }


            const round =
                rounds[0];


            const endTime =
                preference_end ||
                round.preference_end;


            if (!endTime) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Choice filling closing time is required"
                });

            }


            await db.query(`
                UPDATE counselling_rounds
                SET
                    preference_end = ?,
                    choice_close_at = ?,
                    status = 'preferences_locked'
                WHERE id = ?
            `, [
                endTime,
                endTime,
                id
            ]);


            // ------------------------------------------------
            // Lock preferences belonging to this round
            // ------------------------------------------------

            await db.query(`
                UPDATE preferences
                SET
                    is_locked = 1,
                    locked_at = NOW()
                WHERE round_id = ?
            `, [
                id
            ]);


            res.json({
                success: true,
                message:
                    "Choice filling locked successfully",
                preference_end:
                    endTime
            });

        } catch (error) {

            console.error(
                "LOCK CHOICE FILLING ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to lock choice filling",
                error: error.message
            });

        }

    }
);


// ============================================================
// MARK ALLOTMENT COMPLETED
//
// POST /api/rounds/:id/allotment-completed
// ============================================================
router.post(
    "/:id/allotment-completed",
    authenticateToken,
    requireRole("counsellor"),
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const [rounds] =
                await db.query(`
                    SELECT *
                    FROM counselling_rounds
                    WHERE id = ?
                `, [
                    id
                ]);


            if (rounds.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Round not found"
                });

            }


            await db.query(`
                UPDATE counselling_rounds
                SET
                    status = 'allotment_completed',
                    allotment_published_at =
                        COALESCE(
                            allotment_published_at,
                            NOW()
                        )
                WHERE id = ?
            `, [
                id
            ]);


            res.json({
                success: true,
                message:
                    "Allotment marked as completed and published"
            });

        } catch (error) {

            console.error(
                "ALLOTMENT COMPLETED ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to complete allotment",
                error: error.message
            });

        }

    }
);


// ============================================================
// START OFFLINE PAYMENT PERIOD
//
// POST /api/rounds/:id/payment-period
// ============================================================
router.post(
    "/:id/payment-period",
    authenticateToken,
    requireRole("counsellor"),
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                payment_deadline
            } = req.body;


            const [rounds] =
                await db.query(`
                    SELECT *
                    FROM counselling_rounds
                    WHERE id = ?
                `, [
                    id
                ]);


            if (rounds.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Round not found"
                });

            }


            const round =
                rounds[0];


            const deadline =
                payment_deadline ||
                round.payment_deadline;


            if (!deadline) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Payment deadline is required"
                });

            }


            await db.query(`
                UPDATE counselling_rounds
                SET
                    payment_deadline = ?,
                    status = 'payment_period'
                WHERE id = ?
            `, [
                deadline,
                id
            ]);


            // ------------------------------------------------
            // Allotted students become payment pending
            // ------------------------------------------------

            await db.query(`
                UPDATE allotments
                SET status = 'payment_pending'
                WHERE round_id = ?
                  AND status = 'allotted'
            `, [
                id
            ]);


            res.json({
                success: true,
                message:
                    "Offline payment period started successfully",
                payment_deadline:
                    deadline
            });

        } catch (error) {

            console.error(
                "PAYMENT PERIOD ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to start payment period",
                error: error.message
            });

        }

    }
);


// ============================================================
// COMPLETE ROUND
//
// POST /api/rounds/:id/complete
// ============================================================
router.post(
    "/:id/complete",
    authenticateToken,
    requireRole("counsellor"),
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const [rounds] =
                await db.query(`
                    SELECT *
                    FROM counselling_rounds
                    WHERE id = ?
                `, [
                    id
                ]);


            if (rounds.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Round not found"
                });

            }


            await db.query(`
                UPDATE counselling_rounds
                SET status = 'completed'
                WHERE id = ?
            `, [
                id
            ]);


            res.json({
                success: true,
                message:
                    "Counselling round completed successfully"
            });

        } catch (error) {

            console.error(
                "COMPLETE ROUND ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to complete counselling round",
                error: error.message
            });

        }

    }
);


// ============================================================
// RESET ENTIRE COUNSELLING PROCESS
//
// POST /api/rounds/reset-process
//
// DOES NOT DELETE:
// - users
// - students
// - applications
// - departments
// - counsellors
// ============================================================
router.post(
    "/reset-process",
    authenticateToken,
    requireRole("counsellor"),
    async (req, res) => {

        const connection =
            await db.getConnection();

        try {

            await connection.beginTransaction();


            // ------------------------------------------------
            // Delete payments
            // ------------------------------------------------

            await connection.query(`
                DELETE FROM payments
            `);


            // ------------------------------------------------
            // Delete seat movements
            // ------------------------------------------------

            await connection.query(`
                DELETE FROM seat_movements
            `);


            // ------------------------------------------------
            // Delete upward requests
            // ------------------------------------------------

            await connection.query(`
                DELETE FROM upward_requests
            `);


            // ------------------------------------------------
            // Delete allotments
            // ------------------------------------------------

            await connection.query(`
                DELETE FROM allotments
            `);


            // ------------------------------------------------
            // Delete preferences
            // ------------------------------------------------

            await connection.query(`
                DELETE FROM preferences
            `);


            // ------------------------------------------------
            // Reset counselling sessions
            // ------------------------------------------------

            await connection.query(`
                UPDATE counselling_sessions
                SET
                    current_rank = 1,
                    status = 'not_started',
                    started_at = NULL,
                    ended_at = NULL
            `);


            // ------------------------------------------------
            // Reset counselling rounds
            // ------------------------------------------------

            await connection.query(`
                UPDATE counselling_rounds
                SET
                    preference_start = NULL,
                    preference_end = NULL,
                    allotment_at = NULL,
                    payment_deadline = NULL,
                    status = 'not_started',
                    choice_open_at = NULL,
                    choice_close_at = NULL,
                    allotment_published_at = NULL
            `);


            await connection.commit();


            res.json({
                success: true,
                message:
                    "Entire counselling process has been reset successfully"
            });

        } catch (error) {

            await connection.rollback();

            console.error(
                "RESET COUNSELLING ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to reset counselling process"
            });

        } finally {

            connection.release();

        }

    }
);


module.exports = router;