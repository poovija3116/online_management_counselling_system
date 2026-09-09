const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

// ===============================
// ROUTES
// ===============================

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const roundRoutes = require("./routes/roundRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const preferenceRoutes = require("./routes/preferenceRoutes");
const allotmentRoutes = require("./routes/allotmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");

const app = express();


// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());


// ===============================
// API ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/rounds", roundRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/allotments", allotmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message:
            "GCE Counselling Backend is running"
    });

});


// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message:
            "Server is healthy"
    });

});


// ===============================
// DATABASE TEST
// ===============================

app.get("/api/db-test", async (req, res) => {

    try {

        const [rows] =
            await db.execute(
                "SELECT 1 AS result"
            );

        res.json({
            success: true,
            message:
                "MySQL connected successfully",
            result: rows
        });

    } catch (error) {

        console.error(
            "DATABASE CONNECTION ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Database connection failed",

            error:
                error.message

        });

    }

});


// ============================================================
// AUTOMATIC COUNSELLING SCHEDULER
// ============================================================
//
// FLOW:
//
// 1. Counsellor configures round
//
// 2. Choice filling opens automatically
//
// 3. Student saves preferences
//
// 4. Choice filling closes automatically
//
// 5. Backend locks preferences
//
// 6. System waits until allotment_at
//
// 7. Allotment runs automatically
//
// 8. Allotment is published
//
// 9. Payment period starts
//
// 10. Payment deadline is reached
//
// 11. Round becomes completed
//
// 12. Next scheduled round becomes current
//
// ============================================================

let automaticSchedulerRunning = false;


// ============================================================
// STEP 1
// LOCK CLOSED PREFERENCES
// ============================================================

async function lockClosedPreferences() {

    try {

        const [rounds] =
            await db.execute(`
                SELECT
                    id,
                    round_number,
                    choice_close_at,
                    preference_end,
                    status,
                    allotment_published_at
                FROM counselling_rounds
                WHERE
                    COALESCE(
                        choice_close_at,
                        preference_end
                    ) IS NOT NULL
                    AND COALESCE(
                        choice_close_at,
                        preference_end
                    ) <= NOW()
                    AND allotment_published_at IS NULL
                    AND status IN (
                        'preference_open',
                        'not_started'
                    )
                ORDER BY
                    round_number ASC
            `);


        if (rounds.length === 0) {

            return;

        }


        for (const round of rounds) {

            try {

                // ==================================================
                // LOCK STUDENT PREFERENCES
                // ==================================================

                const [lockResult] =
                    await db.execute(`
                        UPDATE preferences
                        SET
                            is_locked = 1,
                            locked_at =
                                COALESCE(
                                    locked_at,
                                    NOW()
                                )
                        WHERE
                            round_id = ?
                            AND is_locked = 0
                    `, [
                        round.id
                    ]);


                if (
                    lockResult.affectedRows > 0
                ) {

                    console.log(
                        `🔒 Round ${round.round_number}: ` +
                        `${lockResult.affectedRows} preference(s) locked.`
                    );

                }


                // ==================================================
                // CHANGE ROUND STATUS
                // ==================================================

                await db.execute(`
                    UPDATE counselling_rounds
                    SET
                        status =
                            'preferences_locked'
                    WHERE
                        id = ?
                        AND allotment_published_at IS NULL
                `, [
                    round.id
                ]);


                console.log(
                    `✅ Round ${round.round_number}: ` +
                    `preferences_locked`
                );

            } catch (error) {

                console.error(
                    `❌ Preference lock error - ` +
                    `Round ${round.round_number}:`,
                    error
                );

            }

        }

    } catch (error) {

        console.error(
            "❌ AUTOMATIC PREFERENCE LOCK ERROR:",
            error
        );

    }

}


// ============================================================
// STEP 2
// CHECK AUTOMATIC ALLOTMENT
// ============================================================

