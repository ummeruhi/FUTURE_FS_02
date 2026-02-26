-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Feb 26, 2026 at 03:05 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mini_crm`
--

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
CREATE TABLE IF NOT EXISTS `leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'New',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `source` varchar(50) DEFAULT 'manual',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`id`, `name`, `email`, `phone`, `status`, `notes`, `created_at`, `source`) VALUES
(9, 'umme ruhi', 'ummeruhi07@gmail.com', '09148771030', 'new', NULL, '2026-02-25 10:53:44', 'manual'),
(4, 'Rahul Sharma', 'rahul.sharma@gmail.com', '9876543210', 'new', 'Interested in product demo', '2026-02-25 10:39:52', 'website'),
(3, 'aarav', 'aarav@gmail.com', '09148771030', 'converted', NULL, '2026-02-25 10:13:55', 'manual'),
(5, 'Ayesha Khan', 'ayesha.khan@gmail.com', '9123456780', 'contacted', 'Follow-up scheduled', '2026-02-25 10:39:52', 'manual'),
(6, 'Vikram Patel', 'vikram.patel@gmail.com', '9988776655', 'converted', 'Purchased premium plan', '2026-02-25 10:39:52', 'website'),
(7, 'Neha Verma', 'neha.verma@gmail.com', '9012345678', 'new', 'Requested pricing details', '2026-02-25 10:39:52', 'manual'),
(8, 'Arjun Reddy', 'arjun.reddy@gmail.com', '8899776655', 'contacted', 'Waiting for response', '2026-02-25 10:39:52', 'website');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`) VALUES
(1, 'admin', 'admin123');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
