const express = require("express");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const db = require("../config/db");

const router = express.Router();


// ============================================================
// GCE ERODE - STUDENT PREFERENCES
// COUNSELLOR CONTROLS CHOICE-FILLING WINDOW
// ============================================================


// ============================================================
// HELPER - GET STUDENT ID FROM LOGGED-IN USER ID
// ============================================================

async function getStudentIdFromUserId(userId) {

    const [students] = await db.execute(
        `
        SELECT
            id,
            rank_number,
            community
        FROM students
        WHERE user_id = ?
        LIMIT 1
        `,
        [userId]
    );

    if (students.length === 0) {
        return null;
    }

    return students[0];
}


// ============================================================
// HELPER - GET ACTIVE COUNSELLING ROUND
// ============================================================

async function getActiveRound() {

    const [rounds] = await db.execute(
        `
        SELECT
            id,
            round_number,
            min_rank,
            max_rank,
            preference_start,
            preference_end,
            choice_open_at,
            choice_close_at,
            allotment_at,
            payment_deadline,
            allotment_published_at,
            status

        FROM counselling_rounds

        WHERE status IN (
            'not_started',
            'preference_open',
            'preferences_locked',
            'allotment_completed',
            'payment_period'
        )

        ORDER BY round_number ASC

        LIMIT 1
        `
    );

    return rounds.length > 0
        ? rounds[0]
        : null;
}


// ============================================================
// HELPER - GET CHOICE OPEN TIME
// ============================================================

function getChoiceOpenTime(round) {

    return (
        round.choice_open_at ||
        round.preference_start ||
        null
    );
}


// ============================================================
// HELPER - GET CHOICE CLOSE TIME
// ============================================================

function getChoiceCloseTime(round) {

    return (
        round.choice_close_at ||
        round.preference_end ||
        null
    );
}


// ============================================================
// HELPER - AUTOMATICALLY LOCK ROUND PREFERENCES
// ============================================================

async function lockRoundPreferences(roundId) {

    const [result] = await db.execute(
        `
        UPDATE preferences

        SET
            is_locked = 1,
            locked_at = COALESCE(
                locked_at,
                NOW()
            )

        WHERE round_id = ?

        AND is_locked = 0
        `,
        [roundId]
    );

    return result.affectedRows;
}


// ============================================================
// HELPER - CHANGE ROUND STATUS TO LOCKED
// ============================================================

async function markRoundPreferencesLocked(roundId) {

    await db.execute(
        `
        UPDATE counselling_rounds

        SET
            status = 'preferences_locked'

        WHERE id = ?

        AND status IN (
            'not_started',
            'preference_open'
        )
        `,
        [roundId]
    );
}


// ============================================================
// HELPER - CHECK CHOICE FILLING WINDOW
// USING MYSQL SERVER TIME
// ============================================================

