import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin.html"),
        adminMain: resolve(__dirname, "admin-main.html"),
        adminRank: resolve(__dirname, "admin-rank.html"),
        adminStudentMonitoring: resolve(__dirname, "admin-student-monitoring.html"),
        allotmentOverview: resolve(__dirname, "allotment-overview.html"),
        announcement: resolve(__dirname, "announcement.html"),
        choiceFilling: resolve(__dirname, "choice-filling.html"),
        counsellorMain: resolve(__dirname, "counseller-main.html"),
        counsellingEdit: resolve(__dirname, "counselling-edit.html"),
        counsellingInfo: resolve(__dirname, "counselling-info.html"),
        counsellingOfficer: resolve(__dirname, "counselling-officer.html"),
        counsellorDashboard: resolve(__dirname, "counsellor-dashboard.html"),
        myApplication: resolve(__dirname, "my-application.html"),
        roundManagement: resolve(__dirname, "round-management.html"),
        seatAvailability: resolve(__dirname, "seat-availability.html"),
        studentAllotmentOrder: resolve(__dirname, "student-allotment-order.html"),
        studentDashboard: resolve(__dirname, "student-dashboard.html"),
        studentLogin: resolve(__dirname, "student-login.html"),
        studentModification: resolve(__dirname, "student-modification.html"),
        studentSeatSelection: resolve(__dirname, "student-seat-selection.html"),
      },
    },
  },
});