
const express = require("express");

const {
    authenticateToken,
    requireRole
} = require("../middleware/authMiddleware");

const db = require("../config/db");

const router = express.Router();


// =====================================
// GET ALL DEPARTMENTS WITH
// REAL COMMUNITY-WISE SEAT OCCUPANCY
// =====================================

router.get(
    "/",
    authenticateToken,
    requireRole("admin","student","counsellor"),
    async (req, res) => {

        try {

            // Get all departments
            const [departments] = await db.query(`
                SELECT
                    id,
                    code,
                    name,
                    total_seats,
                    available_seats,
                    created_at
                FROM departments
                ORDER BY id ASC
            `);


            // Get occupied seats from allotments
            // grouped by department and student community
            const [occupancy] = await db.query(`
                SELECT
                    a.department_id,
                    s.community,
                    COUNT(a.id) AS occupied
                FROM allotments a
                JOIN students s
                    ON a.student_id = s.id
                WHERE a.status IN (
                    'allotted',
                    'payment_pending',
                    'confirmed'
                )
                GROUP BY
                    a.department_id,
                    s.community
            `);


            // Create community occupancy map
            const occupancyMap = {};


            occupancy.forEach(row => {

                if (!occupancyMap[row.department_id]) {

                    occupancyMap[row.department_id] = {

                        OC: 0,
                        BC: 0,
                        BCM: 0,
                        SC: 0,
                        ST: 0,
                        SCA: 0

                    };

                }


                const community =
                    String(row.community || "")
                        .trim()
                        .toUpperCase();


                if (
                    Object.prototype.hasOwnProperty.call(
                        occupancyMap[row.department_id],
                        community
                    )
                ) {

                    occupancyMap[
                        row.department_id
                    ][community] =
                        Number(row.occupied);

                }

            });


            // Format final response
            const formattedDepartments =
                departments.map(department => {

                    const communities =
                        occupancyMap[department.id] || {

                            OC: 0,
                            BC: 0,
                            BCM: 0,
                            SC: 0,
                            ST: 0,
                            SCA: 0

                        };


                    const occupiedSeats =
                        Object.values(communities)
                            .reduce(
                                (total, occupied) =>
                                    total + Number(occupied),
                                0
                            );


                    return {

                        id:
                            department.id,

                        code:
                            department.code,

                        name:
                            department.name,

                        total_seats:
                            department.total_seats,

                        occupied_seats:
                            occupiedSeats,

                        available_seats:
                            Number(department.total_seats) -
                            occupiedSeats,

                        communities: {

                            OC: {
                                occupied:
                                    communities.OC
                            },

                            BC: {
                                occupied:
                                    communities.BC
                            },

                            BCM: {
                                occupied:
                                    communities.BCM
                            },

                            SC: {
                                occupied:
                                    communities.SC
                            },

                            ST: {
                                occupied:
                                    communities.ST
                            },

                            SCA: {
                                occupied:
                                    communities.SCA
                            }

                        }

                    };

                });


            res.json({

                success: true,

                count:
                    formattedDepartments.length,

                departments:
                    formattedDepartments

            });


        } catch (error) {

            console.error(
                "GET DEPARTMENTS ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch departments",

                error:
                    error.message

            });

        }

    }
);


module.exports = router;