async function checkChoiceFillingOpen() {

    const round = await getActiveRound();


    // ========================================================
    // NO ACTIVE ROUND
    // ========================================================

    if (!round) {

        return {

            allowed: false,

            message:
                "No counselling round is currently available",

            round: null

        };
    }


    // ========================================================
    // GET CURRENT MYSQL SERVER TIME
    // ========================================================
    //
    // IMPORTANT:
    //
    // Do NOT use:
    //
    // SELECT NOW() AS current_time
    //
    // because current_time can be interpreted as a
    // MySQL keyword/function.
    //
    // Use db_now instead.
    //
    // ========================================================

    const [timeRows] = await db.execute(
        `
        SELECT NOW() AS db_now
        `
    );


    const currentTime =
        new Date(timeRows[0].db_now);


    // ========================================================
    // GET OPEN AND CLOSE TIMES
    // ========================================================

    const openTimeValue =
        getChoiceOpenTime(round);

    const closeTimeValue =
        getChoiceCloseTime(round);


    // ========================================================
    // SCHEDULE NOT CONFIGURED
    // ========================================================

    if (
        !openTimeValue ||
        !closeTimeValue
    ) {

        return {

            allowed: false,

            message:
                "Choice-filling schedule has not been configured",

            round,

            currentTime

        };
    }


    const openTime =
        new Date(openTimeValue);

    const closeTime =
        new Date(closeTimeValue);


    // ========================================================
    // BEFORE CHOICE FILLING OPENS
    // ========================================================

    if (currentTime < openTime) {

        return {

            allowed: false,

            message:
                "Choice filling has not started yet",

            round,

            currentTime,

            openTime,

            closeTime

        };
    }


    // ========================================================
    // CHOICE FILLING CLOSED
    // ========================================================

    if (currentTime >= closeTime) {


        // ----------------------------------------------------
        // AUTOMATICALLY LOCK ALL PREFERENCES
        // ----------------------------------------------------

        const lockedCount =
            await lockRoundPreferences(
                round.id
            );


        // ----------------------------------------------------
        // AUTOMATICALLY CHANGE ROUND STATUS
        // ----------------------------------------------------

        await markRoundPreferencesLocked(
            round.id
        );


        round.status =
            "preferences_locked";


        console.log(
            `🔒 Round ${round.round_number} ` +
            `preferences locked automatically. ` +
            `Locked preferences: ${lockedCount}`
        );


        return {

            allowed: false,

            message:
                "Choice filling has been closed",

            round,

            currentTime,

            openTime,

            closeTime,

            lockedCount

        };
    }


    // ========================================================
    // WITHIN CHOICE-FILLING WINDOW
    // ========================================================

    if (
        currentTime >= openTime &&
        currentTime < closeTime
    ) {


        // ----------------------------------------------------
        // AUTOMATICALLY OPEN ROUND
        // ----------------------------------------------------

        if (
            round.status ===
            "not_started"
        ) {

            await db.execute(
                `
                UPDATE counselling_rounds

                SET
                    status = 'preference_open'

                WHERE id = ?

                AND status = 'not_started'
                `,
                [round.id]
            );


            round.status =
                "preference_open";


            console.log(
                `🟢 Round ${round.round_number} ` +
                `choice filling opened automatically.`
            );
        }


        // ----------------------------------------------------
        // CHECK ROUND STATUS
        // ----------------------------------------------------

        if (
            round.status !==
            "preference_open"
        ) {

            return {

                allowed: false,

                message:
                    "Choice filling is currently unavailable",

                round,

                currentTime,

                openTime,

                closeTime

            };
        }


        return {

            allowed: true,

            message:
                "Choice filling is open",

            round,

            currentTime,

            openTime,

            closeTime

        };
    }


    // ========================================================
    // FALLBACK
    // ========================================================

    return {

        allowed: false,

        message:
            "Choice filling is currently unavailable",

        round,

        currentTime,

        openTime,

        closeTime

    };
}


// ============================================================
// POST /api/preferences
// SAVE STUDENT PREFERENCES
// ============================================================

