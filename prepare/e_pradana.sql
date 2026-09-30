-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 29, 2026 at 03:47 PM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `e_pradana`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `action` enum('open_election','force_open','auto_open','auto_open_failed','close_election','force_close','auto_close','reopen_emergency','reveal','announce_winner','tie_decision','update_schedule','update_settings','import_dpt','add_voter','print_cards','regenerate_token','reset_token','reset_database','create_admin','disable_admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidates`
--

CREATE TABLE `candidates` (
  `id` bigint UNSIGNED NOT NULL,
  `category` enum('putra','putri') COLLATE utf8mb4_unicode_ci NOT NULL,
  `candidate_number` smallint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `class` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vision` text COLLATE utf8mb4_unicode_ci,
  `mission` text COLLATE utf8mb4_unicode_ci,
  `photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_blank` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `status` enum('draft','rehearsal','open','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `schedule_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `manual_override` tinyint(1) NOT NULL DEFAULT '0',
  `results_revealed` tinyint(1) NOT NULL DEFAULT '0',
  `allow_blank` tinyint(1) NOT NULL DEFAULT '0',
  `decided_putra_id` bigint UNSIGNED DEFAULT NULL,
  `decided_putri_id` bigint UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `status`, `start_at`, `end_at`, `schedule_enabled`, `manual_override`, `results_revealed`, `allow_blank`, `decided_putra_id`, `decided_putri_id`, `updated_at`) VALUES
(1, 'draft', NULL, NULL, 0, 0, 0, 0, NULL, NULL, '2026-09-29 15:41:53');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'admin', '$2y$12$LM/VjfQDUyP3msURxbMaveAFoWrmgCiyf/izPFoOCJPkuEZkrok56', '2026-09-29 15:45:55', '2026-09-29 15:45:55');

-- --------------------------------------------------------

--
-- Table structure for table `voters`
--

CREATE TABLE `voters` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `class` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_voted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `votes`
--

CREATE TABLE `votes` (
  `id` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `candidate_putra_id` bigint UNSIGNED NOT NULL,
  `candidate_putri_id` bigint UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_user_id_index` (`user_id`),
  ADD KEY `audit_logs_action_created_at_index` (`action`,`created_at`);

--
-- Indexes for table `candidates`
--
ALTER TABLE `candidates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `candidates_category_number_unique` (`category`,`candidate_number`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `settings_decided_putra_id_index` (`decided_putra_id`),
  ADD KEY `settings_decided_putri_id_index` (`decided_putri_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `voters`
--
ALTER TABLE `voters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `voters_username_unique` (`username`),
  ADD KEY `voters_class_index` (`class`);

--
-- Indexes for table `votes`
--
ALTER TABLE `votes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `votes_candidate_putra_id_index` (`candidate_putra_id`),
  ADD KEY `votes_candidate_putri_id_index` (`candidate_putri_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `candidates`
--
ALTER TABLE `candidates`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `voters`
--
ALTER TABLE `voters`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `settings_decided_putra_id_foreign` FOREIGN KEY (`decided_putra_id`) REFERENCES `candidates` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `settings_decided_putri_id_foreign` FOREIGN KEY (`decided_putri_id`) REFERENCES `candidates` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `votes`
--
ALTER TABLE `votes`
  ADD CONSTRAINT `votes_candidate_putra_id_foreign` FOREIGN KEY (`candidate_putra_id`) REFERENCES `candidates` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `votes_candidate_putri_id_foreign` FOREIGN KEY (`candidate_putri_id`) REFERENCES `candidates` (`id`) ON DELETE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
