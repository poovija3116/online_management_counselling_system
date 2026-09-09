-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: gce_counselling
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `allotments`
--

DROP TABLE IF EXISTS `allotments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allotments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `department_id` int NOT NULL,
  `seat_number` varchar(50) DEFAULT NULL,
  `status` enum('allotted','payment_pending','confirmed','rejected','upward_requested','upgraded','payment_expired','released','cancelled') NOT NULL DEFAULT 'allotted',
  `allotted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `round_id` int DEFAULT NULL,
  `student_decision` enum('pending','accepted','rejected','upward') NOT NULL DEFAULT 'pending',
  `decision_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `department_id` (`department_id`),
  KEY `fk_allotments_round` (`round_id`),
  CONSTRAINT `allotments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `allotments_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `fk_allotments_round` FOREIGN KEY (`round_id`) REFERENCES `counselling_rounds` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allotments`
--

LOCK TABLES `allotments` WRITE;
/*!40000 ALTER TABLE `allotments` DISABLE KEYS */;
INSERT INTO `allotments` VALUES (24,59,3,'EEE-001','payment_pending','2026-09-09 19:08:04',1,'accepted','2026-09-10 00:38:25');
/*!40000 ALTER TABLE `allotments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `application_number` varchar(50) NOT NULL,
  `status` varchar(30) DEFAULT 'pending',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_number` (`application_number`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
INSERT INTO `applications` VALUES (7,60,'GCE2026002','pending',NULL,'2026-09-01 14:31:38'),(8,61,'GCE2026105','pending',NULL,'2026-09-02 03:11:22'),(9,62,'GCE2026003','pending',NULL,'2026-09-02 08:02:16'),(10,63,'GCE2026004','pending',NULL,'2026-09-02 10:45:36'),(11,64,'GCE2026078','pending',NULL,'2026-09-02 10:53:07'),(12,65,'GCE2026007','pending',NULL,'2026-09-02 15:15:00'),(13,66,'GCE2026008','pending',NULL,'2026-09-04 08:57:47'),(14,67,'GCE2026098','pending',NULL,'2026-09-07 05:24:17'),(15,68,'GCE2026026','pending',NULL,'2026-09-07 07:04:26'),(16,69,'GCE2026061','pending',NULL,'2026-09-07 16:13:13'),(18,59,'GCE2026009','pending',NULL,'2026-09-08 09:14:50'),(19,70,'GCE2026062','pending',NULL,'2026-09-09 09:28:04'),(20,71,'GCE2026071','pending',NULL,'2026-09-09 10:35:47');
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `description` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `correction_requests`
--

DROP TABLE IF EXISTS `correction_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `correction_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `incorrect_data` text NOT NULL,
  `correct_data` text NOT NULL,
  `reason` text,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_correction_student` (`student_id`),
  CONSTRAINT `fk_correction_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `correction_requests`
--

LOCK TABLES `correction_requests` WRITE;
/*!40000 ALTER TABLE `correction_requests` DISABLE KEYS */;
INSERT INTO `correction_requests` VALUES (1,59,'community','BC','OC','incorrect community','resolved','2026-09-09 07:54:55','2026-09-09 08:43:24'),(2,59,'community','BC','OC','commiunty is incorrect','resolved','2026-09-09 08:41:34','2026-09-09 09:11:15'),(3,59,'community','BC','OC','INCORRECT COMMUNITY','resolved','2026-09-09 09:10:19','2026-09-09 09:14:34'),(4,59,'community','OC','BC','incorrect community','resolved','2026-09-09 09:19:44','2026-09-09 09:20:23'),(5,70,'community','OC','BC','incorrect community','resolved','2026-09-09 09:33:56','2026-09-09 18:10:39'),(6,59,'community','BC','OC','incorrect','resolved','2026-09-09 18:05:52','2026-09-09 18:10:26');
/*!40000 ALTER TABLE `correction_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counselling_rounds`
--

DROP TABLE IF EXISTS `counselling_rounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `counselling_rounds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `round_number` int NOT NULL,
  `min_rank` int NOT NULL,
  `max_rank` int NOT NULL,
  `preference_start` datetime DEFAULT NULL,
  `preference_end` datetime DEFAULT NULL,
  `allotment_at` datetime DEFAULT NULL,
  `payment_deadline` datetime DEFAULT NULL,
  `status` enum('not_started','preference_open','preferences_locked','allotment_completed','payment_period','completed') DEFAULT 'not_started',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `choice_open_at` datetime DEFAULT NULL,
  `choice_close_at` datetime DEFAULT NULL,
  `allotment_published_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `round_number` (`round_number`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counselling_rounds`
--

LOCK TABLES `counselling_rounds` WRITE;
/*!40000 ALTER TABLE `counselling_rounds` DISABLE KEYS */;
INSERT INTO `counselling_rounds` VALUES (1,1,1,2,'2026-09-10 00:36:00','2026-09-10 00:37:00','2026-09-10 00:38:00','2026-09-10 00:39:00','completed','2026-08-25 16:55:32','2026-09-10 00:36:00',NULL,'2026-09-10 00:38:04');
/*!40000 ALTER TABLE `counselling_rounds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counselling_sessions`
--

DROP TABLE IF EXISTS `counselling_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `counselling_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `current_rank` int DEFAULT '1',
  `status` varchar(30) DEFAULT 'not_started',
  `started_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counselling_sessions`
--

LOCK TABLES `counselling_sessions` WRITE;
/*!40000 ALTER TABLE `counselling_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `counselling_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `counsellors`
--

DROP TABLE IF EXISTS `counsellors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `counsellors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `qualification` varchar(150) DEFAULT NULL,
  `availability` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `counsellors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `counsellors`
--

LOCK TABLES `counsellors` WRITE;
/*!40000 ALTER TABLE `counsellors` DISABLE KEYS */;
/*!40000 ALTER TABLE `counsellors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `total_seats` int NOT NULL,
  `available_seats` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'CSE','Computer Science and Engineering',21,15,'2026-08-19 16:47:55'),(2,'ECE','Electronics and Communication Engineering',21,18,'2026-08-19 16:47:55'),(3,'EEE','Electrical and Electronics Engineering',21,20,'2026-08-19 16:47:55'),(4,'MECH','Mechanical Engineering',21,21,'2026-08-19 16:47:55'),(5,'CIVIL','Civil Engineering',21,20,'2026-08-19 16:47:55'),(22,'CSE DS','Computer Science and Engineering - Data Science',21,21,'2026-08-26 07:08:09'),(23,'IT','Information Technology',21,19,'2026-08-26 07:08:09'),(24,'AUTO','Automobile Engineering',21,21,'2026-08-26 07:08:09');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `notification_type` enum('round_open','preference_deadline','preferences_locked','allotment','payment','upward','general') NOT NULL DEFAULT 'general',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `allotment_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_status` enum('pending','paid','expired','refunded') DEFAULT 'pending',
  `payment_mode` enum('offline') DEFAULT 'offline',
  `receipt_number` varchar(100) DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `verified_by` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `student_id` (`student_id`),
  KEY `allotment_id` (`allotment_id`),
  KEY `verified_by` (`verified_by`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`allotment_id`) REFERENCES `allotments` (`id`),
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preferences`
--

DROP TABLE IF EXISTS `preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `department_id` int NOT NULL,
  `priority` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `round_id` int DEFAULT NULL,
  `is_locked` tinyint(1) NOT NULL DEFAULT '0',
  `locked_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `department_id` (`department_id`),
  KEY `fk_preferences_round` (`round_id`),
  CONSTRAINT `fk_preferences_round` FOREIGN KEY (`round_id`) REFERENCES `counselling_rounds` (`id`),
  CONSTRAINT `preferences_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `preferences_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preferences`
--

LOCK TABLES `preferences` WRITE;
/*!40000 ALTER TABLE `preferences` DISABLE KEYS */;
INSERT INTO `preferences` VALUES (134,59,3,1,'2026-09-09 19:06:15',1,1,'2026-09-10 00:37:04');
/*!40000 ALTER TABLE `preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seat_movements`
--

DROP TABLE IF EXISTS `seat_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seat_movements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `allotment_id` int NOT NULL,
  `student_id` int NOT NULL,
  `from_department_id` int DEFAULT NULL,
  `to_department_id` int DEFAULT NULL,
  `from_round_id` int DEFAULT NULL,
  `to_round_id` int DEFAULT NULL,
  `movement_type` enum('initial_allotment','upward_upgrade','payment_expired','student_rejected','seat_released','manual_correction') NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `moved_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `allotment_id` (`allotment_id`),
  KEY `student_id` (`student_id`),
  KEY `from_department_id` (`from_department_id`),
  KEY `to_department_id` (`to_department_id`),
  KEY `from_round_id` (`from_round_id`),
  KEY `to_round_id` (`to_round_id`),
  CONSTRAINT `seat_movements_ibfk_1` FOREIGN KEY (`allotment_id`) REFERENCES `allotments` (`id`),
  CONSTRAINT `seat_movements_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `seat_movements_ibfk_3` FOREIGN KEY (`from_department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `seat_movements_ibfk_4` FOREIGN KEY (`to_department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `seat_movements_ibfk_5` FOREIGN KEY (`from_round_id`) REFERENCES `counselling_rounds` (`id`),
  CONSTRAINT `seat_movements_ibfk_6` FOREIGN KEY (`to_round_id`) REFERENCES `counselling_rounds` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seat_movements`
--

LOCK TABLES `seat_movements` WRITE;
/*!40000 ALTER TABLE `seat_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `seat_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `community` varchar(10) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `cutoff_mark` decimal(5,2) DEFAULT NULL,
  `rank_number` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rank_number` (`rank_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (59,61,NULL,'2007-12-31',NULL,'OC',NULL,'2026-09-01 14:27:53',198.00,2),(60,62,NULL,'2007-07-12',NULL,'BC',NULL,'2026-09-01 14:31:38',199.00,1),(61,63,NULL,'2008-06-16',NULL,'OC',NULL,'2026-09-02 03:11:22',130.00,10),(62,64,NULL,'2008-07-04',NULL,'MBC',NULL,'2026-09-02 08:02:16',195.00,5),(63,65,NULL,'2008-01-10',NULL,'BC',NULL,'2026-09-02 10:45:36',196.00,4),(64,66,NULL,'2007-11-26',NULL,'MBC',NULL,'2026-09-02 10:53:07',171.00,7),(65,67,NULL,'2007-12-28',NULL,'BC',NULL,'2026-09-02 15:15:00',193.00,6),(66,68,NULL,'2005-04-07',NULL,'BC',NULL,'2026-09-04 08:57:47',196.00,3),(67,69,NULL,'2006-08-14',NULL,'BC',NULL,'2026-09-07 05:24:17',160.50,9),(68,70,NULL,'2006-02-12',NULL,'BCM',NULL,'2026-09-07 07:04:26',170.00,8),(69,71,NULL,'2007-12-12',NULL,'BC',NULL,'2026-09-07 16:13:13',187.00,11),(70,72,NULL,'2008-05-17',NULL,'BC',NULL,'2026-09-09 09:28:04',181.00,12),(71,73,NULL,'2008-05-24',NULL,'OC',NULL,'2026-09-09 10:35:47',192.00,13);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `upward_requests`
--

DROP TABLE IF EXISTS `upward_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `upward_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `allotment_id` int NOT NULL,
  `current_department_id` int NOT NULL,
  `status` enum('requested','upgraded','not_upgraded','cancelled') DEFAULT 'requested',
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `upgraded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `allotment_id` (`allotment_id`),
  KEY `current_department_id` (`current_department_id`),
  CONSTRAINT `upward_requests_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `upward_requests_ibfk_2` FOREIGN KEY (`allotment_id`) REFERENCES `allotments` (`id`),
  CONSTRAINT `upward_requests_ibfk_3` FOREIGN KEY (`current_department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `upward_requests`
--

LOCK TABLES `upward_requests` WRITE;
/*!40000 ALTER TABLE `upward_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `upward_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(30) DEFAULT 'student',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (9,'GCE Admin','admin@gcecounselling.com','$2b$10$f9QktZYIRVMIB8PU.FgXz.5RmxAsqLf/fIXrQIxTafP28eUAcL6mC','admin','2026-08-26 06:56:37'),(10,'Counsellor','counsellor@gceerode.edu.in','$2b$10$lUeL9QhiQf6qgNXirxi0Mua7ITJHT6MNMHVTO6CVHOZn8mxLCmDRW','counsellor','2026-08-27 19:37:07'),(61,'poovija','poovija31@gmail.com','$2b$10$sE1qmH0YL9XHgPzGknMTbe24c/JOim/jWa2v/sTMECeRpOEmmqgbi','student','2026-09-01 14:27:53'),(62,'amutha','poovija.m@gmail.com','$2b$10$5QXJkUOrPGGENine35vUbeNSKs/yxwpJKECnHOhQ9nj9NbSGqKY1e','student','2026-09-01 14:31:38'),(63,'SARAN S','sxrn16062008@gmail.com','$2b$10$HhQtcmD8dVq2Q3UL3zNaoun2CXdm62Ze33RETbbErEVhFWEXj2RF6','student','2026-09-02 03:11:22'),(64,'Ratchaya','ratchayasri7@gmail.com','$2b$10$Nzi5IRW46pgUbX/0dkPupe101X593tjP9tCXsZBcvwSk2VRE4GREC','student','2026-09-02 08:02:16'),(65,'jayasree','jayasree100108@gmail.com','$2b$10$nkEpsXoTCa0tpKUUQ11P6.N/jvBME7NzphF9XWnm9/WiJ3Q.qNq6K','student','2026-09-02 10:45:36'),(66,'GURU SARAN G K','2626gurusaran@gmail.com','$2b$10$vOUihkY0oEkyoUYF1fiFBOgB4XW/m131nCmOAA75EytXSlVUqNwGa','student','2026-09-02 10:53:07'),(67,'malar','vizhi2812@gmail.com','$2b$10$QlzJyCK5U/kGK6tvD5bsIuv8224NsqDnN4uPj7FnOWu7s/v44drO2','student','2026-09-02 15:15:00'),(68,'abinaya','abinayam2050@gmail.com','$2b$10$3guOxcV8tcSrF89KfkQeWOM4Qa78MgUeKRs34nxDRSpAOS3exsS.C','student','2026-09-04 08:57:46'),(69,'swetha,m','swethpriya0143@gmail.com','$2b$10$SpyoirRSSr45mCfuAr21rOtWAflWkLckqpwNEYfcHDrV.tk/EE.UW','student','2026-09-07 05:24:17'),(70,'Prem','skvimalraj0@gmail.com','$2b$10$uUVGzpEVBFyu4G0m52LOGu.CKamYd1NPitDVkx765CHnB5vloSKuG','student','2026-09-07 07:04:26'),(71,'akshaya','makshaya80701@gmail.com','$2b$10$SYixPSafWEfRKzEwc1ssBeW3K9W3igud21rdh3Mkb1u8Mso9MfJLO','student','2026-09-07 16:13:13'),(72,'rithika','rithikat1752008@gmail.com','$2b$10$uqHIEx.4NnJA9NUFO1IcRu1.W35V6jOHYvoI79fnd8tb8LHIk8iLC','student','2026-09-09 09:28:04'),(73,'jivanthika','jivanthika0024@gmail.com','$2b$10$kLNpDO2.7xbAHVjrP66aFuu5lK5MOGDE/DPSUnhQnuuP8NZ4H4O3O','student','2026-09-09 10:35:47');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-10  1:08:43