router.post(
    "/",
    authenticateToken,
    async (req, res) => {

        try {


            // ==================================================
            // ONLY STUDENTS
            // ==================================================

            if (
                req.user.role !==
                "student"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Only students can submit preferences"

                });
            }


            // ==================================================
            // GET STUDENT RECORD
            // ==================================================

            const student =
                await getStudentIdFromUserId(
                    req.user.id
                );


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student profile not found"

                });
            }


            const studentId =
                student.id;


            // ==================================================
            // CHECK CHOICE FILLING WINDOW
            // ==================================================

            const choiceStatus =
                await checkChoiceFillingOpen();


            if (
                !choiceStatus.allowed
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        choiceStatus.message,

                    round:
                        choiceStatus.round ||
                        null

                });
            }


            const round =
                choiceStatus.round;


            // ==================================================
            // CHECK STUDENT RANK
            // ==================================================

            if (
                student.rank_number ===
                    null ||

                student.rank_number ===
                    undefined
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your counselling rank has not been assigned"

                });
            }


            // ==================================================
            // CHECK ROUND ELIGIBILITY
            // ==================================================

            if (
                student.rank_number <
                    round.min_rank ||

                student.rank_number >
                    round.max_rank
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        `You are not eligible for Round ${round.round_number}`,

                    rank:
                        student.rank_number,

                    min_rank:
                        round.min_rank,

                    max_rank:
                        round.max_rank

                });
            }


            // ==================================================
            // GET REQUEST DATA
            // ==================================================

            const {
                preferences
            } = req.body;


            // ==================================================
            // VALIDATE PREFERENCES ARRAY
            // ==================================================

            if (
                !Array.isArray(
                    preferences
                ) ||

                preferences.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Preferences must be a non-empty array"

                });
            }


            // ==================================================
            // CONVERT DEPARTMENT IDS TO NUMBERS
            // ==================================================

            const departmentIds =
                preferences.map(
                    id => Number(id)
                );


            // ==================================================
            // CHECK INVALID IDS
            // ==================================================

            if (
                departmentIds.some(
                    id =>
                        !Number.isInteger(id) ||
                        id <= 0
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid department ID found"

                });
            }


            // ==================================================
            // CHECK DUPLICATES
            // ==================================================

            const uniquePreferences =
                new Set(
                    departmentIds
                );


            if (
                uniquePreferences.size !==
                departmentIds.length
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "A department cannot be selected more than once"

                });
            }


            // ==================================================
            // CHECK DEPARTMENTS EXIST
            // ==================================================

            const placeholders =
                departmentIds
                    .map(() => "?")
                    .join(",");


            const [departments] =
                await db.execute(
                    `
                    SELECT
                        id

                    FROM departments

                    WHERE id IN (
                        ${placeholders}
                    )
                    `,
                    departmentIds
                );


            if (
                departments.length !==
                departmentIds.length
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "One or more department IDs are invalid"

                });
            }


            // ==================================================
            // CHECK LOCKED PREFERENCES
            // ==================================================

            const [lockedPreferences] =
                await db.execute(
                    `
                    SELECT
                        id

                    FROM preferences

                    WHERE student_id = ?

                    AND round_id = ?

                    AND is_locked = 1

                    LIMIT 1
                    `,
                    [
                        studentId,
                        round.id
                    ]
                );


            if (
                lockedPreferences.length >
                0
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your preferences are already locked"

                });
            }


            // ==================================================
            // DELETE PREVIOUS UNLOCKED PREFERENCES
            // ==================================================

            await db.execute(
                `
                DELETE FROM preferences

                WHERE student_id = ?

                AND round_id = ?

                AND is_locked = 0
                `,
                [
                    studentId,
                    round.id
                ]
            );


            // ==================================================
            // INSERT NEW PREFERENCES
            // ==================================================

            for (
                let i = 0;
                i < departmentIds.length;
                i++
            ) {

                const departmentId =
                    departmentIds[i];

                const priority =
                    i + 1;


                await db.execute(
                    `
                    INSERT INTO preferences
                    (
                        student_id,
                        department_id,
                        priority,
                        round_id,
                        is_locked
                    )

                    VALUES (?, ?, ?, ?, 0)
                    `,
                    [
                        studentId,
                        departmentId,
                        priority,
                        round.id
                    ]
                );
            }


            // ==================================================
            // VERIFY SAVED PREFERENCES
            // ==================================================

            const [savedPreferences] =
                await db.execute(
                    `
                    SELECT
                        id,
                        student_id,
                        department_id,
                        priority,
                        round_id,
                        is_locked,
                        locked_at

                    FROM preferences

                    WHERE student_id = ?

                    AND round_id = ?

                    ORDER BY priority ASC
                    `,
                    [
                        studentId,
                        round.id
                    ]
                );


            console.log(
                `✅ Preferences saved - ` +
                `Student ${studentId}, ` +
                `Round ${round.round_number}, ` +
                `Count ${savedPreferences.length}`
            );


            // ==================================================
            // SUCCESS
            // ==================================================

            return res.status(201).json({

                success: true,

                message:
                    "Preferences saved successfully",

                studentId:
                    studentId,

                round_id:
                    round.id,

                round_number:
                    round.round_number,

                count:
                    savedPreferences.length,

                preferences:
                    savedPreferences

            });

        }

        catch (error) {

            console.error(
                "SAVE PREFERENCES ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to save preferences",

                error:
                    error.message

            });
        }
    }
);


// ============================================================
// STUDENT LOCK ENDPOINT
// ============================================================
//
// Students CANNOT manually lock preferences.
//
// Backend automatically locks preferences when
// choice_close_at is reached.
//
// ============================================================

router.post(
    "/lock",
    authenticateToken,
    async (req, res) => {

        return res.status(403).json({

            success: false,

            message:
                "Students cannot manually lock preferences. " +
                "The counselling schedule automatically locks them."

        });
    }
);


// ============================================================
// GET /api/preferences
// GET STUDENT PREFERENCES
// ============================================================