async function checkAutomaticAllotment() {

    if (automaticSchedulerRunning) {

        return;

    }


    automaticSchedulerRunning = true;


    try {

        // ======================================================
        // LOCK CLOSED PREFERENCES FIRST
        // ======================================================

        await lockClosedPreferences();


        // ======================================================
        // FIND ROUNDS READY FOR ALLOTMENT
        // ======================================================

        const [rounds] =
            await db.execute(`
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
                    allotment_published_at,
                    payment_deadline,
                    status
                FROM counselling_rounds
                WHERE
                    allotment_at IS NOT NULL
                    AND allotment_at <= NOW()
                    AND allotment_published_at IS NULL
                    AND COALESCE(
                        choice_close_at,
                        preference_end
                    ) IS NOT NULL
                    AND COALESCE(
                        choice_close_at,
                        preference_end
                    ) <= NOW()
                ORDER BY
                    round_number ASC
            `);


        if (rounds.length === 0) {

            return;

        }


        console.log(
            "=============================================="
        );

        console.log(
            "🎯 AUTOMATIC ALLOTMENT CHECK"
        );

        console.log(
            `Rounds ready: ${rounds.length}`
        );

        console.log(
            "=============================================="
        );


        // ======================================================
        // PROCESS EACH ROUND
        // ======================================================

        for (const round of rounds) {

            try {

                console.log(
                    `\n🔄 Processing Round ${round.round_number}`
                );

                console.log(
                    `Round ID: ${round.id}`
                );

                console.log(
                    `Allotment Time: ${round.allotment_at}`
                );


                // ==================================================
                // FINAL SAFETY LOCK
                // ==================================================

                const [lockResult] =
                    await db.execute(`
                        UPDATE preferences
                        SET
                            is_locked = 1,
                            locked_at =
                                COALESCE(
                                    locked_at,
                                    NOW()
                                )
                        WHERE
                            round_id = ?
                            AND is_locked = 0
                    `, [
                        round.id
                    ]);


                if (
                    lockResult.affectedRows > 0
                ) {

                    console.log(
                        `🔐 Final safety lock: ` +
                        `${lockResult.affectedRows} preference(s) locked.`
                    );

                }


                // ==================================================
                // VERIFY ALLOTMENT FUNCTION
                // ==================================================

                if (
                    typeof
                    allotmentRoutes.runAllotmentForRound
                    !== "function"
                ) {

                    console.error(
                        "❌ runAllotmentForRound() " +
                        "is not available."
                    );

                    continue;

                }


                // ==================================================
                // RUN AUTOMATIC ALLOTMENT
                // ==================================================

                console.log(
                    `🎯 Running automatic allotment ` +
                    `for Round ${round.round_number}...`
                );


                const result =
                    await allotmentRoutes
                        .runAllotmentForRound(
                            round.id
                        );


                console.log(
                    "Allotment result:",
                    result
                );


                // ==================================================
                // CHECK RESULT
                // ==================================================

                if (
                    !result ||
                    result.success !== true
                ) {

                    console.error(
                        `❌ Allotment was not successful ` +
                        `for Round ${round.round_number}`
                    );

                    continue;

                }


                // ==================================================
                // ALLOTMENT SUCCESS
                // ==================================================

                console.log(
                    `🎉 Round ${round.round_number} ` +
                    `ALLOTMENT PUBLISHED AUTOMATICALLY`
                );


                console.log(
                    `Students: ${result.total_students}`
                );

                console.log(
                    `Allotted: ${result.allotted}`
                );

                console.log(
                    `Skipped: ${result.skipped}`
                );

                console.log(
                    `Not allotted: ${result.not_allotted}`
                );


                // ==================================================
                // START PAYMENT PERIOD
                // ==================================================

                await db.execute(`
                    UPDATE counselling_rounds
                    SET
                        status = 'payment_period'
                    WHERE
                        id = ?
                        AND allotment_published_at IS NOT NULL
                        AND status = 'allotment_completed'
                `, [
                    round.id
                ]);


                console.log(
                    `💳 Round ${round.round_number}: ` +
                    `PAYMENT PERIOD STARTED`
                );


                console.log(
                    "=============================================="
                );

            } catch (error) {

                console.error(
                    `❌ AUTOMATIC ALLOTMENT ERROR - ` +
                    `Round ${round.round_number}:`,
                    error
                );

            }

        }

    } catch (error) {

        console.error(
            "❌ AUTOMATIC ALLOTMENT SCHEDULER ERROR:",
            error
        );

    } finally {

        automaticSchedulerRunning = false;

    }

}


// ============================================================
// STEP 3
// AUTOMATIC PAYMENT DEADLINE
// ============================================================
//
// When:
//
// payment_deadline <= NOW()
//
// and the round is in payment period:
//
// status becomes:
//
// completed
//
// ============================================================

async function checkPaymentDeadline() {

    try {

        const [rounds] =
            await db.execute(`
                SELECT
                    id,
                    round_number,
                    payment_deadline,
                    status,
                    allotment_published_at
                FROM counselling_rounds
                WHERE
                    payment_deadline IS NOT NULL
                    AND payment_deadline <= NOW()
                    AND allotment_published_at IS NOT NULL
                    AND status IN (
                        'allotment_completed',
                        'payment_period'
                    )
                ORDER BY
                    round_number ASC
            `);


        if (rounds.length === 0) {

            return;

        }


        for (const round of rounds) {

            try {

                const [result] =
                    await db.execute(`
                        UPDATE counselling_rounds
                        SET
                            status = 'completed'
                        WHERE
                            id = ?
                            AND payment_deadline <= NOW()
                            AND allotment_published_at IS NOT NULL
                            AND status IN (
                                'allotment_completed',
                                'payment_period'
                            )
                    `, [
                        round.id
                    ]);


                if (
                    result.affectedRows > 0
                ) {

                    console.log(
                        `✅ Round ${round.round_number}: ` +
                        `PAYMENT DEADLINE PASSED`
                    );

                    console.log(
                        `🏁 Round ${round.round_number}: ` +
                        `ROUND COMPLETED`
                    );

                }

            } catch (error) {

                console.error(
                    `❌ Payment deadline error - ` +
                    `Round ${round.round_number}:`,
                    error
                );

            }

        }

    } catch (error) {

        console.error(
            "❌ PAYMENT DEADLINE CHECK ERROR:",
            error
        );

    }

}


// ============================================================
// START AUTOMATIC SCHEDULER
// ============================================================

const SCHEDULER_INTERVAL = 5000;


// ============================================================
// RUN EVERY 5 SECONDS
// ============================================================

setInterval(
    async () => {

        await checkAutomaticAllotment();

        await checkPaymentDeadline();

    },
    SCHEDULER_INTERVAL
);


// ============================================================
// RUN ONCE IMMEDIATELY
// ============================================================

async function startScheduler() {

    console.log(
        "🚀 Starting automatic counselling scheduler..."
    );


    await checkAutomaticAllotment();

    await checkPaymentDeadline();


    console.log(
        "✓ Automatic scheduler initialized."
    );

}


startScheduler();


// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {

    console.log(
        "❌ ROUTE NOT FOUND:",
        req.method,
        req.originalUrl
    );

    res.status(404).json({

        success: false,

        message:
            "Route not found",

        route:
            req.originalUrl

    });

});


// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {

    console.error(
        "❌ SERVER ERROR:",
        err
    );

    res.status(500).json({

        success: false,

        message:
            "Internal server error",

        error:
            err.message

    });

});


// ============================================================
// START SERVER
// ============================================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            "================================="
        );

        console.log(
            "GCE COUNSELLING BACKEND"
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            "Automatic counselling scheduler: ACTIVE"
        );

        console.log(
            "Preference auto-lock: ACTIVE"
        );

        console.log(
            "Automatic allotment: ACTIVE"
        );

        console.log(
            "Automatic payment period: ACTIVE"
        );

        console.log(
            "Automatic round completion: ACTIVE"
        );

        console.log(
            "================================="
        );

    }
);