router.get(
    "/",
    authenticateToken,
    async (req, res) => {

        try {


            // ==================================================
            // ONLY STUDENTS
            // ==================================================

            if (
                req.user.role !==
                "student"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Only students can view preferences"

                });
            }


            // ==================================================
            // GET STUDENT
            // ==================================================

            const student =
                await getStudentIdFromUserId(
                    req.user.id
                );


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student profile not found"

                });
            }


            const studentId =
                student.id;


            // ==================================================
            // GET ACTIVE ROUND
            // ==================================================

            const round =
                await getActiveRound();


            // ==================================================
            // NO ROUND
            // ==================================================

            if (!round) {

                return res.json({

                    success: true,

                    count: 0,

                    preferences: [],

                    round: null

                });
            }


            // ==================================================
            // GET PREFERENCES
            // ==================================================

            const [preferences] =
                await db.execute(
                    `
                    SELECT
                        p.id,
                        p.student_id,
                        p.department_id,
                        d.code,
                        d.name,
                        p.priority,
                        p.round_id,
                        p.is_locked,
                        p.locked_at

                    FROM preferences p

                    JOIN departments d
                        ON p.department_id = d.id

                    WHERE p.student_id = ?

                    AND p.round_id = ?

                    ORDER BY p.priority ASC
                    `,
                    [
                        studentId,
                        round.id
                    ]
                );


            // ==================================================
            // SUCCESS
            // ==================================================

            return res.json({

                success: true,

                count:
                    preferences.length,

                preferences,

                round: {

                    id:
                        round.id,

                    round_number:
                        round.round_number,

                    min_rank:
                        round.min_rank,

                    max_rank:
                        round.max_rank,

                    preference_start:
                        round.preference_start,

                    preference_end:
                        round.preference_end,

                    choice_open_at:
                        round.choice_open_at,

                    choice_close_at:
                        round.choice_close_at,

                    allotment_at:
                        round.allotment_at,

                    payment_deadline:
                        round.payment_deadline,

                    allotment_published_at:
                        round.allotment_published_at,

                    status:
                        round.status

                }

            });

        }

        catch (error) {

            console.error(
                "GET PREFERENCES ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to fetch preferences",

                error:
                    error.message

            });
        }
    }
);


// ============================================================
// GET /api/preferences/status
// CURRENT CHOICE-FILLING STATUS
// ============================================================

router.get(
    "/status",
    authenticateToken,
    async (req, res) => {

        try {


            // ==================================================
            // ONLY STUDENTS
            // ==================================================

            if (
                req.user.role !==
                "student"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Only students can view choice-filling status"

                });
            }


            // ==================================================
            // GET STUDENT
            // ==================================================

            const student =
                await getStudentIdFromUserId(
                    req.user.id
                );


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student profile not found"

                });
            }


            // ==================================================
            // CHECK CHOICE STATUS
            // ==================================================

            const choiceStatus =
                await checkChoiceFillingOpen();


            const round =
                choiceStatus.round;


            // ==================================================
            // NO ROUND
            // ==================================================

            if (!round) {

                return res.json({

                    success: true,

                    choice_filling_open:
                        false,

                    eligible:
                        false,

                    message:
                        choiceStatus.message,

                    status:
                        "not_started",

                    current_time:
                        choiceStatus.currentTime ||
                        null,

                    round:
                        null

                });
            }


            // ==================================================
            // CHECK RANK ELIGIBILITY
            // ==================================================

            const eligible =
                student.rank_number !==
                    null &&

                student.rank_number !==
                    undefined &&

                student.rank_number >=
                    round.min_rank &&

                student.rank_number <=
                    round.max_rank;


            // ==================================================
            // GET STUDENT PREFERENCE COUNT
            // ==================================================

            const [preferenceRows] =
                await db.execute(
                    `
                    SELECT
                        COUNT(*) AS preference_count

                    FROM preferences

                    WHERE student_id = ?

                    AND round_id = ?
                    `,
                    [
                        student.id,
                        round.id
                    ]
                );


            const preferenceCount =
                Number(
                    preferenceRows[0]
                        .preference_count
                );


            // ==================================================
            // SUCCESS
            // ==================================================

            return res.json({

                success: true,

                choice_filling_open:
                    choiceStatus.allowed &&
                    eligible,

                eligible:
                    eligible,

                message:
                    eligible
                        ? choiceStatus.message
                        : `You are not eligible for Round ${round.round_number}`,

                status:
                    round.status,

                current_time:
                    choiceStatus.currentTime ||
                    null,

                preference_count:
                    preferenceCount,

                round: {

                    id:
                        round.id,

                    round_number:
                        round.round_number,

                    min_rank:
                        round.min_rank,

                    max_rank:
                        round.max_rank,

                    preference_start:
                        round.preference_start,

                    preference_end:
                        round.preference_end,

                    choice_open_at:
                        round.choice_open_at,

                    choice_close_at:
                        round.choice_close_at,

                    allotment_at:
                        round.allotment_at,

                    payment_deadline:
                        round.payment_deadline,

                    allotment_published_at:
                        round.allotment_published_at,

                    status:
                        round.status

                }

            });

        }

        catch (error) {

            console.error(
                "GET CHOICE FILLING STATUS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to fetch choice-filling status",

                error:
                    error.message

            });
        }
    }
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;